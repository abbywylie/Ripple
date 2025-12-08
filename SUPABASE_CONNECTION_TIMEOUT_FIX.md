# Supabase Connection Timeout Fix

## Problem
Login fails with timeout error when connecting to Supabase:
```
connection to server at "aws-0-us-west-2.pooler.supabase.com" (54.70.143.232), port 5432 failed: timeout expired
```

## What I Fixed

1. **Increased connection timeout** from 10 to 30 seconds
2. **Added keepalive settings** to maintain connections
3. **Reduced pool size** to avoid hitting free tier limits
4. **Added better connection pooling** settings

## Additional Troubleshooting

### Check Your DATABASE_URL Format

**If using connection pooler (recommended for Render):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
- Port should be **6543** (not 5432)
- Example: `postgresql://postgres.xxx:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres`

**If using direct connection:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
- Port is **5432**
- Example: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`

### Steps to Fix

1. **Check your Render environment variables:**
   - Go to Render Dashboard → Your Service → Environment
   - Verify `DATABASE_URL` is set correctly
   - Make sure it starts with `postgresql://` (not `https://` or `postgres://`)

2. **If using pooler URL, verify port:**
   - Pooler URL should use port **6543**
   - Direct URL should use port **5432**

3. **Try direct connection if pooler fails:**
   - Get direct connection string from Supabase Dashboard
   - Settings → Database → Connection string → URI
   - Update `DATABASE_URL` on Render

4. **Check Supabase status:**
   - Visit https://status.supabase.com
   - Verify your region is operational

5. **Verify network access:**
   - Render should be able to reach Supabase
   - Check if there are any firewall rules blocking connections

### Quick Test

After updating, test the connection:
```bash
# On Render, check logs after deployment
# Should see: "✅ Database engine configured"
# And: "Target: Supabase PostgreSQL"
```

## Changes Made

- `backend/models/database_functions.py`:
  - Increased `connect_timeout` to 30 seconds
  - Added keepalive settings
  - Reduced pool size to 3 (from 5)
  - Reduced max_overflow to 5 (from 10)

## Next Steps

1. **Push changes to GitHub** (already done)
2. **Redeploy on Render** (should auto-deploy)
3. **Check Render logs** for connection status
4. **Try logging in again**

If still failing, try switching to direct connection URL instead of pooler.

