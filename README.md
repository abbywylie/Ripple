# 🌊 Ripple - Professional Networking Reimagined

A comprehensive professional networking management platform that helps users build meaningful connections, track relationships, and grow their network with purpose.

## 🏗️ Project Structure

This is a **monorepo** containing both frontend and backend code for easier development and deployment:

```
ripple-networking-app/
├── frontend/                 # React + TypeScript + Vite application
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities and API
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Python + FastAPI application
│   ├── data/               # Database models and functions
│   │   ├── database_functions.py
│   │   └── networking.db   # SQLite database
│   ├── login/              # Authentication modules
│   ├── api_app.py          # Main FastAPI application
│   ├── service_api.py      # Business logic layer
│   └── requirements.txt    # Python dependencies
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ripple-networking-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000

## 📋 Available Scripts

### Root Level Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend development server
- `npm run dev:backend` - Start only backend API server
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all frontend and backend dependencies

### Frontend Commands (in `frontend/` directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Commands (in `backend/` directory)
- `python -m uvicorn api_app:app --reload` - Start FastAPI with hot reload
- `python -m uvicorn api_app:app` - Start production FastAPI server

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database (dev)
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Uvicorn** - ASGI server

## 👥 Team Development

### For Frontend Developers
Work in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```

### For Backend Developers  
Work in the `backend/` directory:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api_app:app --reload
```

### For Full-Stack Developers
Use the root commands to run everything:
```bash
npm run dev
```

## 📁 Key Directories

### Frontend (`/frontend/`)
- **`src/pages/`** - All page components (Dashboard, Contacts, Goals, etc.)
- **`src/components/ui/`** - Reusable UI components (shadcn/ui)
- **`src/lib/api.ts`** - API client configuration
- **`src/contexts/AuthContext.tsx`** - Authentication state management

### Backend (`/backend/`)
- **`api_app.py`** - FastAPI routes and endpoints
- **`service_api.py`** - Business logic layer
- **`data/database_functions.py`** - Database models and operations
- **`data/networking.db`** - SQLite database file

## 🔗 API Endpoints

The backend provides RESTful APIs at `http://localhost:8000`:

- **Authentication**: `/api/login`, `/api/register`, `/api/me`
- **Users**: `/users`, `/users/by-email/{email}`
- **Contacts**: `/contacts`, `/users/{user_id}/contacts`
- **Meetings**: `/meetings`, `/contacts/{contact_id}/meetings`

## 🎯 Core Features

1. **User Authentication** - Secure login/registration
2. **Contact Management** - Add, edit, and track professional contacts
3. **Goal Tracking** - Set and monitor networking objectives
4. **Reminder System** - Schedule and manage follow-ups
5. **Progress Analytics** - Visualize networking growth
6. **Dashboard** - Overview of key metrics and activities

## 🌐 Environment Configuration

### Frontend
Environment variables can be added to `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

### Backend
Environment variables can be added to `backend/.env`:
```
DATABASE_URL=sqlite:///./data/networking.db
SECRET_KEY=your-secret-key
```

## 📚 Documentation

- [Frontend Documentation](frontend/README.md) - React app details
- [Backend Documentation](backend/README.md) - API documentation
- [API Documentation](README_API.md) - Detailed API reference

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes in the appropriate directory (`frontend/` or `backend/`)
3. Test your changes locally using `npm run dev`
4. Submit a pull request

## 📞 Support

For team questions or issues, please refer to the documentation in the `docs/` folder or reach out to the project leads.