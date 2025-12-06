# ⚡ Quick Update: Render Environment Variables

## 🎯 What You Need to Do RIGHT NOW

### Step 1: Go to Render Dashboard
👉 https://dashboard.render.com

### Step 2: Find Your Backend Service
Click on your backend service (the one running FastAPI)

### Step 3: Open Environment Tab
Click **Environment** in the sidebar

### Step 4: Update DATABASE_URL
1. Find `DATABASE_URL` in the list
2. Click **Edit**
3. **Replace the entire value with:**
   ```
   postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres
   ```
4. Click **Save**

### Step 5: Add/Update SECRET_KEY
1. Look for `SECRET_KEY` in the list
2. If it doesn't exist, click **Add Environment Variable**
3. **Key:** `SECRET_KEY`
4. **Value:** `31CDeMa1NtRKTjqN1gIdPbCMjOKwAfPOjbadKc-M1r8`
5. Click **Save**

### Step 6: Wait for Redeploy
- Render will automatically redeploy (2-5 minutes)
- Watch the **Logs** tab to see progress
- Look for: ✅ "Application startup complete"

---

## ✅ That's It!

Once deployed, your backend will be connected to Supabase.

**Test it:**
- Visit: https://ripple-backend-6uou.onrender.com/docs
- Should load without errors
- Try logging in from your frontend

---

## 📋 Summary

**Updated Variables:**
- ✅ `DATABASE_URL` = `postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres`
- ✅ `SECRET_KEY` = `31CDeMa1NtRKTjqN1gIdPbCMjOKwAfPOjbadKc-M1r8`

**No changes needed:**
- Frontend (Vercel) - already configured correctly

