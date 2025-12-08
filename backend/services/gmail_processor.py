# processor.py (copied from GmailPluginRoot/automation)
import traceback
from typing import Dict, Any, Optional, Tuple

# Import from local directory (backend/services)
try:
    # Try importing from same directory (when in backend/services)
    from .gmail_db import (
        message_exists,
        upsert_contact,
        upsert_thread,
        insert_networking_message,
        get_thread_networking_status,
        get_thread_messages_for_analysis,
        set_thread_meeting_scheduled,
        recompute_contact_checklist,
        get_user_id_from_email,
        is_gmail_email,
    )
    from .gmail_client import fetch_thread_full, get_gmail_service
    from .gmail_llm_client import classify_and_summarize, summarize_email, analyze_thread_for_meeting_full_emails
except ImportError:
    try:
        # Try importing without dot (absolute import)
        from gmail_db import (
            message_exists,
            upsert_contact,
            upsert_thread,
            insert_networking_message,
            get_thread_networking_status,
            get_thread_messages_for_analysis,
            set_thread_meeting_scheduled,
            recompute_contact_checklist,
            get_user_id_from_email,
            is_gmail_email,
        )
        from gmail_client import fetch_thread_full, get_gmail_service
        from gmail_llm_client import classify_and_summarize, summarize_email, analyze_thread_for_meeting_full_emails
    except ImportError:
        # Fallback to original imports if running from GmailPluginRoot
        from db import (
            message_exists,
            upsert_contact,
            upsert_thread,
            insert_networking_message,
            get_thread_networking_status,
            get_thread_messages_for_analysis,
            set_thread_meeting_scheduled,
            recompute_contact_checklist,
            get_user_id_from_email,
            is_gmail_email,
        )
        from gmail_client import fetch_thread_full, get_gmail_service
        from llm_client import classify_and_summarize, summarize_email, analyze_thread_for_meeting_full_emails


# ================================================================
# Helper functions
# ================================================================

def _direction_and_contact(msg: Dict[str, Any], gmail_email: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Determine direction ("sent"/"received") and counterparty email.
    
    Args:
        msg: Gmail message dictionary
        gmail_email: The authenticated Gmail account email address
    """
    label_ids = msg.get("label_ids", []) or []
    from_list = msg.get("from_list", []) or []
    to_list = msg.get("to_list", []) or []
    me = (gmail_email or "").lower()

    # Sent: user is sender → pick first non-user in To
    if "SENT" in label_ids:
        for _, email in to_list:
            if email and email.lower() != me:
                return "sent", email.lower()

    # Received: pick first non-user in From
    for _, email in from_list:
        if email and email.lower() != me:
            return "received", email.lower()

    return None, None


def _contact_name(msg: Dict[str, Any], email: str) -> Optional[str]:
    """Extract human-friendly name from headers."""
    email_lower = (email or "").lower()
    for name, e in (msg.get("from_list", []) or []) + (msg.get("to_list", []) or []):
        if e and e.lower() == email_lower and name:
            return name.strip()
    return None


def _thread_has_meeting(thread_id: str, user_id: int) -> bool:
    """
    True if thread already has meeting_scheduled = true for this user.
    """
    from db import get_session, text
    if not thread_id or not user_id:
        return False

    with get_session() as session:
        result = session.execute(
            text("SELECT meeting_scheduled FROM gmail_threads WHERE thread_id = :thread_id AND user_id = :user_id"),
            {"thread_id": thread_id, "user_id": user_id}
        )
        row = result.fetchone()
        return bool(row and row[0] == True)


# ================================================================
# PROCESSOR: Main pipeline for each Gmail message
# ================================================================

def process_message(msg: Dict[str, Any], user_id: int, gmail_email: str) -> bool:
    """
    Full networking message processing pipeline.
    Includes:
      ✔ classification
      ✔ summaries
      ✔ DB persistence
      ✔ checklist recomputation
      ✔ inbound-first logic
      ✔ meeting detection (full thread)
    
    Args:
        msg: Gmail message dictionary
        user_id: Ripple user_id (must be provided, validated before calling)
    """

    gmail_id = msg.get("id")
    thread_id = msg.get("thread_id")

    if not gmail_id or not user_id:
        return False

    # 1. Skip if already processed for this user
    try:
        if message_exists(gmail_id, user_id):
            return False
    except Exception:
        traceback.print_exc()

    if not thread_id:
        return False

    # 2. Fetch known networking status for this user
    try:
        thread_status = get_thread_networking_status(thread_id, user_id)
    except Exception:
        traceback.print_exc()
        thread_status = None

    # 3. Determine direction + counterparty email
    try:
        direction, contact_email = _direction_and_contact(msg, gmail_email)
        if not direction or not contact_email:
            return False
    except Exception:
        traceback.print_exc()
        return False

    subject = msg.get("subject", "") or ""
    body = msg.get("body_text", "") or ""
    ts = int(msg.get("internal_date", 0) or 0)

    # ----------------------------------------------------------
    # Case A: Thread known to be NOT networking
    # ----------------------------------------------------------
    if thread_status is False:
        return False

    # ----------------------------------------------------------
    # Case B: Thread already networking → summarize this email
    # ----------------------------------------------------------
    if thread_status is True:

        try:
            summary = summarize_email(subject, body)
        except Exception:
            traceback.print_exc()
            return False

        if not summary:
            return False

        # Update metadata
        try:
            name = _contact_name(msg, contact_email)
            upsert_contact(name=name, email=contact_email, last_contact_ts=ts, user_id=user_id)
            upsert_thread(
                thread_id=thread_id,
                contact_email=contact_email,
                subject=subject,
                message_ts=ts,
                is_networking=True,
                user_id=user_id,
            )
        except Exception:
            traceback.print_exc()
            return False

        try:
            insert_networking_message(
                gmail_id=gmail_id,
                thread_id=thread_id,
                contact_email=contact_email,
                timestamp=ts,
                direction=direction,
                summary=summary,
                user_id=user_id,
            )
        except Exception:
            traceback.print_exc()
            return False

        # Recompute checklist
        try:
            recompute_contact_checklist(contact_email, user_id)
        except Exception:
            traceback.print_exc()

        # Attempt meeting detection
        _maybe_detect_meeting(thread_id, contact_email, user_id, gmail_email)

        return True

    # ----------------------------------------------------------
    # Case C: New thread → classify
    # ----------------------------------------------------------
    try:
        is_networking, summary = classify_and_summarize(subject, body)
    except Exception:
        traceback.print_exc()
        return False

    # For networking threads, we need a contact row (FK);
    # for non-networking, we do NOT create a contact at all.
    if is_networking:
        try:
            name = _contact_name(msg, contact_email)
            upsert_contact(name=name, email=contact_email, last_contact_ts=ts, user_id=user_id)
        except Exception:
            traceback.print_exc()
            return False

    # Always persist thread networking status
    try:
        upsert_thread(
            thread_id=thread_id,
            contact_email=contact_email,
            subject=subject,
            message_ts=ts,
            is_networking=is_networking,
            user_id=user_id,
        )
    except Exception:
        traceback.print_exc()
        return False

    # Not networking → we're done (thread is recorded, but no contact row)
    if not is_networking:
        return False

    # Networking → store message
    try:
        insert_networking_message(
            gmail_id=gmail_id,
            thread_id=thread_id,
            contact_email=contact_email,
            timestamp=ts,
            direction=direction,
            summary=summary,
            user_id=user_id,
        )
    except Exception:
        traceback.print_exc()
        return False

    # Checklist update
    try:
        recompute_contact_checklist(contact_email, user_id)
    except Exception:
        traceback.print_exc()

    # Meeting detection
    _maybe_detect_meeting(thread_id, contact_email, user_id, gmail_email)

    return True


# ================================================================
# MEETING DETECTION WRAPPER
# ================================================================

def _maybe_detect_meeting(thread_id: str, contact_email: str, user_id: int, gmail_email: str) -> None:
    """
    Run meeting detection only when:
      - thread has >=1 sent AND >=1 received networking message
      - meeting not already logged
    """
    try:
        # Already has meeting → done
        if _thread_has_meeting(thread_id, user_id):
            return

        msgs = get_thread_messages_for_analysis(thread_id, user_id)
        if not msgs:
            return

        has_sent = any(m["direction"] == "sent" for m in msgs)
        has_received = any(m["direction"] == "received" for m in msgs)

        if not (has_sent and has_received):
            return

        # Fetch full Gmail thread for LLM
        service = get_gmail_service()
        full_thread = fetch_thread_full(service, thread_id, gmail_email)

        result = analyze_thread_for_meeting_full_emails(full_thread)
        if result.get("meeting_scheduled"):

            # Update thread → mark meeting scheduled
            set_thread_meeting_scheduled(thread_id, user_id)

            # Recompute contact-level checklist
            recompute_contact_checklist(contact_email, user_id)

    except Exception:
        traceback.print_exc()