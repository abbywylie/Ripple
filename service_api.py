from __future__ import annotations

from typing import Optional, List, Dict, Any

from data.database_functions import (
    add_user,
    add_contact,
    add_meeting,
    add_contact_for_user_email,
    add_meeting_by_emails,
    User,
    Contact,
    Meeting,
    SessionLocal,
    select,
)

from data.database_functions import (
    AlreadyExistsError,
    NotFoundError
)

def user_to_dict(user: User) -> Dict[str, Any]:
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "created_date_time": user.created_date_time.isoformat() if user.created_date_time else None,
    }


def contact_to_dict(contact: Contact) -> Dict[str, Any]:
    return {
        "contact_id": contact.contact_id,
        "user_id": contact.user_id,
        "name": contact.name,
        "email": contact.email,
        "phone_number": contact.phone_number,
        "company": contact.company,
        "job_title": contact.job_title,
        "date_first_meeting": contact.date_first_meeting.isoformat() if contact.date_first_meeting else None,
        "date_next_follow_up": contact.date_next_follow_up.isoformat() if contact.date_next_follow_up else None,
        "date_created": contact.date_created.isoformat() if contact.date_created else None,
    }


def meeting_to_dict(meeting: Meeting) -> Dict[str, Any]:
    return {
        "meeting_id": meeting.meeting_id,
        "user_id": meeting.user_id,
        "contact_id": meeting.contact_id,
        "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
        "start_time": meeting.start_time.isoformat() if meeting.start_time else None,
        "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
        "meeting_type": meeting.meeting_type,
        "location": meeting.location,
        "meeting_notes": meeting.meeting_notes,
        "thank_you": meeting.thank_you,
    }


# Basic read/query helpers for internal use
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with SessionLocal() as s:
        result = s.execute(select(User).where(User.email == email)).scalar_one_or_none()
        return user_to_dict(result) if result else None


def list_contacts_for_user(user_id: int) -> List[Dict[str, Any]]:
    with SessionLocal() as s:
        rows = s.execute(select(Contact).where(Contact.user_id == user_id)).scalars().all()
        return [contact_to_dict(c) for c in rows]


def list_meetings_for_contact(contact_id: int) -> List[Dict[str, Any]]:
    with SessionLocal() as s:
        rows = s.execute(select(Meeting).where(Meeting.contact_id == contact_id)).scalars().all()
        return [meeting_to_dict(m) for m in rows]


# Write operations returning dicts
def create_user(email: str, password_hash: str, name: str) -> Dict[str, Any]:
    user = add_user(email=email, password_hash=password_hash, name=name)
    return user_to_dict(user)


def create_contact(
    user_id: int,
    name: str,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    date_first_meeting: Optional[str] = None,
    date_next_follow_up: Optional[str] = None,
) -> Dict[str, Any]:
    contact = add_contact(
        user_id=user_id,
        name=name,
        email=email,
        phone_number=phone_number,
        company=company,
        job_title=job_title,
        date_first_meeting=None if not date_first_meeting else __import__("datetime").date.fromisoformat(date_first_meeting),
        date_next_follow_up=None if not date_next_follow_up else __import__("datetime").date.fromisoformat(date_next_follow_up),
    )
    return contact_to_dict(contact)


def create_meeting(
    user_id: int,
    contact_id: int,
    meeting_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    meeting_type: Optional[str] = None,
    location: Optional[str] = None,
    meeting_notes: Optional[str] = None,
    thank_you: bool = False,
) -> Dict[str, Any]:
    dt = __import__("datetime")
    meeting = add_meeting(
        user_id=user_id,
        contact_id=contact_id,
        meeting_date=None if not meeting_date else dt.date.fromisoformat(meeting_date),
        start_time=None if not start_time else dt.time.fromisoformat(start_time),
        end_time=None if not end_time else dt.time.fromisoformat(end_time),
        meeting_type=meeting_type,
        location=location,
        meeting_notes=meeting_notes,
        thank_you=thank_you,
    )
    return meeting_to_dict(meeting)


