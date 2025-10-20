# 🌊 Ripple Backend

FastAPI backend for the Ripple networking platform.

## 🚀 Quick Start

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api_app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── data/                   # Database layer
│   ├── database_functions.py  # SQLAlchemy models and operations
│   ├── networking.db      # SQLite database
│   └── reminders.py       # Reminder-related functions
├── login/                 # Authentication module
│   └── login.py          # JWT auth endpoints
├── api_app.py            # Main FastAPI application
├── service_api.py        # Business logic layer
└── requirements.txt      # Python dependencies
```

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database (development)
- **Pydantic** - Data validation and serialization
- **JWT** - Authentication tokens
- **Uvicorn** - ASGI server

## 📊 Database Models

### User Model
```python
class User:
    user_id: int (Primary Key)
    email: str (Unique)
    password_hash: str
    name: str
    created_date_time: datetime
```

### Contact Model
```python
class Contact:
    contact_id: int (Primary Key)
    user_id: int (Foreign Key)
    name: str
    email: str
    phone_number: str
    company: str
    job_title: str
    date_first_meeting: date
    date_next_follow_up: date
    date_created: date
```

### Meeting Model
```python
class Meeting:
    meeting_id: int (Primary Key)
    user_id: int (Foreign Key)
    contact_id: int (Foreign Key)
    meeting_date: date
    start_time: time
    end_time: time
    meeting_type: str
    location: str
    meeting_notes: str
    thank_you: bool
```

## 🔗 API Endpoints

### Authentication (`/login/login.py`)
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/me` - Get current user profile

### Main API (`api_app.py`)
- `POST /users` - Create user
- `GET /users/by-email/{email}` - Get user by email
- `POST /contacts` - Create contact
- `GET /users/{user_id}/contacts` - List user's contacts
- `POST /meetings` - Create meeting
- `GET /contacts/{contact_id}/meetings` - List contact's meetings

## 🔐 Authentication System

Uses JWT tokens for authentication:
- **Login**: Returns JWT token upon successful authentication
- **Protected routes**: Require valid JWT token in Authorization header
- **Token format**: `Bearer <jwt_token>`

## 🗄️ Database Operations

### Key Functions (`data/database_functions.py`)
- `add_user()` - Create new user
- `add_contact()` - Create new contact
- `add_meeting()` - Create new meeting
- `get_session()` - Database session context manager

### Service Layer (`service_api.py`)
- `create_user()` - User creation with validation
- `create_contact()` - Contact creation with validation
- `create_meeting()` - Meeting creation with validation
- `list_contacts_for_user()` - Get user's contacts
- `list_meetings_for_contact()` - Get contact's meetings

## 🚀 Development

### Running the Server

```bash
# Development with auto-reload
python -m uvicorn api_app:app --reload --host 0.0.0.0 --port 8000

# Production
python -m uvicorn api_app:app --host 0.0.0.0 --port 8000
```

### API Documentation

Once the server is running, visit:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```
DATABASE_URL=sqlite:///./data/networking.db
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
```

### Database Setup
The SQLite database (`data/networking.db`) will be created automatically on first run.

## 📝 Error Handling

The API uses FastAPI's built-in exception handling:
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists (e.g., duplicate email)
- **401 Unauthorized** - Invalid or missing authentication token
- **422 Validation Error** - Invalid request data

## 🧪 Testing

To test the API endpoints:

```bash
# Using curl
curl -X POST "http://localhost:8000/api/register" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Using the interactive docs at http://localhost:8000/docs
```

## 🚀 Deployment

For production deployment:

1. Set up a proper database (PostgreSQL recommended)
2. Update `DATABASE_URL` in environment variables
3. Change `SECRET_KEY` to a secure random string
4. Configure reverse proxy (nginx) for serving the API
5. Use a production ASGI server like Gunicorn with Uvicorn workers
