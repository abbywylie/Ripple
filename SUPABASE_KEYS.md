# Supabase API Keys Reference

## 🔑 Key Types Explained

### 1. DATABASE_URL (Connection String)
**What it is:** Direct connection to your PostgreSQL database
**Where to use:** Backend environment variable `DATABASE_URL`
**Value:**
```
postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres
```

### 2. SECRET_KEY (Backend JWT Signing)
**What it is:** Secret key for signing JWTs in your FastAPI backend
**Where to use:** Backend environment variable `SECRET_KEY` in Render
**Value:**
```
31CDeMa1NtRKTjqN1gIdPbCMjOKwAfPOjbadKc-M1r8
```
**Purpose:** Used by your backend to sign/verify JWT tokens for authentication

### 3. Supabase Anon/Public Key
**What it is:** Supabase API key for client-side access (public key)
**Where to use:** Frontend if you integrate Supabase Auth (optional)
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iYmZwYnpydHBpY21hZWNlbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzcyMzMsImV4cCI6MjA4MDU1MzIzM30.mr3LkBh1gY1NXBXDND7ROxhPZqMLKxpiqP6iTov0-js
```
**Purpose:** Used by Supabase client libraries for API access
**Note:** Currently not needed - your backend uses its own JWT system

### 4. Supabase Service Role Key (Not Provided)
**What it is:** Supabase API key for server-side access (secret key)
**Where to use:** Backend if you integrate Supabase Auth (optional)
**How to get:** Supabase Dashboard → Settings → API → service_role key
**Purpose:** Bypasses Row Level Security (RLS) - use carefully!

---

## 📋 Current Setup

### Backend (Render) - Required Variables

#### ✅ DATABASE_URL
```
postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres
```
- **Purpose:** Connect backend to Supabase PostgreSQL
- **Status:** ⚠️ **MUST UPDATE** in Render

#### ✅ SECRET_KEY
```
31CDeMa1NtRKTjqN1gIdPbCMjOKwAfPOjbadKc-M1r8
```
- **Purpose:** Sign JWT tokens in FastAPI backend
- **Status:** ⚠️ **MUST SET** in Render

### Frontend (Vercel) - Optional Variables

#### 🔵 SUPABASE_ANON_KEY (Optional - for future Supabase Auth)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iYmZwYnpydHBpY21hZWNlbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzcyMzMsImV4cCI6MjA4MDU1MzIzM30.mr3LkBh1gY1NXBXDND7ROxhPZqMLKxpiqP6iTov0-js
```
- **Purpose:** Use Supabase client libraries (if you migrate to Supabase Auth)
- **Status:** ✅ **SAVED** but not needed right now
- **Note:** Your current setup uses backend JWT, not Supabase Auth

---

## 🎯 What You Need to Do NOW

### In Render (Backend):
1. Set `DATABASE_URL` = Supabase connection string ✅
2. Set `SECRET_KEY` = Generated secure key ✅

### In Vercel (Frontend):
- **No changes needed** - frontend uses backend JWT system
- Supabase anon key is saved for future use (if you migrate to Supabase Auth)

---

## 🔄 Future: Migrating to Supabase Auth (Optional)

If you want to use Supabase Auth instead of backend JWT:

1. **Backend:** Add `SUPABASE_SERVICE_KEY` (get from Supabase Dashboard)
2. **Frontend:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. **Update code:** Replace JWT system with Supabase Auth

**Current setup:** ✅ Works fine with backend JWT - no need to change unless you want Supabase Auth features.

---

## 📝 Summary

**For Supabase Migration (Right Now):**
- ✅ `DATABASE_URL` → Supabase connection string
- ✅ `SECRET_KEY` → Generated secure key

**Supabase Keys (Saved for Future):**
- ✅ Anon key saved (not needed for current setup)
- ⏳ Service role key (get if migrating to Supabase Auth)

**Status:** You have everything you need to complete the migration! 🚀

