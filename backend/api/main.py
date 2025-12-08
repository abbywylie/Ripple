from __future__ import annotations

from fastapi import FastAPI, HTTPException, Depends, Request
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
import re
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.service_api import create_user, update_user_service, create_contact, update_contact_service, delete_contact_service, create_meeting, update_meeting_service, delete_meeting_service, get_upcoming_meetings_service, get_meetings_for_date_service, get_user_by_email, list_contacts_for_user, list_meetings_for_contact, list_meetings_for_user, get_upcoming_follow_ups_for_user, get_goals_for_user, create_goal, update_goal_service, delete_goal_service, get_goal_steps, create_goal_step, update_goal_step_service, delete_goal_step_service, get_interactions_for_contact, get_interactions_for_user, create_interaction, update_interaction_service, delete_interaction_service, get_overdue_follow_ups_for_user, get_upcoming_follow_ups_interactions_for_user, get_platform_stats, create_or_update_public_profile_service, get_public_profiles_service, get_public_profile_by_user_id_service, delete_public_profile_service
from models.database_functions import AlreadyExistsError, NotFoundError, get_session, User, engine, DATABASE_URL
from sqlalchemy import text

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

try:
    from services.gmail_sync_service import (
        get_authorization_url,
        handle_oauth_callback,
        sync_gmail_for_user,
        get_gmail_sync_status as get_gmail_oauth_status
    )
except ImportError as e:
    print(f"Warning: gmail_sync_service not available: {e}")
    get_authorization_url = None
    handle_oauth_callback = None
    sync_gmail_for_user = None
    get_gmail_oauth_status = None

# Background sync removed - using manual sync only to save API calls


app = FastAPI(title="Networking API", version="1.0.0")

# Add CORS middleware FIRST to handle preflight requests
# Allow production Vercel URL, localhost, and all Vercel preview deployments (*.vercel.app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ripple-rose.vercel.app",  # Vercel production URL
        "http://localhost:5173",  # Local development
        "http://localhost:8080",  # Local development
        "http://localhost:3000",  # Local development
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

# Add global OPTIONS handler for all routes to handle CORS preflight
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle CORS preflight requests for all routes."""
    # Get the origin from the request
    origin = request.headers.get("origin", "")
    
    # Check if origin is allowed
    allowed_origins = [
        "https://ripple-rose.vercel.app",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
    ]
    
    # Check if origin matches Vercel preview pattern or is in allowed list
    is_allowed = (
        origin in allowed_origins or
        re.match(r"https://.*\.vercel\.app", origin) is not None
    )
    
    # Return the origin if allowed, otherwise return empty
    cors_origin = origin if is_allowed else allowed_origins[0] if allowed_origins else "*"
    
    return JSONResponse(
        status_code=200,
        content={},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Authentication setup
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")  # Set SECRET_KEY environment variable in production!
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
    relationship_stage: Optional[str] = None
    timeline: Optional[str] = None  # JSON string
    gmail_thread_id: Optional[str] = None
    last_interaction_date: Optional[str] = None  # ISO date

class ContactUpdatePartial(BaseModel):
    """Partial update model for REST-style endpoint (contact_id and user_id come from path/token)"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None
    date_first_meeting: Optional[str] = None  # ISO date
    date_next_follow_up: Optional[str] = None  # ISO date
    relationship_stage: Optional[str] = None
    timeline: Optional[str] = None  # JSON string
    gmail_thread_id: Optional[str] = None
    last_interaction_date: Optional[str] = None  # ISO date

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
    current_route: Optional[str] = None  # Current page/route for contextual help


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
            
            # Auto-create public profile for existing users if they have name and (company or role)
            # This migrates existing users to have public profiles by default
            if db_user.name and (db_user.company_or_school or db_user.role):
                try:
                    # Check if public profile exists
                    existing_profile = None
                    try:
                        existing_profile = get_public_profile_by_user_id_service(db_user.user_id)
                    except HTTPException as e:
                        if e.status_code == 404:
                            existing_profile = None
                        else:
                            raise
                    
                    # Only create if it doesn't exist (don't overwrite user's choice)
                    if not existing_profile:
                        create_or_update_public_profile_service(
                            user_id=db_user.user_id,
                            display_name=db_user.name,
                            school=db_user.company_or_school,
                            role=db_user.role,
                            visibility=True,  # Public by default
                        )
                except Exception as pub_error:
                    # Don't fail login if public profile creation fails
                    print(f"Note: Could not auto-create public profile on login: {pub_error}")
            
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
        
        # Auto-create/update public profile if user has name and (company or role)
        # Profiles are public by default
        if user_data.get("name") and (user_data.get("company_or_school") or user_data.get("role")):
            try:
                # Check if public profile exists (may return None or raise 404)
                existing_profile = None
                try:
                    existing_profile = get_public_profile_by_user_id_service(user_id)
                except HTTPException as e:
                    if e.status_code == 404:
                        existing_profile = None  # No profile exists yet
                    else:
                        raise  # Re-raise other HTTP exceptions
                
                # Create or update public profile (always public by default)
                create_or_update_public_profile_service(
                    user_id=user_id,
                    display_name=user_data.get("name", ""),
                    school=user_data.get("company_or_school"),
                    role=user_data.get("role"),
                    visibility=True,  # Public by default
                )
            except Exception as pub_error:
                # Don't fail profile update if public profile creation fails
                print(f"Note: Could not auto-update public profile: {pub_error}")
        
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


@app.put("/contacts/{contact_id}", response_model=dict)
def update_contact_by_id_endpoint(contact_id: int, payload: ContactUpdatePartial, token: str = Depends(oauth2_scheme)):
    """REST-style endpoint: PUT /contacts/{contact_id}"""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        # Merge path parameter and body data
        update_data = payload.dict()
        update_data["contact_id"] = contact_id
        update_data["user_id"] = user_id
        
        return update_contact_service(**update_data)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error updating contact {contact_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update contact: {str(e)}")


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
    """Answer app navigation and feature questions using RAG."""
    try:
        if answer_rag_question is None:
            raise HTTPException(status_code=503, detail="RAG service not available")
        # Enhance query with route context if provided
        query = payload.query
        if payload.current_route:
            query = f"[User is on {payload.current_route} page] {payload.query}"
        result = answer_rag_question(query)
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
        print(f"[DEBUG] GET /public-profiles called with filters: industry={industry}, school={school}, role={role}")
        profiles = get_public_profiles_service(
            industry=industry,
            school=school,
            role=role,
        )
        print(f"[DEBUG] Found {len(profiles)} visible public profiles")
        if len(profiles) > 0:
            print(f"[DEBUG] First profile sample: {profiles[0] if profiles else 'None'}")
        return profiles
    except Exception as e:
        print(f"[ERROR] Failed to get public profiles: {e}")
        import traceback
        traceback.print_exc()
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


@app.get("/api/debug/public-profiles", response_model=dict)
def debug_public_profiles_endpoint():
    """Debug endpoint to check public profiles in database. Public endpoint."""
    try:
        from models.database_functions import get_session, PublicProfile, select, func
        with get_session() as s:
            # Get all profiles regardless of visibility
            all_profiles = s.execute(select(PublicProfile)).scalars().all()
            total_count = len(all_profiles)
            
            # Count by visibility
            visible_count = s.execute(
                select(func.count(PublicProfile.profile_id)).where(PublicProfile.visibility == True)
            ).scalar()
            hidden_count = s.execute(
                select(func.count(PublicProfile.profile_id)).where(PublicProfile.visibility == False)
            ).scalar()
            
            # Get sample profiles
            visible_profiles = s.execute(
                select(PublicProfile).where(PublicProfile.visibility == True).limit(5)
            ).scalars().all()
            
            return {
                "total_profiles": total_count,
                "visible_count": visible_count,
                "hidden_count": hidden_count,
                "sample_visible_profiles": [
                    {
                        "user_id": p.user_id,
                        "display_name": p.display_name,
                        "visibility": p.visibility,
                        "school": p.school,
                        "role": p.role,
                    }
                    for p in visible_profiles
                ]
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Debug endpoint error: {str(e)}")


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


# =====================================================
# Database Connection Test Endpoint
# =====================================================
@app.get("/test-db", response_model=dict)
def test_database_connection():
    """
    Test endpoint to verify Supabase database connection.
    Returns database connection status and sample data.
    """
    try:
        # Test 1: Basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            
            if test_value != 1:
                raise Exception("Database query returned unexpected result")
        
        # Test 2: Get database info
        db_info = {
            "connection_status": "✅ Connected",
            "database_type": "SQLite" if "sqlite" in DATABASE_URL.lower() else "PostgreSQL",
            "is_supabase": "supabase" in DATABASE_URL.lower(),
            "url_preview": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "local",
        }
        
        # Test 3: Try to query public_profiles table
        try:
            with get_session() as session:
                from models.database_functions import PublicProfile
                profile_count = session.query(PublicProfile).count()
                db_info["public_profiles_count"] = profile_count
                db_info["public_profiles_test"] = "✅ Table accessible"
        except Exception as table_error:
            db_info["public_profiles_test"] = f"⚠️ Table error: {str(table_error)}"
            db_info["public_profiles_count"] = None
        
        # Test 4: Try to query users table
        try:
            with get_session() as session:
                user_count = session.query(User).count()
                db_info["users_count"] = user_count
                db_info["users_test"] = "✅ Table accessible"
        except Exception as table_error:
            db_info["users_test"] = f"⚠️ Table error: {str(table_error)}"
            db_info["users_count"] = None
        
        # Test 5: Get a sample public profile
        try:
            with get_session() as session:
                from models.database_functions import PublicProfile
                sample_profile = session.query(PublicProfile).filter(
                    PublicProfile.visibility == True
                ).first()
                
                if sample_profile:
                    db_info["sample_profile"] = {
                        "profile_id": sample_profile.profile_id,
                        "display_name": sample_profile.display_name,
                        "school": sample_profile.school,
                        "role": sample_profile.role,
                        "visibility": sample_profile.visibility,
                    }
                    db_info["sample_data_test"] = "✅ Sample data retrieved"
                else:
                    db_info["sample_data_test"] = "ℹ️ No public profiles found (table exists but empty)"
                    db_info["sample_profile"] = None
        except Exception as sample_error:
            db_info["sample_data_test"] = f"⚠️ Error retrieving sample: {str(sample_error)}"
            db_info["sample_profile"] = None
        
        return {
            "status": "success",
            "message": "Database connection test successful",
            "database": db_info,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection test failed: {str(e)}",
            "database": {
                "connection_status": "❌ Failed",
                "error": str(e),
                "url_preview": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "local",
            },
            "timestamp": datetime.datetime.utcnow().isoformat()
        }


# =====================================================
# Gmail Plugin Integration Endpoints
# =====================================================

@app.get("/api/gmail/contacts", response_model=List[dict])
def get_gmail_contacts(token: str = Depends(oauth2_scheme)):
    """Get Gmail contacts for the authenticated user."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        with get_session() as session:
            # Query gmail_contacts table
            result = session.execute(
                text("""
                    SELECT email, name, last_contact_ts,
                           has_reached_out, has_contact_responded, 
                           has_scheduled_meeting, awaiting_reply_from_user
                    FROM gmail_contacts
                    WHERE user_id = :user_id
                    ORDER BY last_contact_ts DESC
                """),
                {"user_id": user_id}
            )
            rows = result.fetchall()
            
            contacts = []
            for row in rows:
                contacts.append({
                    "email": row[0],
                    "name": row[1],
                    "last_contact_ts": row[2],
                    "checklist": {
                        "has_reached_out": row[3],
                        "has_contact_responded": row[4],
                        "has_scheduled_meeting": row[5],
                        "awaiting_reply_from_user": row[6]
                    }
                })
            
            return contacts
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error fetching Gmail contacts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Gmail contacts: {str(e)}")


@app.get("/api/gmail/threads", response_model=List[dict])
def get_gmail_threads(
    contact_email: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    """Get Gmail threads for the authenticated user, optionally filtered by contact email."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        with get_session() as session:
            if contact_email:
                result = session.execute(
                    text("""
                        SELECT thread_id, contact_email, subject, is_networking,
                               first_message_ts, last_updated_ts, meeting_scheduled
                        FROM gmail_threads
                        WHERE user_id = :user_id AND contact_email = :contact_email
                        ORDER BY last_updated_ts DESC NULLS LAST
                    """),
                    {"user_id": user_id, "contact_email": contact_email}
                )
            else:
                result = session.execute(
                    text("""
                        SELECT thread_id, contact_email, subject, is_networking,
                               first_message_ts, last_updated_ts, meeting_scheduled
                        FROM gmail_threads
                        WHERE user_id = :user_id
                        ORDER BY last_updated_ts DESC NULLS LAST
                    """),
                    {"user_id": user_id}
                )
            
            rows = result.fetchall()
            
            threads = []
            for row in rows:
                threads.append({
                    "thread_id": row[0],
                    "contact_email": row[1],
                    "subject": row[2],
                    "is_networking": row[3],
                    "first_message_ts": row[4],
                    "last_updated_ts": row[5],
                    "meeting_scheduled": row[6]
                })
            
            return threads
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error fetching Gmail threads: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Gmail threads: {str(e)}")


@app.get("/api/gmail/threads/{thread_id}/messages", response_model=List[dict])
def get_gmail_thread_messages(thread_id: str, token: str = Depends(oauth2_scheme)):
    """Get all messages in a Gmail thread."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        with get_session() as session:
            result = session.execute(
                text("""
                    SELECT gmail_id, thread_id, contact_email, timestamp,
                           direction, summary
                    FROM gmail_messages
                    WHERE user_id = :user_id AND thread_id = :thread_id
                    ORDER BY timestamp ASC
                """),
                {"user_id": user_id, "thread_id": thread_id}
            )
            rows = result.fetchall()
            
            messages = []
            for row in rows:
                messages.append({
                    "gmail_id": row[0],
                    "thread_id": row[1],
                    "contact_email": row[2],
                    "timestamp": row[3],
                    "direction": row[4],
                    "summary": row[5]
                })
            
            return messages
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error fetching Gmail messages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Gmail messages: {str(e)}")


@app.get("/api/gmail/sync-status", response_model=dict)
def get_gmail_sync_status(token: str = Depends(oauth2_scheme)):
    """Check if user has Gmail data synced and OAuth connection status."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        # Get OAuth connection status
        oauth_status = {}
        if get_gmail_oauth_status:
            try:
                oauth_status = get_gmail_oauth_status(user_id)
            except Exception as e:
                print(f"Error getting OAuth status: {e}")
                oauth_status = {"connected": False}
        
        with get_session() as session:
            # Count Gmail contacts
            contacts_result = session.execute(
                text("SELECT COUNT(*) FROM gmail_contacts WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            contacts_count = contacts_result.scalar() or 0
            
            # Count Gmail threads
            threads_result = session.execute(
                text("SELECT COUNT(*) FROM gmail_threads WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            threads_count = threads_result.scalar() or 0
            
            return {
                "has_gmail_data": contacts_count > 0 or threads_count > 0,
                "contacts_count": contacts_count,
                "threads_count": threads_count,
                "oauth_connected": oauth_status.get("connected", False),
                "last_sync": oauth_status.get("last_sync"),
                "connected_at": oauth_status.get("connected_at")
            }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error checking Gmail sync status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check Gmail sync status: {str(e)}")


# =====================================================
# Gmail OAuth and Sync Endpoints
# =====================================================

@app.get("/api/gmail/oauth/authorize")
def gmail_oauth_authorize(token: str = Depends(oauth2_scheme)):
    """Get OAuth authorization URL for Gmail integration."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        if not get_authorization_url:
            raise HTTPException(status_code=503, detail="Gmail sync service not available")
        
        auth_url = get_authorization_url(user_id)
        return {"authorization_url": auth_url}
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error generating OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate OAuth URL: {str(e)}")


@app.get("/api/gmail/oauth/callback")
def gmail_oauth_callback(code: str, state: str):
    """Handle OAuth callback from Google."""
    try:
        if not handle_oauth_callback:
            raise HTTPException(status_code=503, detail="Gmail sync service not available")
        
        result = handle_oauth_callback(code, state)
        
        if result["success"]:
            # Redirect to frontend success page
            from fastapi.responses import RedirectResponse
            frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
            return RedirectResponse(
                url=f"{frontend_url}/profile?gmail_connected=true",
                status_code=302
            )
        else:
            # Redirect to frontend error page
            from fastapi.responses import RedirectResponse
            frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
            return RedirectResponse(
                url=f"{frontend_url}/profile?gmail_error={result.get('error', 'Unknown error')}",
                status_code=302
            )
    
    except Exception as e:
        print(f"Error handling OAuth callback: {e}")
        from fastapi.responses import RedirectResponse
        frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
        return RedirectResponse(
            url=f"{frontend_url}/profile?gmail_error={str(e)}",
            status_code=302
        )


@app.post("/api/gmail/sync")
def trigger_gmail_sync(token: str = Depends(oauth2_scheme)):
    """Trigger manual Gmail sync for the authenticated user (on-demand)."""
    try:
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = jwt_payload["user_id"]
        
        if not sync_gmail_for_user:
            raise HTTPException(status_code=503, detail="Gmail sync service not available")
        
        result = sync_gmail_for_user(user_id)
        return result
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError as e:
        # No credentials found
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error syncing Gmail: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync Gmail: {str(e)}")


# Background sync endpoint removed - using manual sync only


# Root route handler - check for OAuth callback first
@app.get("/")
def root(code: Optional[str] = None, state: Optional[str] = None):
    """
    Root route handler.
    If OAuth callback parameters are present, handle OAuth callback directly.
    Otherwise, serve frontend or show message.
    """
    # Check if this is an OAuth callback (has code and state parameters)
    if code and state:
        # Handle OAuth callback directly (same logic as /api/gmail/oauth/callback)
        try:
            if not handle_oauth_callback:
                from fastapi.responses import RedirectResponse
                frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
                return RedirectResponse(
                    url=f"{frontend_url}/profile?gmail_error=Gmail sync service not available",
                    status_code=302
                )
            
            result = handle_oauth_callback(code, state)
            
            if result["success"]:
                # Redirect to frontend success page
                from fastapi.responses import RedirectResponse
                frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
                return RedirectResponse(
                    url=f"{frontend_url}/profile?gmail_connected=true",
                    status_code=302
                )
            else:
                # Redirect to frontend error page
                from fastapi.responses import RedirectResponse
                frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
                return RedirectResponse(
                    url=f"{frontend_url}/profile?gmail_error={result.get('error', 'Unknown error')}",
                    status_code=302
                )
        
        except Exception as e:
            print(f"Error handling OAuth callback at root: {e}")
            from fastapi.responses import RedirectResponse
            frontend_url = os.getenv("FRONTEND_URL", "https://ripple-rose.vercel.app")
            return RedirectResponse(
                url=f"{frontend_url}/profile?gmail_error={str(e)}",
                status_code=302
            )
    
    # Serve the built frontend (the Vite build output) - MUST be after all API routes
    frontend_dist_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
    if os.path.exists(frontend_dist_path):
        from fastapi.responses import FileResponse
        index_path = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # Fallback if frontend not built
    return {"message": "Frontend not built. Run 'npm run build' in the frontend directory."}

