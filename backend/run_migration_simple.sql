-- Simple SQL migration - copy and paste this entire file into your database console
-- Or use: psql "your-database-url" < run_migration_simple.sql

-- Add company_or_school column
ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200);

-- Add role column  
ALTER TABLE users ADD COLUMN role VARCHAR(200);

-- Verify (optional - just to check it worked)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('company_or_school', 'role');

