# llm_client.py
# ---------------------------------------------------------------------
# Original classification + summary preserved EXACTLY.
# Added: full-thread meeting detection returning ONLY:
# { "meeting_scheduled": true/false }
# ---------------------------------------------------------------------

import json
import re
from typing import Tuple, List, Dict

from openai import OpenAI
import os

# Get config from environment variables or defaults
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_CLASSIFY_MODEL_NAME = os.getenv("OPENAI_CLASSIFY_MODEL_NAME")
OPENAI_SUMMARY_MODEL_NAME = os.getenv("OPENAI_SUMMARY_MODEL_NAME")
OPENAI_MEETING_MODEL_NAME = os.getenv("OPENAI_MEETING_MODEL_NAME")

# Fallback to config if running from GmailPluginRoot
if not OPENAI_API_KEY:
    try:
        from config import (
            OPENAI_API_KEY,
            OPENAI_CLASSIFY_MODEL_NAME,
            OPENAI_SUMMARY_MODEL_NAME,
            OPENAI_MEETING_MODEL_NAME,
        )
    except ImportError:
        pass

# -----------------------
# OpenAI client
# -----------------------

_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

_CLASSIFY_MODEL = OPENAI_CLASSIFY_MODEL_NAME or "gpt-4.1-mini"  # Default matches GmailPluginRoot/automation/config.py
_SUMMARY_MODEL  = OPENAI_SUMMARY_MODEL_NAME or _CLASSIFY_MODEL
_MEETING_MODEL  = OPENAI_MEETING_MODEL_NAME or _SUMMARY_MODEL

# Log model configuration on import
if _client:
    print(f"✅ Gmail LLM Client initialized with model: {_CLASSIFY_MODEL}")
else:
    print(f"⚠️  Gmail LLM Client: OPENAI_API_KEY not set, classification will be disabled")


# -----------------------
# ORIGINAL PROMPTS — UNCHANGED (content) / BRACES ESCAPED
# -----------------------

CLASSIFY_PROMPT = """
You are part of Ripple, a personal networking tracker that helps a user
keep track of professional / networking email threads.

DEFINITION OF A NETWORKING EMAIL
--------------------------------
A networking email is any email where the sender’s intent is to build,
initiate, or maintain a professional relationship.

This includes, but is not limited to:
- Requesting career advice or guidance.
- Seeking mentorship.
- Asking for an informational interview or coffee chat.
- Reaching out to learn about someone’s career path or experiences.
- Asking about job or internship opportunities or referrals
  (NOT formally submitting an application—just inquiring).
- Thank-you emails after a networking conversation, event, or introduction.
- Reconnecting with a former colleague, professor, or acquaintance
  for professional reasons.
- Introducing oneself professionally with no sales motive.
- Alumni outreach.
- Emails with professors, alumni, or professionals about research,
  graduate school, recommendations, collaborations, or long-term career advice.

NOT NETWORKING EMAILS
---------------------
The following do NOT count as networking emails:
- Sales or marketing emails.
- Promotional emails from companies (product deals, discount codes, newsletters).
- Financial or loan-related promotional emails (student loan offers,
  refinancing deals, credit card promotions).
- Customer service or support requests.
- Personal or social emails unrelated to careers or professional goals.
- Spam.
- Academic assignment–related emails (homework, problem sets, class logistics).
- Transactional emails (receipts, confirmations, password resets, system alerts).

EDGE CASE GUIDELINES
--------------------
Treat these cases carefully:

- Mass recruiting or program emails from companies or schools
  (bulk announcements, “check out our program,” job lists, generic career center blasts)
  → NOT networking.

- Personalized recruiter outreach (1:1 messages mentioning the user’s background
  and inviting a conversation or call)
  → YES, networking.

- Application / portal / status emails (submission confirmations, “your application
  is under review,” automated interview scheduling links)
  → NOT networking.

- Automated event invitations or reminders (career fairs, info sessions, webinars)
  → NOT networking, unless it is a clearly personal invitation from a specific person.

- Emails with professors or supervisors:
  * If about homework, exams, class logistics, or admin → NOT networking.
  * If about careers, grad school, research opportunities, recommendations, or
    long-term professional advice → YES, networking.

- Internal work emails:
  * Routine project updates, task assignments, bug reports → NOT networking.
  * 1:1 emails about mentorship, career growth, performance, or opportunities → YES, networking.

- Friends or acquaintances:
  * Purely social or personal chat → NOT networking.
  * If the main purpose is professional (asking for career advice, referrals, intros,
    or opportunities) → YES, networking.

Borderline rule:
- If the primary intent is to build or deepen a professional relationship or explore
  professional/academic opportunities, classify as networking.
- If it is mostly transactional, marketing, automated, or purely social, classify as not networking.

YOUR TASK
---------
1. Decide whether THIS email is networking or not.
2. If (and only if) it IS networking, write a short summary capturing:
   - The main purpose of the email.
   - Any concrete asks or offers.
   - Any next steps, deadlines, or dates (if they exist).
   - Focus on the big picture, not line-by-line detail.

SUMMARY STYLE REQUIREMENTS (IMPORTANT):
- Output MUST be one short phrase (max ~15–20 words), starting with an action verb in the past tense.
- Be punchy and direct. The flow of the summary MUST be easy to skim quickly.
- Focus ONLY on the new content in THIS email, not quoted previous messages.

OUTPUT FORMAT (IMPORTANT)
-------------------------
Return *only* a single JSON object with this exact schema:

{{
  "networking": true or false,
  "summary": "one short, punchy sentence or phrase if networking is true, otherwise an empty string"
}}

EMAIL CONTENT
-------------
Subject: {subject}

Body:
{body}
""".strip()


SUMMARY_PROMPT = """
You are part of Ripple, a personal networking tracker.

Given the email below, write a VERY SHORT summary capturing:
- The main purpose or update.
- Any explicit asks or offers.
- Any next steps, deadlines, or dates (if they exist).
- Focus on the big picture, not line-by-line detail.

STYLE REQUIREMENTS (IMPORTANT):
- Output MUST be one short phrase (max ~15–20 words), starting with an action verb in the past tense.
- Be punchy and direct. Flow of the summary MUST be easy to skim quickly.
- Focus ONLY on the new content in this email, not quoted previous messages.

Return *only* a single JSON object with this exact schema:

{{
  "summary": "concise networking-oriented summary here"
}}

EMAIL CONTENT
-------------
Subject: {subject}

Body:
{body}
""".strip()


MEETING_PROMPT = """
You are analyzing a professional networking email thread for Ripple.

Your ONLY task is to determine whether a meeting or call has been
*definitively scheduled and agreed upon*.

A meeting counts as scheduled ONLY IF:
- A specific date or time is mentioned, AND
- The other person clearly accepts or confirms it.

Confirmation examples:
"Yes, that works."
"Confirmed."
"See you then."
"Sounds good — let's plan on it."

If a time is suggested but NOT clearly accepted, return false.

Return ONLY this JSON:

{{
  "meeting_scheduled": true or false
}}

THREAD TRANSCRIPT:
------------------------------------
{thread_body}
------------------------------------
""".strip()


# =====================================================================
# JSON helper (UPGRADED)
# =====================================================================

def _extract_first_valid_json(text: str) -> str:
    """
    Safely extracts the first JSON object using brace-depth parsing.
    """
    if not text:
        return ""

    cleaned = re.sub(r"```[a-zA-Z]*", "", text).replace("```", "").strip()

    # First try direct load
    try:
        obj = json.loads(cleaned)
        if isinstance(obj, dict):
            return cleaned
    except Exception:
        pass

    # Brace-depth parser
    depth = 0
    start = None
    for i, ch in enumerate(cleaned):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                candidate = cleaned[start : i + 1]
                try:
                    json.loads(candidate)
                    return candidate
                except Exception:
                    pass
    return ""


# =====================================================================
# Quoted-text removal (SAFER)
# =====================================================================

def _strip_quoted_text(body: str) -> str:
    if not body:
        return ""
    lines = body.splitlines()
    cleaned = []
    for line in lines:
        low = line.strip().lower()
        if low.startswith("on ") and " wrote:" in low:
            break
        if "forwarded message" in low:
            break
        cleaned.append(line)
    text = "\n".join(cleaned).strip()
    return text if len(text) >= 40 else body.strip()


def _prepare_body_for_llm(body: str, max_chars: int = 3750) -> str:
    text = _strip_quoted_text(body.strip())
    if len(text) <= max_chars:
        return text
    return (
        text[: int(max_chars * 0.7)]
        + "\n\n[...content truncated...]\n\n"
        + text[-int(max_chars * 0.3) :]
    )


# =====================================================================
# Classification + Summary
# =====================================================================

def classify_and_summarize(subject: str, body: str) -> Tuple[bool, str]:
    if not OPENAI_API_KEY or _client is None:
        print(f"  ⚠️  Classification skipped: OPENAI_API_KEY or client is None")
        return False, ""
    prepared = _prepare_body_for_llm(body or "")
    prompt = CLASSIFY_PROMPT.format(
        subject=subject or "(no subject)",
        body=prepared or "(no body)",
    )
    try:
        print(f"  🤖 Calling OpenAI API with model: {_CLASSIFY_MODEL}")
        resp = _client.chat.completions.create(
            model=_CLASSIFY_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
        print(f"  📥 OpenAI raw response: {raw[:200]}...")  # Log first 200 chars
    except Exception as e:
        print(f"  ❌ OpenAI API error: {type(e).__name__}: {str(e)}")
        return False, ""
    json_text = _extract_first_valid_json(raw)
    if not json_text:
        print(f"  ⚠️  Failed to extract JSON from response. Raw: {raw[:200]}...")
        return False, ""
    try:
        parsed = json.loads(json_text)
        networking = bool(parsed.get("networking", False))
        summary = parsed.get("summary", "") if networking else ""
        print(f"  📊 Parsed result: networking={networking}, summary='{summary[:50]}...'")
        return networking, summary.strip()[:400]
    except Exception as e:
        print(f"  ❌ JSON parse error: {type(e).__name__}: {str(e)}. JSON text: {json_text[:200]}...")
        return False, ""


def summarize_email(subject: str, body: str) -> str:
    if not OPENAI_API_KEY or _client is None:
        return ""
    prepared = _prepare_body_for_llm(body or "")
    prompt = SUMMARY_PROMPT.format(
        subject=subject or "(no subject)",
        body=prepared or "(no body)",
    )
    try:
        resp = _client.chat.completions.create(
            model=_SUMMARY_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
    except Exception:
        return ""
    json_text = _extract_first_valid_json(raw)
    if not json_text:
        return ""
    try:
        parsed = json.loads(json_text)
        return parsed.get("summary", "").strip()[:400]
    except Exception:
        return ""


# =====================================================================
# Meeting detection (YES/NO only)
# =====================================================================

def _prepare_thread_for_llm(messages: List[Dict]) -> str:
    out = []
    for i, m in enumerate(messages, start=1):
        who = "You" if m.get("direction") == "sent" else "Contact"
        text = (m.get("body_text") or "").strip()
        if len(text) > 2500:
            text = text[:2000] + "\n\n[...truncated...]\n\n" + text[-500:]
        out.append(f"{i}. {who}:\n{text}\n")
    return "\n".join(out).strip()


def analyze_thread_for_meeting_full_emails(messages: List[Dict]) -> Dict:
    default = {"meeting_scheduled": False}
    if not OPENAI_API_KEY or _client is None or not messages:
        return default
    thread_body = _prepare_thread_for_llm(messages)
    if not thread_body:
        return default
    prompt = MEETING_PROMPT.format(thread_body=thread_body)
    try:
        resp = _client.chat.completions.create(
            model=_MEETING_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
    except Exception:
        return default
    json_text = _extract_first_valid_json(raw)
    if not json_text:
        return default
    try:
        parsed = json.loads(json_text)
        return {"meeting_scheduled": bool(parsed.get("meeting_scheduled", False))}
    except Exception:
        return default