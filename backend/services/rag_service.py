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
# If a knowledge_base folder exists, we'll load content from there. Otherwise use this default.
DEFAULT_KNOWLEDGE_BASE = """
RECRUITING TRACKER TEMPLATE - KNOWLEDGE BASE

Company Tracker Format:
- Company | Tier | Contact Name | Contact Role | LinkedIn | Email | Outreach 1 | Outreach 2 | Outreach 3 | Notes | Position Link | Position Deadline | Applied?

Tier System:
- Tier 1 = Dream companies: Send 3 messages total, 1.5–2 weeks apart
- Tier 2 = Great companies: Send 2 messages total
- Tier 3 = Curious companies: 1 message is ok

Outreach Pattern:
- First contact (Outreach 1): Initial introduction, express interest
- Second contact (Outreach 2): Follow-up with additional value or specific question
- Third contact (Outreach 3): Final follow-up if no response (Tier 1 only)

Best Practices:
- Start with 5 companies minimum
- Each company should have at least 1 point of contact
- Track each interaction with email/call notes
- Record date of application
- Send thank-you emails after calls
- Track deadlines for each position
- Update tracker regularly

Contact Columns:
- Contact Name: Person's full name
- Contact Role: Their job title/role
- LinkedIn: LinkedIn profile URL
- Email: Email address if available
- Notes: Important context about interactions

Application Tracking:
- Applied?: Yes/No checkbox
- Position Link: URL to job posting
- Position Deadline: Application deadline date
"""

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
    KNOWLEDGE_BASE = DEFAULT_KNOWLEDGE_BASE


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
            # If folder became empty, fall back to default
            KB_FILES = {}
            KNOWLEDGE_BASE = DEFAULT_KNOWLEDGE_BASE
        KB_LAST_MTIME = current_mtime


def get_relevant_context(query: str) -> str:
    """
    Get relevant context from knowledge base based on query.
    This is a simple keyword-based retrieval for now.
    """
    # Ensure the KB reflects latest files without server restart
    ensure_kb_up_to_date()

    query_lower = query.lower()
    
    # Keywords and their associated context (baseline if folder is empty)
    knowledge_snippets = {
        "tier": """
Tier System:
- Tier 1 = Dream companies: Send 3 messages total, 1.5–2 weeks apart
- Tier 2 = Great companies: Send 2 messages total  
- Tier 3 = Curious companies: 1 message is ok
        """,
        "outreach": """
Outreach Pattern:
- First contact (Outreach 1): Initial introduction, express interest
- Second contact (Outreach 2): Follow-up with additional value or specific question
- Third contact (Outreach 3): Final follow-up if no response (Tier 1 only)
        """,
        "message": """
[] Message Guidelines:
- Tier 1 companies: Send 3 messages total, space them 1.5-2 weeks apart
- Tier 2 companies: Send 2 messages
- Tier 3 companies: 1 message is ok
        """,
        "contact": """
Contact Information:
- Track Contact Name, Contact Role, LinkedIn, Email
- Record all interactions in Notes column
- Send thank-you emails after calls
- Keep notes updated regularly
        """,
        "apply": """
Application Tracking:
- Record Position Link (job posting URL)
- Track Position Deadline
- Mark Applied? (Yes/No)
- Log application date in Notes
        """,
        "tracker": """
Tracker Format:
Company | Tier | Contact Name | Contact Role | LinkedIn | Email | Outreach 1 | Outreach 2 | Outreach 3 | Notes | Position Link | Position Deadline | Applied?

Best Practices:
- Start with 5 companies minimum
- Each company should have at least 1 point of contact
- Track each interaction with email/call notes
- Record date of application
- Send thank-you emails after calls
- Track deadlines for each position
        """,
    }
    
    # If we have on-disk KB files, prefer simple keyword retrieval across files
    if KB_FILES:
        relevant_contexts: List[str] = []
        # Very simple heuristic: include files that contain any keyword from the map
        keywords = list(knowledge_snippets.keys())
        for name, content in KB_FILES.items():
            content_lower = content.lower()
            if any(k in query_lower or k in content_lower for k in keywords):
                relevant_contexts.append(content)

        # If nothing matched, try a broader substring match using query words
        if not relevant_contexts:
            for name, content in KB_FILES.items():
                if any(word and word in content.lower() for word in query_lower.split()):
                    relevant_contexts.append(content)

        # If still nothing, fall back to combined KB
        if not relevant_contexts:
            return KNOWLEDGE_BASE

        return "\n\n".join(relevant_contexts)

    # Fallback to built-in snippets if no on-disk KB is present
    relevant_contexts = []
    for keyword, context in knowledge_snippets.items():
        if keyword in query_lower:
            relevant_contexts.append(context.strip())

    if not relevant_contexts:
        return KNOWLEDGE_BASE

    return "\n\n".join(relevant_contexts)


def answer_rag_question(query: str, user_context: str = "") -> Dict:
    """
    Answer a question using the knowledge base context.
    Returns both the answer and the source context used.
    """
    # Get relevant context from knowledge base - use more comprehensive context
    context = get_relevant_context(query)
    
    # If context is too short or generic, include more of the knowledge base
    if not context or len(context) < 100 or context == KNOWLEDGE_BASE:
        # Use full knowledge base for better context
        context = KNOWLEDGE_BASE
    
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
            
            return {
                "query": query,
                "context": context,
                "answer": answer,
                "needs_llm": False,
                "model": "llama-3.1-8b-instant (Groq)"
            }
        except Exception as e:
            # Fallback to simple response if Groq fails
            print(f"Groq error: {e}")
            # Format context nicely without alarming message
            formatted_context = context.strip()
            return {
                "query": query,
                "context": context,
                "answer": formatted_context,
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
            
            return {
                "query": query,
                "context": context,
                "answer": answer,
                "needs_llm": False,
                "model": "gpt-3.5-turbo"
            }
        except Exception as e:
            # Fallback to simple response if OpenAI fails
            print(f"OpenAI error: {e}")
            # Format context nicely without alarming message
            formatted_context = context.strip()
            return {
                "query": query,
                "context": context,
                "answer": formatted_context,
                "needs_llm": True,
                "error": str(e)
            }
    
    # Fallback: return contextual answer without LLM
    return {
        "query": query,
        "context": context,
        "answer": f"Based on the recruiting tracker knowledge base:\n\n{context}",
        "needs_llm": True
    }

