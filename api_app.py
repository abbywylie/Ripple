from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

import service_api as svc
from database_functions import AlreadyExistsError, NotFoundError


app = FastAPI(title="Networking API", version="1.0.0")


class UserCreate(BaseModel):
    email: str
    password_hash: str
    name: str


class ContactCreate(BaseModel):
    user_id: int
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    date_first_meeting: Optional[str] = None  # ISO date
    date_next_follow_up: Optional[str] = None  # ISO date


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


@app.post("/users", response_model=dict)
def create_user(payload: UserCreate):
    try:
        return svc.create_user(**payload.dict())
    except AlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.get("/users/by-email/{email}", response_model=Optional[dict])
def get_user_by_email(email: str):
    return svc.get_user_by_email(email)


@app.post("/contacts", response_model=dict)
def create_contact(payload: ContactCreate):
    try:
        return svc.create_contact(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/users/{user_id}/contacts", response_model=List[dict])
def list_contacts(user_id: int):
    return svc.list_contacts_for_user(user_id)


@app.post("/meetings", response_model=dict)
def create_meeting(payload: MeetingCreate):
    try:
        return svc.create_meeting(**payload.dict())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/contacts/{contact_id}/meetings", response_model=List[dict])
def list_meetings(contact_id: int):
    return svc.list_meetings_for_contact(contact_id)


