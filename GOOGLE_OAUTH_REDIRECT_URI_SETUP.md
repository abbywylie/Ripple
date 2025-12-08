# Google OAuth Redirect URI Setup (Testing Mode)

## What is a Redirect URI?

When a user authorizes Gmail access, Google redirects them back to your app with an authorization code. The **redirect URI** tells Google where to send the user after authorization.

## Testing Mode vs Production Mode

**Good news:** You can configure redirect URIs even in **testing mode**! You don't need production mode.

The difference:
- **Testing mode**: Only approved test users can use the app (you control who)
- **Production mode**: Anyone can use the app (requires Google verification)

Both modes allow you to configure redirect URIs.

## Step-by-Step: Configure Redirect URI

### 1. Go to Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth 2.0 Client

- Look for your OAuth 2.0 Client ID (the one you're using for Gmail)
- Click on it to edit

### 3. Add Authorized Redirect URIs

In the "Authorized redirect URIs" section, click **"+ ADD URI"** and add:

```
https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback
```

**Important:** 
- Replace `ripple-backend-6uou.onrender.com` with your actual Render backend URL
- The path `/api/gmail/oauth/callback` must match exactly
- Use `https://` (not `http://`)

### 4. Save Changes

Click **"SAVE"** at the bottom

## Example

If your Render backend is at `https://my-backend.onrender.com`, add:
```
https://my-backend.onrender.com/api/gmail/oauth/callback
```

## Testing Mode Limitations

**What works in testing mode:**
- ✅ Configure redirect URIs
- ✅ OAuth flow works
- ✅ Only approved test users can connect

**What doesn't work:**
- ❌ Random users can't connect (only test users you add)
- ❌ Requires Google verification for production use

## For Your Demo (30 Test Users)

1. **Add redirect URI** (as shown above) ✅
2. **Add 30 test users** in Google Cloud Console:
   - Go to OAuth consent screen
   - Scroll to "Test users"
   - Add all 30 email addresses
3. **They'll receive invitation emails** to accept
4. **Once accepted, they can connect Gmail** via the Ripple app

## Verify It's Working

After adding the redirect URI:
1. User clicks "Connect Gmail" in Ripple
2. Redirects to Google OAuth
3. User authorizes
4. **Should redirect back to:** `https://ripple-backend-6uou.onrender.com/api/gmail/oauth/callback`
5. Backend processes callback
6. Redirects to frontend: `https://ripple-rose.vercel.app/profile?gmail_connected=true`

If step 4 fails, the redirect URI is misconfigured.

## Common Issues

**"Redirect URI mismatch" error:**
- Check the redirect URI matches exactly (including `https://`)
- Check the path is `/api/gmail/oauth/callback`
- Make sure you saved changes in Google Cloud Console

**"Access blocked" error:**
- User needs to be added as a test user first
- They need to accept the invitation email

## Summary

- **No production mode needed** ✅
- **Add redirect URI in Google Cloud Console** (works in testing mode)
- **Add test users** for your demo
- **That's it!** The OAuth flow will work

