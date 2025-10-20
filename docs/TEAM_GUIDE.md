# 👥 Team Development Guide

This guide is specifically for the 6-person Ripple development team to understand how to work together effectively.

## 🏗️ Project Structure Overview

```
Ripple-main/
├── frontend/          # Frontend developers work here
├── backend/           # Backend developers work here  
├── docs/              # Documentation and guides
└── package.json       # Root package.json for easy commands
```

## 👨‍💻 Team Roles & Responsibilities

### Frontend Team (3-4 developers)
- **Work in**: `frontend/` directory
- **Primary files**: 
  - `src/pages/` - Page components
  - `src/components/` - UI components
  - `src/lib/api.ts` - API integration
- **Technologies**: React, TypeScript, Tailwind CSS, shadcn/ui

### Backend Team (2-3 developers)
- **Work in**: `backend/` directory
- **Primary files**:
  - `api_app.py` - API endpoints
  - `service_api.py` - Business logic
  - `data/database_functions.py` - Database operations
- **Technologies**: Python, FastAPI, SQLAlchemy, SQLite

## 🚀 Getting Started for Team Members

### For New Team Members

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ripple-main
   ```

2. **Install everything**
   ```bash
   npm run install:all
   ```

3. **Start development**
   ```bash
   npm run dev  # Runs both frontend and backend
   ```

### Daily Development Workflow

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Work on your assigned area** (frontend or backend)

3. **Test your changes locally**
   ```bash
   # Frontend developers
   cd frontend && npm run dev
   
   # Backend developers  
   cd backend && python -m uvicorn api_app:app --reload
   
   # Or use root command for both
   npm run dev
   ```

4. **Commit and push your changes**

## 🔄 Communication Between Frontend & Backend

### API Contract
- **Backend team**: Document all API changes in `backend/README.md`
- **Frontend team**: Update API calls in `frontend/src/lib/api.ts`
- **Communication**: Notify team when API endpoints change

### Data Flow
```
Frontend (React) → API Calls → Backend (FastAPI) → Database (SQLite)
                ↑                               ↓
                └────── JSON Response ←────────┘
```

## 📂 File Organization by Feature

### Contact Management Feature
**Frontend**:
- `frontend/src/pages/Contacts.tsx` - Contact listing page
- `frontend/src/components/ContactCard.tsx` - Contact component (if exists)

**Backend**:
- `backend/api_app.py` - Contact endpoints
- `backend/service_api.py` - Contact business logic
- `backend/data/database_functions.py` - Contact database operations

### Goal Tracking Feature
**Frontend**:
- `frontend/src/pages/Goals.tsx` - Goals page

**Backend**:
- Add goal-related endpoints in `backend/api_app.py`

## 🛠️ Development Tools

### Frontend Development
- **IDE**: VS Code with React/TypeScript extensions
- **Browser**: Chrome DevTools for debugging
- **Package Manager**: npm or yarn
- **Linting**: ESLint is configured

### Backend Development
- **IDE**: VS Code with Python extensions
- **API Testing**: Use `http://localhost:8000/docs` (FastAPI auto-docs)
- **Package Manager**: pip for Python dependencies

## 🐛 Debugging Guide

### Frontend Issues
1. Check browser console for errors
2. Check Network tab for API call failures
3. Verify API endpoint URLs in `frontend/src/lib/api.ts`

### Backend Issues
1. Check terminal output for Python errors
2. Verify database connection in `backend/data/`
3. Test endpoints using `/docs` interface

### Common Issues
- **CORS errors**: Backend needs to allow frontend origin
- **API connection**: Verify backend is running on port 8000
- **Database issues**: Check if `networking.db` exists and has proper permissions

## 📋 Branch Strategy (Recommended)

1. **Main branch**: `main` (production-ready code)
2. **Feature branches**: `feature/contact-management`, `feature/goal-tracking`
3. **Bugfix branches**: `bugfix/login-error`

### Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# Test locally with npm run dev

# Commit and push
git add .
git commit -m "Add feature: brief description"
git push origin feature/your-feature-name

# Create pull request to main
```

## 🔍 Code Review Guidelines

### For Frontend Code
- [ ] TypeScript types are properly defined
- [ ] Components are reusable and well-structured
- [ ] No console.log statements left in code
- [ ] Proper error handling for API calls
- [ ] Responsive design works on mobile

### For Backend Code
- [ ] Proper error handling and HTTP status codes
- [ ] Input validation using Pydantic models
- [ ] Database operations use proper session management
- [ ] API endpoints follow REST conventions
- [ ] Security considerations (no hardcoded secrets)

## 📅 Regular Team Practices

### Daily Standups (Recommended)
- What did you work on yesterday?
- What are you working on today?
- Any blockers or help needed?

### Weekly Planning
- Review upcoming features in backlog
- Assign tasks to frontend/backend teams
- Discuss API contract changes

## 🚨 Emergency Procedures

### If Database Gets Corrupted
1. Stop the backend server
2. Delete `backend/data/networking.db-shm` and `backend/data/networking.db-wal`
3. Restart backend - it will recreate the database

### If Dependencies Get Broken
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
pip install -r requirements.txt --force-reinstall
```

## 📞 Team Communication

- **GitHub Issues**: For bug reports and feature requests
- **Pull Requests**: For code reviews and discussions
- **Team Chat**: For quick questions and coordination

Remember: Communication is key in a team of 6! Always notify the team about changes that might affect others' work.
