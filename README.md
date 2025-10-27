# Ripple - Professional Networking Platform

A full-stack networking application built with FastAPI and React, designed to help professionals manage their networking activities and build meaningful connections.

## 🏗️ Project Structure

```
├── backend/                 # Python FastAPI backend
│   ├── api/                # API endpoints and route handlers
│   ├── models/             # Database models and schemas
│   ├── services/           # Business logic layer
│   ├── config/             # Configuration files
│   ├── login/              # Authentication handlers
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API client
│   │   ├── contexts/       # React contexts
│   │   └── hooks/          # Custom React hooks
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Project documentation
└── scripts/                # Development and deployment scripts
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 👥 Team Development

This project is organized for team collaboration with clear separation of concerns:

- **Backend API**: Handle business logic, database operations, and authentication
- **Frontend**: Focus on user interface, state management, and user experience
- **Database Models**: Define data structures and relationships
- **Services**: Implement core business logic

## 🛠️ Technologies

- **Backend**: FastAPI, SQLAlchemy, SQLite, JWT Authentication
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Database**: SQLite with proper relationships and constraints

## 📋 Features

- User authentication and registration
- Contact management
- Meeting tracking and scheduling
- Goal setting and progress tracking
- Responsive modern UI

## 🔧 Development Guidelines

1. **Backend**: Keep API endpoints clean, use proper error handling
2. **Frontend**: Follow React best practices, use TypeScript strictly
3. **Database**: Use proper migrations for schema changes
4. **Testing**: Write tests for critical functionality

## 📝 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.