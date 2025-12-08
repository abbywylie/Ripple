# Render Environment Variables for Gmail Integration

## Required Environment Variables

Add these to Render Dashboard → Your Backend Service → Environment:

### 1. Google OAuth Credentials

```
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
```

**Where to find:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Copy "Client ID" → paste as `GOOGLE_OAUTH_CLIENT_ID`
4. Click "Show" next to "Client secret" → copy → paste as `GOOGLE_OAUTH_CLIENT_SECRET`

### 2. Redirect URI

```
GOOGLE_OAUTH_REDIRECT_URI=https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback
```

**Important:** 
- Replace `ripple-backend-6uou.onrender.com` with your actual Render backend URL
- Must match exactly what you added in Google Cloud Console
- Must use `https://` (not `http://`)

### 3. Backend URL

```
BACKEND_URL=https://ripple-backend-6uou.onrender.com
```

**Replace with your actual Render backend URL** (same as above, but without the `/api/gmail/oauth/callback` path)

### 4. Frontend URL

```
FRONTEND_URL=https://ripple-rose.vercel.app
```

**Replace with your actual Vercel frontend URL** (where users will be redirected after OAuth)

## Complete Example

If your Render backend is `https://my-backend.onrender.com` and frontend is `https://my-app.vercel.app`:

```
GOOGLE_OAUTH_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xyz123
GOOGLE_OAUTH_REDIRECT_URI=https://my-backend.onrender.com/api/gmail/oauth/callback
BACKEND_URL=https://my-backend.onrender.com
FRONTEND_URL=https://my-app.vercel.app
```

## How to Add on Render

1. **Go to Render Dashboard**
2. **Click your backend service** (the one running FastAPI)
3. **Click "Environment"** in left sidebar
4. **Click "Add Environment Variable"** for each one
5. **Enter the key and value**
6. **Click "Save Changes"**
7. **Service will auto-redeploy** with new variables

## Verification

After adding variables and redeploying:
1. Check Render logs for: "Gmail sync service available"
2. Test endpoint: `GET /api/gmail/oauth/authorize` (will need auth token)
3. Try connecting Gmail from Profile page

## Notes

- **Don't include quotes** around values in Render
- **Case-sensitive** - use exact variable names shown
- **No spaces** around the `=` sign
- **Service will restart** after adding variables (this is normal)

