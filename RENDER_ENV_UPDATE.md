# Render Environment Variable Update

## ⚠️ ACTION REQUIRED: Update DATABASE_URL in Render

### Step-by-Step Instructions

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Login to your account

2. **Navigate to Your Backend Service**
   - Click on your backend service (likely named something like "ripple-backend" or "ripple-api")

3. **Open Environment Tab**
   - Click on **Environment** in the left sidebar
   - Or click the **Environment** tab at the top

4. **Update DATABASE_URL**
   - Find the `DATABASE_URL` variable in the list
   - Click **Edit** or click on the value
   - Replace the entire value with:
     ```
     postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres
     ```
   - Click **Save**

5. **Verify SECRET_KEY is Set**
   - While you're in the Environment tab, check if `SECRET_KEY` exists
   - If not, add it:
     - Click **Add Environment Variable**
     - Key: `SECRET_KEY`
     - Value: Generate a secure random key (see below)
     - Click **Save**

6. **Render Will Auto-Redeploy**
   - After saving, Render will automatically detect the change
   - It will redeploy your service (takes 2-5 minutes)
   - Watch the **Logs** tab to see the deployment progress

7. **Verify Connection**
   - Once deployed, check the logs for:
     - ✅ "Connected to database successfully"
     - ✅ No connection errors
     - ❌ If you see errors, check the troubleshooting section below

---

## 🔐 Generate SECRET_KEY (if not set)

If `SECRET_KEY` is not set, generate a secure one:

```bash
# Option 1: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -hex 32
```

Copy the output and set it as `SECRET_KEY` in Render.

---

## ✅ Verification Checklist

After updating, verify:

- [ ] `DATABASE_URL` is set to Supabase connection string
- [ ] `SECRET_KEY` is set to a secure random value
- [ ] Render service redeployed successfully
- [ ] No database connection errors in logs
- [ ] Backend API is accessible (check `/docs` endpoint)
- [ ] Frontend can connect to backend

---

## 🧪 Test the Connection

Once deployed, test the connection:

1. **Check Render Logs**
   - Go to **Logs** tab in Render
   - Look for successful startup messages
   - No "connection refused" or "authentication failed" errors

2. **Test API Endpoint**
   ```bash
   curl https://ripple-backend-6uou.onrender.com/api/health
   ```
   Or visit: https://ripple-backend-6uou.onrender.com/docs

3. **Test from Frontend**
   - Try logging in
   - Check browser console for errors
   - Verify API calls succeed

---

## 🆘 Troubleshooting

### "Connection refused" or "Connection timeout"
- ✅ Verify the connection string is correct (no extra spaces)
- ✅ Check Supabase dashboard - is the database active?
- ✅ Verify password is correct: `ByteMe2025!`
- ✅ Check if IP needs to be whitelisted (Supabase allows all by default)

### "SSL connection required"
- The connection string should work, but if you get SSL errors:
- Add `?sslmode=require` to the end:
  ```
  postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres?sslmode=require
  ```

### "Authentication failed"
- ✅ Double-check the password: `ByteMe2025!`
- ✅ Verify username is `postgres`
- ✅ Check Supabase dashboard for any connection restrictions

### "Too many connections"
- This shouldn't happen with the current pool settings
- If it does, use the connection pooler URL instead (see below)

---

## 🔄 Alternative: Use Connection Pooler (Optional)

For better performance and connection management, you can use Supabase's connection pooler:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection pooling**
3. Copy the **Session mode** connection string
4. Replace `DATABASE_URL` in Render with that value

The pooler URL looks like:
```
postgresql://postgres.obbfpbzrtpicmaecenxs:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Note:** You'll need to use the pooler password (might be different from direct connection password).

---

## 📝 Your Supabase Configuration

**DATABASE_URL (Copy this exactly):**
```
postgresql://postgres:ByteMe2025!@db.obbfpbzrtpicmaecenxs.supabase.co:5432/postgres
```

**Supabase Project:** `obbfpbzrtpicmaecenxs`

**Database:** `postgres`

**Port:** `5432`

**Password:** `ByteMe2025!`

---

## 🎯 Next Steps After Update

1. ✅ Update `DATABASE_URL` in Render (this file)
2. ✅ Verify `SECRET_KEY` is set
3. ✅ Wait for Render to redeploy
4. ✅ Test the connection
5. ✅ Import your data (if you have data to migrate)
6. ✅ Update frontend if needed (shouldn't need changes)

---

## 📞 Need Help?

If you encounter issues:
1. Check Render logs for specific error messages
2. Check Supabase dashboard → **Database** → **Connection issues**
3. Verify the connection string format is correct
4. Test connection locally first (optional)

