# Supabase Schema Setup Guide

## Quick Steps

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and Paste the SQL**
   - Open `scripts/create_supabase_schema.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor

3. **Run the Script**
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Wait for "Success. No rows returned" message

4. **Verify Tables Were Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see 9 tables:
     - `users`
     - `public_profiles`
     - `contacts`
     - `meetings`
     - `goals`
     - `goal_steps`
     - `interactions`
     - `calendar_integrations`
     - `synced_events`

## What the Script Creates

✅ **9 Tables** with all columns and data types
✅ **Foreign Keys** with CASCADE deletes
✅ **Indexes** for performance
✅ **Default Values** for required fields
✅ **Constraints** (unique, not null, etc.)

## Important Notes

- **Order Matters**: Tables are created in dependency order (users first, then contacts, etc.)
- **No Data Loss**: The script uses `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- **Foreign Keys**: All relationships have `ON DELETE CASCADE` to maintain data integrity
- **Indexes**: Created for commonly queried columns (user_id, email, dates, etc.)

## If You Need to Start Fresh

If you want to drop all tables and recreate (⚠️ **WILL DELETE ALL DATA**):

1. Uncomment the `DROP TABLE` statements at the top of the SQL file
2. Run the script
3. Comment them back out for future runs

## Next Steps

After creating the schema:

1. ✅ Tables are ready
2. 📥 Import your data using `scripts/import_to_supabase.py`
3. 🔗 Update your `DATABASE_URL` in Render environment variables
4. 🚀 Deploy and test!

## Troubleshooting

**Error: "relation already exists"**
- Tables already exist - this is fine! The script uses `IF NOT EXISTS`
- If you want to recreate, drop tables first (see above)

**Error: "permission denied"**
- Make sure you're using the correct database user
- Supabase admin user should have all permissions

**Missing tables after running**
- Check the SQL Editor output for errors
- Verify you're in the correct database/project
- Check Supabase logs for details

