"""
RAG (Retrieval-Augmented Generation) Service
Helps students with networking and recruiting questions using the recruiting tracker template
"""
import os
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv
import glob
import time

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Check if API keys are configured (try Groq first - it's free!)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_GROQ = bool(GROQ_API_KEY)
USE_OPENAI = bool(OPENAI_API_KEY)

# We'll use a simple approach first - can upgrade to proper vector store later

# Path to optional on-disk knowledge base
KB_DIR = Path(__file__).parent.parent / "knowledge_base"

# Track last modified time to support lightweight hot reload
def _kb_latest_mtime() -> float:
    try:
        if KB_DIR.exists() and KB_DIR.is_dir():
            mtimes: List[float] = []
            for path_str in glob.glob(str(KB_DIR / "*.md")) + glob.glob(str(KB_DIR / "*.txt")):
                try:
                    mtimes.append(Path(path_str).stat().st_mtime)
                except Exception:
                    continue
            return max(mtimes) if mtimes else 0.0
    except Exception:
        return 0.0
    return 0.0

def load_knowledge_base_from_folder() -> Dict[str, str]:
    """
    Load all .md and .txt files from backend/knowledge_base into a dict of {filename: content}.
    Returns empty dict if folder doesn't exist or has no matching files.
    """
    kb_files: Dict[str, str] = {}
    try:
        if KB_DIR.exists() and KB_DIR.is_dir():
            for path_str in glob.glob(str(KB_DIR / "*.md")) + glob.glob(str(KB_DIR / "*.txt")):
                path = Path(path_str)
                try:
                    text = path.read_text(encoding="utf-8")
                    # Store by stem for readability
                    kb_files[path.stem] = text.strip()
                except Exception:
                    # Skip unreadable files
                    continue
    except Exception:
        # On any unexpected error, fall back silently
        pass
    return kb_files

# Load KB at import time
KB_FILES: Dict[str, str] = load_knowledge_base_from_folder()
KB_LAST_MTIME: float = _kb_latest_mtime()

# Combined knowledge base text
if KB_FILES:
    KNOWLEDGE_BASE = "\n\n".join([content for _, content in KB_FILES.items() if content])
else:
    KNOWLEDGE_BASE = ""


def ensure_kb_up_to_date() -> None:
    """Reload KB files from disk if any files changed since last load."""
    global KB_FILES, KB_LAST_MTIME, KNOWLEDGE_BASE
    current_mtime = _kb_latest_mtime()
    if current_mtime and current_mtime > KB_LAST_MTIME:
        files = load_knowledge_base_from_folder()
        if files:  # Only switch if we successfully read something
            KB_FILES = files
            KNOWLEDGE_BASE = "\n\n".join([content for _, content in KB_FILES.items() if content])
        else:
            # If folder became empty, leave KB empty
            KB_FILES = {}
            KNOWLEDGE_BASE = ""
        KB_LAST_MTIME = current_mtime


def get_relevant_context(query: str) -> str:
    """
    Get relevant context from knowledge base based on query.
    This is a simple keyword-based retrieval for now.
    """
    # Ensure the KB reflects latest files without server restart
    ensure_kb_up_to_date()

    query_lower = query.lower()
    
    # If we have on-disk KB files, prefer simple keyword retrieval across files
    if KB_FILES:
        relevant_contexts: List[str] = []
        # Very simple heuristic: include files that contain any query keyword
        keywords = [w for w in query_lower.split() if w]
        for name, content in KB_FILES.items():
            content_lower = content.lower()
            if any(k in query_lower or k in content_lower for k in keywords):
                relevant_contexts.append(content)

        # If nothing matched, try a broader substring match using query words
        if not relevant_contexts:
            for name, content in KB_FILES.items():
                if any(word and word in content.lower() for word in query_lower.split()):
                    relevant_contexts.append(content)

        # If still nothing, return combined KB (may be empty)
        if not relevant_contexts:
            return KNOWLEDGE_BASE

        return "\n\n".join(relevant_contexts)
    
    # If no KB files present, return empty string
    return ""


def answer_rag_question(query: str, user_context: str = "") -> Dict:
    """
    Answer a question using the knowledge base context.
    Returns both the answer and the source context used.
    """
    # Get relevant context from knowledge base (from folder only)
    context = get_relevant_context(query)
    
    # If we have no KB content, return a helpful notice without generic tips
    if not context.strip():
        notice = (
            "I don’t have knowledge base content to reference yet."
            " Add .md or .txt files to backend/knowledge_base and ask again."
        )
        return {
            "query": query,
            "context": "",
            "answer": _format_conversational(query, notice),
            "needs_llm": True
        }
    
    # Try Groq first (free and fast!)
    if USE_GROQ:
        try:
            import groq
            
            client = groq.Groq(api_key=GROQ_API_KEY)
            
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Fast and free
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a friendly, knowledgeable networking coach."
                            " Use only the provided knowledge base for facts."
                            " Be concise and actionable. Answer in 3–5 bullet points max."
                            " Do not paste long passages from the KB; summarize in your own words."
                            " Use a warm, encouraging tone."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Knowledge Base:\n{context}\n\n"
                            f"Question: {query}\n\n"
                            "Please give concise, coach-style guidance based only on the KB above."
                            " 3–5 bullets, short sentences, no long quotes."
                        )
                    }
                ],
                temperature=0.4,
                max_tokens=180
            )
            
            answer = response.choices[0].message.content
            conversational = _format_conversational(query, answer)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": False,
                "model": "llama-3.1-8b-instant (Groq)"
            }
        except Exception as e:
            # Fallback to concise response if Groq fails
            print(f"Groq error: {e}")
            concise = _make_concise_answer(query, context)
            conversational = _format_conversational(query, concise)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": True,
                "error": str(e)
            }
    
    # If OpenAI is available, use it for better answers
    if USE_OPENAI:
        try:
            import openai
            
            openai.api_key = OPENAI_API_KEY
            
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a concise, encouraging networking coach."
                            " Only use the provided knowledge base."
                            " Respond in 3–5 bullet points maximum and avoid quoting large chunks."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Knowledge Base:\n{context}\n\n"
                            f"Question: {query}\n\n"
                            "Summarize guidance in 3–5 short bullets, personable and actionable,"
                            " without long quotes, based strictly on the KB."
                        )
                    }
                ],
                temperature=0.4,
                max_tokens=180
            )
            
            answer = response.choices[0].message.content
            conversational = _format_conversational(query, answer)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": False,
                "model": "gpt-3.5-turbo"
            }
        except Exception as e:
            # Fallback to concise response if OpenAI fails
            print(f"OpenAI error: {e}")
            concise = _make_concise_answer(query, context)
            conversational = _format_conversational(query, concise)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": True,
                "error": str(e)
            }
    
    # Fallback: return contextual answer without LLM
    concise = _make_concise_answer(query, context)
    conversational = _format_conversational(query, concise)
    return {
        "query": query,
        "context": context,
        "answer": conversational,
        "needs_llm": True
    }


def _format_conversational(query: str, bullets_text: str) -> str:
    """Wrap answer with conversational structure: acknowledge, brief bullets, tiny template (if email-y), follow-up."""
    q = (query or "").strip()
    opening = _acknowledge(q)
    bullets = _normalize_bullets(bullets_text)
    template = _maybe_email_template(q)
    follow_up = _follow_up(q)

    parts = [opening]
    if bullets:
        parts.append("Here are quick pointers:")
        parts.append("\n".join([f"- {b}" for b in bullets]))
    if template:
        parts.append("\nTry this mini template:")
        parts.append(template)
    parts.append(follow_up)

    return "\n\n".join(parts)


def _acknowledge(q: str) -> str:
    if not q:
        return "Got it — here’s a quick take."
    if any(k in q.lower() for k in ["met", "meet", "network", "coffee"]):
        return "Sounds like you just met someone — nice job taking initiative."
    if any(k in q.lower() for k in ["email", "intro", "reach", "follow"]):
        return "You’re crafting outreach — let’s keep it brief and specific."
    return "Here’s a concise answer based on best practices."


def _normalize_bullets(text: str) -> list[str]:
    lines = [ln.strip(" -•\t") for ln in (text or "").splitlines() if ln.strip()]
    # Keep short, actionable lines
    bullets: list[str] = []
    for ln in lines:
        if 2 <= len(ln) <= 150:
            bullets.append(ln)
        if len(bullets) >= 5:
            break
    if not bullets:
        bullets = ["Keep it brief (one screen on mobile).", "Ask 2–3 focused questions.", "Send a thank-you within 24 hours."]
    return bullets[:5]


def _maybe_email_template(q: str) -> str:
    ql = q.lower()
    if any(k in ql for k in ["email", "intro", "follow", "met", "meet"]):
        return (
            "Subject: Great meeting you\n\n"
            "Hi [Name] — great meeting you [today/yesterday] at [event]."
            " I enjoyed [specific topic]. If you’re open, I’d love 15–20 minutes to learn more about [team/topic]."
            "\n\nBest,\n[Your Name]"
        )
    return ""


def _follow_up(q: str) -> str:
    if any(k in (q or "").lower() for k in ["email", "met", "follow"]):
        return "Want me to tailor that template to your situation (industry, role, or event)?"
    return "Want a deeper dive or a tailored example for your context?"


def _make_concise_answer(query: str, context: str) -> str:
    """Produce 3–5 short bullets from the KB context without dumping full text."""
    if not context or not context.strip():
        return ""
    q = (query or "").lower()
    # Prefer lines that look like bullets or short guidelines
    lines = [
        ln.strip(" -•\t") for ln in context.splitlines() if ln.strip()
    ]
    # Simple keyword guidance
    preferred_keywords = []
    if any(k in q for k in ["tier", "tiers"]):
        preferred_keywords += ["Tier 1", "Tier 2", "Tier 3"]
    if any(k in q for k in ["outreach", "follow-up", "follow up"]):
        preferred_keywords += ["Outreach", "follow", "thank-you"]
    if any(k in q for k in ["email", "intro", "message"]):
        preferred_keywords += ["email", "introduction", "brief", "20 minutes"]

    selected: list[str] = []
    # First, pick lines containing preferred keywords
    for kw in preferred_keywords:
        for ln in lines:
            if len(selected) >= 5:
                break
            if kw.lower() in ln.lower() and ln not in selected and 3 <= len(ln) <= 180:
                selected.append(ln)
        if len(selected) >= 5:
            break

    # If still short, pick generic short actionable lines
    if len(selected) < 3:
        for ln in lines:
            if len(selected) >= 5:
                break
            if 3 <= len(ln) <= 140 and any(x in ln.lower() for x in ["ask", "send", "track", "prepare", "brief", "thank"]):
                if ln not in selected:
                    selected.append(ln)

    # Final fallback: very short summary bullets
    if not selected:
        selected = [
            "Keep emails brief and specific (one screen on mobile).",
            "Ask 2–3 focused questions; leave room for follow-ups.",
            "Send thanks within 24 hours and log key notes.",
        ]

    # Limit to 3–5 bullets
    bullets = selected[:5]
    if len(bullets) > 5:
        bullets = bullets[:5]

    return "\n".join([f"- {b}" for b in bullets[:5]])

