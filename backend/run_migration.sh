#!/bin/bash
# Script to run the migration using psql

# Your database URL (update this with your actual URL)
DB_URL="postgresql://ripple_database_469e_user:2XKQo0bY7xv0ueOwIwk305AecKhlzy6W@dpg-d44i8nripnbc73fulh30-a/ripple_database_469e"

echo "🚀 Running database migration..."
echo ""

# Run the migration SQL
psql "$DB_URL" << EOF
-- Add company_or_school column if it doesn't exist
DO \$\$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_or_school'
    ) THEN
        ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200);
        RAISE NOTICE 'Added company_or_school column';
    ELSE
        RAISE NOTICE 'company_or_school column already exists';
    END IF;
END \$\$;

-- Add role column if it doesn't exist
DO \$\$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(200);
        RAISE NOTICE 'Added role column';
    ELSE
        RAISE NOTICE 'role column already exists';
    END IF;
END \$\$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('company_or_school', 'role');
EOF

echo ""
echo "✅ Migration complete!"

