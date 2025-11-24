# models.py
from __future__ import annotations

from datetime import datetime, date, time, timedelta
from pathlib import Path
from typing import Optional
import os

from sqlalchemy import (
    create_engine, String, Integer, DateTime, Date, Time,
    Text, Boolean, ForeignKey, event, select, func
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
    company_or_school: Mapped[Optional[str]] = mapped_column(String(200))
    role: Mapped[Optional[str]] = mapped_column(String(200))
    created_date_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    contacts: Mapped[list["Contact"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    meetings: Mapped[list["Meeting"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interactions: Mapped[list["Interaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    calendar_integrations: Mapped[list["CalendarIntegration"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    contact_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone_number: Mapped[Optional[str]] = mapped_column(String(50))
    company: Mapped[Optional[str]] = mapped_column(String(200))
    job_title: Mapped[Optional[str]] = mapped_column(String(200))
    category: Mapped[Optional[str]] = mapped_column(String(100), default="Professional")  # Professional, Personal, Academic, etc.

    date_first_meeting: Mapped[Optional[date]] = mapped_column(Date)
    date_next_follow_up: Mapped[Optional[date]] = mapped_column(Date)
    date_created: Mapped[date] = mapped_column(Date, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="contacts")
    meetings: Mapped[list["Meeting"]] = relationship(back_populates="contact", cascade="all, delete-orphan")
    interactions: Mapped[list["Interaction"]] = relationship(back_populates="contact", cascade="all, delete-orphan")


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


class Goal(Base):
    __tablename__ = "goals"

    goal_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)  # The number to achieve (e.g., 10 contacts)
    current_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Current progress (e.g., 7)
    deadline: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50), default="In Progress", nullable=False)  # In Progress, Completed, etc.
    date_created: Mapped[date] = mapped_column(Date, nullable=False, default=date.today())

    # relationships
    user: Mapped["User"] = relationship(back_populates="goals")
    steps: Mapped[list["GoalStep"]] = relationship(back_populates="goal", cascade="all, delete-orphan")


class GoalStep(Base):
    __tablename__ = "goal_steps"

    step_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.goal_id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # For ordering steps

    # relationships
    goal: Mapped["Goal"] = relationship(back_populates="steps")


class Interaction(Base):
    __tablename__ = "interactions"

    interaction_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.contact_id", ondelete="CASCADE"), nullable=False)

    # Interaction type: 'email', 'call', 'meeting', 'text', 'other'
    interaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Date and time of the interaction
    interaction_date: Mapped[Optional[date]] = mapped_column(Date, default=date.today)
    interaction_time: Mapped[Optional[time]] = mapped_column(Time)
    
    # Subject/title of the interaction
    subject: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Content/notes - for emails this could be the email content, for calls the notes
    content: Mapped[Optional[str]] = mapped_column(Text)
    
    # Tag to categorize the interaction (e.g., "First Contact", "Follow-Up", "Project Discussion")
    tag: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Direction of interaction: 'inbound', 'outbound', 'mutual'
    direction: Mapped[str] = mapped_column(String(20), default="outbound")
    
    # Follow-up required
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    follow_up_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Timestamps
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="interactions")
    contact: Mapped["Contact"] = relationship(back_populates="interactions")


# Calendar Integration Models
class CalendarIntegration(Base):
    __tablename__ = "calendar_integrations"

    integration_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    provider: Mapped[str] = mapped_column(String(20), nullable=False)  # 'google', 'outlook', 'icloud'
    access_token: Mapped[Optional[str]] = mapped_column(Text)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    calendar_id: Mapped[Optional[str]] = mapped_column(String(500))  # External calendar ID
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # relationships
    user: Mapped["User"] = relationship(back_populates="calendar_integrations")
    synced_events: Mapped[list["SyncedEvent"]] = relationship(back_populates="integration", cascade="all, delete-orphan")


class SyncedEvent(Base):
    __tablename__ = "synced_events"

    sync_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.meeting_id", ondelete="CASCADE"), nullable=False)
    integration_id: Mapped[int] = mapped_column(ForeignKey("calendar_integrations.integration_id", ondelete="CASCADE"), nullable=False)
    
    external_event_id: Mapped[str] = mapped_column(String(500), nullable=False)  # Event ID in external calendar
    last_modified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # relationships
    integration: Mapped["CalendarIntegration"] = relationship(back_populates="synced_events")


# ----- Engine / DB init -----
# Use environment variable for database URL, fallback to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{Path(__file__).parent / 'networking.db'}")

engine = create_engine(DATABASE_URL, echo=False, future=True)

# Ensure SQLite enforces foreign keys (SQLite off by default)
# PostgreSQL has foreign keys enabled by default, so only run PRAGMA for SQLite
@event.listens_for(engine, "connect")
def _fk_pragma_on_connect(dbapi_connection, connection_record):
    # Only run PRAGMA for SQLite, not PostgreSQL
    if DATABASE_URL.startswith("sqlite"):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

# (Optional) WAL mode for smoother concurrent reads (SQLite only)
@event.listens_for(engine, "connect")
def _wal_on_connect(dbapi_connection, connection_record):
    # Only run PRAGMA for SQLite, not PostgreSQL
    if DATABASE_URL.startswith("sqlite"):
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
def add_user(*, email: str, password_hash: str, name: str, company_or_school: Optional[str] = None, role: Optional[str] = None) -> User:
    """Create a new user if email not taken. Returns the persisted User."""
    with get_session() as s:
        existing = s.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise AlreadyExistsError(f"user with email {email} already exists")

        user = User(email=email, password_hash=password_hash, name=name, company_or_school=company_or_school, role=role)
        s.add(user)
        s.flush()   # populate user.user_id
        s.refresh(user)
        return user


def update_user(*, user_id: int, name: Optional[str] = None, company_or_school: Optional[str] = None, role: Optional[str] = None) -> User:
    """Update user information. Returns the updated User."""
    with get_session() as s:
        user = s.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        if not user:
            raise NotFoundError(f"user with id {user_id} not found")
        
        if name is not None:
            user.name = name
        if company_or_school is not None:
            user.company_or_school = company_or_school
        if role is not None:
            user.role = role
        
        s.flush()
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
    category: Optional[str] = "Professional",
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
            category=category,
            date_first_meeting=date_first_meeting,
            date_next_follow_up=date_next_follow_up,
            date_created=date.today(),
        )
        s.add(contact)
        s.flush()
        s.refresh(contact)
        return contact


def update_contact(
    *,
    contact_id: int,
    user_id: int,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    category: Optional[str] = None,
    date_first_meeting: Optional[date] = None,
    date_next_follow_up: Optional[date] = None,
) -> Contact:
    """Update a contact for a given contact_id and user_id."""
    with get_session() as s:
        contact = s.execute(select(Contact).where(
            Contact.contact_id == contact_id,
            Contact.user_id == user_id
        )).scalar_one_or_none()
        
        if not contact:
            raise NotFoundError(f"contact {contact_id} not found for user {user_id}")

        # Update only provided fields
        if name is not None:
            contact.name = name
        if email is not None:
            contact.email = email
        if phone_number is not None:
            contact.phone_number = phone_number
        if company is not None:
            contact.company = company
        if job_title is not None:
            contact.job_title = job_title
        if category is not None:
            contact.category = category
        if date_first_meeting is not None:
            contact.date_first_meeting = date_first_meeting
        if date_next_follow_up is not None:
            contact.date_next_follow_up = date_next_follow_up

        s.flush()
        s.refresh(contact)
        return contact


def delete_contact(*, contact_id: int, user_id: int) -> bool:
    """Delete a contact for a given contact_id and user_id."""
    with get_session() as s:
        contact = s.execute(select(Contact).where(
            Contact.contact_id == contact_id,
            Contact.user_id == user_id
        )).scalar_one_or_none()
        
        if not contact:
            raise NotFoundError(f"contact {contact_id} not found for user {user_id}")

        s.delete(contact)
        s.flush()
        return True


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
    follow_up_days: Optional[int] = None,
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
        
        # Auto-update follow-up date if specified
        if follow_up_days:
            contact = s.get(Contact, contact_id)
            if contact:
                contact.date_next_follow_up = (meeting_date or date.today()) + timedelta(days=follow_up_days)
        
        s.flush()
        s.refresh(mtg)
        return mtg


def update_meeting(
    *,
    meeting_id: int,
    user_id: int,
    meeting_date: Optional[date] = None,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    meeting_type: Optional[str] = None,
    location: Optional[str] = None,
    meeting_notes: Optional[str] = None,
    thank_you: Optional[bool] = None,
) -> Meeting:
    """Update a meeting."""
    with get_session() as s:
        meeting = s.execute(select(Meeting).where(
            Meeting.meeting_id == meeting_id,
            Meeting.user_id == user_id
        )).scalar_one_or_none()
        
        if not meeting:
            raise NotFoundError(f"meeting {meeting_id} not found for user {user_id}")

        # Update only provided fields
        if meeting_date is not None:
            meeting.meeting_date = meeting_date
        if start_time is not None:
            meeting.start_time = start_time
        if end_time is not None:
            meeting.end_time = end_time
        if meeting_type is not None:
            meeting.meeting_type = meeting_type
        if location is not None:
            meeting.location = location
        if meeting_notes is not None:
            meeting.meeting_notes = meeting_notes
        if thank_you is not None:
            meeting.thank_you = thank_you

        s.flush()
        s.refresh(meeting)
        return meeting


def delete_meeting(*, meeting_id: int, user_id: int) -> bool:
    """Delete a meeting."""
    with get_session() as s:
        meeting = s.execute(select(Meeting).where(
            Meeting.meeting_id == meeting_id,
            Meeting.user_id == user_id
        )).scalar_one_or_none()
        
        if not meeting:
            raise NotFoundError(f"meeting {meeting_id} not found for user {user_id}")

        s.delete(meeting)
        s.flush()
        return True


def get_upcoming_meetings(user_id: int, days_ahead: int = 30) -> list[Meeting]:
    """Get meetings within the next specified days."""
    today = date.today()
    upcoming = today + timedelta(days=days_ahead)
    
    with get_session() as s:
        results = s.execute(
            select(Meeting)
            .where(Meeting.user_id == user_id)
            .where(Meeting.meeting_date >= today)
            .where(Meeting.meeting_date <= upcoming)
            .order_by(Meeting.meeting_date, Meeting.start_time)
        ).scalars().all()
        return list(results)


def get_meetings_for_date(user_id: int, target_date: date) -> list[Meeting]:
    """Get meetings for a specific date."""
    with get_session() as s:
        results = s.execute(
            select(Meeting)
            .where(Meeting.user_id == user_id)
            .where(Meeting.meeting_date == target_date)
            .order_by(Meeting.start_time)
        ).scalars().all()
        return list(results)


# ---------- GOALS ----------
def add_goal(
    *,
    user_id: int,
    title: str,
    description: Optional[str] = None,
    target_value: int,
    current_value: int = 0,
    deadline: Optional[date] = None,
    status: str = "In Progress",
) -> Goal:
    """Create a goal for a given user_id."""
    with get_session() as s:
        if not s.get(User, user_id):
            raise NotFoundError(f"user {user_id} not found")
        
        goal = Goal(
            user_id=user_id,
            title=title,
            description=description,
            target_value=target_value,
            current_value=current_value,
            deadline=deadline,
            status=status,
            date_created=date.today(),
        )
        s.add(goal)
        s.flush()
        s.refresh(goal)
        return goal


def list_goals_for_user(user_id: int) -> list[Goal]:
    """List all goals for a given user_id."""
    with get_session() as s:
        results = s.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.date_created.desc())
        ).scalars().all()
        return list(results)


def update_goal(
    *,
    goal_id: int,
    user_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    target_value: Optional[int] = None,
    current_value: Optional[int] = None,
    deadline: Optional[date] = None,
    status: Optional[str] = None,
) -> Goal:
    """Update a goal for a given goal_id and user_id."""
    with get_session() as s:
        goal = s.execute(select(Goal).where(
            Goal.goal_id == goal_id,
            Goal.user_id == user_id
        )).scalar_one_or_none()
        
        if not goal:
            raise NotFoundError(f"goal {goal_id} not found for user {user_id}")

        # Update only provided fields
        if title is not None:
            goal.title = title
        if description is not None:
            goal.description = description
        if target_value is not None:
            goal.target_value = target_value
        if current_value is not None:
            goal.current_value = current_value
        if deadline is not None:
            goal.deadline = deadline
        if status is not None:
            goal.status = status

        s.flush()
        s.refresh(goal)
        return goal


def delete_goal(*, goal_id: int, user_id: int) -> bool:
    """Delete a goal for a given goal_id and user_id."""
    with get_session() as s:
        goal = s.execute(select(Goal).where(
            Goal.goal_id == goal_id,
            Goal.user_id == user_id
        )).scalar_one_or_none()
        
        if not goal:
            raise NotFoundError(f"goal {goal_id} not found for user {user_id}")

        s.delete(goal)
        s.flush()
        return True


def add_goal_step(
    *,
    goal_id: int,
    title: str,
    description: Optional[str] = None,
    order_index: int = 0,
) -> GoalStep:
    """Create a step for a given goal_id."""
    with get_session() as s:
        goal = s.get(Goal, goal_id)
        if not goal:
            raise NotFoundError(f"goal {goal_id} not found")
        
        step = GoalStep(
            goal_id=goal_id,
            title=title,
            description=description,
            order_index=order_index,
        )
        s.add(step)
        s.flush()
        s.refresh(step)
        return step


def list_goal_steps(goal_id: int) -> list[GoalStep]:
    """List all steps for a given goal_id."""
    with get_session() as s:
        results = s.execute(
            select(GoalStep)
            .where(GoalStep.goal_id == goal_id)
            .order_by(GoalStep.order_index)
        ).scalars().all()
        return list(results)


def update_goal_step(
    *,
    step_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    completed: Optional[bool] = None,
    order_index: Optional[int] = None,
) -> GoalStep:
    """Update a goal step."""
    with get_session() as s:
        step = s.execute(select(GoalStep).where(GoalStep.step_id == step_id)).scalar_one_or_none()
        
        if not step:
            raise NotFoundError(f"goal step {step_id} not found")

        # Update only provided fields
        if title is not None:
            step.title = title
        if description is not None:
            step.description = description
        if completed is not None:
            step.completed = completed
        if order_index is not None:
            step.order_index = order_index

        s.flush()
        s.refresh(step)
        return step


def delete_goal_step(*, step_id: int) -> bool:
    """Delete a goal step."""
    with get_session() as s:
        step = s.execute(select(GoalStep).where(GoalStep.step_id == step_id)).scalar_one_or_none()
        
        if not step:
            raise NotFoundError(f"goal step {step_id} not found")

        s.delete(step)
        s.flush()
        return True


# ---------- INTERACTIONS ----------
def add_interaction(
    *,
    user_id: int,
    contact_id: int,
    interaction_type: str,
    subject: Optional[str] = None,
    content: Optional[str] = None,
    tag: Optional[str] = None,
    direction: str = "outbound",
    interaction_date: Optional[date] = None,
    interaction_time: Optional[time] = None,
    follow_up_required: bool = False,
    follow_up_date: Optional[date] = None,
) -> Interaction:
    """Create an interaction (email, call, meeting, etc.) for a contact."""
    with get_session() as s:
        if not s.get(User, user_id):
            raise NotFoundError(f"user {user_id} not found")
        if not s.get(Contact, contact_id):
            raise NotFoundError(f"contact {contact_id} not found")

        interaction = Interaction(
            user_id=user_id,
            contact_id=contact_id,
            interaction_type=interaction_type,
            subject=subject,
            content=content,
            tag=tag,
            direction=direction,
            interaction_date=interaction_date or date.today(),
            interaction_time=interaction_time,
            follow_up_required=follow_up_required,
            follow_up_date=follow_up_date,
        )
        s.add(interaction)
        s.flush()
        s.refresh(interaction)
        return interaction


def list_interactions_for_contact(contact_id: int, user_id: int) -> list[Interaction]:
    """List all interactions for a specific contact and user."""
    with get_session() as s:
        results = s.execute(
            select(Interaction)
            .where(Interaction.contact_id == contact_id)
            .where(Interaction.user_id == user_id)
            .order_by(Interaction.interaction_date.desc(), Interaction.date_created.desc())
        ).scalars().all()
        return list(results)


def list_interactions_for_user(user_id: int) -> list[Interaction]:
    """List all interactions for a user."""
    with get_session() as s:
        results = s.execute(
            select(Interaction)
            .where(Interaction.user_id == user_id)
            .order_by(Interaction.interaction_date.desc(), Interaction.date_created.desc())
        ).scalars().all()
        return list(results)


def update_interaction(
    *,
    interaction_id: int,
    user_id: int,
    subject: Optional[str] = None,
    content: Optional[str] = None,
    tag: Optional[str] = None,
    direction: Optional[str] = None,
    interaction_date: Optional[date] = None,
    interaction_time: Optional[time] = None,
    follow_up_required: Optional[bool] = None,
    follow_up_date: Optional[date] = None,
) -> Interaction:
    """Update an interaction."""
    with get_session() as s:
        interaction = s.execute(select(Interaction).where(
            Interaction.interaction_id == interaction_id,
            Interaction.user_id == user_id
        )).scalar_one_or_none()
        
        if not interaction:
            raise NotFoundError(f"interaction {interaction_id} not found for user {user_id}")

        # Update only provided fields
        if subject is not None:
            interaction.subject = subject
        if content is not None:
            interaction.content = content
        if tag is not None:
            interaction.tag = tag
        if direction is not None:
            interaction.direction = direction
        if interaction_date is not None:
            interaction.interaction_date = interaction_date
        if interaction_time is not None:
            interaction.interaction_time = interaction_time
        if follow_up_required is not None:
            interaction.follow_up_required = follow_up_required
        if follow_up_date is not None:
            interaction.follow_up_date = follow_up_date

        s.flush()
        s.refresh(interaction)
        return interaction


def delete_interaction(*, interaction_id: int, user_id: int) -> bool:
    """Delete an interaction."""
    with get_session() as s:
        interaction = s.execute(select(Interaction).where(
            Interaction.interaction_id == interaction_id,
            Interaction.user_id == user_id
        )).scalar_one_or_none()
        
        if not interaction:
            raise NotFoundError(f"interaction {interaction_id} not found for user {user_id}")

        s.delete(interaction)
        s.flush()
        return True


def get_overdue_follow_ups(user_id: int) -> list[Interaction]:
    """Get interactions that require follow-up and are overdue."""
    today = date.today()
    
    with get_session() as s:
        results = s.execute(
            select(Interaction)
            .where(Interaction.user_id == user_id)
            .where(Interaction.follow_up_required == True)
            .where(Interaction.follow_up_date < today)
        ).scalars().all()
        return list(results)


def get_upcoming_interaction_follow_ups(user_id: int, days_ahead: int = 7) -> list[Interaction]:
    """Get interactions that require follow-up within the next specified days."""
    today = date.today()
    upcoming = today + timedelta(days=days_ahead)
    
    with get_session() as s:
        results = s.execute(
            select(Interaction)
            .where(Interaction.user_id == user_id)
            .where(Interaction.follow_up_required == True)
            .where(Interaction.follow_up_date >= today)
            .where(Interaction.follow_up_date <= upcoming)
        ).scalars().all()
        return list(results)


# ---------- Convenience variants ----------
def add_contact_for_user_email(*, user_email: str, name: str, **kwargs) -> Contact:
    """Find user by email, then add the contact."""
    with get_session() as s:
        user = s.execute(select(User).where(User.email == user_email)).scalar_one_or_none()
        if not user:
            raise NotFoundError(f"user with email {user_email} not found")
        # Ensure date_created is set to today unless explicitly provided
        if 'date_created' not in kwargs:
            kwargs['date_created'] = date.today()
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


def get_upcoming_follow_ups(user_id: int, days_ahead: int = 7) -> list[Contact]:
    """Get contacts with follow-up dates within the next specified days."""
    today = date.today()
    upcoming = today + timedelta(days=days_ahead)
    
    with get_session() as s:
        results = s.execute(
            select(Contact)
            .where(Contact.user_id == user_id)
            .where(Contact.date_next_follow_up >= today)
            .where(Contact.date_next_follow_up <= upcoming)
        ).scalars().all()
        return list(results)


# ----- Tiny smoke test (optional) -----
if __name__ == "__main__":
    print(f"DB path: {DATABASE_URL}")
    with SessionLocal() as s:
        u = User(email="user@example.com", password_hash="hash", name="user1")
        c = Contact(user=u, name="contact", email="contact@co.com", company="example inc")
        m = Meeting(user=u, contact=c, meeting_type="Coffee chat")
        s.add_all([u, c, m])
        s.commit()
        print("OK")