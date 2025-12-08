# gmail_client.py
import base64
import os
import re
from email.header import decode_header, make_header
from email.utils import getaddresses
from typing import Dict, Any, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from config import GOOGLE_CREDENTIALS_FILE, GMAIL_TOKEN_FILE, MAX_MESSAGES_PER_POLL

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


# =====================================================================
# Helper Functions
# =====================================================================

def _decode_header_value(value: str) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value))).strip()
    except Exception:
        return value or ""


def _parse_address_list(header_val: str) -> List[tuple]:
    """
    Returns [(name, email), ...] parsed from the header.
    """
    if not header_val:
        return []
    addresses = getaddresses([header_val])
    results = []
    for name, email in addresses:
        name = (name or "").strip()
        email = (email or "").strip()
        if email:
            results.append((name, email))
    return results


def _extract_body_text(message: Dict[str, Any]) -> str:
    """
    Extract best-effort plain text from Gmail payload.
    """
    snippet = message.get("snippet", "") or ""
    payload = message.get("payload", {}) or {}
    body = payload.get("body", {}) or {}

    # Direct body
    data = body.get("data")
    if data:
        try:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
        except Exception:
            pass

    # Multipart: text/plain first
    parts = payload.get("parts", []) or []
    for part in parts:
        if part.get("mimeType") == "text/plain":
            pdata = part.get("body", {}).get("data")
            if pdata:
                try:
                    return base64.urlsafe_b64decode(pdata).decode("utf-8", errors="ignore")
                except Exception:
                    continue

    # Multipart: fallback to text/html
    for part in parts:
        if part.get("mimeType") == "text/html":
            pdata = part.get("body", {}).get("data")
            if pdata:
                try:
                    html = base64.urlsafe_b64decode(pdata).decode("utf-8", errors="ignore")

                    # Remove script/style
                    html = re.sub(
                        r"<(script|style)[^>]*>.*?</\1>",
                        "",
                        html,
                        flags=re.IGNORECASE | re.DOTALL,
                    )

                    # Strip all remaining tags
                    return re.sub(r"<[^>]+>", "", html)

                except Exception:
                    continue

    return snippet


def _clean_body_text(text: str) -> str:
    """
    Clean and trim body text for LLM meeting analysis.
    Removes quoted replies, signatures, and excess whitespace.
    """
    if not text:
        return ""

    t = text

    # Remove common reply headers (non-greedy)
    t = re.sub(r"On .*? wrote:", "", t, flags=re.IGNORECASE)

    # Remove Gmail-style quote lines starting with ">"
    t = re.sub(r"^>.*$", "", t, flags=re.MULTILINE)

    # Remove signatures ONLY when they appear at the end
    t = re.sub(r"\n--\s*\n.*$", "", t, flags=re.DOTALL)

    # Collapse blank lines
    t = re.sub(r"\n\s*\n+", "\n", t)

    return t.strip()


# =====================================================================
# Gmail Authentication
# =====================================================================

def get_gmail_service():
    """
    Returns an authenticated Gmail API client.
    """
    creds = None

    if os.path.exists(GMAIL_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                GOOGLE_CREDENTIALS_FILE, SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save token
        with open(GMAIL_TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


# =====================================================================
# Fetch Recent Messages
# =====================================================================

def fetch_recent_messages(
    service,
    label_ids: Optional[List[str]] = None,
    query: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch up to MAX_MESSAGES_PER_POLL recent Gmail messages.
    Used by the inbound message processor.
    """
    if label_ids is None:
        label_ids = ["INBOX"]

    list_req = (
        service.users()
        .messages()
        .list(
            userId="me",
            labelIds=label_ids,
            maxResults=MAX_MESSAGES_PER_POLL,
            q=query or None,
        )
    )
    resp = list_req.execute()

    refs = resp.get("messages", []) or []
    if not refs:
        return []

    out: List[Dict[str, Any]] = []

    for ref in refs:
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=ref["id"], format="full")
            .execute()
        )
        payload = msg.get("payload", {}) or {}
        headers = payload.get("headers", []) or []
        header_map = {h.get("name", "").lower(): h.get("value", "") for h in headers}

        subject = _decode_header_value(header_map.get("subject", ""))
        from_list = _parse_address_list(header_map.get("from", ""))
        to_list = _parse_address_list(header_map.get("to", ""))
        body_text = _extract_body_text(msg)
        internal_date = int(msg.get("internalDate", 0) or 0)
        thread_id = msg.get("threadId", "") or ""

        out.append(
            {
                "id": msg.get("id"),
                "thread_id": thread_id,
                "label_ids": msg.get("labelIds", []) or [],
                "subject": subject,
                "from_list": from_list,
                "to_list": to_list,
                "body_text": body_text,
                "internal_date": internal_date,
            }
        )

    return out


# =====================================================================
# Fetch Full Thread (for Meeting Detection)
# =====================================================================

def fetch_thread_full(
    service,
    thread_id: str,
    user_email: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch a Gmail thread and return messages shaped for LLM meeting detection:

    Each dict:
      - timestamp: int (Gmail internalDate)
      - direction: "sent" or "received"
      - body_text: cleaned plain text
      - subject: decoded subject line

    NO raw bodies are persisted — this is transient & LLM-only.
    """
    if not thread_id:
        return []

    # Determine user email if not provided
    if user_email is None:
        try:
            profile = service.users().getProfile(userId="me").execute()
            user_email = profile.get("emailAddress", "").lower()
        except Exception:
            user_email = ""

    try:
        thread = (
            service.users()
            .threads()
            .get(userId="me", id=thread_id, format="full")
            .execute()
        )
    except Exception:
        return []

    msgs = thread.get("messages", []) or []
    results: List[Dict[str, Any]] = []

    for msg in msgs:
        internal_ts = int(msg.get("internalDate", 0) or 0)
        payload = msg.get("payload", {}) or {}
        headers = payload.get("headers", []) or []
        header_map = {h.get("name", "").lower(): h.get("value", "") for h in headers}

        from_list = _parse_address_list(header_map.get("from", ""))
        subject = _decode_header_value(header_map.get("subject", ""))

        sender_email = (from_list[0][1].lower() if from_list else "")
        direction = "sent" if user_email and sender_email == user_email else "received"

        raw_body = _extract_body_text(msg)
        clean_body = _clean_body_text(raw_body)

        results.append(
            {
                "timestamp": internal_ts,
                "direction": direction,
                "body_text": clean_body,
                "subject": subject,
            }
        )

    # Chronological order
    results.sort(key=lambda m: m["timestamp"])
    return results