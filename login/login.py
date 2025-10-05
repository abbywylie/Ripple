"""Converted from login.ipynb to login.py
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
import bcrypt, jwt, datetime

from database_functions import (
    add_user, get_session, User, NotFoundError, AlreadyExistsError
)

SECRET_KEY = "supersecretkey"  # change this in production!
ALGORITHM = "HS256"

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ----- Schemas -----
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ----- Helper functions -----
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

# ----- Endpoints -----
@app.post("/api/register")
def register(user: UserCreate):
    try:
        u = add_user(email=user.email, password_hash=hash_password(user.password), name=user.name)
        return {"userId": u.user_id, "email": u.email, "name": u.name}
    except AlreadyExistsError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/login", response_model=Token)
def login(user: UserLogin):
    with get_session() as s:
        db_user = s.query(User).filter(User.email == user.email).first()
        if not db_user or not verify_password(user.password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(db_user.user_id, db_user.email)
        return {"access_token": token, "token_type": "bearer"}

@app.get("/api/me")
def get_profile(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"userId": payload["user_id"], "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
