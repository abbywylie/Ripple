# Gmail Plugin Integration with Ripple - Demo Plan

## For Demo Tomorrow (30 Test Users)

### ✅ Already Done:
1. ✅ Gmail plugin stores data in Supabase (same DB as Ripple)
2. ✅ Multi-user support (user_id linking)
3. ✅ Database tables created (`gmail_contacts`, `gmail_threads`, `gmail_messages`)

### 🔧 What We Need to Build:

#### 1. Backend API Endpoints (Priority: HIGH)
- `GET /api/gmail/contacts` - Get user's Gmail contacts
- `GET /api/gmail/threads` - Get email threads for a contact
- `GET /api/gmail/messages/{thread_id}` - Get messages in a thread
- `GET /api/gmail/sync-status` - Check if user has Gmail data

#### 2. Frontend Integration (Priority: HIGH)
- Add Gmail data to ContactDetail page
- Show email threads/messages in a new tab
- Link Gmail contacts with Ripple contacts by email
- Show Gmail checklist status

#### 3. Contact Linking (Priority: MEDIUM)
- Auto-link Gmail contacts with Ripple contacts by email matching
- Show "Gmail Connected" badge on contacts with Gmail data

#### 4. User Onboarding (Priority: LOW)
- Instructions for users to run the Gmail plugin locally
- Or: Deploy plugin as a service (future)

## Implementation Steps

### Step 1: Backend API Endpoints
Create endpoints in `backend/api/main.py` to query Gmail tables.

### Step 2: Frontend API Client
Add functions in `frontend/src/lib/api.ts` to call Gmail endpoints.

### Step 3: UI Components
- Add "Gmail" tab to ContactDetail page
- Display email threads with summaries
- Show checklist status from Gmail plugin

### Step 4: Contact Linking
- Match Gmail contacts with Ripple contacts by email
- Update `gmail_thread_id` in Ripple contacts table

## Demo Flow

1. **User runs Gmail plugin locally:**
   ```bash
   cd GmailPluginRoot/automation
   python3 main.py
   ```
   - Authenticates with Gmail (must be added as test user)
   - Processes emails and stores in Supabase

2. **User opens Ripple app:**
   - Goes to Contacts page
   - Sees contacts with Gmail data (if linked)
   - Opens contact detail → "Gmail" tab
   - Sees email threads and messages

3. **For demo:**
   - Pre-run plugin for demo accounts
   - Show Gmail data in UI
   - Explain the integration

## Quick Setup for 30 Test Users

1. **Google Cloud Console:**
   - Add all 30 email addresses as test users
   - They'll receive invitation emails

2. **Each user:**
   - Accepts Google OAuth invitation
   - Runs `python3 main.py` locally
   - Authenticates with Gmail
   - Plugin processes their emails

3. **Ripple app:**
   - Shows Gmail data automatically (once integrated)

