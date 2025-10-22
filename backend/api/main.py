from __future__ import annotations

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import bcrypt
import jwt
import datetime

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.service_api import create_user, create_contact, update_contact_service, delete_contact_service, create_meeting, get_user_by_email, list_contacts_for_user, list_meetings_for_contact, list_meetings_for_user, get_upcoming_follow_ups_for_user, get_goals_for_user, create_goal, update_goal_service, delete_goal_service, get_goal_steps, create_goal_step, update_goal_step_service, delete_goal_step_service, get_interactions_for_contact, get_interactions_for_user, create_interaction, update_interaction_service, delete_interaction_service, get_overdue_follow_ups_for_user, get_upcoming_follow_ups_interactions_for_user
from models.database_functions import AlreadyExistsError, NotFoundError, get_session, User


app = FastAPI(title="Networking API", version="1.0.0")

# Add CORS middleware FIRST to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=False,  # Disable for now to avoid issues
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


class UserLogin(BaseModel):
    email: str
    password: str


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
            name=user.name
        )
        return {"userId": user_data["user_id"], "email": user_data["email"], "name": user_data["name"]}
    except AlreadyExistsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the full error for debugging
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.options("/api/login")
async def options_login():
    return {"message": "OK"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin):
    with get_session() as s:
        from sqlalchemy import select
        db_user = s.execute(select(User).where(User.email == user.email)).scalar_one_or_none()
        if not db_user or not verify_password(user.password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(db_user.user_id, db_user.email)
        return {"access_token": token, "token_type": "bearer"}


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
                "name": db_user.name
            }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


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


@app.get("/contacts/{contact_id}/meetings", response_model=List[dict])
def list_meetings_endpoint(contact_id: int):
    return list_meetings_for_contact(contact_id)


@app.get("/users/{user_id}/meetings", response_model=List[dict])
def list_user_meetings_endpoint(user_id: int):
    return list_meetings_for_user(user_id)


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

