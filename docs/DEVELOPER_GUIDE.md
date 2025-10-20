# 💻 Developer Guide - Code Functions & GitHub Workflow

This guide explains how specific functions work in Ripple, how data flows through the system, and how to contribute effectively using GitHub.

## 🏗️ System Architecture Overview

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    SQL    ┌─────────────────┐
│    Frontend     │ ──────────────► │    Backend      │ ────────► │   Database      │
│   (React/TS)    │                 │   (FastAPI)     │           │   (SQLite)      │
└─────────────────┘                 └─────────────────┘           └─────────────────┘
```

## 🗄️ Database Layer (`backend/data/database_functions.py`)

### Core Database Models

```python
# User Model - Stores user account information
class User:
    user_id: int (Primary Key)
    email: str (Unique)
    password_hash: str
    name: str
    created_date_time: datetime

# Contact Model - Stores professional contacts
class Contact:
    contact_id: int (Primary Key)
    user_id: int (Foreign Key → User)
    name: str
    email: str
    phone_number: str
    company: str
    job_title: str
    date_first_meeting: date
    date_next_follow_up: date  # 🔔 KEY FOR REMINDERS
    date_created: date

# Meeting Model - Stores meeting history
class Meeting:
    meeting_id: int (Primary Key)
    user_id: int (Foreign Key → User)
    contact_id: int (Foreign Key → Contact)
    meeting_date: date
    start_time: time
    end_time: time
    meeting_type: str
    location: str
    meeting_notes: str
    thank_you: bool
```

### Key Database Functions

#### User Management
```python
def add_user(email: str, password_hash: str, name: str) -> User:
    """Creates a new user account"""
    # - Checks if email already exists
    # - Creates new User record
    # - Returns the created User object
```

#### Contact Management
```python
def add_contact(
    user_id: int,
    name: str,
    email: Optional[str] = None,
    date_next_follow_up: Optional[date] = None,
    **kwargs
) -> Contact:
    """Creates a new contact for a user"""
    # - Validates user exists
    # - Creates Contact with follow-up date
    # - Returns Contact object
```

#### Meeting Management
```python
def add_meeting(
    user_id: int,
    contact_id: int,
    meeting_date: Optional[date] = None,
    meeting_notes: Optional[str] = None,
    **kwargs
) -> Meeting:
    """Records a meeting between user and contact"""
    # - Validates user and contact exist
    # - Creates Meeting record
    # - Returns Meeting object
```

## 🔔 Reminder System - How It Works

### Current Implementation (Static Data)
The frontend currently shows static reminder data in `frontend/src/pages/Reminders.tsx`:

```typescript
const reminders = [
  {
    contact: "David Kim",
    task: "Coffee catch-up at Starbucks",
    date: "Tomorrow",
    time: "2:00 PM",
    urgency: "high",
    category: "Meeting"
  },
  // ... more static reminders
];
```

### Database-Driven Reminders (To Implement)
Based on `backend/data/reminders.py`, here's how reminders should work:

#### 1. Auto-Set Follow-up Dates
When a meeting is created, automatically set a follow-up date:

```python
# In database_functions.py - add_meeting function
from datetime import timedelta

def add_meeting(..., follow_up_days: Optional[int] = 7) -> Meeting:
    with get_session() as s:
        # Create meeting
        mtg = Meeting(...)
        s.add(mtg)
        
        # Auto-update follow-up date
        if follow_up_days:
            contact = s.get(Contact, contact_id)
            if contact:
                contact.date_next_follow_up = (
                    meeting_date or date.today()
                ) + timedelta(days=follow_up_days)
        
        s.flush()
        return mtg
```

#### 2. Query Reminders
Get contacts with upcoming follow-ups:

```python
def get_follow_ups_for_date(user_id: int, target_date: date) -> list[Contact]:
    """Get contacts with follow-ups due on specific date"""
    with get_session() as s:
        results = s.execute(
            select(Contact)
            .where(Contact.user_id == user_id)
            .where(Contact.date_next_follow_up == target_date)
        ).scalars().all()
        return results

def get_upcoming_follow_ups(user_id: int, days_ahead: int = 7) -> list[Contact]:
    """Get contacts with follow-ups in next N days"""
    today = date.today()
    upcoming = today + timedelta(days=days_ahead)
    with get_session() as s:
        results = s.execute(
            select(Contact)
            .where(Contact.user_id == user_id)
            .where(Contact.date_next_follow_up >= today)
            .where(Contact.date_next_follow_up <= upcoming)
        ).scalars().all()
        return results
```

#### 3. Backend API Endpoint (To Add)
Add to `backend/api_app.py`:

```python
@app.get("/users/{user_id}/reminders", response_model=List[dict])
def get_user_reminders(user_id: int, days_ahead: int = 7):
    """Get upcoming reminders for a user"""
    contacts = get_upcoming_follow_ups(user_id, days_ahead)
    # Convert contacts to reminder format
    reminders = []
    for contact in contacts:
        reminders.append({
            "contact": contact.name,
            "task": f"Follow-up with {contact.name}",
            "date": contact.date_next_follow_up.strftime("%Y-%m-%d"),
            "company": contact.company,
            "contact_id": contact.contact_id
        })
    return reminders
```

## 🔄 Data Flow Through the System

### Authentication Flow
```
1. User enters credentials → Login.tsx
2. authApi.login() → frontend/src/lib/api.ts
3. POST /api/login → backend/login/login.py
4. Verify credentials → database_functions.py
5. Generate JWT token → Return to frontend
6. Store token → localStorage
7. Update AuthContext → frontend/src/contexts/AuthContext.tsx
```

### Contact Management Flow
```
1. User adds contact → Contacts.tsx
2. API call → frontend/src/lib/api.ts (needs to be added)
3. POST /contacts → backend/api_app.py
4. create_contact() → backend/service_api.py
5. add_contact() → backend/data/database_functions.py
6. Save to SQLite → networking.db
7. Return success → Update frontend UI
```

### Reminder Flow (Current vs. Future)
```
Current (Static):
Reminders.tsx → Shows hardcoded data

Future (Dynamic):
1. Reminders.tsx loads → API call to /users/{user_id}/reminders
2. Backend queries → get_upcoming_follow_ups()
3. Database returns → Contacts with date_next_follow_up
4. Transform data → Convert to reminder format
5. Display → Dynamic reminder list
```

## 🚀 GitHub Workflow for Team Development

### 1. Initial Setup
```bash
# Clone the repository
git clone <your-github-repo-url>
cd Ripple-main

# Install dependencies
npm run install:all

# Create and switch to feature branch
git checkout -b feature/your-feature-name
```

### 2. Daily Development Workflow
```bash
# Start your day
git pull origin main  # Get latest changes

# Work on your feature
npm run dev  # Start both frontend and backend

# Make your changes in either:
# - frontend/src/ for React/TypeScript work
# - backend/ for Python/FastAPI work

# Test your changes
npm run dev  # Ensure everything still works
```

### 3. Before Committing
```bash
# Frontend developers - run linting
cd frontend && npm run lint

# Backend developers - test API endpoints
cd backend && python -m uvicorn api_app:app --reload
# Visit http://localhost:8000/docs to test

# Stage your changes
git add .
git status  # Review what you're committing
```

### 4. Committing & Pushing
```bash
# Write descriptive commit message
git commit -m "feat: add reminder API endpoint for upcoming follow-ups"

# Push your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### 5. Code Review Process
When reviewing code, check for:

#### Frontend Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Components follow React best practices
- [ ] No `console.log` statements left in production code
- [ ] API calls handle errors properly
- [ ] UI is responsive (works on mobile)
- [ ] No hardcoded data (should come from API)

#### Backend Code Review Checklist
- [ ] Proper error handling and HTTP status codes
- [ ] Input validation using Pydantic models
- [ ] Database session management (use `get_session()`)
- [ ] Follows REST API conventions
- [ ] No sensitive data in logs
- [ ] Database relationships are properly handled

## 🔧 Key Functions You Should Know

### Adding New API Endpoints

1. **Define in database layer** (`backend/data/database_functions.py`):
```python
def get_user_goals(user_id: int) -> list[Goal]:
    """Get user's networking goals"""
    # Implementation here
```

2. **Add business logic** (`backend/service_api.py`):
```python
def list_user_goals(user_id: int) -> List[Dict[str, Any]]:
    """Convert Goal objects to dictionaries"""
    goals = get_user_goals(user_id)
    return [goal_to_dict(goal) for goal in goals]
```

3. **Create API endpoint** (`backend/api_app.py`):
```python
@app.get("/users/{user_id}/goals", response_model=List[dict])
def get_user_goals(user_id: int):
    """API endpoint for user goals"""
    return svc.list_user_goals(user_id)
```

4. **Frontend integration** (`frontend/src/lib/api.ts`):
```typescript
export const goalsApi = {
  getUserGoals: async (userId: number) => {
    const response = await api.get(`/users/${userId}/goals`);
    return response.data;
  }
};
```

### Modifying Database Schema

1. **Update model** in `backend/data/database_functions.py`
2. **Run database migration** (SQLite will auto-create new columns)
3. **Update service layer** to handle new fields
4. **Update API endpoints** to include new data
5. **Update frontend** to display new fields

## 🐛 Common Issues & Solutions

### Database Issues
```bash
# If database gets corrupted:
cd backend/data
rm networking.db-shm networking.db-wal
# Restart backend - it will recreate the database
```

### Import Errors
```bash
# If you get import errors after restructuring:
cd backend
python -c "import sys; print(sys.path)"
# Make sure you're running from the correct directory
```

### API Connection Issues
```typescript
// Check API base URL in frontend/src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

// Ensure backend is running on port 8000
// Check CORS settings if needed
```

## 📋 Feature Implementation Guide

### To Implement Dynamic Reminders:

1. **Backend**: Add the reminder query functions shown above
2. **Backend**: Add API endpoint `/users/{user_id}/reminders`
3. **Frontend**: Update `frontend/src/lib/api.ts` with reminder API calls
4. **Frontend**: Modify `frontend/src/pages/Reminders.tsx` to fetch real data
5. **Database**: Ensure `Contact.date_next_follow_up` is being set properly

### To Add Goal Tracking:

1. **Database**: Create `Goal` model in `database_functions.py`
2. **Backend**: Add goal CRUD operations
3. **Frontend**: Create goal management UI components
4. **Integration**: Connect goals to contacts and meetings

## 🤝 Team Communication

### When Working on Related Features:
- **Frontend** changes affecting API: Update `frontend/src/lib/api.ts`
- **Backend** API changes: Update documentation in `backend/README.md`
- **Database** schema changes: Notify team about migration needs

### Branch Naming Convention:
- `feature/reminder-system` - New features
- `fix/login-bug` - Bug fixes
- `refactor/database-layer` - Code improvements
- `docs/update-readme` - Documentation updates

Remember: Always test locally with `npm run dev` before pushing to GitHub!
