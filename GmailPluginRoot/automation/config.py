# config.py
import os
from pathlib import Path

# Load .env file if it exists (for local development)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not installed, skip .env loading
    pass

# --- Gmail / Google API config ---

# Path to OAuth 2.0 client secrets (from Google Cloud Console)
# Default: Look in ../plugin/client_secret_test.json relative to this file
_default_credentials = Path(__file__).parent.parent / "plugin" / "client_secret_test.json"
_credentials_path = os.getenv("GOOGLE_CREDENTIALS_FILE")
if not _credentials_path:
    _credentials_path = str(_default_credentials) if _default_credentials.exists() else None

GOOGLE_CREDENTIALS_FILE = _credentials_path

if not GOOGLE_CREDENTIALS_FILE or not Path(GOOGLE_CREDENTIALS_FILE).exists():
    print(f"⚠️  Warning: Gmail OAuth credentials file not found.")
    print(f"   Expected at: {_default_credentials}")
    print(f"   Set GOOGLE_CREDENTIALS_FILE environment variable to point to your credentials file.")
    print(f"   Get credentials from: https://console.cloud.google.com/apis/credentials")

# Token file that stores the user's access/refresh token (created on first run)
GMAIL_TOKEN_FILE = os.getenv("GMAIL_TOKEN_FILE", "token.json")

# Your own primary email address (used to infer direction / counterparty)
USER_EMAIL = os.getenv("GMAIL_USER_EMAIL", "markarshavsky@gmail.com")


# --- OpenAI / LLM config ---

# OpenAI API key (from your personal OpenAI account)
OPENAI_API_KEY = os.getenv("RIPPLE_OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))

# Models used for classification and summaries
OPENAI_CLASSIFY_MODEL_NAME = os.getenv("OPENAI_CLASSIFY_MODEL", "gpt-4.1-mini")
OPENAI_SUMMARY_MODEL_NAME = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4.1-mini")

# Model used for meeting detection (falls back to SUMMARY if None)
OPENAI_MEETING_MODEL_NAME = os.getenv("OPENAI_MEETING_MODEL", "gpt-4.1-mini")


# --- Database config ---

# Use Supabase PostgreSQL (same as main Ripple backend)
# Falls back to SQLite for local development if DATABASE_URL not set
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{Path(__file__).parent / 'data' / 'ripple_networking.db'}"
)

# Poll interval in seconds (e.g., 60 = check once per minute)
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))

# How many recent messages to pull on each poll (per label)
MAX_MESSAGES_PER_POLL = int(os.getenv("MAX_MESSAGES_PER_POLL", "10"))
