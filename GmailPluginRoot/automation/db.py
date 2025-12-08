# db.py
# -------------------------------------------------------------------
# Ripple Gmail Plugin Database Layer (Supabase PostgreSQL)
# -------------------------------------------------------------------

import os
from pathlib import Path
from contextlib import contextmanager
from typing import List, Dict, Optional

from sqlalchemy import create_engine, text, Integer, BigInteger, String, Text, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from config import DATABASE_URL


# -------------------------------------------------------------------
# SQLAlchemy Base and Models
# -------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


class GmailContact(Base):
    """Gmail plugin contacts table (separate from main Ripple contacts)."""
    __tablename__ = "gmail_contacts"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False, index=True)  # FK enforced at DB level
    name: Mapped[Optional[str]] = mapped_column(String(200))
    last_contact_ts: Mapped[int] = mapped_column(BigInteger, default=0)  # Gmail timestamps are in milliseconds (BIGINT)

    # Checklist flags
    has_reached_out: Mapped[bool] = mapped_column(Boolean, default=False)
    has_contact_responded: Mapped[bool] = mapped_column(Boolean, default=False)
    has_scheduled_meeting: Mapped[bool] = mapped_column(Boolean, default=False)
    awaiting_reply_from_user: Mapped[bool] = mapped_column(Boolean, default=False)


class GmailThread(Base):
    """Gmail plugin threads table."""
    __tablename__ = "gmail_threads"

    thread_id: Mapped[str] = mapped_column(String(500), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False, index=True)  # FK enforced at DB level
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))  # No FK - handle in code
    subject: Mapped[Optional[str]] = mapped_column(Text)
    is_networking: Mapped[bool] = mapped_column(Boolean, nullable=False)
    first_message_ts: Mapped[Optional[int]] = mapped_column(BigInteger)  # Gmail timestamps are in milliseconds (BIGINT)
    last_updated_ts: Mapped[Optional[int]] = mapped_column(BigInteger)  # Gmail timestamps are in milliseconds (BIGINT)
    meeting_scheduled: Mapped[bool] = mapped_column(Boolean, default=False)


class GmailMessage(Base):
    """Gmail plugin messages table."""
    __tablename__ = "gmail_messages"

    gmail_id: Mapped[str] = mapped_column(String(500), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False, index=True)  # FK enforced at DB level
    thread_id: Mapped[Optional[str]] = mapped_column(String(500))  # No FK - handle in code
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))  # No FK - handle in code
    timestamp: Mapped[int] = mapped_column(BigInteger, default=0)  # Gmail timestamps are in milliseconds (BIGINT)
    direction: Mapped[str] = mapped_column(String(20))  # "sent" or "received"
    summary: Mapped[Optional[str]] = mapped_column(Text)


# -------------------------------------------------------------------
# Database Engine Setup
# -------------------------------------------------------------------

def _validate_database_url(url: str) -> tuple[bool, str]:
    """Validate database URL format."""
    if not url:
        return False, "DATABASE_URL environment variable is not set"
    
    if url.startswith("https://") or url.startswith("http://"):
        return False, "DATABASE_URL should start with 'postgresql://' or 'sqlite://'"
    
    if "postgres" in url.lower() and not url.startswith("postgresql://"):
        if url.startswith("postgres://"):
            return True, "Converted postgres:// to postgresql://"
        return False, "PostgreSQL DATABASE_URL should start with 'postgresql://'"
    
    return True, ""


# Validate and configure connection
is_valid, error_msg = _validate_database_url(DATABASE_URL)
if not is_valid:
    print(f"❌ DATABASE_URL Validation Error: {error_msg}")
    raise ValueError(f"Invalid DATABASE_URL: {error_msg}")
elif error_msg:
    print(f"⚠️  DATABASE_URL: {error_msg}")

# Configure connection args for Supabase
connect_args = {}
if "supabase" in DATABASE_URL.lower():
    # Check for SSL certificate file
    cert_paths = [
        Path(__file__).parent.parent / "prod-supabase.cer",
        Path(__file__).parent.parent.parent / "prod-supabase.cer",
    ]
    
    cert_file = None
    for path in cert_paths:
        if path.exists():
            cert_file = str(path)
            break
    
    if cert_file:
        connect_args["sslmode"] = "require"
        connect_args["sslrootcert"] = cert_file
        print(f"✅ Using SSL certificate: {cert_file}")
    else:
        connect_args["sslmode"] = "prefer"
        print("✅ SSL mode: prefer")
    
    connect_args["connect_timeout"] = 10

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
    pool_reset_on_return='commit'
)

# Create session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# -------------------------------------------------------------------
# Connection Helper
# -------------------------------------------------------------------

@contextmanager
def get_session():
    """Context manager that yields a SQLAlchemy session."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# -------------------------------------------------------------------
# Database Initialization
# -------------------------------------------------------------------

def init_db() -> None:
    """Creates the Gmail plugin schema in Supabase."""
    print("Initializing Gmail plugin database schema...")
    try:
        Base.metadata.create_all(engine)
        print("✅ Gmail plugin database schema initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise


# -------------------------------------------------------------------
# User Lookup and Validation
# -------------------------------------------------------------------

def is_gmail_email(email: str) -> bool:
    """Check if email is a Gmail address."""
    if not email:
        return False
    email_lower = email.lower().strip()
    # Check for @gmail.com or @googlemail.com
    return email_lower.endswith("@gmail.com") or email_lower.endswith("@googlemail.com")


def get_user_id_from_email(gmail_email: str) -> Optional[int]:
    """
    Look up user_id from Gmail email address.
    Validates that the email is a Gmail address.
    Returns None if not found or not a Gmail address.
    """
    if not gmail_email:
        return None
    
    # Validate it's a Gmail address
    if not is_gmail_email(gmail_email):
        print(f"⚠️  Email {gmail_email} is not a Gmail address. Gmail plugin requires a Gmail account.")
        return None
    
    email_lower = gmail_email.lower().strip()
    
    try:
        with get_session() as session:
            result = session.execute(
                text("SELECT user_id FROM users WHERE LOWER(email) = :email LIMIT 1"),
                {"email": email_lower}
            )
            row = result.fetchone()
            if row:
                return int(row[0])
            else:
                print(f"⚠️  No Ripple user found with email {gmail_email}. User must register with this Gmail address first.")
                return None
    except Exception as e:
        print(f"❌ Error looking up user_id for {gmail_email}: {e}")
        return None


# -------------------------------------------------------------------
# Basic Helpers
# -------------------------------------------------------------------

def message_exists(gmail_id: str, user_id: int) -> bool:
    """Returns True if this Gmail message has already been stored for this user."""
    if not gmail_id or not user_id:
        return False
    
    with get_session() as session:
        result = session.execute(
            text("SELECT 1 FROM gmail_messages WHERE gmail_id = :gmail_id AND user_id = :user_id LIMIT 1"),
            {"gmail_id": gmail_id, "user_id": user_id}
        )
        return result.fetchone() is not None


def upsert_contact(name: Optional[str], email: str, last_contact_ts: int, user_id: int) -> None:
    """Insert or update a contact. Only called for networking threads."""
    if not email or not user_id:
        return
    
    email_norm = email.lower()
    
    with get_session() as session:
        # Use composite key lookup (email + user_id)
        existing = session.execute(
            text("SELECT name, last_contact_ts FROM gmail_contacts WHERE email = :email AND user_id = :user_id"),
            {"email": email_norm, "user_id": user_id}
        ).fetchone()
        
        if existing:
            existing_name, existing_ts = existing
            new_name = name.strip() if name else existing_name
            new_ts = max(existing_ts or 0, last_contact_ts or 0)
            session.execute(
                text("""
                    UPDATE gmail_contacts 
                    SET name = :name, last_contact_ts = :last_contact_ts
                    WHERE email = :email AND user_id = :user_id
                """),
                {
                    "name": new_name,
                    "last_contact_ts": new_ts,
                    "email": email_norm,
                    "user_id": user_id
                }
            )
        else:
            new_contact = GmailContact(
                email=email_norm,
                user_id=user_id,
                name=name.strip() if name else None,
                last_contact_ts=last_contact_ts or 0
            )
            session.add(new_contact)


def get_thread_networking_status(thread_id: str, user_id: int) -> Optional[bool]:
    """Returns True/False if thread exists for this user, or None if not seen yet."""
    if not thread_id or not user_id:
        return None
    
    with get_session() as session:
        result = session.execute(
            text("SELECT is_networking FROM gmail_threads WHERE thread_id = :thread_id AND user_id = :user_id LIMIT 1"),
            {"thread_id": thread_id, "user_id": user_id}
        )
        row = result.fetchone()
        if row is None:
            return None
        return bool(row[0])


def upsert_thread(
    thread_id: str,
    contact_email: str,
    subject: str,
    message_ts: int,
    is_networking: bool,
    user_id: int,
) -> None:
    """Upsert thread metadata."""
    if not thread_id or not user_id:
        return
    
    email_norm = (contact_email or "").lower() or None if is_networking else None
    subj = (subject or "").strip() or None
    
    with get_session() as session:
        existing = session.execute(
            text("SELECT contact_email, subject, is_networking, first_message_ts, last_updated_ts FROM gmail_threads WHERE thread_id = :thread_id AND user_id = :user_id"),
            {"thread_id": thread_id, "user_id": user_id}
        ).fetchone()
        
        if existing:
            # Update existing thread
            existing_email, existing_subject, existing_is_net, first_ts, last_ts = existing
            new_email = email_norm or existing_email
            new_subject = existing_subject or subj
            new_first_ts = first_ts or message_ts
            new_last_ts = max(last_ts or 0, message_ts or 0)
            new_is_net = True if (existing_is_net == True or is_networking) else False
            
            session.execute(
                text("""
                    UPDATE gmail_threads 
                    SET contact_email = :contact_email, subject = :subject,
                        is_networking = :is_networking, first_message_ts = :first_ts,
                        last_updated_ts = :last_ts
                    WHERE thread_id = :thread_id AND user_id = :user_id
                """),
                {
                    "contact_email": new_email,
                    "subject": new_subject,
                    "is_networking": new_is_net,
                    "first_ts": new_first_ts,
                    "last_ts": new_last_ts,
                    "thread_id": thread_id,
                    "user_id": user_id
                }
            )
        else:
            new_thread = GmailThread(
                thread_id=thread_id,
                user_id=user_id,
                contact_email=email_norm,
                subject=subj,
                is_networking=is_networking,
                first_message_ts=message_ts,
                last_updated_ts=message_ts
            )
            session.add(new_thread)


def insert_networking_message(
    gmail_id: str,
    thread_id: str,
    contact_email: str,
    timestamp: int,
    direction: str,
    summary: str,
    user_id: int,
) -> None:
    """Insert a networking message. Only summary is stored."""
    if not gmail_id or not user_id:
        return
    
    email_norm = (contact_email or "").lower() or None
    
    with get_session() as session:
        # Check if message already exists for this user
        existing = session.execute(
            text("SELECT 1 FROM gmail_messages WHERE gmail_id = :gmail_id AND user_id = :user_id LIMIT 1"),
            {"gmail_id": gmail_id, "user_id": user_id}
        ).fetchone()
        if existing:
            return  # Already exists, skip
        
        new_message = GmailMessage(
            gmail_id=gmail_id,
            user_id=user_id,
            thread_id=thread_id,
            contact_email=email_norm,
            timestamp=timestamp or 0,
            direction=direction,
            summary=summary
        )
        session.add(new_message)


# -------------------------------------------------------------------
# Thread Analysis Helpers
# -------------------------------------------------------------------

def get_thread_messages_for_analysis(thread_id: str, user_id: int) -> List[Dict]:
    """Returns summaries + direction + timestamp (chronological) for meeting detection."""
    if not thread_id or not user_id:
        return []
    
    with get_session() as session:
        messages = session.execute(
            text("""
                SELECT timestamp, direction, summary
                FROM gmail_messages
                WHERE thread_id = :thread_id AND user_id = :user_id
                ORDER BY timestamp ASC
            """),
            {"thread_id": thread_id, "user_id": user_id}
        ).fetchall()
    
    return [
        {
            "timestamp": int(ts or 0),
            "direction": (direction or "").strip().lower(),
            "summary": (summary or "").strip(),
        }
        for ts, direction, summary in messages
    ]


def set_thread_meeting_scheduled(thread_id: str, user_id: int) -> None:
    """Mark a thread as having a scheduled meeting. Once set, never unset."""
    if not thread_id or not user_id:
        return
    
    with get_session() as session:
        session.execute(
            text("""
                UPDATE gmail_threads 
                SET meeting_scheduled = true
                WHERE thread_id = :thread_id AND user_id = :user_id
            """),
            {"thread_id": thread_id, "user_id": user_id}
        )


# -------------------------------------------------------------------
# Contact Checklist Recomputation
# -------------------------------------------------------------------

def recompute_contact_checklist(contact_email: str, user_id: int) -> None:
    """Compute checklist flags for a contact."""
    if not contact_email or not user_id:
        return
    
    email = contact_email.lower()
    
    with get_session() as session:
        # Get all messages for this contact and user
        messages = session.execute(
            text("""
                SELECT timestamp, direction
                FROM gmail_messages
                WHERE contact_email = :email AND user_id = :user_id
                ORDER BY timestamp ASC
            """),
            {"email": email, "user_id": user_id}
        ).fetchall()
        
        directions = [(d or "").strip().lower() for _, d in messages]
        
        has_sent = any(d == "sent" for d in directions)
        has_received = any(d == "received" for d in directions)
        
        has_reached_out = has_sent
        awaiting_reply = has_received and not has_sent
        
        # Contact responded after user's outbound
        has_contact_responded = False
        if has_sent:
            first_sent_idx = next((i for i, d in enumerate(directions) if d == "sent"), None)
            if first_sent_idx is not None:
                if any(d == "received" for d in directions[first_sent_idx + 1:]):
                    has_contact_responded = True
        
        # Meeting scheduled anywhere across all threads for this user
        meeting_result = session.execute(
            text("""
                SELECT 1
                FROM gmail_threads
                WHERE contact_email = :email
                  AND user_id = :user_id
                  AND meeting_scheduled = true
                LIMIT 1
            """),
            {"email": email, "user_id": user_id}
        ).fetchone()
        has_scheduled_meeting = meeting_result is not None
        
        # Update contact (use composite key: email + user_id)
        session.execute(
            text("""
                UPDATE gmail_contacts
                SET has_reached_out = :has_reached_out,
                    has_contact_responded = :has_contact_responded,
                    has_scheduled_meeting = :has_scheduled_meeting,
                    awaiting_reply_from_user = :awaiting_reply
                WHERE email = :email AND user_id = :user_id
            """),
            {
                "has_reached_out": has_reached_out,
                "has_contact_responded": has_contact_responded,
                "has_scheduled_meeting": has_scheduled_meeting,
                "awaiting_reply": awaiting_reply,
                "email": email,
                "user_id": user_id
            }
        )
