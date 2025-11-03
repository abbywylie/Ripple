# 🚀 Vercel Deployment - Step by Step

## Prerequisites ✅

Before you start, you need:
- GitHub account
- Vercel account (free)
- Railway account (free) - for backend
- Groq API key (free from https://console.groq.com)

---

## PART 1: Deploy Backend to Railway (Do This First!)

### Step 1.1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 1.2: Login to Railway
```bash
railway login
```
This opens a browser window where you login with GitHub.

### Step 1.3: Navigate to Backend Directory
```bash
cd RippleTotal/Ripple/backend
```

### Step 1.4: Initialize Railway Project
```bash
railway init
```
- Select "Empty Project" or "Create New Project"
- Name it something like "ripple-backend"

### Step 1.5: Deploy
```bash
railway up
```
This uploads your backend and deploys it. Takes 2-5 minutes.

### Step 1.6: Get Your Backend URL
After deployment, Railway will show you a URL like:
```
https://ripple-backend-production.up.railway.app
```

**⚠️ Save this URL - you'll need it!**

### Step 1.7: Add Environment Variables

Go to Railway dashboard → Your project → Variables tab

Add these variables:

| Variable | Value | How to Get It |
|----------|-------|---------------|
| `GROQ_API_KEY` | Your Groq API key | Sign up at https://console.groq.com |
| `SECRET_KEY` | Random string | Run: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `DATABASE_URL` | Auto-set by Railway | Railway provides this automatically |

### Step 1.8: Redeploy After Adding Variables
```bash
railway up
```

### Step 1.9: Test Backend
Open `https://your-railway-url.railway.app/docs` in browser

You should see FastAPI documentation page! ✅

---

## PART 2: Deploy Frontend to Vercel

### Step 2.1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub

### Step 2.2: Import Your GitHub Repo
1. Click "Add New..." → "Project"
2. Find your repo: `abbywylie/Ripple`
3. Click "Import"

### Step 2.3: Configure Project Settings

On the "Configure Project" page:

**Root Directory:**
- Click "Edit" next to Root Directory
- Change to: `frontend`

**Build Settings (should auto-detect):**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 2.4: Add Environment Variables

Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://your-railway-url.railway.app` |
| | (Use the Railway URL from Step 1.6!) |

**⚠️ Important:** Make sure you use your actual Railway URL!

### Step 2.5: Deploy!

Click the big "Deploy" button!

This will:
- Install dependencies
- Build your React app
- Deploy to Vercel

Takes 2-3 minutes.

### Step 2.6: Get Your Frontend URL

After deployment, you'll see:
```
✅ Deployment successful
https://ripple-frontend.vercel.app
```

**⚠️ Save this URL - you'll need it!**

---

## PART 3: Fix CORS (Connect Frontend to Backend)

### Step 3.1: Update Backend CORS Settings

Open `RippleTotal/Ripple/backend/api/main.py`

Find this section (around line 26-33):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This needs to change
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Change it to:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-url.vercel.app",  # Your Vercel frontend URL from Step 2.6
        "http://localhost:5173"  # Keep this for local dev
    ],
    allow_credentials=True,  # Changed to True
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 3.2: Commit and Push Changes
```bash
cd RippleTotal/Ripple
git add backend/api/main.py
git commit -m "Update CORS for production deployment"
git push origin main
```

### Step 3.3: Redeploy Backend
```bash
cd backend
railway up
```

**OR** use Railway dashboard:
- Go to your project
- Click "Deploy" → It auto-deploys from GitHub

---

## PART 4: Test Everything!

### Step 4.1: Visit Your Frontend
Go to: `https://your-vercel-url.vercel.app`

### Step 4.2: Test Registration
1. Click "Get Started"
2. Fill in name, email, password
3. Click "Register"
4. Should redirect to dashboard ✅

### Step 4.3: Test Features
- ✅ Add a contact
- ✅ Try the RAG assistant (should work if Groq API key is set)
- ✅ View networking tips
- ✅ Add a meeting

---

## 🐛 Troubleshooting

### "CORS Error" in browser console
**Problem:** Frontend can't reach backend  
**Fix:** 
1. Check CORS in `backend/api/main.py` includes your Vercel URL
2. Make sure `allow_credentials=True`
3. Redeploy backend

### "Cannot connect to backend" or "Network Error"
**Problem:** Wrong API URL  
**Fix:**
1. Check `VITE_API_BASE_URL` in Vercel environment variables
2. Make sure it's your Railway backend URL (with `https://`)
3. Redeploy frontend (click "Redeploy" in Vercel dashboard)

### RAG Assistant says "API key not configured"
**Problem:** Groq API key not set  
**Fix:**
1. Go to Railway dashboard
2. Check Variables tab has `GROQ_API_KEY`
3. Redeploy backend

### Frontend shows blank page
**Problem:** Build failed  
**Fix:**
1. Check Vercel deployment logs
2. Make sure `Root Directory` is set to `frontend`
3. Check for TypeScript errors

---

## ✅ You're Done!

**Your Ripple app is now live:**
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-backend.railway.app/docs`

**Total Cost:** $0/month 🎉

**Next Steps:**
- Share your app URL with users!
- Monitor Railway/Vercel dashboards for usage
- Add custom domain (optional, in Vercel settings)
- Set up email verification (future enhancement)

---

## 📊 Quick Reference

| Service | What It Runs | URL |
|---------|-------------|-----|
| **Vercel** | Frontend (React) | `https://ripple-frontend.vercel.app` |
| **Railway** | Backend (FastAPI) | `https://ripple-backend.railway.app` |
| **Railway** | Database (PostgreSQL) | Auto-managed |

---

**Need help?** Check the logs in Railway and Vercel dashboards!

