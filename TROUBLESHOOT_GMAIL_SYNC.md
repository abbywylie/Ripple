# Troubleshooting Gmail Sync - Why New Emails Don't Show Up

## Quick Checks

### 1. Check Gmail Contacts Table
Run this SQL in Supabase SQL Editor to see all Gmail contacts:
```sql
SELECT email, name, last_contact_ts, user_id
FROM gmail_contacts
WHERE user_id = 5
ORDER BY last_contact_ts DESC;
```

**What to look for:**
- Is `john.lasanajak@gmail.com` in this table?
- What's the `last_contact_ts`? (convert to date: `timestamp / 1000`)

### 2. Check Gmail Threads Table
```sql
SELECT thread_id, contact_email, subject, is_networking, last_updated_ts, user_id
FROM gmail_threads
WHERE user_id = 5
ORDER BY last_updated_ts DESC
LIMIT 10;
```

**What to look for:**
- Is there a thread with `contact_email = 'john.lasanajak@gmail.com'`?
- Is `is_networking = true`?
- What's the `last_updated_ts`? (should be recent if new email was processed)

### 3. Check Gmail Messages Table
```sql
SELECT gmail_id, thread_id, contact_email, timestamp, direction, user_id
FROM gmail_messages
WHERE user_id = 5 AND contact_email = 'john.lasanajak@gmail.com'
ORDER BY timestamp DESC
LIMIT 10;
```

**What to look for:**
- Are there recent messages for this contact?
- What's the `timestamp`? (should be recent)

### 4. Check Main Contacts Table
```sql
SELECT contact_id, name, email, gmail_thread_id, last_interaction_date, user_id
FROM contacts
WHERE user_id = 5 AND email LIKE '%lasanajak%';
```

**What to look for:**
- Does the contact exist?
- Does it have `gmail_thread_id` set?
- What's the `last_interaction_date`?

## Common Issues

### Issue 1: Email Not Fetched
**Symptom:** No entry in `gmail_messages` table
**Causes:**
- Email is older than recent limit (default: 50 messages)
- Email is not in Primary category (check Promotions, Social, Updates tabs)
- Email is in a different folder/label

**Fix:** Check Gmail filters, make sure email is in Primary inbox

### Issue 2: Email Not Classified as Networking
**Symptom:** Entry in `gmail_threads` but `is_networking = false`
**Causes:**
- LLM classified it as non-networking
- Subject/body doesn't contain networking keywords

**Fix:** Check the thread in database, see if `is_networking = false`

### Issue 3: Message Already Processed
**Symptom:** No new entry in `gmail_messages` table
**Causes:**
- `message_exists()` check returns True
- Email was processed in a previous sync

**Fix:** Check if `gmail_id` exists in `gmail_messages` table

### Issue 4: Gmail Contact Not Synced to Main Contacts
**Symptom:** Contact exists in `gmail_contacts` but not in main `contacts` table
**Causes:**
- Sync function didn't run
- Email mismatch (case sensitivity, typos)
- Contact exists but has no email field

**Fix:** Check email addresses match exactly (case-insensitive)

## Debug Steps

### Step 1: Check Recent Messages Fetched
The sync should log: `📬 Fetched X inbox messages...`
- If X is 0, no messages were fetched
- If X is small, might be missing recent emails

### Step 2: Check Classification
The sync should log: `🔍 Classified email from john.lasanajak@gmail.com: networking=true/false`
- If `networking=false`, that's why no contact was created
- If `networking=true`, contact should be created

### Step 3: Check Contact Creation
The sync should log: `➕ Creating new Gmail contact: john.lasanajak@gmail.com`
- If you don't see this, contact wasn't created
- Check for errors in logs

### Step 4: Check Sync to Main Contacts
The sync should log: `📧 Found X Gmail contacts...`
- If X doesn't include `john.lasanajak@gmail.com`, it's not in `gmail_contacts` table
- Check `gmail_contacts` table directly

## Manual Test

### Test 1: Check if Email Exists in Gmail
1. Go to Gmail
2. Search for: `from:john.lasanajak@gmail.com`
3. Check if email is in Primary category
4. Check email date (is it recent?)

### Test 2: Check Database Directly
Run the SQL queries above to see:
- If email was processed
- If contact was created
- If thread was created
- If message was stored

### Test 3: Check Render Logs
Look for:
- `📬 Fetched X messages...` (should be > 0)
- `🔍 Classified email from...` (should show john.lasanajak@gmail.com)
- `➕ Creating new Gmail contact...` (should show if networking)
- Any error messages

## Most Likely Issues

1. **Email not in Primary category** - Gmail filters it to Promotions/Social
2. **Email too old** - Only fetches 50 most recent messages
3. **Not classified as networking** - LLM thinks it's not networking-related
4. **Already processed** - Message was in previous sync, skipped

## Next Steps

1. Run the SQL queries above to check database state
2. Check Gmail to see if email is in Primary category
3. Check Render logs for the new detailed logging (after deployment)
4. Share the SQL query results so we can see what's in the database

