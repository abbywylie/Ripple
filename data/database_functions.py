# models.py
from __future__ import annotations

from datetime import datetime, date, time
from pathlib import Path
from typing import Optional

from sqlalchemy import (
    create_engine, String, Integer, DateTime, Date, Time,
    Text, Boolean, ForeignKey, event, select
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship,
    sessionmaker, Session
)

# ----- Base -----
class Base(DeclarativeBase):
    pass

# ----- Tables -----
class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_date_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    contacts: Mapped[list["Contact"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    meetings: Mapped[list["Meeting"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    contact_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone_number: Mapped[Optional[str]] = mapped_column(String(50))
    company: Mapped[Optional[str]] = mapped_column(String(200))
    job_title: Mapped[Optional[str]] = mapped_column(String(200))

    date_first_meeting: Mapped[Optional[date]] = mapped_column(Date)
    date_next_follow_up: Mapped[Optional[date]] = mapped_column(Date)
    date_created: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="contacts")
    meetings: Mapped[list["Meeting"]] = relationship(back_populates="contact", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.contact_id", ondelete="CASCADE"), nullable=False)

    meeting_date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    meeting_type: Mapped[Optional[str]] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(200))
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text)
    thank_you: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="meetings")
    contact: Mapped["Contact"] = relationship(back_populates="meetings")


# ----- Engine / DB init -----
# Ensure ./data exists and point SQLite there

DB_FILE = "/Users/gabeschwartz/Documents/GitHub/Ripple/data/networking.db"

engine = create_engine(f"sqlite:///{DB_FILE}", echo=False, future=True)

# Ensure SQLite enforces foreign keys (SQLite off by default)
@event.listens_for(engine, "connect")
def _fk_pragma_on_connect(dbapi_connection, connection_record):
    cur = dbapi_connection.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()

# (Optional) WAL mode for smoother concurrent reads
@event.listens_for(engine, "connect")
def _wal_on_connect(dbapi_connection, connection_record):
    try:
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.close()
    except Exception:
        pass

Base.metadata.create_all(engine)

# Session factory
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


# --- Optional: simple app-level errors ---
class AlreadyExistsError(Exception): ...
class NotFoundError(Exception): ...


# --- Session helper (context-managed) ---
class get_session:
    def __enter__(self) -> Session:
        self.s = SessionLocal()
        return self.s
    def __exit__(self, exc_type, exc, tb):
        if exc:
            self.s.rollback()
        else:
            self.s.commit()
        self.s.close()


# ---------- USERS ----------
def add_user(*, email: str, password_hash: str, name: str) -> User:
    """Create a new user if email not taken. Returns the persisted User."""
    with get_session() as s:
        existing = s.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise AlreadyExistsError(f"user with email {email} already exists")

        user = User(email=email, password_hash=password_hash, name=name)
        s.add(user)
        s.flush()   # populate user.user_id
        s.refresh(user)
        return user


# ---------- CONTACTS ----------
def add_contact(
    *,
    user_id: int,
    name: str,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    date_first_meeting: Optional[date] = None,
    date_next_follow_up: Optional[date] = None,
) -> Contact:
    """Add a contact for a given user_id."""
    with get_session() as s:
        if not s.get(User, user_id):
            raise NotFoundError(f"user {user_id} not found")

        contact = Contact(
            user_id=user_id,
            name=name,
            email=email,
            phone_number=phone_number,
            company=company,
            job_title=job_title,
            date_first_meeting=date_first_meeting,
            date_next_follow_up=date_next_follow_up,
        )
        s.add(contact)
        s.flush()
        s.refresh(contact)
        return contact


# ---------- MEETINGS ----------
def add_meeting(
    *,
    user_id: int,
    contact_id: int,
    meeting_date: Optional[date] = None,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    meeting_type: Optional[str] = None,
    location: Optional[str] = None,
    meeting_notes: Optional[str] = None,
    thank_you: bool = False,
) -> Meeting:
    """Create a meeting row tied to a user and a contact."""
    with get_session() as s:
        if not s.get(User, user_id):
            raise NotFoundError(f"user {user_id} not found")
        if not s.get(Contact, contact_id):
            raise NotFoundError(f"contact {contact_id} not found")

        mtg = Meeting(
            user_id=user_id,
            contact_id=contact_id,
            meeting_date=meeting_date,
            start_time=start_time,
            end_time=end_time,
            meeting_type=meeting_type,
            location=location,
            meeting_notes=meeting_notes,
            thank_you=thank_you,
        )
        s.add(mtg)
        s.flush()
        s.refresh(mtg)
        return mtg


# ---------- Convenience variants ----------
def add_contact_for_user_email(*, user_email: str, name: str, **kwargs) -> Contact:
    """Find user by email, then add the contact."""
    with get_session() as s:
        user = s.execute(select(User).where(User.email == user_email)).scalar_one_or_none()
        if not user:
            raise NotFoundError(f"user with email {user_email} not found")
        contact = Contact(user_id=user.user_id, name=name, **kwargs)
        s.add(contact)
        s.flush(); s.refresh(contact)
        return contact


def add_meeting_by_emails(*, user_email: str, contact_id: int, **kwargs) -> Meeting:
    """Resolve user by email, then create the meeting."""
    with get_session() as s:
        user = s.execute(select(User).where(User.email == user_email)).scalar_one_or_none()
        if not user:
            raise NotFoundError(f"user with email {user_email} not found")
        mtg = Meeting(user_id=user.user_id, contact_id=contact_id, **kwargs)
        s.add(mtg)
        s.flush(); s.refresh(mtg)
        return mtg


# ----- Tiny smoke test (optional) -----
if __name__ == "__main__":
    print(f"DB path: {DB_FILE}")
    with SessionLocal() as s:
        u = User(email="user@example.com", password_hash="hash", name="user1")
        c = Contact(user=u, name="contact", email="contact@co.com", company="example inc")
        m = Meeting(user=u, contact=c, meeting_type="Coffee chat")
        s.add_all([u, c, m])
        s.commit()
        print("OK")
