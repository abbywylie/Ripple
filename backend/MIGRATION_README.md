# Database Migration Guide

## Problem
The database is missing the new `company_or_school` and `role` columns in the `users` table, causing errors when trying to login or access user data.

## Solution Options

### Option 1: Run SQL Script in Render Dashboard (Recommended)

1. Go to your Render dashboard
2. Navigate to your PostgreSQL database
3. Click on "Connect" or "Shell" to open a database console
4. Copy and paste the contents of `migration_add_user_fields.sql`
5. Execute the SQL script

### Option 2: Run Python Migration Script

If you have access to the Render shell or can SSH into your deployment:

```bash
cd backend
python migrate_add_user_fields.py
```

### Option 3: Manual SQL Commands

If you prefer to run commands manually, connect to your PostgreSQL database and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_or_school VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(200);
```

**Note:** The `IF NOT EXISTS` syntax might not work in all PostgreSQL versions. If you get an error, use the SQL script in `migration_add_user_fields.sql` which includes proper checks.

## Verification

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('company_or_school', 'role');
```

You should see both columns listed.

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS company_or_school;
ALTER TABLE users DROP COLUMN IF EXISTS role;
```

