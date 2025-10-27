# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free tier available)

**Backend Deployment:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables to set in Railway:**
- `DATABASE_URL`: Railway will provide a PostgreSQL URL automatically
- `SECRET_KEY`: Generate a random string for JWT signing

**Frontend Deployment:**
1. Build the frontend: `npm run build`
2. Deploy `dist/` folder to Vercel or Netlify
3. Update API_BASE_URL in `frontend/src/lib/api.ts` to your Railway backend URL

### Option 2: Render (Free tier available)

**Backend:**
1. Connect your GitHub repo to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `DATABASE_URL`: Render PostgreSQL URL
   - `SECRET_KEY`: Random string

**Frontend:**
1. Deploy to Vercel/Netlify
2. Update API_BASE_URL

### Option 3: Local Development Setup

**For team members:**
```bash
# Clone the repo
git clone <your-github-repo>
cd <repo-name>

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=.. python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000

# Frontend setup (new terminal)
cd frontend/ripple-connect-crafted-main
npm install
npm run dev
```

## Database Migration Notes

- **Local**: Uses SQLite (`networking.db`)
- **Production**: Uses PostgreSQL (Railway/Render provide this)
- **Schema**: Automatically created by SQLAlchemy on first run
- **Data**: Each deployment gets a fresh database (no data migration needed for demo)

## Environment Variables

**Backend (.env or Railway/Render settings):**
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-random-secret-key-here
```

**Frontend (update api.ts):**
```typescript
const API_BASE_URL = "https://your-backend-url.railway.app";
```

## Testing the Deployment

1. **Backend**: Visit `https://your-backend-url.railway.app/docs` to see API docs
2. **Frontend**: Visit your Vercel/Netlify URL
3. **Register**: Create a new account
4. **Test**: Add contacts, goals, interactions

## Cost Breakdown

- **Railway**: Free tier (500 hours/month)
- **Vercel**: Free tier (100GB bandwidth)
- **Total**: $0/month for small teams

## Production Considerations

- Add proper CORS settings for your domain
- Set up proper error logging
- Consider adding rate limiting
- Add email verification for registration
- Set up automated backups for production data
