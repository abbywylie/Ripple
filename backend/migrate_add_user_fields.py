#!/usr/bin/env python3
"""
Migration script to add company_or_school and role columns to users table.
Run this script once to update your production database schema.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from models.database_functions import DATABASE_URL

def migrate():
    """Add company_or_school and role columns to users table if they don't exist."""
    engine = create_engine(DATABASE_URL, echo=True)
    
    with engine.connect() as conn:
        # Check if columns already exist
        if DATABASE_URL.startswith("sqlite"):
            # SQLite
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='users'
            """))
            if not result.fetchone():
                print("❌ Users table does not exist. Please create it first.")
                return
            
            # Check if columns exist
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'company_or_school' not in columns:
                print("➕ Adding company_or_school column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200)"))
                conn.commit()
                print("✅ Added company_or_school column")
            else:
                print("✅ company_or_school column already exists")
            
            if 'role' not in columns:
                print("➕ Adding role column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(200)"))
                conn.commit()
                print("✅ Added role column")
            else:
                print("✅ role column already exists")
        
        else:
            # PostgreSQL
            # Check if columns exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name IN ('company_or_school', 'role')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            
            if 'company_or_school' not in existing_columns:
                print("➕ Adding company_or_school column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN company_or_school VARCHAR(200)"))
                conn.commit()
                print("✅ Added company_or_school column")
            else:
                print("✅ company_or_school column already exists")
            
            if 'role' not in existing_columns:
                print("➕ Adding role column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(200)"))
                conn.commit()
                print("✅ Added role column")
            else:
                print("✅ role column already exists")
    
    print("\n🎉 Migration completed successfully!")

if __name__ == "__main__":
    print("🚀 Starting migration to add company_or_school and role columns...")
    print(f"📊 Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}\n")
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)

