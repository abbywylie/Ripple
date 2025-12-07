"""
RAG (Retrieval-Augmented Generation) Service
Helps students with networking and recruiting questions using the recruiting tracker template
"""
import os
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
import glob
import time
import math

try:
    import numpy as _np  # type: ignore
except Exception:
    _np = None  # Fallback handled when embeddings not available

try:
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.metrics.pairwise import cosine_similarity  # type: ignore
except Exception:
    TfidfVectorizer = None
    cosine_similarity = None

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Check if API keys are configured (try Groq first - it's free!)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_GROQ = bool(GROQ_API_KEY)
USE_OPENAI = bool(OPENAI_API_KEY)

# Path to optional on-disk knowledge base
KB_DIR = Path(__file__).parent.parent / "knowledge_base"


# ---------- KB Loading & Hot Reload ----------

def _kb_latest_mtime() -> float:
    """Get latest modified time across KB files for lightweight hot reload."""
    try:
        if KB_DIR.exists() and KB_DIR.is_dir():
            mtimes: List[float] = []
            # Recursively check all .md and .txt files
            for path_str in glob.glob(str(KB_DIR / "**/*.md"), recursive=True) + glob.glob(
                str(KB_DIR / "**/*.txt"), recursive=True
            ):
                path = Path(path_str)
                # Skip README files
                if path.name.lower() == "readme.md":
                    continue
                try:
                    mtimes.append(path.stat().st_mtime)
                except Exception:
                    continue
            return max(mtimes) if mtimes else 0.0
    except Exception:
        return 0.0
    return 0.0


def load_knowledge_base_from_folder() -> Dict[str, str]:
    """
    Load all .md and .txt files from backend/knowledge_base (recursively) into a dict of {filename: content}.
    Skips README.md files and files that look like directory listings.
    Returns empty dict if folder doesn't exist or has no matching files.
    """
    kb_files: Dict[str, str] = {}
    try:
        if KB_DIR.exists() and KB_DIR.is_dir():
            # Recursively find all .md and .txt files in subdirectories
            for path_str in glob.glob(str(KB_DIR / "**/*.md"), recursive=True) + glob.glob(
                str(KB_DIR / "**/*.txt"), recursive=True
            ):
                path = Path(path_str)

                # Skip README files and files that look like directory listings
                if path.name.lower() == "readme.md":
                    continue

                try:
                    text = path.read_text(encoding="utf-8")

                    # Filter out files that are mostly directory structure listings
                    # Check if more than 30% of lines look like file structure (│, ├──, └──, etc.)
                    lines = text.splitlines()
                    if lines:
                        structure_lines = sum(
                            1 for ln in lines if any(marker in ln for marker in ["│", "├──", "└──", "├", "└", "──"])
                        )
                        if structure_lines > len(lines) * 0.3:
                            print(f"RAG: Skipping {path.name} - appears to be directory structure")
                            continue

                    # Store by relative path for better identification (e.g., "guides/user-success/networking-timeline")
                    # But use a readable key format
                    rel_path = path.relative_to(KB_DIR)
                    key = (
                        str(rel_path)
                        .replace("/", "_")
                        .replace("\\", "_")
                        .replace(".md", "")
                        .replace(".txt", "")
                    )
                    kb_files[key] = text.strip()
                except Exception as e:
                    # Skip unreadable files
                    print(f"RAG: Could not load {path_str}: {e}")
                    continue
    except Exception as e:
        print(f"RAG: Error loading knowledge base: {e}")
        # On any unexpected error, fall back silently
        pass
    return kb_files


# Load KB at import time
KB_FILES: Dict[str, str] = load_knowledge_base_from_folder()
KB_LAST_MTIME: float = _kb_latest_mtime()

# Chunked KB and vector index (rebuilt on change)
KB_CHUNKS: List[Dict[str, str]] = []  # {id, source, text}
_EMB_MATRIX = None  # type: ignore
_TFIDF = None  # type: ignore


def _init_index_once():
    """Initial index build."""
    try:
        if KB_FILES:
            _rebuild_index()
            print(f"RAG: Loaded {len(KB_FILES)} KB files, built {len(KB_CHUNKS)} chunks")
        else:
            print("RAG: No KB files found in knowledge_base folder")
    except Exception as e:
        print(f"RAG: Error building index: {e}")
        import traceback
        traceback.print_exc()


def ensure_kb_up_to_date() -> None:
    """Reload KB files from disk if any files changed since last load."""
    global KB_FILES, KB_LAST_MTIME, KB_CHUNKS
    current_mtime = _kb_latest_mtime()
    if current_mtime and current_mtime > KB_LAST_MTIME:
        files = load_knowledge_base_from_folder()
        KB_FILES = files or {}
        try:
            _rebuild_index()
            print(f"RAG: Reloaded KB, now {len(KB_CHUNKS)} chunks")
        except Exception as e:
            print(f"RAG: Error reloading index: {e}")
        KB_LAST_MTIME = current_mtime


def get_relevant_context(query: str) -> str:
    """
    Get relevant context from knowledge base based on query.
    Uses semantic retrieval over chunk index.
    """
    # Ensure the KB reflects latest files without server restart
    ensure_kb_up_to_date()

    query_lower = query.lower()

    # Semantic retrieval over chunk index
    if KB_CHUNKS:
        chunks = retrieve_context(query_lower, k=5)
        return "\n\n".join(c["text"] for c in chunks)

    # If no KB files present, return empty string
    return ""


# ---------- Core Answer Function ----------

def answer_rag_question(query: str, user_context: str = "") -> Dict:
    """
    Answer a question using the knowledge base context when relevant.
    If KB context is weak or absent, rely on the model's broader knowledge
    (i.e., what it has learned from the internet during pretraining).
    Returns both the answer and the source context used.
    """
    # Get relevant context from knowledge base (from folder only)
    context = get_relevant_context(query)

    # Detect intent and pick template hint
    intent = _detect_intent(query)
    template_hint = _template_hint(intent)

    # Try Groq first (free and fast!)
    if USE_GROQ:
        try:
            import groq

            client = groq.Groq(api_key=GROQ_API_KEY)

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=_build_messages(query, context, intent, template_hint),
                temperature=0.4,
                max_tokens=220,
            )

            answer = response.choices[0].message.content
            conversational = _format_conversational(query, answer)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": False,
                "model": "llama-3.1-8b-instant (Groq)",
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
                "error": str(e),
            }

    # If OpenAI is available, use it for better answers
    if USE_OPENAI:
        try:
            import openai

            openai.api_key = OPENAI_API_KEY

            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=_build_messages(query, context, intent, template_hint),
                temperature=0.4,
                max_tokens=220,
            )

            answer = response.choices[0].message.content
            conversational = _format_conversational(query, answer)
            return {
                "query": query,
                "context": context,
                "answer": conversational,
                "needs_llm": False,
                "model": "gpt-3.5-turbo",
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
                "error": str(e),
            }

    # Fallback: return contextual answer without LLM
    concise = _make_concise_answer(query, context)
    conversational = _format_conversational(query, concise)
    return {
        "query": query,
        "context": context,
        "answer": conversational,
        "needs_llm": True,
    }


# ---------- Conversational Formatting ----------

def _format_conversational(query: str, answer_text: str) -> str:
    """
    Wrap answer with conversational structure:
    - opening acknowledgement
    - brief bullet-ized version of the answer
    - tiny email template when relevant
    - follow-up question
    """
    q = (query or "").strip()
    opening = _acknowledge(q)
    bullets = _normalize_bullets(answer_text)
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


def _normalize_bullets(text: str) -> List[str]:
    """
    Extract 3–5 short, actionable bullet points from arbitrary text.
    Cleans markdown headings and leading bullet markers.
    """
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    bullets: List[str] = []

    for ln in lines:
        # Strip markdown heading markers like "## "
        while ln.startswith("#"):
            ln = ln[1:].lstrip()

        # Strip leading bullet-ish characters
        ln = ln.lstrip("-•\t ")

        if 2 <= len(ln) <= 150:
            bullets.append(ln)
        if len(bullets) >= 5:
            break

    if not bullets:
        bullets = [
            "Keep it brief (one screen on mobile).",
            "Ask 2–3 focused questions.",
            "Send a thank-you within 24 hours.",
        ]
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
    lines = [ln.strip(" -•\t") for ln in context.splitlines() if ln.strip()]
    # Simple keyword guidance
    preferred_keywords: List[str] = []
    if any(k in q for k in ["tier", "tiers"]):
        preferred_keywords += ["Tier 1", "Tier 2", "Tier 3"]
    if any(k in q for k in ["outreach", "follow-up", "follow up"]):
        preferred_keywords += ["Outreach", "follow", "thank-you"]
    if any(k in q for k in ["email", "intro", "message"]):
        preferred_keywords += ["email", "introduction", "brief", "20 minutes"]

    selected: List[str] = []
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
            if 3 <= len(ln) <= 140 and any(
                x in ln.lower() for x in ["ask", "send", "track", "prepare", "brief", "thank"]
            ):
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
    return "\n".join([f"- {b}" for b in bullets[:5]])


# ---------- Semantic Retrieval Utilities ----------

def _rebuild_index() -> None:
    """Build chunked KB and vector index."""
    global KB_CHUNKS, _EMB_MATRIX, _TFIDF
    KB_CHUNKS = []
    texts: List[str] = []
    if not KB_FILES:
        _EMB_MATRIX = None
        _TFIDF = None
        return
    for name, content in KB_FILES.items():
        for idx, chunk in enumerate(_chunk_text(content)):
            KB_CHUNKS.append({"id": f"{name}-{idx}", "source": name, "text": chunk})
            texts.append(chunk)
    # Embeddings: prefer OpenAI, else TF-IDF
    if USE_OPENAI:
        embs = _embed_texts_openai(texts)
        _EMB_MATRIX = embs
        _TFIDF = None
    else:
        if TfidfVectorizer is None:
            _EMB_MATRIX = None
            _TFIDF = None
        else:
            _TFIDF = TfidfVectorizer(max_features=20000, ngram_range=(1, 2))
            _EMB_MATRIX = _TFIDF.fit_transform(texts)


def _chunk_text(text: str, max_len: int = 600, overlap: int = 80) -> List[str]:
    """Split text into overlapping chunks by paragraphs and size."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    for para in paragraphs:
        if len(para) <= max_len:
            chunks.append(para)
        else:
            start = 0
            while start < len(para):
                end = min(len(para), start + max_len)
                chunk = para[start:end]
                chunks.append(chunk)
                if end == len(para):
                    break
                start = max(0, end - overlap)
    return chunks


def _embed_texts_openai(texts: List[str]):
    try:
        import openai  # type: ignore

        openai.api_key = OPENAI_API_KEY
        # Batch embed; for simplicity, do single call per text (could batch optimize)
        vectors = []
        for t in texts:
            resp = openai.embeddings.create(model="text-embedding-3-small", input=t)
            vectors.append(resp.data[0].embedding)
        if _np is not None:
            return _np.array(vectors)
        return vectors
    except Exception:
        return None


def _embed_query(query: str):
    if USE_OPENAI:
        try:
            import openai  # type: ignore

            openai.api_key = OPENAI_API_KEY
            resp = openai.embeddings.create(model="text-embedding-3-small", input=query)
            vec = resp.data[0].embedding
            if _np is not None:
                return _np.array(vec).reshape(1, -1)
            return [vec]
        except Exception:
            pass
    # TF-IDF fallback
    if _TFIDF is not None:
        return _TFIDF.transform([query])
    return None


def retrieve_context(query: str, k: int = 5) -> List[Dict[str, str]]:
    """
    Retrieve top-k KB chunks for a query using cosine similarity.
    Drops chunks that are clearly unrelated via a similarity threshold.
    """
    if not KB_CHUNKS:
        return []
    q_vec = _embed_query(query)
    if q_vec is None or _EMB_MATRIX is None:
        # No embeddings available; return first k chunks
        return KB_CHUNKS[:k]
    try:
        if _np is not None and isinstance(_EMB_MATRIX, _np.ndarray):
            # cosine similarity manually
            a = q_vec / (_np.linalg.norm(q_vec) + 1e-12)
            b = _EMB_MATRIX / (_np.linalg.norm(_EMB_MATRIX, axis=1, keepdims=True) + 1e-12)
            sims = (a @ b.T).flatten()
        else:
            # sparse matrix (TF-IDF) path
            sims = cosine_similarity(q_vec, _EMB_MATRIX).flatten()

        scored = sorted(
            [(i, sims[i]) for i in range(len(sims))],
            key=lambda x: x[1],
            reverse=True,
        )

        # Drop truly unrelated chunks with a loose minimum similarity
        MIN_SIM = 0.15
        top = [KB_CHUNKS[i] for (i, s) in scored[:k] if s >= MIN_SIM]

        return top
    except Exception:
        return KB_CHUNKS[:k]


# ---------- Intent & Prompt Utilities ----------

def _detect_intent(query: str) -> str:
    """
    Rough intent classification to influence templates and tone.
    We only treat something as an informational interview if it’s explicitly
    called that (so regular job interviews don't get that agenda).
    """
    q = (query or "").lower()

    if "informational" in q or "coffee chat" in q:
        return "informational_interview"

    if any(k in q for k in ["met", "meet", "follow up", "follow-up"]):
        return "email_intro"

    if any(k in q for k in ["thank", "thanks"]):
        return "email_thanks"

    if any(k in q for k in ["tracker", "tier", "outreach"]):
        return "tracker_guidance"

    return "general"


def _template_hint(intent: str) -> str:
    if intent == "email_intro":
        return (
            "Subject: Great meeting you\n\nHi [Name] — great meeting you [today/yesterday] at [event]."
            " I enjoyed [specific topic]. If you’re open, I’d love 15–20 minutes to learn more about [team/topic].\n\nBest,\n[Your Name]"
        )
    if intent == "email_thanks":
        return (
            "Subject: Thank you\n\nThanks again for the time today — I appreciated [specific insight]."
            " I’ll follow up on [next step].\n\nBest,\n[Your Name]"
        )
    if intent == "informational_interview":
        return "Quick agenda: 1) Your path 2) Day-to-day 3) Advice for breaking in."
    return ""


def _filter_context(context: str) -> str:
    """Filter out directory structure listings and file paths from context."""
    if not context:
        return context

    lines = context.splitlines()
    filtered_lines: List[str] = []

    for line in lines:
        # Skip lines that look like directory structure
        if any(marker in line for marker in ["│", "├──", "└──", "├", "└"]):
            continue
        # Skip lines that are just folder paths
        if line.strip().endswith("/") and not line.strip().startswith("#"):
            continue
        # Skip lines that are mostly dashes or separators
        if len(line.strip()) > 0 and line.strip().replace("-", "").replace("=", "").replace("_", "").strip() == "":
            continue
        filtered_lines.append(line)

    return "\n".join(filtered_lines)


def _build_messages(query: str, context: str, intent: str, template_hint: str):
    """
    Build messages for the chat completion call.

    The model:
    - can use BOTH its own knowledge (trained on internet-scale data)
      and the KB context
    - should prefer KB context when clearly relevant
    - should answer the question directly if context isn't very helpful
    """
    filtered_context = _filter_context(context)
    context_block = filtered_context.strip() or "[No strongly relevant context from the knowledge base.]"

    system = (
        "You are a friendly, knowledgeable networking and recruiting coach."
        " You can use both your own knowledge and the provided knowledge base context."
        " Prefer the knowledge base when it is clearly relevant; if it is not, answer from your broader expertise."
        " Answer clearly and practically, and do NOT simply repeat headings, file names, or directory listings."
    )

    user = (
        f"User question:\n{query}\n\n"
        f"Intent: {intent}\n"
        f"Template hint (optional): {template_hint}\n\n"
        "Relevant context from the knowledge base (may or may not be useful):\n"
        f"{context_block}\n\n"
        "Answer the question directly. If the context is not helpful, ignore it."
        " Do not include raw file paths, directory trees, or code blocks from the context."
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


# Initialize index after all functions are defined
_init_index_once()
