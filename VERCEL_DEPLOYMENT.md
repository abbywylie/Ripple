# 🚀 Deploying Ripple to Vercel

## ⚠️ Important Architecture Note

**Ripple has a Python FastAPI backend**, and Vercel is primarily for frontend/serverless functions.

**You have TWO deployment options:**

---

## Option 1: Hybrid Deployment (Recommended) ✅

**Backend:** Deploy to Railway or Render  
**Frontend:** Deploy to Vercel

### Why this works:
- Python backend needs persistent runtime (not serverless)
- Frontend is static React that Vercel serves perfectly
- Best of both worlds

### Steps:

#### 1. Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd Ripple/backend
railway init
railway up
```

#### 2. Set Environment Variables in Railway
- `DATABASE_URL` - Railway provides PostgreSQL automatically
- `SECRET_KEY` - Generate random string for JWT
- `GROQ_API_KEY` - Your Groq API key (free tier available)
- `OPENAI_API_KEY` - Your OpenAI API key (optional, for fallback)

#### 3. Deploy Frontend to Vercel
```bash
# From RippleTotal directory
cd Ripple/frontend

# Update API URL in lib/api.ts
# Change: const API_BASE_URL = "http://127.0.0.1:8000"
# To: const API_BASE_URL = "https://your-railway-backend-url.railway.app"
```

Then:
1. Go to https://vercel.com
2. Import your GitHub repo: `abbywylie/Ripple`
3. Set root directory to `frontend`
4. Deploy!

---

## Option 2: All-in-One Vercel (Advanced) 🔧

**⚠️ Not recommended for this project** because:
- Python backend needs persistent processes
- Vercel Serverless Functions have execution time limits
- Database connections may timeout
- More complex setup required

If you still want to try:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Create `vercel.json` in root
```json
{
  "builds": [
    {
      "src": "backend/api/main.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/api/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

### 3. Convert to Serverless Functions
You'll need to refactor the backend to work with Vercel's serverless model (significant code changes required).

---

## ✅ Recommended Setup (Option 1)

| Component | Platform | Cost | Why |
|-----------|----------|------|-----|
| **Backend** | Railway | Free (500hrs/mo) | Persistent Python runtime |
| **Frontend** | Vercel | Free | Perfect for React static sites |
| **Database** | Railway PostgreSQL | Included free | Auto-provisioned |

### Total Cost: $0/month

---

## 🧪 Testing After Deployment

1. **Backend:** Visit `https://your-backend.railway.app/docs` - should see FastAPI docs
2. **Frontend:** Visit your Vercel URL - should load the app
3. **Integration:** Try registering an account to test backend connection

---

## 🔑 API Keys You Need

Before deploying, get these keys:

### 1. Groq API Key (Free)
- Sign up at https://console.groq.com
- Get your free API key
- Add to Railway environment variables

### 2. OpenAI API Key (Optional - for fallback)
- Sign up at https://platform.openai.com
- Get API key
- Add to Railway environment variables

### 3. SECRET_KEY (Generate yourself)
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🐛 Common Issues

### Issue: CORS errors
**Fix:** Update CORS in `backend/api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],  # Add your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Frontend can't reach backend
**Fix:** Update `frontend/src/lib/api.ts`:
```typescript
const API_BASE_URL = "https://your-railway-backend.railway.app"
```

### Issue: API keys not working
**Fix:** Make sure environment variables are set in Railway dashboard, not just in `.env` file

---

## 📝 Quick Checklist

- [ ] Backend deployed to Railway
- [ ] Environment variables set in Railway (DATABASE_URL, SECRET_KEY, GROQ_API_KEY)
- [ ] Frontend built successfully (`npm run build`)
- [ ] API URL updated in `frontend/src/lib/api.ts`
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel domain
- [ ] Tested registration flow
- [ ] Tested RAG assistant (needs Groq API key)

---

**Need help?** Check the Railway and Vercel documentation or see `DEPLOYMENT.md` for more details.

