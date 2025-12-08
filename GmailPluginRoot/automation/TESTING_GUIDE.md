# Testing the Gmail Plugin

## Prerequisites

1. ✅ **Ripple account with Gmail address**
   - You must have registered in Ripple with a Gmail address (`@gmail.com` or `@googlemail.com`)
   - The Gmail plugin will look up your account by email

2. ✅ **Gmail OAuth credentials**
   - The plugin folder has `client_secret_test.json`
   - If you need your own credentials, get them from: https://console.cloud.google.com/apis/credentials
   - Set `GOOGLE_CREDENTIALS_FILE` in `.env` if using different credentials

3. ✅ **OpenAI API key (optional)**
   - For email classification and summarization
   - Set `RIPPLE_OPENAI_API_KEY` in `.env`

## Quick Test

1. **Make sure you have a Ripple account with Gmail:**
   - Register/login at your Ripple app
   - Use a Gmail address for your account

2. **Run the plugin:**
   ```bash
   cd GmailPluginRoot/automation
   python3 main.py
   ```

3. **First run will:**
   - Open browser for Gmail OAuth authentication
   - Ask you to sign in with your Gmail account
   - Grant permissions to read Gmail
   - Save token to `token.json` (created automatically)
   - **The email is automatically determined from the account you authenticate with - you don't need to set it anywhere!**

4. **Plugin will then:**
   - Get your Gmail email address (from OAuth profile)
   - Validate it's a Gmail address
   - Look up your Ripple `user_id` based on that email
   - Start processing emails every 5 seconds (configurable)

## Using a Different Gmail Account

**To switch to a different Gmail account:**
1. Delete `token.json` in the `automation/` folder
2. Run `python3 main.py` again
3. Authenticate with the different Gmail account in the browser
4. The plugin will use that account's email automatically

## What to Expect

**Success output:**
```
Initializing Ripple networking tracker backend...
✅ Gmail plugin database schema initialized successfully.
Database initialized successfully.
Gmail authenticated.
Gmail account: your-email@gmail.com
✅ Linked to Ripple user_id: 1
Beginning polling loop...

Polling Gmail for new PRIMARY INBOX + SENT messages...
Poll complete. Processed 10 messages, tracked 3 networking email(s).
Sleeping for 5 seconds.
```

**If Gmail email doesn't match Ripple account:**
```
❌ No Ripple user found with email your-email@gmail.com.
   Please register a Ripple account with this Gmail address first.
```

## Troubleshooting

**"No such file or directory: client_secret_test.json"**
- The credentials file should be in `GmailPluginRoot/plugin/client_secret_test.json`
- Or set `GOOGLE_CREDENTIALS_FILE` in `.env`

**"No Ripple user found"**
- Make sure you registered in Ripple with the same Gmail address
- Check your Ripple account email matches your Gmail

**"Not a Gmail address"**
- Your Gmail account must be `@gmail.com` or `@googlemail.com`
- The plugin only works with Gmail accounts

## Viewing Results

After the plugin runs, check Supabase:
```sql
-- See your Gmail contacts
SELECT * FROM gmail_contacts WHERE user_id = YOUR_USER_ID;

-- See email threads
SELECT * FROM gmail_threads WHERE user_id = YOUR_USER_ID;

-- See message summaries
SELECT * FROM gmail_messages WHERE user_id = YOUR_USER_ID;
```

