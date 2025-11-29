# 🌊 Ripple - Product Overview

**Ripple** is a comprehensive professional networking platform designed to help professionals manage their networking activities, build meaningful connections, and achieve their career goals through intelligent automation and AI-powered guidance.

---

## 📋 Table of Contents

1. [Product Overview](#product-overview)
2. [Core Features](#core-features)
3. [User Interface & Navigation](#user-interface--navigation)
4. [Key Functionality](#key-functionality)
5. [User Flows](#user-flows)
6. [Access & Setup](#access--setup)
7. [Technical Architecture](#technical-architecture)

---

## 🎯 Product Overview

Ripple helps professionals:
- **Manage Contacts**: Organize and track all networking contacts with tier-based prioritization
- **Discover Connections**: Find and connect with other professionals through public profiles
- **Track Meetings**: Schedule, log, and follow up on networking meetings
- **Set Goals**: Create and track networking goals with actionable steps
- **Get AI Guidance**: Receive personalized networking advice through RAG-powered assistant
- **Automate Follow-ups**: Never miss a follow-up with intelligent reminder system
- **Track Progress**: Visualize networking growth and engagement metrics

---

## 🚀 Core Features

### 1. **Dashboard** (`/dashboard`)
- **Overview**: Central hub showing networking activity at a glance
- **Features**:
  - Upcoming follow-ups and reminders
  - Recent contacts and interactions
  - Goal progress tracking
  - Networking tips and resources
  - Quick access to key actions
  - RAG Assistant integration (blue chat bubble)

### 2. **Contacts and Emails** (`/contacts`)
- **Overview**: Complete contact management system
- **Features**:
  - Create, edit, and delete contacts
  - **Tier System**: Organize contacts by priority (Tier 1, 2, 3)
  - **Auto Follow-up Dates**: Automatically calculated based on tier
    - Tier 1 & 2: 14 days
    - Tier 3: 7 days
  - Contact search and filtering
  - Email template integration
  - Contact detail pages with full history
  - **Email Parser**: Paste email threads to automatically log interactions

### 3. **Discover** (`/discover`) ⭐ NEW
- **Overview**: Find and connect with other professionals on the platform
- **Features**:
  - **Recommended for You Tab**: ML-powered personalized recommendations based on role/company similarity
  - **Browse All Tab**: Manual search and filter through all public profiles
  - Filter by industry, school, role
  - Search by name, school, role, or industry tags
  - View public profiles with contact information
  - Add discovered users directly to contacts
  - Send templated networking messages
  - Similarity scores for recommendations

### 4. **Meetings** (`/meetings`)
- **Overview**: Schedule and track networking meetings
- **Features**:
  - Create new meetings with contacts
  - Edit and delete meetings
  - Calendar view of scheduled meetings
  - Meeting notes and follow-up actions
  - Integration with contact follow-up dates

### 5. **Goals** (`/goals`)
- **Overview**: Set and track networking goals
- **Features**:
  - Create goals with multiple steps
  - Track goal completion progress
  - Step-by-step action items
  - Progress visualization
  - Goal categories and prioritization

### 6. **Reminders** (`/reminders`)
- **Overview**: Never miss a follow-up
- **Features**:
  - View all upcoming follow-ups
  - Overdue follow-up alerts
  - Automatic reminder generation based on contact tiers
  - Mark reminders as complete
  - Filter by date range

### 7. **Progress** (`/progress`)
- **Overview**: Analytics and insights into networking activity
- **Features**:
  - Total contacts and interactions
  - Goal completion rates
  - Monthly activity trends
  - Visual charts and graphs
  - Growth metrics

### 8. **Profile** (`/profile`)
- **Overview**: User profile and settings management
- **Features**:
  - View and edit personal information
  - Update role, company, school
  - Change experience level (Beginner/Intermediate/Advanced)
  - Manage public profile settings
  - Account settings and preferences

### 9. **RAG Assistant** (Floating Chat)
- **Overview**: AI-powered networking guidance
- **Features**:
  - Ask questions about networking strategies
  - Get personalized advice based on experience level
  - Access curated resources from top business schools
  - Context-aware responses
  - Pin important answers for quick reference

---

## 🎨 User Interface & Navigation

### Navigation Structure

```
Ripple Logo (Home)
├── Dashboard
├── Contacts and Emails
├── Discover ⭐
├── Meetings
├── Goals
├── Reminders
├── Progress
└── Profile
```

### Key UI Components

- **Sidebar Navigation**: Persistent sidebar with all main pages
- **Daily Ripple**: Motivational networking tip at bottom of sidebar
- **RAG Assistant**: Floating blue chat bubble (bottom right)
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes

---

## 🔑 Key Functionality

### 1. **Tier-Based Contact Management**
- **Tier 1**: High-priority contacts (14-day follow-up)
- **Tier 2**: Medium-priority contacts (14-day follow-up)
- **Tier 3**: Lower-priority contacts (7-day follow-up)
- Follow-up dates automatically calculated when creating/updating contacts

### 2. **Public Profile System**
- Users can opt into public networking directory
- Create public profile with:
  - Display name
  - School/university
  - Role/job title
  - Industry tags
  - Contact method (email or LinkedIn)
  - Visibility toggle

### 3. **ML-Powered Recommendations**
- Uses SentenceTransformer embeddings
- Calculates similarity based on:
  - Job title/role similarity
  - Company similarity
- Returns top matches with similarity scores
- Only recommends users with public profiles
- Excludes existing contacts

### 4. **Email Parsing**
- Paste email threads into contact detail page
- Automatically extracts:
  - Participants
  - Date and time
  - Subject
  - Conversation content
- Creates interaction records automatically

### 5. **Experience Level System**
- **Beginner**: Guided onboarding, basic features
- **Intermediate**: More advanced features unlocked
- **Advanced**: Full feature access
- Can be changed in Profile settings
- Affects onboarding flow and feature visibility

### 6. **Auto Follow-up Reminders**
- Automatically calculates follow-up dates based on contact tier
- Shows in Reminders page
- Dashboard highlights upcoming/overdue follow-ups
- Can be manually adjusted per contact

---

## 👤 User Flows

### New User Onboarding

1. **Registration** → Create account
2. **Experience Level Selection** → Choose Beginner/Intermediate/Advanced
3. **Onboarding Tour** → Guided walkthrough of key features
4. **Profile Setup** → Add role, company, school
5. **First Contact** → Create first contact to see tier system
6. **Explore Features** → Discover, Goals, Meetings, etc.

### Adding a Contact

1. Navigate to **Contacts** page
2. Click **"Add Contact"** button
3. Fill in contact information:
   - Name (required)
   - Email, phone, company, job title (optional)
   - Category (Professional, Personal, etc.)
   - **Tier** (1, 2, or 3)
   - First meeting date (optional)
4. Follow-up date automatically calculated
5. Contact appears in Contacts list and Reminders

### Discovering Connections

1. Navigate to **Discover** page
2. **Recommended Tab**:
   - View ML-powered personalized recommendations
   - See similarity scores
   - Click "Add to Contacts" to save
3. **Browse All Tab**:
   - Use search bar to find specific people
   - Filter by industry, school, or role
   - View public profiles
   - Contact or add to contacts

### Logging an Email Interaction

1. Navigate to **Contact Detail** page
2. Click **"Paste Email"** button
3. Paste email thread content
4. Click **"Parse Email"**
5. Review extracted information
6. Click **"Log as Interaction"**
7. Interaction automatically saved with date, participants, content

### Setting a Goal

1. Navigate to **Goals** page
2. Click **"Create Goal"**
3. Enter goal title and description
4. Add goal steps (action items)
5. Track progress as steps are completed
6. View completion percentage

---

## 🔐 Access & Setup

### Local Development

#### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Access URLs
- **Frontend**: http://localhost:8080 (or port shown in terminal)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

### Production Deployment

- **Backend**: Deployed on Render (or similar platform)
- **Frontend**: Deployed on Vercel (or similar platform)
- **Database**: SQLite (can be migrated to PostgreSQL for production)

### Authentication

- **Registration**: Create account with email and password
- **Login**: JWT-based authentication
- **Protected Routes**: All pages except Landing, Login, Register require authentication
- **Session**: Token stored in localStorage

---

## 🏗️ Technical Architecture

### Backend Stack
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **ML Libraries**: SentenceTransformer (for recommendations)
- **API Style**: RESTful endpoints

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Fetch API with custom API client

### Key Backend Endpoints

```
POST   /api/register          - User registration
POST   /api/login             - User authentication
GET    /api/contacts          - Get user's contacts
POST   /api/contacts          - Create contact
PUT    /api/contacts/{id}     - Update contact
DELETE /api/contacts/{id}     - Delete contact
GET    /api/meetings          - Get user's meetings
POST   /api/meetings          - Create meeting
GET    /api/goals             - Get user's goals
POST   /api/goals             - Create goal
GET    /api/reminders         - Get follow-up reminders
POST   /public-profiles       - Create/update public profile
GET    /public-profiles       - Get all public profiles (filtered)
GET    /api/recommendations   - Get personalized recommendations
POST   /api/interactions/parse-email - Parse email thread
```

### Database Models

- **User**: User accounts with authentication
- **Contact**: Networking contacts with tier system
- **Meeting**: Scheduled meetings
- **Goal**: Networking goals with steps
- **GoalStep**: Individual goal action items
- **Interaction**: Logged interactions with contacts
- **PublicProfile**: Public networking directory profiles
- **CalendarIntegration**: Calendar sync settings
- **SyncedEvent**: Synced calendar events

---

## 📚 Additional Resources

### Documentation Files
- `README.md` - Basic setup and project structure
- `AUTO_FOLLOWUP_FEATURE.md` - Tier system and auto follow-up details
- `RAG_KNOWLEDGE.md` - RAG assistant knowledge base
- `FIRST_48H_RULE.md` - Networking best practices
- `DEPLOYMENT.md` - Deployment instructions
- `VERCEL_DEPLOYMENT.md` - Vercel-specific deployment

### Knowledge Base
- Networking guides from top business schools (Emory, Georgetown)
- Product guides and user success resources
- Interview playbooks and templates
- Email templates for networking

---

## 🎯 Use Cases

### For Job Seekers
- Track networking conversations
- Set goals for informational interviews
- Discover professionals in target companies
- Get AI guidance on networking strategies
- Never miss a follow-up

### For Professionals
- Maintain professional network
- Track relationships over time
- Discover new connections
- Set networking goals
- Measure networking activity

### For Students
- Build network during school
- Track informational interviews
- Connect with alumni
- Access school-specific networking resources
- Learn networking best practices

---

## 🔄 Recent Updates

### Latest Features (2024)
- ✅ **Discover Page**: ML-powered recommendations and public profile browsing
- ✅ **Public Profiles**: Opt-in networking directory
- ✅ **Recommendation System**: AI-powered connection suggestions
- ✅ **Experience Level System**: Tiered onboarding based on networking experience
- ✅ **Improved Error Handling**: Better user feedback and error recovery

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- Check existing documentation files
- Review API documentation at `/docs` endpoint
- Check browser console for error messages
- Review backend logs for API errors

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active Development

