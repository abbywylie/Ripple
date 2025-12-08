# Gmail Server-Side Setup Checklist

## ✅ Step 1: Google Cloud Console (DONE)
- [x] Added redirect URI: `https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback`
- [ ] Add 30 test users in "Test users" section (for demo)

## Step 2: Supabase Database Migration

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
    user_id INTEGER NOT NULL PRIMARY KEY,
    tokens_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_sync_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gmail_oauth_tokens_user_id ON gmail_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_oauth_tokens_last_sync ON gmail_oauth_tokens(last_sync_at);
```

**How to run:**
1. Go to Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Paste the SQL above
4. Click "Run" (or press Cmd/Ctrl + Enter)

## Step 3: Render Environment Variables

Go to Render Dashboard → Your Backend Service → Environment → Add these:

```
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback
BACKEND_URL=https://ripple-backend-6uou.onrender.com
FRONTEND_URL=https://ripple-rose.vercel.app
```

**Where to find Client ID/Secret:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Copy "Client ID" → `GOOGLE_OAUTH_CLIENT_ID`
4. Copy "Client secret" → `GOOGLE_OAUTH_CLIENT_SECRET`

**Important:** Replace `ripple-backend-6uou.onrender.com` with your actual Render backend URL if different.

## Step 4: Push Code to GitHub

The code is ready to push. Run:
```bash
git add .
git commit -m "Add server-side Gmail sync integration"
git push abby_backend main
git push origin main
```

This will trigger auto-deployment on Render and Vercel.

## Step 5: Verify Deployment

1. **Check Render logs:**
   - Render Dashboard → Your Service → Logs
   - Should see: "✅ Database engine configured"
   - Should see: "Gmail sync service available" (or warning if not)

2. **Test the endpoint:**
   - Visit: `https://ripple-backend-6uou.onrender.com/api/gmail/oauth/authorize`
   - Should return JSON (will need auth token, but confirms endpoint exists)

## Step 6: Test the Flow

1. **Login to Ripple app**
2. **Go to Profile page**
3. **Scroll to "Gmail Integration" section**
4. **Click "Connect Gmail"**
   - Should redirect to Google OAuth
   - Authorize
   - Should redirect back to Profile page
5. **Click "Sync Now"**
   - Should process emails
   - Check ContactDetail page → Gmail tab

## Troubleshooting

**"Gmail sync service not available"**
- Check Render logs for import errors
- Verify `GmailPluginRoot/automation/` is in repository
- May need to copy plugin functions to backend

**"Redirect URI mismatch"**
- Verify redirect URI in Google Cloud Console matches exactly
- Check `GOOGLE_OAUTH_REDIRECT_URI` in Render matches

**"No Gmail credentials found"**
- User needs to complete OAuth flow first
- Check `gmail_oauth_tokens` table has entry

## Quick Reference

**Google Cloud Console:**
- Credentials: https://console.cloud.google.com/apis/credentials
- OAuth Consent: https://console.cloud.google.com/apis/credentials/consent

**Supabase:**
- SQL Editor: Supabase Dashboard → SQL Editor

**Render:**
- Environment: Render Dashboard → Service → Environment

