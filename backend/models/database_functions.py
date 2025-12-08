# models.py
from __future__ import annotations

from datetime import datetime, date, time, timedelta
from pathlib import Path
from typing import Optional
import os

from sqlalchemy import (
    create_engine, String, Integer, DateTime, Date, Time,
    Text, Boolean, ForeignKey, event, select, func, text
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
    experience_level: Mapped[Optional[str]] = mapped_column(String(50))  # 'beginner', 'intermediate', 'experienced'
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    has_public_profile: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_date_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    contacts: Mapped[list["Contact"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    meetings: Mapped[list["Meeting"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interactions: Mapped[list["Interaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    calendar_integrations: Mapped[list["CalendarIntegration"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    public_profile: Mapped[Optional["PublicProfile"]] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)


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
    
    # Relationship tracking fields
    relationship_stage: Mapped[Optional[str]] = mapped_column(String(100))  # e.g., "Outreach Sent", "Meeting Scheduled"
    timeline: Mapped[Optional[str]] = mapped_column(Text)  # JSON string of timeline stages
    gmail_thread_id: Mapped[Optional[str]] = mapped_column(String(500))  # For future Gmail plugin integration
    last_interaction_date: Mapped[Optional[date]] = mapped_column(Date)  # Last touchpoint date

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


class PublicProfile(Base):
    __tablename__ = "public_profiles"

    profile_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    school: Mapped[Optional[str]] = mapped_column(String(200))
    role: Mapped[Optional[str]] = mapped_column(String(200))
    industry_tags: Mapped[Optional[str]] = mapped_column(Text)  # Comma-separated string
    contact_method: Mapped[Optional[str]] = mapped_column(String(50))  # 'email' or 'linkedin'
    contact_info: Mapped[Optional[str]] = mapped_column(String(500))  # Email address or LinkedIn URL
    visibility: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # relationships
    user: Mapped["User"] = relationship(back_populates="public_profile")


# ----- Engine / DB init -----
# Use environment variable for database URL, fallback to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{Path(__file__).parent / 'networking.db'}")

# Validate DATABASE_URL format
def validate_database_url(url: str) -> tuple[bool, str]:
    """Validate database URL format and return (is_valid, error_message)."""
    if not url:
        return False, "DATABASE_URL environment variable is not set"
    
    # Check for common mistakes
    if url.startswith("https://"):
        return False, "DATABASE_URL should start with 'postgresql://' or 'sqlite://', not 'https://'. Did you copy the Supabase API URL instead of the connection string?"
    
    if url.startswith("http://"):
        return False, "DATABASE_URL should start with 'postgresql://' or 'sqlite://', not 'http://'"
    
    # For PostgreSQL, ensure it starts with postgresql://
    if "postgres" in url.lower() and not url.startswith("postgresql://"):
        if url.startswith("postgres://"):
            # PostgreSQL accepts both postgres:// and postgresql://, but SQLAlchemy prefers postgresql://
            url = url.replace("postgres://", "postgresql://", 1)
            return True, f"Converted postgres:// to postgresql://"
        else:
            return False, "PostgreSQL DATABASE_URL should start with 'postgresql://'"
    
    return True, ""

# Validate the URL
is_valid, error_msg = validate_database_url(DATABASE_URL)
if not is_valid:
    print(f"❌ DATABASE_URL Validation Error: {error_msg}")
    print(f"   Current DATABASE_URL: {DATABASE_URL[:50]}..." if len(DATABASE_URL) > 50 else f"   Current DATABASE_URL: {DATABASE_URL}")
    if "https://" in DATABASE_URL or "http://" in DATABASE_URL:
        print("   💡 Tip: Get the connection string from Supabase Dashboard → Settings → Database → Connection string → URI")
    raise ValueError(f"Invalid DATABASE_URL: {error_msg}")
elif error_msg:  # Warning but valid
    print(f"⚠️  DATABASE_URL: {error_msg}")

# Create engine with connection pool settings that help with schema changes
# Connection pool settings optimized for Supabase
# Supabase free tier: max 60 direct connections, 200 via pooler
# Use connection pooler URL for better performance: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
connect_args = {}
if "supabase" in DATABASE_URL.lower():
    # Check for SSL certificate file (looks for prod-supabase.cer first, then other common names)
    cert_paths = [
        os.path.join(Path(__file__).parent.parent, "prod-supabase.cer"),  # backend/prod-supabase.cer
        os.path.join(Path(__file__).parent.parent.parent, "prod-supabase.cer"),  # Ripple/prod-supabase.cer
        os.path.join(Path(__file__).parent.parent, "supabase.crt"),  # backend/supabase.crt
        os.path.join(Path(__file__).parent.parent.parent, "supabase.crt"),  # Ripple/supabase.crt
        os.path.join(Path(__file__).parent.parent, "supabase.pem"),  # backend/supabase.pem
        os.path.join(Path(__file__).parent.parent.parent, "supabase.pem"),  # Ripple/supabase.pem
        os.path.join(Path(__file__).parent.parent, "supabase.cer"),  # backend/supabase.cer
        os.path.join(Path(__file__).parent.parent.parent, "supabase.cer"),  # Ripple/supabase.cer
    ]
    
    cert_file = None
    for path in cert_paths:
        if os.path.exists(path):
            cert_file = path
            break
    
    if cert_file:
        # Use custom certificate file
        connect_args["sslmode"] = "require"
        # For .cer files, typically used as root certificate
        connect_args["sslrootcert"] = cert_file
        # Some setups may need client cert/key, but .cer is usually just root CA
        print(f"✅ Detected Supabase database - Using SSL certificate: {cert_file}")
        print(f"   Certificate type: Root CA certificate (.cer)")
    else:
        # Try 'prefer' first - will use SSL if available, but won't fail if not
        # If connection still fails, try changing to 'require' or 'disable'
        connect_args["sslmode"] = "prefer"  # Changed from 'require' to 'prefer' for better compatibility
        print("✅ Detected Supabase database - SSL mode: prefer (will use SSL if available)")
        print("   💡 Tip: Place SSL certificate as 'prod-supabase.cer' in backend/ or root folder to use custom cert")

# Create engine (connection is lazy - won't connect until first use)
# This allows the app to start even if database is temporarily unreachable
# For Supabase, we may need to force IPv4 or use connection pooler
connect_args_final = connect_args.copy()
if "supabase" in DATABASE_URL.lower():
    # Force IPv4 connection (Render may have IPv6 issues)
    # Supabase connection pooler is recommended for better reliability
    connect_args_final["connect_timeout"] = 30  # Increased to 30 seconds for better reliability
    # Add keepalive settings to maintain connection
    connect_args_final["keepalives"] = 1
    connect_args_final["keepalives_idle"] = 30
    connect_args_final["keepalives_interval"] = 10
    connect_args_final["keepalives_count"] = 5

engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    future=True,
    pool_pre_ping=True,  # Verify connections before using them (checks if connection is alive)
    pool_recycle=180,    # Recycle connections after 3 minutes (shorter for Supabase free tier)
    pool_size=2,         # Very small pool for free tier (max 60 direct connections)
    max_overflow=3,      # Minimal overflow for free tier limits
    connect_args=connect_args_final,
    pool_reset_on_return='commit',  # Reset connections properly
    pool_timeout=20      # Wait up to 20 seconds for a connection from pool
)
print(f"✅ Database engine configured")
if "supabase" in DATABASE_URL.lower():
    print(f"   Target: Supabase PostgreSQL")
    print(f"   Pool size: 2 (free tier optimized)")
    print(f"   Connection recycle: 180 seconds")
    print(f"   Note: Connection will be established on first database operation")
    print(f"   💡 Tip: If connection fails, try using Supabase connection pooler URL")
elif "postgresql" in DATABASE_URL.lower():
    print(f"   Target: PostgreSQL")
    print(f"   Note: Connection will be established on first database operation")
else:
    print(f"   Target: SQLite (local development)")

# Add connection-level settings for better reliability
@event.listens_for(engine, "connect")
def _set_connection_settings(dbapi_connection, connection_record):
    """Set connection-level settings for better reliability."""
    if "supabase" in DATABASE_URL.lower() or "postgresql" in DATABASE_URL.lower():
        try:
            # Set statement timeout to prevent hanging queries
            with dbapi_connection.cursor() as cursor:
                cursor.execute("SET statement_timeout = '30s'")
        except Exception:
            pass  # Ignore if setting fails

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

# Don't create tables on import - let them be created lazily or via migration
# This prevents connection errors during module import
# Base.metadata.create_all(engine)  # Commented out - tables should already exist in Supabase

# Auto-migrate: Add relationship tracking columns if they don't exist
def _ensure_relationship_tracking_columns():
    """Ensure relationship tracking columns exist in contacts table."""
    try:
        with engine.connect() as conn:
            if "postgresql" in DATABASE_URL.lower():
                # PostgreSQL - check and add columns
                columns_to_add = [
                    ("relationship_stage", "VARCHAR(100)"),
                    ("timeline", "TEXT"),
                    ("gmail_thread_id", "VARCHAR(500)"),
                    ("last_interaction_date", "DATE"),
                ]
                for col_name, col_type in columns_to_add:
                    result = conn.execute(text(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name='contacts' AND column_name='{col_name}'
                    """))
                    if result.fetchone() is None:
                        conn.execute(text(f"""
                            ALTER TABLE contacts 
                            ADD COLUMN {col_name} {col_type}
                        """))
                        conn.commit()
            else:
                # SQLite - check and add columns
                result = conn.execute(text("PRAGMA table_info(contacts)"))
                columns = [row[1] for row in result.fetchall()]
                columns_to_add = [
                    ("relationship_stage", "VARCHAR(100)"),
                    ("timeline", "TEXT"),
                    ("gmail_thread_id", "VARCHAR(500)"),
                    ("last_interaction_date", "DATE"),
                ]
                for col_name, col_type in columns_to_add:
                    if col_name not in columns:
                        conn.execute(text(f"""
                            ALTER TABLE contacts 
                            ADD COLUMN {col_name} {col_type}
                        """))
                        conn.commit()
    except Exception as e:
        print(f"Warning: Could not auto-migrate relationship tracking columns: {e}")

# Don't run migration on import - it will try to connect immediately
# Migrations will run on first database operation if needed
# Uncomment below if you want to run migrations on startup (may cause issues if network is down):
# try:
#     _ensure_relationship_tracking_columns()
# except Exception as e:
#     print(f"Warning: Relationship tracking migration check failed: {e}")

# Auto-migrate: Add has_public_profile column if it doesn't exist
def _ensure_has_public_profile_column():
    """Ensure has_public_profile column exists in users table."""
    try:
        with engine.connect() as conn:
            if "postgresql" in DATABASE_URL.lower():
                # PostgreSQL - check if column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='has_public_profile'
                """))
                if result.fetchone() is None:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN has_public_profile BOOLEAN NOT NULL DEFAULT FALSE
                    """))
                    conn.commit()
            else:
                # SQLite - check if column exists
                result = conn.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result.fetchall()]
                if 'has_public_profile' not in columns:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN has_public_profile BOOLEAN NOT NULL DEFAULT 0
                    """))
                    conn.commit()
    except Exception as e:
        # Don't fail startup if migration fails - just log it
        print(f"Warning: Could not auto-migrate has_public_profile column: {e}")

# Don't run migration on import - it will try to connect immediately
# Migrations will run on first database operation if needed
# Uncomment below if you want to run migrations on startup (may cause issues if network is down):
# try:
#     from sqlalchemy import text
#     _ensure_has_public_profile_column()
# except Exception as e:
#     print(f"Warning: Auto-migration check failed: {e}")

# Test database connection on startup
def test_database_connection():
    """Test database connection and print status."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            test_value = result.scalar()
            if test_value == 1:
                db_type = "SQLite" if "sqlite" in DATABASE_URL.lower() else "PostgreSQL"
                is_supabase = "supabase" in DATABASE_URL.lower()
                print(f"✅ Database connection test successful")
                print(f"   Type: {db_type}")
                if is_supabase:
                    print(f"   Provider: Supabase")
                return True
            else:
                print(f"⚠️  Database connection test returned unexpected value: {test_value}")
                return False
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        print(f"   Please check your DATABASE_URL environment variable")
        return False

# Don't run connection test on import - it will block startup if network is unreachable
# Connection will be tested on first actual database operation
# Uncomment below if you want to test on startup (may cause issues if network is down):
# try:
#     test_database_connection()
# except Exception as e:
#     print(f"Warning: Could not test database connection on startup: {e}")

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
        try:
            if exc:
                self.s.rollback()
            else:
                self.s.commit()
        except Exception as e:
            # If commit/rollback fails, invalidate the connection
            print(f"⚠️ Session cleanup error: {e}")
            self.s.rollback()
        finally:
            # Always close the session, even if commit/rollback failed
            try:
                self.s.close()
            except Exception as e:
                print(f"⚠️ Session close error: {e}")
                # If close fails, invalidate the connection from the pool
                try:
                    self.s.bind.invalidate()
                except:
                    pass


# ---------- USERS ----------
def add_user(*, email: str, password_hash: str, name: str, company_or_school: Optional[str] = None, role: Optional[str] = None, experience_level: Optional[str] = None) -> User:
    """Create a new user if email not taken. Returns the persisted User."""
    with get_session() as s:
        existing = s.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise AlreadyExistsError(f"user with email {email} already exists")

        user = User(email=email, password_hash=password_hash, name=name, company_or_school=company_or_school, role=role, experience_level=experience_level)
        s.add(user)
        s.flush()   # populate user.user_id
        s.refresh(user)
        return user


def update_user(*, user_id: int, name: Optional[str] = None, company_or_school: Optional[str] = None, role: Optional[str] = None, experience_level: Optional[str] = None, onboarding_completed: Optional[bool] = None) -> User:
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
        if experience_level is not None:
            user.experience_level = experience_level
        if onboarding_completed is not None:
            user.onboarding_completed = onboarding_completed
        
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
    relationship_stage: Optional[str] = None,
    timeline: Optional[str] = None,
    gmail_thread_id: Optional[str] = None,
    last_interaction_date: Optional[date] = None,
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
        if relationship_stage is not None:
            contact.relationship_stage = relationship_stage
        if timeline is not None:
            contact.timeline = timeline
        if gmail_thread_id is not None:
            contact.gmail_thread_id = gmail_thread_id
        if last_interaction_date is not None:
            contact.last_interaction_date = last_interaction_date

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


# ---------- PUBLIC PROFILES ----------
def create_or_update_public_profile(
    *,
    user_id: int,
    display_name: str,
    school: Optional[str] = None,
    role: Optional[str] = None,
    industry_tags: Optional[str] = None,  # Comma-separated string
    contact_method: Optional[str] = None,
    contact_info: Optional[str] = None,
    visibility: bool = True,
) -> PublicProfile:
    """Create or update a public profile for a user."""
    with get_session() as s:
        if not s.get(User, user_id):
            raise NotFoundError(f"user {user_id} not found")
        
        # Check if profile already exists
        existing = s.execute(select(PublicProfile).where(PublicProfile.user_id == user_id)).scalar_one_or_none()
        
        if existing:
            # Update existing profile
            existing.display_name = display_name
            existing.school = school
            existing.role = role
            existing.industry_tags = industry_tags
            existing.contact_method = contact_method
            existing.contact_info = contact_info
            existing.visibility = visibility
            existing.updated_at = datetime.utcnow()
            
            # Update user's has_public_profile flag
            user = s.get(User, user_id)
            if user:
                user.has_public_profile = visibility
            
            s.flush()
            s.refresh(existing)
            return existing
        else:
            # Create new profile
            profile = PublicProfile(
                user_id=user_id,
                display_name=display_name,
                school=school,
                role=role,
                industry_tags=industry_tags,
                contact_method=contact_method,
                contact_info=contact_info,
                visibility=visibility,
            )
            s.add(profile)
            
            # Update user's has_public_profile flag
            user = s.get(User, user_id)
            if user:
                user.has_public_profile = visibility
            
            s.flush()
            s.refresh(profile)
            return profile


def get_public_profiles(
    *,
    industry: Optional[str] = None,
    school: Optional[str] = None,
    role: Optional[str] = None,
    visibility: bool = True,
) -> list[PublicProfile]:
    """Get all visible public profiles with optional filters."""
    with get_session() as s:
        # Debug: Check total profiles in database
        total_count = s.execute(select(func.count(PublicProfile.profile_id))).scalar()
        visible_count = s.execute(select(func.count(PublicProfile.profile_id)).where(PublicProfile.visibility == True)).scalar()
        print(f"[DEBUG] Database stats: Total profiles={total_count}, Visible profiles={visible_count}, Filtering for visibility={visibility}")
        
        query = select(PublicProfile).where(PublicProfile.visibility == visibility)
        
        if industry:
            # Search in industry_tags (comma-separated string)
            query = query.where(PublicProfile.industry_tags.ilike(f"%{industry}%"))
        
        if school:
            query = query.where(PublicProfile.school.ilike(f"%{school}%"))
        
        if role:
            query = query.where(PublicProfile.role.ilike(f"%{role}%"))
        
        results = s.execute(query.order_by(PublicProfile.created_at.desc())).scalars().all()
        print(f"[DEBUG] Query returned {len(results)} profiles after filters")
        if len(results) > 0:
            print(f"[DEBUG] First result: user_id={results[0].user_id}, visibility={results[0].visibility}, display_name={results[0].display_name}")
        return list(results)


def get_public_profile_by_user_id(user_id: int) -> Optional[PublicProfile]:
    """Get a public profile by user_id."""
    with get_session() as s:
        return s.execute(select(PublicProfile).where(PublicProfile.user_id == user_id)).scalar_one_or_none()


def delete_public_profile(*, user_id: int) -> bool:
    """Hide/delete a public profile."""
    with get_session() as s:
        profile = s.execute(select(PublicProfile).where(PublicProfile.user_id == user_id)).scalar_one_or_none()
        
        if not profile:
            raise NotFoundError(f"public profile for user {user_id} not found")
        
        # Update user's has_public_profile flag
        user = s.get(User, user_id)
        if user:
            user.has_public_profile = False
        
        s.delete(profile)
        s.flush()
        return True


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