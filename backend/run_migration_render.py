#!/usr/bin/env python3
"""
Migration script to run in Render shell
Run this from Render's shell/terminal: python run_migration_render.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from models.database_functions import engine

print("🚀 Starting database migration...")
print()

try:
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('company_or_school', 'role')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        added_columns = []
        
        if 'company_or_school' not in existing_columns:
            print("➕ Adding company_or_school column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200)"))
            conn.commit()
            added_columns.append('company_or_school')
            print("✅ Added company_or_school column")
        else:
            print("✅ company_or_school column already exists")
        
        if 'role' not in existing_columns:
            print("➕ Adding role column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(200)"))
            conn.commit()
            added_columns.append('role')
            print("✅ Added role column")
        else:
            print("✅ role column already exists")
        
        # Verify
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('company_or_school', 'role')
            ORDER BY column_name
        """))
        columns = result.fetchall()
        
        print()
        print("📊 Verification:")
        for col_name, col_type in columns:
            print(f"   ✅ {col_name} ({col_type})")
        
        if added_columns:
            print()
            print(f"🎉 Successfully added: {', '.join(added_columns)}")
        else:
            print()
            print("✅ All columns already exist - no migration needed")
            
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

