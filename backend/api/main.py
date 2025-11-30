from __future__ import annotations

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import bcrypt
import jwt
import datetime

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.service_api import create_user, update_user_service, create_contact, update_contact_service, delete_contact_service, create_meeting, update_meeting_service, delete_meeting_service, get_upcoming_meetings_service, get_meetings_for_date_service, get_user_by_email, list_contacts_for_user, list_meetings_for_contact, list_meetings_for_user, get_upcoming_follow_ups_for_user, get_goals_for_user, create_goal, update_goal_service, delete_goal_service, get_goal_steps, create_goal_step, update_goal_step_service, delete_goal_step_service, get_interactions_for_contact, get_interactions_for_user, create_interaction, update_interaction_service, delete_interaction_service, get_overdue_follow_ups_for_user, get_upcoming_follow_ups_interactions_for_user, get_platform_stats, create_or_update_public_profile_service, get_public_profiles_service, get_public_profile_by_user_id_service, delete_public_profile_service
from models.database_functions import AlreadyExistsError, NotFoundError, get_session, User

# Import optional services - don't break app if they fail
try:
    from services.recommendation_service import get_recommendations_for_user
except ImportError as e:
    print(f"Warning: recommendation_service not available: {e}")
    get_recommendations_for_user = None

try:
    from services.email_parser import parse_email_thread, suggest_actions, generate_interaction_tag
except ImportError as e:
    print(f"Warning: email_parser not available: {e}")
    parse_email_thread = None
    suggest_actions = None
    generate_interaction_tag = None

try:
    from services.rag_service import answer_rag_question
except ImportError as e:
    print(f"Warning: rag_service not available: {e}")
    answer_rag_question = None


app = FastAPI(title="Networking API", version="1.0.0")

# Add CORS middleware FIRST to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ripple-rose.vercel.app",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "*"  # Fallback for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication setup
SECRET_KEY = "supersecretkey"  # change this in production!
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Auth helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: int, email: str):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os

# API routes are defined below...


class UserCreate(BaseModel):
    email: str
    password_hash: str
    name: str


class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    company_or_school: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    company_or_school: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ContactCreate(BaseModel):
    user_id: int
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    category: Optional[str] = "Professional"
    tier: Optional[str] = "Tier 3"
    date_first_meeting: Optional[str] = None  # ISO date
    date_next_follow_up: Optional[str] = None  # ISO date

class ContactUpdate(BaseModel):
    contact_id: int
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None
    date_first_meeting: Optional[str] = None  # ISO date
    date_next_follow_up: Optional[str] = None  # ISO date

class ContactDelete(BaseModel):
    contact_id: int
    user_id: int

class MeetingCreate(BaseModel):
    user_id: int
    contact_id: int
    meeting_date: Optional[str] = None  # ISO date
    start_time: Optional[str] = None    # ISO time
    end_time: Optional[str] = None      # ISO time
    meeting_type: Optional[str] = None
    location: Optional[str] = None
    meeting_notes: Optional[str] = None
    thank_you: bool = False
    follow_up_days: Optional[int] = None

class MeetingUpdate(BaseModel):
    user_id: int
    meeting_date: Optional[str] = None  # ISO date
    start_time: Optional[str] = None    # ISO time
    end_time: Optional[str] = None      # ISO time
    meeting_type: Optional[str] = None
    location: Optional[str] = None
    meeting_notes: Optional[str] = None
    thank_you: Optional[bool] = None

class GoalCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    target_value: int = 1
    current_value: int = 0
    deadline: Optional[str] = None  # ISO date
    status: str = "In Progress"

class GoalUpdate(BaseModel):
    goal_id: int
    user_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[int] = None
    current_value: Optional[int] = None
    deadline: Optional[str] = None  # ISO date
    status: Optional[str] = None

class GoalDelete(BaseModel):
    goal_id: int
    user_id: int

class GoalStepCreate(BaseModel):
    goal_id: int
    title: str
    description: Optional[str] = None
    order_index: int = 0

class GoalStepUpdate(BaseModel):
    step_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    order_index: Optional[int] = None

class GoalStepDelete(BaseModel):
    step_id: int

class InteractionCreate(BaseModel):
    user_id: int
    contact_id: int
    interaction_type: str  # 'email', 'call', 'meeting', 'text', 'other'
    subject: Optional[str] = None
    content: Optional[str] = None
    tag: Optional[str] = None
    direction: str = "outbound"
    interaction_date: Optional[str] = None  # ISO date
    interaction_time: Optional[str] = None  # ISO time
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None  # ISO date

class InteractionUpdate(BaseModel):
    interaction_id: int
    user_id: int
    subject: Optional[str] = None
    content: Optional[str] = None
    tag: Optional[str] = None
    direction: Optional[str] = None
    interaction_date: Optional[str] = None  # ISO date
    interaction_time: Optional[str] = None  # ISO time
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None  # ISO date

class InteractionDelete(BaseModel):
    interaction_id: int
    user_id: int

class EmailParseRequest(BaseModel):
    email_text: str

class EmailLogRequest(BaseModel):
    user_id: int
    contact_id: int
    email_text: str
    custom_tag: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    user_id: Optional[int] = None


class PublicProfileCreate(BaseModel):
    display_name: str
    school: Optional[str] = None
    role: Optional[str] = None
    industry_tags: Optional[List[str]] = None
    contact_method: Optional[str] = None  # 'email' or 'linkedin'
    contact_info: Optional[str] = None
    visibility: bool = True


@app.post("/users", response_model=dict)
def create_user_endpoint(payload: UserCreate):
    try:
        return create_user(**payload.dict())
    except AlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.get("/users/by-email/{email}", response_model=Optional[dict])
def get_user_by_email_endpoint(email: str):
    return get_user_by_email(email)


# Authentication endpoints
@app.options("/api/register")
async def options_register():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.post("/api/register", response_model=dict)
def register(user: UserRegister):
    try:
        user_data = create_user(
            email=user.email, 
            password_hash=hash_password(user.password), 
            name=user.name,
            company_or_school=user.company_or_school,
            role=user.role
        )
        return {
            "userId": user_data["user_id"], 
            "email": user_data["email"], 
            "name": user_data["name"],
            "company_or_school": user_data.get("company_or_school"),
            "role": user_data.get("role")
        }
    except AlreadyExistsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the full error for debugging
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.options("/api/login")
async def options_login():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.post("/api/login", response_model=Token)
def login(user: UserLogin):
    try:
        with get_session() as s:
            from sqlalchemy import select
            db_user = s.execute(select(User).where(User.email == user.email)).scalar_one_or_none()
            if not db_user or not verify_password(user.password, db_user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            token = create_token(db_user.user_id, db_user.email)
            return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.get("/api/stats", response_model=dict)
def get_stats():
    """Get platform-wide statistics for the landing page."""
    try:
        stats = get_platform_stats()
        return stats
    except Exception as e:
        print(f"Stats error: {e}")
        # Return default stats on error
        return {
            "total_users": 0,
            "total_contacts": 0,
            "active_users": 0,
        }


@app.get("/api/me")
def get_profile(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload["user_id"]
        
        # Fetch full user data from database
        with get_session() as s:
            from sqlalchemy import select
            db_user = s.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {
                "userId": db_user.user_id,
                "email": db_user.email,
                "name": db_user.name,
                "company_or_school": db_user.company_or_school,
                "role": db_user.role,
                "experience_level": db_user.experience_level,
                "onboarding_completed": db_user.onboarding_completed
            }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.put("/api/me")
def update_profile(payload: UserUpdate, token: str = Depends(oauth2_scheme)):
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        user_data = update_user_service(
            user_id=user_id,
            name=payload.name,
            company_or_school=payload.company_or_school,
            role=payload.role,
            experience_level=payload.experience_level,
            onboarding_completed=payload.onboarding_completed
        )
        return user_data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/contacts", response_model=dict)
def create_contact_endpoint(payload: ContactCreate):
    try:
        return create_contact(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contact: {str(e)}")


@app.get("/users/{user_id}/contacts", response_model=List[dict])
def list_contacts_endpoint(user_id: int):
    return list_contacts_for_user(user_id)


@app.put("/contacts", response_model=dict)
def update_contact_endpoint(payload: ContactUpdate):
    try:
        return update_contact_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/contacts", response_model=dict)
def delete_contact_endpoint(payload: ContactDelete):
    try:
        return delete_contact_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/meetings", response_model=dict)
def create_meeting_endpoint(payload: MeetingCreate):
    try:
        return create_meeting(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.put("/meetings/{meeting_id}", response_model=dict)
def update_meeting_endpoint(meeting_id: int, payload: MeetingUpdate):
    try:
        return update_meeting_service(meeting_id=meeting_id, **payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/meetings/{meeting_id}", response_model=dict)
def delete_meeting_endpoint(meeting_id: int, user_id: int):
    try:
        return delete_meeting_service(meeting_id=meeting_id, user_id=user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/contacts/{contact_id}/meetings", response_model=List[dict])
def list_meetings_endpoint(contact_id: int):
    return list_meetings_for_contact(contact_id)


@app.get("/users/{user_id}/meetings", response_model=List[dict])
def list_user_meetings_endpoint(user_id: int):
    return list_meetings_for_user(user_id)


@app.get("/users/{user_id}/meetings/upcoming", response_model=List[dict])
def get_upcoming_meetings_endpoint(user_id: int, days: int = 30):
    return get_upcoming_meetings_service(user_id=user_id, days=days)


@app.get("/users/{user_id}/meetings/date/{target_date}", response_model=List[dict])
def get_meetings_for_date_endpoint(user_id: int, target_date: str):
    return get_meetings_for_date_service(user_id=user_id, target_date=target_date)


@app.get("/users/{user_id}/follow-ups", response_model=List[dict])
def get_upcoming_follow_ups_endpoint(user_id: int, days: int = 7):
    return get_upcoming_follow_ups_for_user(user_id, days)


@app.get("/users/{user_id}/goals", response_model=List[dict])
def list_goals_endpoint(user_id: int):
    return get_goals_for_user(user_id)


@app.post("/goals", response_model=dict)
def create_goal_endpoint(payload: GoalCreate):
    try:
        return create_goal(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.put("/goals", response_model=dict)
def update_goal_endpoint(payload: GoalUpdate):
    try:
        return update_goal_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/goals", response_model=dict)
def delete_goal_endpoint(payload: GoalDelete):
    try:
        return delete_goal_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/goals/{goal_id}/steps", response_model=List[dict])
def list_goal_steps_endpoint(goal_id: int):
    return get_goal_steps(goal_id)


@app.post("/goal-steps", response_model=dict)
def create_goal_step_endpoint(payload: GoalStepCreate):
    try:
        return create_goal_step(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.put("/goal-steps", response_model=dict)
def update_goal_step_endpoint(payload: GoalStepUpdate):
    try:
        return update_goal_step_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/goal-steps", response_model=dict)
def delete_goal_step_endpoint(payload: GoalStepDelete):
    try:
        return delete_goal_step_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Interaction endpoints
@app.get("/contacts/{contact_id}/interactions", response_model=List[dict])
def list_interactions_for_contact_endpoint(contact_id: int, user_id: int):
    return get_interactions_for_contact(contact_id, user_id)

@app.get("/users/{user_id}/interactions", response_model=List[dict])
def list_interactions_for_user_endpoint(user_id: int):
    return get_interactions_for_user(user_id)

@app.post("/interactions", response_model=dict)
def create_interaction_endpoint(payload: InteractionCreate):
    try:
        return create_interaction(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create interaction: {str(e)}")

@app.put("/interactions", response_model=dict)
def update_interaction_endpoint(payload: InteractionUpdate):
    try:
        return update_interaction_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update interaction: {str(e)}")

@app.delete("/interactions", response_model=dict)
def delete_interaction_endpoint(payload: InteractionDelete):
    try:
        return delete_interaction_service(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete interaction: {str(e)}")

@app.get("/users/{user_id}/overdue-follow-ups", response_model=List[dict])
def get_overdue_follow_ups_endpoint(user_id: int):
    return get_overdue_follow_ups_for_user(user_id)

@app.get("/users/{user_id}/upcoming-interaction-follow-ups", response_model=List[dict])
def get_upcoming_interaction_follow_ups_endpoint(user_id: int, days: int = 7):
    return get_upcoming_follow_ups_interactions_for_user(user_id, days)


# Email Thread Parsing Endpoints
@app.post("/api/parse-email", response_model=dict)
def parse_email_endpoint(payload: EmailParseRequest):
    """Parse an email thread to extract key information."""
    if parse_email_thread is None:
        raise HTTPException(status_code=503, detail="Email parser service not available")
    parsed_data = parse_email_thread(payload.email_text)
    suggestions = suggest_actions(parsed_data) if suggest_actions else []
    tag = generate_interaction_tag(parsed_data) if generate_interaction_tag else "email"
    
    return {
        "parsed_data": parsed_data,
        "suggestions": suggestions,
        "suggested_tag": tag
    }


@app.post("/api/log-email", response_model=dict)
def log_email_endpoint(payload: EmailLogRequest):
    """Log a parsed email thread as an interaction."""
    try:
        if parse_email_thread is None:
            raise HTTPException(status_code=503, detail="Email parser service not available")
        parsed_data = parse_email_thread(payload.email_text)
        tag = payload.custom_tag or (generate_interaction_tag(parsed_data) if generate_interaction_tag else "email")
        
        # Create interaction from parsed email
        interaction_data = {
            "user_id": payload.user_id,
            "contact_id": payload.contact_id,
            "interaction_type": "email",
            "subject": parsed_data.get('subject') or 'Email Thread',
            "content": payload.email_text,
            "tag": tag,
            "direction": "outbound" if not parsed_data.get('is_reply') else "inbound"
        }
        
        result = create_interaction(**interaction_data)
        
        return {
            "success": True,
            "interaction": result,
            "suggestions": suggest_actions(parsed_data)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# RAG Assistant Endpoint
@app.post("/api/rag/query", response_model=dict)
def rag_query_endpoint(payload: RAGQueryRequest):
    """Answer networking and recruiting questions using RAG."""
    try:
        if answer_rag_question is None:
            raise HTTPException(status_code=503, detail="RAG service not available")
        result = answer_rag_question(payload.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Database Migration Endpoint (one-time use)
@app.post("/api/migrate/add-user-fields")
def migrate_add_user_fields():
    """Add company_or_school, role, experience_level, and onboarding_completed columns to users table. One-time migration."""
    try:
        from sqlalchemy import text
        from models.database_functions import engine, Base
        from sqlalchemy.orm import Session
        
        # Use a transaction to ensure it commits
        with Session(engine) as session:
            # Check if columns already exist
            result = session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('company_or_school', 'role', 'experience_level', 'onboarding_completed')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            
            added_columns = []
            
            if 'company_or_school' not in existing_columns:
                session.execute(text("ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200)"))
                added_columns.append('company_or_school')
            
            if 'role' not in existing_columns:
                session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(200)"))
                added_columns.append('role')
            
            if 'experience_level' not in existing_columns:
                session.execute(text("ALTER TABLE users ADD COLUMN experience_level VARCHAR(50)"))
                added_columns.append('experience_level')
            
            if 'onboarding_completed' not in existing_columns:
                session.execute(text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE"))
                added_columns.append('onboarding_completed')
            
            # Commit the transaction
            session.commit()
            
            # Verify columns were added
            result = session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('company_or_school', 'role', 'experience_level', 'onboarding_completed')
            """))
            verified_columns = [row[0] for row in result.fetchall()]
            
            # Clear SQLAlchemy metadata cache to force schema refresh
            Base.metadata.clear()
            Base.metadata.reflect(bind=engine)
            
            if added_columns:
                return {
                    "success": True,
                    "message": f"Successfully added columns: {', '.join(added_columns)}",
                    "added_columns": added_columns,
                    "verified_columns": verified_columns,
                    "note": "Service restart recommended to clear connection pool cache"
                }
            else:
                return {
                    "success": True,
                    "message": "Columns already exist",
                    "existing_columns": existing_columns,
                    "verified_columns": verified_columns
                }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


# ---------- PUBLIC PROFILES ENDPOINTS ----------
@app.post("/public-profiles", response_model=dict)
def create_or_update_public_profile_endpoint(payload: PublicProfileCreate, token: str = Depends(oauth2_scheme)):
    """Create or update a public profile. Requires authentication."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        profile_data = create_or_update_public_profile_service(
            user_id=user_id,
            display_name=payload.display_name,
            school=payload.school,
            role=payload.role,
            industry_tags=payload.industry_tags,
            contact_method=payload.contact_method,
            contact_info=payload.contact_info,
            visibility=payload.visibility,
        )
        return profile_data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create/update public profile: {str(e)}")


@app.get("/public-profiles", response_model=List[dict])
def get_public_profiles_endpoint(
    industry: Optional[str] = None,
    school: Optional[str] = None,
    role: Optional[str] = None,
):
    """Get all visible public profiles with optional filters. Public endpoint."""
    try:
        profiles = get_public_profiles_service(
            industry=industry,
            school=school,
            role=role,
        )
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public profiles: {str(e)}")


@app.get("/public-profiles/{user_id}", response_model=dict)
def get_public_profile_by_user_id_endpoint(user_id: int):
    """Get a specific public profile by user_id. Public endpoint."""
    try:
        profile = get_public_profile_by_user_id_service(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Public profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public profile: {str(e)}")


@app.delete("/public-profiles/{user_id}", response_model=dict)
def delete_public_profile_endpoint(user_id: int, token: str = Depends(oauth2_scheme)):
    """Delete/hide a public profile. Users can only delete their own profile."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        authenticated_user_id = jwt_payload["user_id"]
        
        # Ensure users can only delete their own profile
        if authenticated_user_id != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own public profile")
        
        result = delete_public_profile_service(user_id=user_id)
        return result
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete public profile: {str(e)}")


# ---------- RECOMMENDATIONS ENDPOINT ----------
@app.get("/api/recommendations", response_model=List[dict])
def get_recommendations_endpoint(
    threshold: Optional[float] = 0.65,
    use_ml: bool = True,
    token: str = Depends(oauth2_scheme)
):
    """Get personalized connection recommendations for the authenticated user."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        if get_recommendations_for_user is None:
            raise HTTPException(status_code=503, detail="Recommendation service not available")
        recommendations = get_recommendations_for_user(
            user_id=user_id,
            threshold=threshold,
            use_ml=use_ml
        )
        return recommendations
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


# Serve the built frontend (the Vite build output) - MUST be after all API routes
# This will serve static files and handle the root route
frontend_dist_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")
else:
    # Fallback root handler if frontend not built
    @app.get("/")
    def root():
        return {"message": "Frontend not built. Run 'npm run build' in the frontend directory."}

