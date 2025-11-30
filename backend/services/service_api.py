from __future__ import annotations

from typing import Optional, List, Dict, Any

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.database_functions import (
    add_user,
    update_user,
    add_contact,
    update_contact,
    delete_contact,
    add_meeting,
    update_meeting,
    delete_meeting,
    get_upcoming_meetings,
    get_meetings_for_date,
    add_contact_for_user_email,
    add_meeting_by_emails,
    get_upcoming_follow_ups,
    add_goal,
    update_goal,
    delete_goal,
    list_goals_for_user,
    add_goal_step,
    update_goal_step,
    delete_goal_step,
    list_goal_steps,
    add_interaction,
    update_interaction,
    delete_interaction,
    list_interactions_for_contact,
    list_interactions_for_user,
    get_overdue_follow_ups,
    get_upcoming_interaction_follow_ups,
    create_or_update_public_profile,
    get_public_profiles,
    get_public_profile_by_user_id,
    delete_public_profile,
    User,
    Contact,
    Meeting,
    Goal,
    GoalStep,
    Interaction,
    PublicProfile,
    SessionLocal,
    select,
    func,
)

from models.database_functions import (
    AlreadyExistsError,
    NotFoundError
)

def user_to_dict(user: User) -> Dict[str, Any]:
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "company_or_school": user.company_or_school,
        "role": user.role,
        "experience_level": user.experience_level,
        "onboarding_completed": user.onboarding_completed,
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
        "category": contact.category or "Professional",
        "date_first_meeting": contact.date_first_meeting.isoformat() if contact.date_first_meeting else None,
        "date_next_follow_up": contact.date_next_follow_up.isoformat() if contact.date_next_follow_up else None,
        "date_created": contact.date_created.isoformat() if contact.date_created else None,
        "relationship_stage": contact.relationship_stage,
        "timeline": contact.timeline,
        "gmail_thread_id": contact.gmail_thread_id,
        "last_interaction_date": contact.last_interaction_date.isoformat() if contact.last_interaction_date else None,
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


def goal_step_to_dict(step: GoalStep) -> Dict[str, Any]:
    return {
        "step_id": step.step_id,
        "goal_id": step.goal_id,
        "title": step.title,
        "description": step.description,
        "completed": step.completed,
        "order_index": step.order_index,
    }


def interaction_to_dict(interaction: Interaction) -> Dict[str, Any]:
    return {
        "interaction_id": interaction.interaction_id,
        "user_id": interaction.user_id,
        "contact_id": interaction.contact_id,
        "interaction_type": interaction.interaction_type,
        "interaction_date": interaction.interaction_date.isoformat() if interaction.interaction_date else None,
        "interaction_time": interaction.interaction_time.isoformat() if interaction.interaction_time else None,
        "subject": interaction.subject,
        "content": interaction.content,
        "tag": interaction.tag,
        "direction": interaction.direction,
        "follow_up_required": interaction.follow_up_required,
        "follow_up_date": interaction.follow_up_date.isoformat() if interaction.follow_up_date else None,
        "date_created": interaction.date_created.isoformat() if interaction.date_created else None,
    }


def goal_to_dict(goal: Goal) -> Dict[str, Any]:
    # Get steps for this goal
    steps = list_goal_steps(goal.goal_id)
    return {
        "goal_id": goal.goal_id,
        "user_id": goal.user_id,
        "title": goal.title,
        "description": goal.description,
        "target_value": goal.target_value,
        "current_value": goal.current_value,
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "status": goal.status,
        "date_created": goal.date_created.isoformat() if goal.date_created else None,
        "steps": [goal_step_to_dict(step) for step in steps],
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


def list_meetings_for_user(user_id: int) -> List[Dict[str, Any]]:
    with SessionLocal() as s:
        rows = s.execute(select(Meeting).where(Meeting.user_id == user_id)).scalars().all()
        return [meeting_to_dict(m) for m in rows]


def get_upcoming_follow_ups_for_user(user_id: int, days_ahead: int = 7) -> List[Dict[str, Any]]:
    contacts = get_upcoming_follow_ups(user_id, days_ahead)
    return [contact_to_dict(contact) for contact in contacts]


# Write operations returning dicts
def create_user(email: str, password_hash: str, name: str, company_or_school: Optional[str] = None, role: Optional[str] = None, experience_level: Optional[str] = None) -> Dict[str, Any]:
    user = add_user(email=email, password_hash=password_hash, name=name, company_or_school=company_or_school, role=role, experience_level=experience_level)
    return user_to_dict(user)


def update_user_service(user_id: int, name: Optional[str] = None, company_or_school: Optional[str] = None, role: Optional[str] = None, experience_level: Optional[str] = None, onboarding_completed: Optional[bool] = None) -> Dict[str, Any]:
    user = update_user(user_id=user_id, name=name, company_or_school=company_or_school, role=role, experience_level=experience_level, onboarding_completed=onboarding_completed)
    return user_to_dict(user)


def create_contact(
    user_id: int,
    name: str,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    category: Optional[str] = "Professional",
    tier: Optional[str] = None,  # Not stored in DB, kept for API compatibility
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
        category=category,
        date_first_meeting=None if not date_first_meeting else __import__("datetime").date.fromisoformat(date_first_meeting),
        date_next_follow_up=None if not date_next_follow_up else __import__("datetime").date.fromisoformat(date_next_follow_up),
    )
    return contact_to_dict(contact)


def update_contact_service(
    contact_id: int,
    user_id: int,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    category: Optional[str] = None,
    tier: Optional[str] = None,  # Not stored in DB, kept for API compatibility
    date_first_meeting: Optional[str] = None,
    date_next_follow_up: Optional[str] = None,
    relationship_stage: Optional[str] = None,
    timeline: Optional[str] = None,
    gmail_thread_id: Optional[str] = None,
    last_interaction_date: Optional[str] = None,
) -> Dict[str, Any]:
    contact = update_contact(
        contact_id=contact_id,
        user_id=user_id,
        name=name,
        email=email,
        phone_number=phone_number,
        company=company,
        job_title=job_title,
        category=category,
        date_first_meeting=None if not date_first_meeting else __import__("datetime").date.fromisoformat(date_first_meeting),
        date_next_follow_up=None if not date_next_follow_up else __import__("datetime").date.fromisoformat(date_next_follow_up),
        relationship_stage=relationship_stage,
        timeline=timeline,
        gmail_thread_id=gmail_thread_id,
        last_interaction_date=None if not last_interaction_date else __import__("datetime").date.fromisoformat(last_interaction_date),
    )
    return contact_to_dict(contact)


def delete_contact_service(contact_id: int, user_id: int) -> Dict[str, Any]:
    """Delete a contact and return success status."""
    success = delete_contact(contact_id=contact_id, user_id=user_id)
    return {"success": success, "message": "Contact deleted successfully"}


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
    follow_up_days: Optional[int] = None,
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
        follow_up_days=follow_up_days,
    )
    return meeting_to_dict(meeting)


def update_meeting_service(
    meeting_id: int,
    user_id: int,
    meeting_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    meeting_type: Optional[str] = None,
    location: Optional[str] = None,
    meeting_notes: Optional[str] = None,
    thank_you: Optional[bool] = None,
) -> Dict[str, Any]:
    """Update a meeting and return the updated meeting data."""
    dt = __import__("datetime")
    meeting = update_meeting(
        meeting_id=meeting_id,
        user_id=user_id,
        meeting_date=None if not meeting_date else dt.date.fromisoformat(meeting_date),
        start_time=None if not start_time else dt.time.fromisoformat(start_time),
        end_time=None if not end_time else dt.time.fromisoformat(end_time),
        meeting_type=meeting_type,
        location=location,
        meeting_notes=meeting_notes,
        thank_you=thank_you,
    )
    return meeting_to_dict(meeting)


def delete_meeting_service(meeting_id: int, user_id: int) -> Dict[str, Any]:
    """Delete a meeting and return success status."""
    success = delete_meeting(meeting_id=meeting_id, user_id=user_id)
    return {"success": success, "message": "Meeting deleted successfully"}


def get_upcoming_meetings_service(user_id: int, days: int = 30) -> List[Dict[str, Any]]:
    """Get upcoming meetings for a user."""
    meetings = get_upcoming_meetings(user_id=user_id, days_ahead=days)
    return [meeting_to_dict(meeting) for meeting in meetings]


def get_meetings_for_date_service(user_id: int, target_date: str) -> List[Dict[str, Any]]:
    """Get meetings for a specific date."""
    dt = __import__("datetime")
    meetings = get_meetings_for_date(user_id=user_id, target_date=dt.date.fromisoformat(target_date))
    return [meeting_to_dict(meeting) for meeting in meetings]


def get_goals_for_user(user_id: int) -> List[Dict[str, Any]]:
    """Get all goals for a user."""
    goals = list_goals_for_user(user_id)
    return [goal_to_dict(goal) for goal in goals]


def create_goal(
    user_id: int,
    title: str,
    description: Optional[str] = None,
    target_value: int = 1,
    current_value: int = 0,
    deadline: Optional[str] = None,
    status: str = "In Progress",
) -> Dict[str, Any]:
    """Create a new goal."""
    dt = __import__("datetime")
    goal = add_goal(
        user_id=user_id,
        title=title,
        description=description,
        target_value=target_value,
        current_value=current_value,
        deadline=None if not deadline else dt.date.fromisoformat(deadline),
        status=status,
    )
    return goal_to_dict(goal)


def update_goal_service(
    goal_id: int,
    user_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    target_value: Optional[int] = None,
    current_value: Optional[int] = None,
    deadline: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """Update a goal."""
    dt = __import__("datetime")
    goal = update_goal(
        goal_id=goal_id,
        user_id=user_id,
        title=title,
        description=description,
        target_value=target_value,
        current_value=current_value,
        deadline=None if not deadline else dt.date.fromisoformat(deadline),
        status=status,
    )
    return goal_to_dict(goal)


def delete_goal_service(goal_id: int, user_id: int) -> Dict[str, Any]:
    """Delete a goal and return success status."""
    success = delete_goal(goal_id=goal_id, user_id=user_id)
    return {"success": success, "message": "Goal deleted successfully"}


def get_goal_steps(goal_id: int) -> List[Dict[str, Any]]:
    """Get all steps for a goal."""
    steps = list_goal_steps(goal_id)
    return [goal_step_to_dict(step) for step in steps]


def create_goal_step(
    goal_id: int,
    title: str,
    description: Optional[str] = None,
    order_index: int = 0,
) -> Dict[str, Any]:
    """Create a new goal step."""
    step = add_goal_step(
        goal_id=goal_id,
        title=title,
        description=description,
        order_index=order_index,
    )
    return goal_step_to_dict(step)


def update_goal_step_service(
    step_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    completed: Optional[bool] = None,
    order_index: Optional[int] = None,
) -> Dict[str, Any]:
    """Update a goal step."""
    step = update_goal_step(
        step_id=step_id,
        title=title,
        description=description,
        completed=completed,
        order_index=order_index,
    )
    return goal_step_to_dict(step)


def delete_goal_step_service(step_id: int) -> Dict[str, Any]:
    """Delete a goal step and return success status."""
    success = delete_goal_step(step_id=step_id)
    return {"success": success, "message": "Goal step deleted successfully"}


# ---------- INTERACTION SERVICES ----------
def get_interactions_for_contact(contact_id: int, user_id: int) -> List[Dict[str, Any]]:
    """Get all interactions for a specific contact."""
    interactions = list_interactions_for_contact(contact_id, user_id)
    return [interaction_to_dict(interaction) for interaction in interactions]


def get_interactions_for_user(user_id: int) -> List[Dict[str, Any]]:
    """Get all interactions for a user."""
    interactions = list_interactions_for_user(user_id)
    return [interaction_to_dict(interaction) for interaction in interactions]


def create_interaction(
    user_id: int,
    contact_id: int,
    interaction_type: str,
    subject: Optional[str] = None,
    content: Optional[str] = None,
    tag: Optional[str] = None,
    direction: str = "outbound",
    interaction_date: Optional[str] = None,
    interaction_time: Optional[str] = None,
    follow_up_required: bool = False,
    follow_up_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new interaction."""
    dt = __import__("datetime")
    interaction = add_interaction(
        user_id=user_id,
        contact_id=contact_id,
        interaction_type=interaction_type,
        subject=subject,
        content=content,
        tag=tag,
        direction=direction,
        interaction_date=None if not interaction_date else dt.date.fromisoformat(interaction_date),
        interaction_time=None if not interaction_time else dt.time.fromisoformat(interaction_time),
        follow_up_required=follow_up_required,
        follow_up_date=None if not follow_up_date else dt.date.fromisoformat(follow_up_date),
    )
    return interaction_to_dict(interaction)


def update_interaction_service(
    interaction_id: int,
    user_id: int,
    subject: Optional[str] = None,
    content: Optional[str] = None,
    tag: Optional[str] = None,
    direction: Optional[str] = None,
    interaction_date: Optional[str] = None,
    interaction_time: Optional[str] = None,
    follow_up_required: Optional[bool] = None,
    follow_up_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Update an interaction."""
    dt = __import__("datetime")
    interaction = update_interaction(
        interaction_id=interaction_id,
        user_id=user_id,
        subject=subject,
        content=content,
        tag=tag,
        direction=direction,
        interaction_date=None if not interaction_date else dt.date.fromisoformat(interaction_date),
        interaction_time=None if not interaction_time else dt.time.fromisoformat(interaction_time),
        follow_up_required=follow_up_required,
        follow_up_date=None if not follow_up_date else dt.date.fromisoformat(follow_up_date),
    )
    return interaction_to_dict(interaction)


def delete_interaction_service(interaction_id: int, user_id: int) -> Dict[str, Any]:
    """Delete an interaction and return success status."""
    success = delete_interaction(interaction_id=interaction_id, user_id=user_id)
    return {"success": success, "message": "Interaction deleted successfully"}


def get_overdue_follow_ups_for_user(user_id: int) -> List[Dict[str, Any]]:
    """Get interactions that require follow-up and are overdue."""
    interactions = get_overdue_follow_ups(user_id)
    return [interaction_to_dict(interaction) for interaction in interactions]


def get_upcoming_follow_ups_interactions_for_user(user_id: int, days_ahead: int = 7) -> List[Dict[str, Any]]:
    """Get interactions that require follow-up within the next specified days."""
    interactions = get_upcoming_interaction_follow_ups(user_id, days_ahead)
    return [interaction_to_dict(interaction) for interaction in interactions]


def get_platform_stats() -> Dict[str, Any]:
    """Get platform-wide statistics for the landing page."""
    with SessionLocal() as s:
        total_users = s.execute(select(func.count(User.user_id))).scalar() or 0
        total_contacts = s.execute(select(func.count(Contact.contact_id))).scalar() or 0
        
        # Count active users (users who have logged in within the last 30 days)
        # For now, we'll use users who have created contacts as "active"
        # This is a simple heuristic - you could improve this later
        active_users = s.execute(
            select(func.count(func.distinct(Contact.user_id)))
        ).scalar() or 0
        
        return {
            "total_users": total_users,
            "total_contacts": total_contacts,
            "active_users": active_users,
        }


def public_profile_to_dict(profile: PublicProfile) -> Dict[str, Any]:
    """Convert PublicProfile to dictionary."""
    return {
        "profile_id": profile.profile_id,
        "user_id": profile.user_id,
        "display_name": profile.display_name,
        "school": profile.school,
        "role": profile.role,
        "industry_tags": profile.industry_tags.split(",") if profile.industry_tags else [],
        "contact_method": profile.contact_method,
        "contact_info": profile.contact_info,
        "visibility": profile.visibility,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def create_or_update_public_profile_service(
    user_id: int,
    display_name: str,
    school: Optional[str] = None,
    role: Optional[str] = None,
    industry_tags: Optional[List[str]] = None,
    contact_method: Optional[str] = None,
    contact_info: Optional[str] = None,
    visibility: bool = True,
) -> Dict[str, Any]:
    """Create or update a public profile."""
    # Convert list of tags to comma-separated string
    industry_tags_str = ",".join(industry_tags) if industry_tags else None
    
    profile = create_or_update_public_profile(
        user_id=user_id,
        display_name=display_name,
        school=school,
        role=role,
        industry_tags=industry_tags_str,
        contact_method=contact_method,
        contact_info=contact_info,
        visibility=visibility,
    )
    return public_profile_to_dict(profile)


def get_public_profiles_service(
    industry: Optional[str] = None,
    school: Optional[str] = None,
    role: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get all visible public profiles with optional filters."""
    profiles = get_public_profiles(
        industry=industry,
        school=school,
        role=role,
        visibility=True,
    )
    return [public_profile_to_dict(profile) for profile in profiles]


def get_public_profile_by_user_id_service(user_id: int) -> Optional[Dict[str, Any]]:
    """Get a public profile by user_id."""
    profile = get_public_profile_by_user_id(user_id)
    if not profile:
        return None
    return public_profile_to_dict(profile)


def delete_public_profile_service(user_id: int) -> Dict[str, Any]:
    """Delete/hide a public profile."""
    success = delete_public_profile(user_id=user_id)
    return {"success": success, "message": "Public profile deleted successfully"}


