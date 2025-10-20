# 🐙 GitHub Workflow Guide

This guide helps your 6-person team collaborate effectively on GitHub with the reorganized Ripple codebase.

## 🔧 Initial Repository Setup

### First Time Setup (for new team members)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Ripple-networking-app.git
   cd Ripple-networking-app
   ```

2. **Setup development environment**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or manually:
   # Frontend dependencies
   cd frontend && npm install
   
   # Backend dependencies  
   cd ../backend && pip install -r requirements.txt
   ```

3. **Test the setup**
   ```bash
   # Run from project root
   npm run dev
   # Should start both frontend (localhost:8080) and backend (localhost:8000)
   ```

## 🚀 Daily Development Workflow

### 1. Start Your Day
```bash
# Always get latest changes
git pull origin main

# Start development servers
npm run dev
```

### 2. Create Feature Branch
```bash
# Create new branch for your feature
git checkout -b feature/your-feature-name

# Examples:
git checkout -b feature/implement-dynamic-reminders
git checkout -b feature/add-contact-search
git checkout -b fix/login-error-handling
```

### 3. Work on Your Feature

#### For Frontend Developers:
```bash
cd frontend
npm run dev  # Frontend only on localhost:8080
```

**Key areas to work in:**
- `src/pages/` - Page components (Contacts.tsx, Reminders.tsx, etc.)
- `src/components/` - Reusable components
- `src/lib/api.ts` - API integration
- `src/contexts/AuthContext.tsx` - Authentication state

#### For Backend Developers:
```bash
cd backend
python -m uvicorn api_app:app --reload  # Backend only on localhost:8000
```

**Key areas to work in:**
- `api_app.py` - FastAPI endpoints
- `service_api.py` - Business logic
- `data/database_functions.py` - Database operations
- `login/login.py` - Authentication endpoints

### 4. Test Your Changes Locally
```bash
# Test both frontend and backend together
npm run dev

# Frontend testing
cd frontend && npm run lint  # Check for TypeScript errors

# Backend testing
# Visit http://localhost:8000/docs to test API endpoints
```

### 5. Commit Your Changes
```bash
# Review what you're committing
git status
git diff  # See exact changes

# Add your changes
git add .

# Write descriptive commit message
git commit -m "feat: add dynamic reminder loading from database

- Add GET /users/{user_id}/reminders API endpoint
- Update Reminders.tsx to fetch real data instead of static
- Add error handling for failed API calls
- Fix database query for upcoming follow-ups"

# Push to your branch
git push origin feature/your-feature-name
```

## 🔄 Pull Request Process

### 1. Create Pull Request
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Write detailed description:
   ```markdown
   ## What this PR does
   - Implements dynamic reminder system
   - Connects frontend to database-driven reminders
   
   ## Changes Made
   - Backend: Added reminder API endpoint
   - Frontend: Updated Reminders.tsx to use real data
   - Database: Enhanced follow-up query functions
   
   ## Testing
   - [ ] Frontend loads reminders correctly
   - [ ] API returns proper reminder data
   - [ ] No console errors in browser
   - [ ] Works on mobile view
   
   ## Screenshots
   [Add screenshots if UI changes]
   ```

### 2. Request Review
- Assign reviewers (at least 2 people)
- Add labels: `feature`, `frontend`, `backend`, etc.
- Link related issues: `Fixes #123`

### 3. Code Review Process
**For Reviewers:**

#### Frontend Code Review Checklist:
- [ ] TypeScript types are properly defined
- [ ] Components are reusable and well-structured  
- [ ] API calls handle loading and error states
- [ ] No `console.log` or debugging code left
- [ ] UI is responsive and accessible
- [ ] Follows existing code patterns

#### Backend Code Review Checklist:
- [ ] Proper error handling and HTTP status codes
- [ ] Input validation using Pydantic models
- [ ] Database operations use proper session management
- [ ] API endpoints follow REST conventions
- [ ] No sensitive data exposed in responses
- [ ] Database relationships handled correctly

### 4. After Approval
```bash
# Merge the PR on GitHub (or locally if you have permissions)
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main

# Delete the feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 🏷️ Branch Naming Convention

Use descriptive branch names with prefixes:

### Feature Branches
```bash
feature/contact-search-functionality
feature/dynamic-reminder-system
feature/goal-progress-tracking
feature/meeting-calendar-integration
```

### Bug Fix Branches
```bash
fix/login-validation-error
fix/mobile-layout-issues
fix/database-connection-timeout
fix/api-cors-errors
```

### Improvement Branches
```bash
refactor/separate-api-services
refactor/database-session-management
improve/frontend-error-handling
docs/update-setup-instructions
```

## 📋 Issue Management

### Creating Issues
Use GitHub Issues for:
- Bug reports
- Feature requests  
- Documentation improvements
- Team discussions

**Issue Template Example:**
```markdown
## Issue Description
Brief description of the problem or feature request

## Steps to Reproduce (for bugs)
1. Go to contacts page
2. Click search button
3. Error occurs

## Expected Behavior
What should happen?

## Actual Behavior  
What actually happens?

## Screenshots
[If applicable]

## Technical Details
- Browser: Chrome/Safari/Firefox
- Frontend/Backend: Which part is affected
- API endpoints: Which endpoints are involved
```

### Issue Labels
Use these labels to categorize:
- `bug` - Something is broken
- `feature` - New functionality requested
- `frontend` - Frontend-related changes
- `backend` - Backend-related changes  
- `database` - Database changes
- `documentation` - Documentation updates
- `priority:high` - Urgent fixes
- `priority:medium` - Important but not urgent
- `priority:low` - Nice to have

## 🚨 Handling Conflicts

### When Your Branch Has Conflicts
```bash
# Update your branch with latest main
git checkout feature/your-feature-name
git pull origin main

# Fix conflicts manually in your editor
# Look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes  
# >>>>>>> branch-name

# After editing, commit the resolution
git add .
git commit -m "resolve: merge conflicts with main branch"

# Push the resolved version
git push origin feature/your-feature-name
```

### Database Conflicts
If you both modified database schema:
1. **Don't edit** `networking.db` directly in git
2. **Communicate** with team about schema changes
3. **Use migrations** or update database functions carefully
4. **Test thoroughly** before merging

## 🤝 Team Coordination

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **Pull Request Comments**: For code-specific discussions  
- **Commit Messages**: Be descriptive for team review
- **README Updates**: Keep documentation current

### Daily Standup Reminders
Share in team chat:
- What branch you're working on
- Any blockers or help needed
- If you changed API endpoints (affects frontend team)
- If you changed database schema (affects backend team)

### Emergency Procedures

#### If Repository Gets Messed Up
```bash
# Check current status
git status
git log --oneline -10

# Reset to last known good state
git checkout main
git pull origin main
git reset --hard origin/main  # ⚠️ This loses local changes!
```

#### If Database Corrupts
```bash
cd backend/data
rm networking.db-shm networking.db-wal
# Restart backend - it recreates the database
```

## 📚 Useful Git Commands for Team

```bash
# See what everyone else has been working on
git log --oneline --author=all -10

# Check which files have changed recently
git log --stat --since="1 week ago"

# See differences between your branch and main
git diff main..feature/your-branch

# Stash changes temporarily (useful for quick switches)
git stash
git checkout main
git pull origin main
git checkout feature/your-branch  
git stash pop

# Create a quick patch for a teammate
git format-patch main..feature/your-branch
```

Remember: **Good communication prevents most conflicts!** Always notify the team about changes that might affect them.
