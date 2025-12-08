# Gmail Server-Side Sync Setup

## Overview

The Gmail plugin now runs server-side! Users can connect their Gmail account and sync emails directly from the Ripple app - no local installation needed.

## How It Works

1. **User clicks "Connect Gmail"** in Profile page
2. **Redirects to Google OAuth** for authorization
3. **OAuth callback** stores tokens in database
4. **User clicks "Sync Now"** to process emails
5. **Backend processes emails** and stores in Supabase
6. **Gmail data appears** in ContactDetail page

## Setup Steps

### 1. Create Database Table

Run this SQL in Supabase SQL Editor:

```sql
-- See: scripts/create_gmail_oauth_table.sql
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

### 2. Configure Google OAuth

**Option A: Environment Variables (Recommended for Render)**

Set these in Render Dashboard → Your Service → Environment:

```
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://ripple-rose.vercel.app/api/gmail/oauth/callback
```

**Option B: Client Secrets File**

Place `client_secret_test.json` in `backend/` directory (not committed to git).

### 3. Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback
   ```
   (Use your actual Render backend URL)

### 4. Deploy Backend

The backend will auto-deploy from GitHub. Make sure:
- ✅ Database table created
- ✅ Environment variables set
- ✅ Google OAuth redirect URI configured

## User Flow

1. **User goes to Profile page**
2. **Sees "Gmail Integration" section**
3. **Clicks "Connect Gmail"**
4. **Redirected to Google** → Authorizes
5. **Redirected back** to Profile page
6. **Clicks "Sync Now"** to process emails
7. **Gmail data appears** in contacts

## API Endpoints

- `GET /api/gmail/oauth/authorize` - Get OAuth URL
- `GET /api/gmail/oauth/callback` - Handle OAuth callback
- `POST /api/gmail/sync` - Trigger sync
- `GET /api/gmail/sync-status` - Get connection status

## Files Created/Modified

**Backend:**
- `backend/services/gmail_sync_service.py` - Server-side sync service
- `backend/api/main.py` - OAuth and sync endpoints
- `scripts/create_gmail_oauth_table.sql` - Database migration

**Frontend:**
- `frontend/src/pages/ProfilePage.tsx` - Gmail integration UI
- `frontend/src/lib/api.ts` - Gmail API client functions

## Testing

1. **Test OAuth flow:**
   - Click "Connect Gmail" in Profile
   - Should redirect to Google
   - Authorize → Should redirect back

2. **Test sync:**
   - Click "Sync Now"
   - Should process emails
   - Check ContactDetail page for Gmail tab

## Troubleshooting

**"Gmail sync service not available"**
- Check if `gmail_sync_service.py` is imported correctly
- Verify Google OAuth credentials are set

**"No Gmail credentials found"**
- User needs to connect Gmail first
- Check `gmail_oauth_tokens` table

**OAuth redirect fails**
- Verify redirect URI matches Google Cloud Console
- Check backend URL is correct

## Next Steps (Future)

- **Automatic periodic sync** (background job)
- **Webhook-based sync** (real-time)
- **Multiple Gmail accounts** per user
- **Sync scheduling** (daily, weekly, etc.)

