# Google OAuth Setup & Verification

## Current Issue: "Access Blocked"

You're seeing this error because:
- The OAuth app is in **"Testing"** mode in Google Cloud Console
- Only developer-approved test users can access it
- Gmail scopes (`gmail.readonly`) are considered "sensitive" by Google

## Quick Fix: Add Test Users (For Development)

**To allow yourself and others to test:**

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials/consent

2. **Click on your OAuth consent screen**

3. **Scroll to "Test users" section**

4. **Click "+ ADD USERS"**

5. **Add email addresses:**
   - Add your Gmail address: `networkingripple@gmail.com`
   - Add any other test users' Gmail addresses
   - Each user must accept the invitation email

6. **Save changes**

7. **Try authenticating again** - it should work now!

## Production Options

### Option 1: Keep in Testing Mode (Not Scalable)
- ✅ Quick setup
- ✅ No Google verification needed
- ❌ Must manually add every user as a test user
- ❌ Not suitable for public release

### Option 2: Publish App (Recommended for Production)
- ✅ Works for all users automatically
- ✅ No need to add users manually
- ❌ Requires Google verification process (can take weeks)
- ❌ Must provide privacy policy, terms of service
- ❌ May require security review for sensitive scopes

**Steps to publish:**
1. Go to OAuth consent screen
2. Fill out all required fields:
   - App name, support email, developer contact
   - Privacy policy URL (required)
   - Terms of service URL (required)
   - App logo (optional but recommended)
3. Click "PUBLISH APP"
4. Submit for verification (if using sensitive scopes like Gmail)
5. Wait for Google approval (1-4 weeks typically)

### Option 3: Use Service Account (Advanced)
- ✅ No user consent needed
- ✅ Works for all users
- ❌ Requires domain-wide delegation (Google Workspace)
- ❌ More complex setup
- ❌ Not suitable for personal Gmail accounts

## Current Recommendation

**For now (development/testing):**
- Add test users in Google Cloud Console
- This allows you to test immediately

**For production:**
- Plan to publish the app and go through verification
- Or keep it in testing mode and add users as needed (not ideal for scale)

## Verification Requirements (If Publishing)

If you want to publish and use Gmail scopes, Google requires:

1. **Privacy Policy** - Must be publicly accessible
2. **Terms of Service** - Must be publicly accessible
3. **App Information:**
   - App name, logo, homepage URL
   - Support email, developer contact
4. **Security Review:**
   - Google reviews apps using sensitive scopes
   - May ask for video demonstration
   - Can take 1-4 weeks

## Quick Test User Setup

**Right now, to unblock yourself:**

1. Visit: https://console.cloud.google.com/apis/credentials/consent
2. Find "Test users" section
3. Add `networkingripple@gmail.com`
4. Save
5. Try `python3 main.py` again

The user will receive an email invitation they need to accept.

