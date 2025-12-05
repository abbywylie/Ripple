# Supabase Migration Quick Start

## 🚀 Quick Migration Steps

### 1. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → Create Project
2. Copy **Connection String** from Settings → Database → Connection string → URI
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 2. Export Current Data (10 minutes)

```bash
# Set your Render database URL
export SOURCE_DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Run export script
cd /Users/jlasa/Documents/RippleTotal/Ripple
python scripts/export_to_supabase.py

# Check exports
ls -lh exports/
```

### 3. Create Tables in Supabase (2 minutes)

**Option A: Let SQLAlchemy create them (Easiest)**
```bash
# Temporarily set DATABASE_URL to Supabase
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run your app once - it will create all tables
cd backend
python -c "from models.database_functions import engine; print('Tables created!')"
```

**Option B: Import schema manually**
- Use `pg_dump` to export schema only from Render
- Import to Supabase

### 4. Import Data (5 minutes)

```bash
# Set Supabase connection
export TARGET_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Import data
python scripts/import_to_supabase.py
```

### 5. Update Render Environment (2 minutes)

1. Go to Render Dashboard → Your Backend Service
2. Environment tab → Update `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Render will auto-deploy

### 6. Verify (5 minutes)

- [ ] Login works
- [ ] Contacts load
- [ ] Data matches (row counts)
- [ ] No errors in logs

**Total Time: ~30 minutes**

---

## 🔧 Troubleshooting

### Connection Issues

**SSL Required Error:**
- Add `?sslmode=require` to connection string
- Or use connection pooler (recommended)

**Connection Pool Exhausted:**
- Use Supabase connection pooler URL instead
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Data Import Issues

**Foreign Key Violations:**
- Make sure tables are imported in order (script handles this)
- Check that parent records exist before child records

**Type Mismatches:**
- Verify column types in Supabase Dashboard
- Run `ALTER TABLE` if needed

---

## 📚 Full Documentation

See [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for detailed guide.

