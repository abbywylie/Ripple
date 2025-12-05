# Supabase Migration Guide

This guide will help you migrate your Ripple backend from Render PostgreSQL to Supabase.

## Overview

Supabase is a Firebase alternative that provides:
- **PostgreSQL Database** (same as current, but managed)
- **Built-in Authentication** (optional - you can keep JWT)
- **Real-time subscriptions** (bonus feature)
- **Storage** (for future file uploads)
- **Edge Functions** (for serverless functions)

## Migration Strategy

We'll migrate in phases to minimize downtime:

1. **Phase 1**: Set up Supabase project and database
2. **Phase 2**: Export data from Render PostgreSQL
3. **Phase 3**: Import data to Supabase
4. **Phase 4**: Update backend connection strings
5. **Phase 5**: Test and switch over
6. **Phase 6**: (Optional) Integrate Supabase Auth

---

## Phase 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `ripple-networking` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to provision (~2 minutes)

### 1.2 Get Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Save this for later

### 1.3 Get API Keys (Optional - for Supabase Auth)

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon/public key**: For client-side access
   - **service_role key**: For server-side access (keep secret!)

---

## Phase 2: Export Data from Render

### 2.1 Create Export Script

We'll use `pg_dump` to export your database. Run this locally or on Render:

```bash
# Install PostgreSQL client tools (if not installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Export database
pg_dump -h [RENDER-DB-HOST] \
        -U [RENDER-DB-USER] \
        -d [RENDER-DB-NAME] \
        -F c \
        -f ripple_backup.dump

# Or export as SQL (easier to inspect)
pg_dump -h [RENDER-DB-HOST] \
        -U [RENDER-DB-USER] \
        -d [RENDER-DB-NAME] \
        -f ripple_backup.sql
```

**Get Render DB credentials:**
1. Go to Render Dashboard → Your PostgreSQL Database
2. Go to **Info** tab
3. Copy:
   - **Internal Database URL** (for Render services)
   - **External Database URL** (for local access)

### 2.2 Alternative: Use Python Export Script

We've created `scripts/export_to_supabase.py` that will:
- Connect to Render database
- Export all tables to JSON/CSV
- Prepare data for Supabase import

---

## Phase 3: Import Data to Supabase

### 3.1 Create Tables in Supabase

**Option A: Let SQLAlchemy create tables (Recommended)**
- Just update `DATABASE_URL` to Supabase
- Run your app once - SQLAlchemy will create all tables
- Then import data

**Option B: Import schema manually**
- Use `pg_restore` or run SQL from export

### 3.2 Import Data

```bash
# Using pg_restore
pg_restore -h db.[PROJECT-REF].supabase.co \
           -U postgres \
           -d postgres \
           --clean \
           --if-exists \
           ripple_backup.dump

# Or using psql with SQL file
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
     < ripple_backup.sql
```

### 3.3 Verify Data

1. Go to Supabase Dashboard → **Table Editor**
2. Check that all tables exist:
   - `users`
   - `contacts`
   - `meetings`
   - `goals`
   - `interactions`
   - `public_profiles`
   - etc.
3. Verify row counts match

---

## Phase 4: Update Backend Configuration

### 4.1 Update Environment Variables

**On Render (Backend Service):**

1. Go to Render Dashboard → Your Backend Service
2. Go to **Environment** tab
3. Update `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Add Supabase keys (if using Supabase Auth):
   ```
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_KEY=[service_role key]
   ```

### 4.2 Update Connection Pool Settings

Supabase has connection limits. Update `backend/models/database_functions.py`:

```python
engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,        # Supabase free tier: max 60 connections
    max_overflow=10,    # Allow some overflow
)
```

### 4.3 Test Connection

```bash
# Test locally first
cd backend
python -c "from models.database_functions import get_session, User; print('Connected!')"
```

---

## Phase 5: Deploy and Test

### 5.1 Deploy to Render

1. Push changes to GitHub
2. Render will auto-deploy
3. Check logs for connection errors

### 5.2 Run Smoke Tests

- [ ] Login works
- [ ] Contacts load
- [ ] Meetings load
- [ ] Public profiles work
- [ ] Recommendations work

---

## Phase 6: (Optional) Supabase Auth Integration

If you want to use Supabase Auth instead of JWT:

### 6.1 Install Supabase Client

```bash
cd backend
pip install supabase
```

### 6.2 Update Authentication

See `SUPABASE_AUTH_MIGRATION.md` for detailed steps.

**Benefits:**
- Built-in email verification
- Password reset flows
- Social auth (Google, GitHub, etc.)
- Row-level security policies

**Trade-offs:**
- Need to migrate existing users
- Frontend changes required
- More complex initially

---

## Rollback Plan

If something goes wrong:

1. **Immediate**: Revert `DATABASE_URL` to Render PostgreSQL
2. **Data**: Render database is still intact (we only read from it)
3. **Deploy**: Render will auto-deploy the revert

---

## Post-Migration Checklist

- [ ] All tables migrated
- [ ] All data verified
- [ ] Backend connects to Supabase
- [ ] Frontend works with new backend
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] Update documentation
- [ ] Update team on new connection string

---

## Troubleshooting

### Connection Timeout

**Issue**: Can't connect to Supabase
**Fix**: 
- Check firewall rules in Supabase Dashboard
- Verify connection string format
- Check if IP is whitelisted (Supabase allows all by default)

### SSL Required

**Issue**: `SSL connection required`
**Fix**: Add `?sslmode=require` to connection string:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

### Connection Pool Exhausted

**Issue**: Too many connections
**Fix**: 
- Reduce `pool_size` in engine config
- Add connection pooling middleware
- Use Supabase connection pooler (recommended)

### Data Type Mismatches

**Issue**: Import errors due to type differences
**Fix**: 
- Check Supabase table editor for column types
- Run migration scripts to fix types
- Use `ALTER TABLE` commands if needed

---

## Next Steps After Migration

1. **Enable Row-Level Security** (RLS) for multi-tenant data
2. **Set up backups** in Supabase Dashboard
3. **Monitor usage** - Supabase free tier has limits
4. **Consider connection pooling** for better performance
5. **Explore Supabase features**:
   - Real-time subscriptions for live updates
   - Storage for file uploads
   - Edge Functions for serverless logic

---

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Migration Help](https://supabase.com/docs/guides/migrations)

