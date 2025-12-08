# Gmail Plugin - Supabase Integration Setup

This guide explains how to connect the Gmail plugin to your Supabase database.

## Prerequisites

1. Supabase project with `DATABASE_URL` connection string
2. Python 3.8+ installed
3. Required Python packages (see `requirements.txt`)

## Step 1: Create Database Tables

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the SQL script from `create_gmail_tables.sql`:
   ```sql
   -- Copy and paste the entire contents of create_gmail_tables.sql
   ```
4. This will create three tables:
   - `gmail_contacts` - Stores contact information and checklist flags
   - `gmail_threads` - Stores email thread metadata
   - `gmail_messages` - Stores individual message summaries

## Step 2: Set Environment Variables

Set the following environment variables:

```bash
# Required: Supabase database connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Optional: Override default values
export GMAIL_USER_EMAIL="your-email@gmail.com"
export RIPPLE_OPENAI_API_KEY="your-openai-api-key"
export POLL_INTERVAL_SECONDS="5"
export MAX_MESSAGES_PER_POLL="10"
```

Or create a `.env` file in the `automation/` directory:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
GMAIL_USER_EMAIL=your-email@gmail.com
RIPPLE_OPENAI_API_KEY=your-openai-api-key
POLL_INTERVAL_SECONDS=5
MAX_MESSAGES_PER_POLL=10
```

## Step 3: Install Dependencies

```bash
cd GmailPluginRoot/automation
pip install -r requirements.txt
```

## Step 4: Initialize Database

Run the initialization script to create tables (if not already created via SQL):

```bash
python -c "from db import init_db; init_db()"
```

Or the tables will be created automatically on first run if using SQLAlchemy's `create_all()`.

## Step 5: Test Connection

You can test the database connection:

```bash
python -c "from db import get_session, GmailContact; session = next(get_session()); print('✅ Connected to Supabase!')"
```

## Troubleshooting

### Connection Issues

- **SSL Error**: If you get SSL connection errors, place a `prod-supabase.cer` certificate file in the `GmailPluginRoot/` or root `Ripple/` directory
- **Connection Timeout**: Make sure your `DATABASE_URL` is correct and accessible
- **Table Not Found**: Run the SQL script in `create_gmail_tables.sql` in Supabase SQL Editor

### Database URL Format

Make sure your `DATABASE_URL`:
- Starts with `postgresql://` (not `https://` or `postgres://`)
- Contains your actual password and project reference
- Points to the correct Supabase database

Example:
```
postgresql://postgres:YourPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Notes

- The Gmail plugin uses separate tables (`gmail_*`) from the main Ripple app tables
- This allows the plugin to work independently while sharing the same database
- Future integration can link `gmail_contacts` to main `contacts` table via email matching

