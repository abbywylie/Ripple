-- Migration script to add company_or_school and role columns to users table
-- Run this in your Render PostgreSQL database console or via psql

-- Check if columns exist before adding (PostgreSQL)
DO $$ 
BEGIN
    -- Add company_or_school column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_or_school'
    ) THEN
        ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200);
        RAISE NOTICE 'Added company_or_school column';
    ELSE
        RAISE NOTICE 'company_or_school column already exists';
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(200);
        RAISE NOTICE 'Added role column';
    ELSE
        RAISE NOTICE 'role column already exists';
    END IF;
END $$;

