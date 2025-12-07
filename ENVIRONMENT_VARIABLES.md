# Environment Variables Guide

## 🔧 Backend Environment Variables (Render)

Update these in **Render Dashboard → Your Backend Service → Environment** tab.

### Required Variables

#### 1. `DATABASE_URL` ⚠️ **MUST UPDATE FOR SUPABASE**
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**How to get it:**
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your actual database password

**Optional: Use Connection Pooler (Recommended for better performance)**
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
- Better for handling multiple connections
- Find pooler URL in Supabase Dashboard → **Settings** → **Database** → **Connection pooling**

#### 2. `SECRET_KEY` ⚠️ **SHOULD UPDATE FOR SECURITY**
```
SECRET_KEY=your-super-secret-random-key-here-change-this-in-production
```

**Generate a secure key:**
```bash
# Option 1: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -hex 32
```

**Note:** Currently hardcoded in `main.py` as `"supersecretkey"`. Should be moved to environment variable for production.

### Optional Variables

#### 3. `EXTERNAL_RECOMMENDATION_API_URL` ✅ **ALREADY SET**
```
EXTERNAL_RECOMMENDATION_API_URL=https://ripple-yiue.onrender.com/api/recommendations
```
- Already configured with default value
- Only set if you want to override the default

#### 4. `GROQ_API_KEY` ⚠️ **REQUIRED FOR RAG CHATBOT**
```
GROQ_API_KEY=your-groq-api-key-here
```
- **Required** for RAG assistant features to work
- Get your key from: https://console.groq.com
- **IMPORTANT:** Add this to Render environment variables (NOT in code files!)
- Your key has been provided - add it to Render Dashboard → Environment Variables

#### 5. `OPENAI_API_KEY` (Optional - for RAG service)
```
OPENAI_API_KEY=your-openai-api-key-here
```
- Only needed if using RAG assistant features

---

## 🎨 Frontend Environment Variables (Vercel)

Update these in **Vercel Dashboard → Your Project → Settings → Environment Variables**.

### Required Variables

#### 1. `VITE_API_BASE_URL` ⚠️ **VERIFY THIS IS CORRECT**
```
VITE_API_BASE_URL=https://ripple-backend-6uou.onrender.com
```

**Current value:** Should point to your Render backend URL
- Production: `https://ripple-backend-6uou.onrender.com`
- Local dev: `http://localhost:8000` (default fallback)

**Note:** No changes needed unless your backend URL changed.

---

## 📋 Migration Checklist

### Backend (Render)
- [ ] Update `DATABASE_URL` to Supabase connection string
- [ ] Set `SECRET_KEY` to a secure random value
- [ ] Verify `EXTERNAL_RECOMMENDATION_API_URL` is set (optional)
- [ ] Set `GROQ_API_KEY` (REQUIRED for RAG chatbot - key provided separately)
- [ ] Set `OPENAI_API_KEY` if using RAG (optional fallback)

### Frontend (Vercel)
- [ ] Verify `VITE_API_BASE_URL` points to correct backend
- [ ] No other changes needed

---

## 🔍 How to Update in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **Backend Service**
3. Go to **Environment** tab
4. Click **Add Environment Variable** or edit existing ones
5. Add/Update:
   - `DATABASE_URL` = Your Supabase connection string
   - `SECRET_KEY` = Generated secure key
   - `GROQ_API_KEY` = Your Groq API key (for RAG chatbot - key provided separately)
6. Click **Save Changes**
7. Render will automatically redeploy

---

## 🔍 How to Update in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **Project**
3. Go to **Settings** → **Environment Variables**
4. Verify `VITE_API_BASE_URL` is set correctly
5. If updating, click **Save**
6. Redeploy if needed (usually auto-deploys)

---

## 🧪 Testing After Update

### Test Database Connection
```bash
# In Render logs, you should see:
# "Connected to database successfully"
# No connection errors
```

### Test Backend API
```bash
# Should return 200 OK
curl https://ripple-backend-6uou.onrender.com/api/health

# Or check in browser:
# https://ripple-backend-6uou.onrender.com/docs
```

### Test Frontend
1. Open your Vercel frontend URL
2. Try logging in
3. Check browser console for errors
4. Verify API calls are going to correct backend

---

## 🔐 Security Notes

1. **Never commit secrets to Git**
   - All secrets should be in environment variables
   - `.env` files should be in `.gitignore`

2. **Use different keys for production vs development**
   - Render = Production keys
   - Local = Development keys

3. **Rotate keys periodically**
   - Especially `SECRET_KEY` if compromised
   - Update in Render, then redeploy

4. **Supabase Connection String**
   - Contains password - keep it secret!
   - Use connection pooler URL for better security

---

## 🆘 Troubleshooting

### "Connection refused" or "Connection timeout"
- Check Supabase connection string format
- Verify password is correct
- Check if IP is whitelisted (Supabase allows all by default)
- Try connection pooler URL instead

### "SSL connection required"
- Add `?sslmode=require` to connection string
- Or use connection pooler (handles SSL automatically)

### "Too many connections"
- Use connection pooler URL instead of direct connection
- Reduce `pool_size` in database_functions.py (already optimized)

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Verify backend is running and accessible

---

## 📝 Example .env File (Local Development)

Create `backend/.env` for local development:

```env
# Database
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Security
SECRET_KEY=your-local-dev-secret-key-here

# Optional APIs
EXTERNAL_RECOMMENDATION_API_URL=https://ripple-yiue.onrender.com/api/recommendations
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key
```

**Note:** `.env` files are gitignored - never commit them!

