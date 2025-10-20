# 🌊 Ripple Frontend

React + TypeScript frontend application for the Ripple networking platform.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:8080`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AppSidebar.tsx  # Navigation sidebar
│   │   └── ProtectedRoute.tsx
│   ├── pages/              # Page components
│   │   ├── Landing.tsx     # Home page
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Contacts.tsx    # Contact management
│   │   ├── Goals.tsx       # Goal tracking
│   │   ├── Reminders.tsx   # Reminder system
│   │   ├── Progress.tsx    # Analytics
│   │   ├── Login.tsx       # Authentication
│   │   └── Register.tsx    # User registration
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client
│   │   └── utils.ts        # Helper functions
│   └── assets/             # Static assets
└── public/                 # Public assets
```

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data management
- **React Hook Form** with Zod validation

## 🎨 UI Components

The app uses shadcn/ui components located in `src/components/ui/`:
- Buttons, Cards, Forms, Inputs
- Navigation, Sidebar, Tabs
- Dialogs, Tooltips, Toasts
- Charts, Calendars, Progress bars

## 🔐 Authentication

Authentication is handled by:
- `AuthContext.tsx` - Global auth state
- `ProtectedRoute.tsx` - Route protection
- `Login.tsx` & `Register.tsx` - Auth pages
- `api.ts` - API client with token handling

## 🎯 Key Features

1. **Responsive Design** - Works on desktop and mobile
2. **Modern UI** - Clean, professional interface
3. **Real-time Updates** - React Query for data synchronization
4. **Form Validation** - Zod schemas for type-safe validation
5. **Navigation** - Sidebar navigation between main sections

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use TypeScript for all new code
- Follow React best practices (hooks, functional components)
- Use Tailwind classes for styling
- Import components from `@/components/ui/` using the `@/` alias

## 🔗 API Integration

The frontend connects to the backend API via:
- **Base URL**: `http://localhost:8000/api`
- **Authentication**: JWT tokens stored in localStorage
- **Client**: Axios instance in `src/lib/api.ts`

## 📱 Pages Overview

- **Landing** - Marketing page with call-to-action
- **Dashboard** - Overview with stats and recent activity
- **Contacts** - Contact management with search and filtering
- **Goals** - Goal tracking with progress visualization
- **Reminders** - Timeline view of upcoming tasks
- **Progress** - Analytics and relationship strength metrics
- **Profile** - User account management
