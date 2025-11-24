#!/usr/bin/env python3
"""
Quick script to check if a database URL is still accessible
"""

import os
import sys
from sqlalchemy import create_engine, text

# The old database URL
OLD_DB_URL = "postgresql://ripple_database_469e_user:2XKQo0bY7xv0ueOwIwk305AecKhlzy6W@dpg-d44i8nripnbc73fulh30-a/ripple_database_469e"

def check_database(url):
    """Try to connect to the database and check if it exists."""
    try:
        print(f"🔍 Attempting to connect to database...")
        print(f"   Host: dpg-d44i8nripnbc73fulh30-a")
        print(f"   Database: ripple_database_469e")
        print()
        
        engine = create_engine(url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Database is accessible!")
            print(f"   PostgreSQL version: {version}")
            
            # Check if users table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                );
            """))
            table_exists = result.fetchone()[0]
            
            if table_exists:
                print(f"✅ 'users' table exists")
                
                # Check columns
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    ORDER BY column_name;
                """))
                columns = [row[0] for row in result.fetchall()]
                print(f"   Columns: {', '.join(columns)}")
                
                # Check if new columns exist
                if 'company_or_school' in columns and 'role' in columns:
                    print(f"✅ Migration columns already exist!")
                else:
                    print(f"⚠️  Missing migration columns - need to run migration")
            else:
                print(f"⚠️  'users' table does not exist")
            
            return True
    except Exception as e:
        print(f"❌ Cannot connect to database: {e}")
        print()
        print("Possible reasons:")
        print("  1. Database was deleted or paused")
        print("  2. Database hostname changed (Render rotates these)")
        print("  3. Credentials expired")
        print("  4. Network/firewall issue")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Database Connection Check")
    print("=" * 60)
    print()
    
    if check_database(OLD_DB_URL):
        print()
        print("💡 If connection succeeded, you can:")
        print("   1. Update DATABASE_URL in Render environment variables")
        print("   2. Run the migration script to add missing columns")
    else:
        print()
        print("💡 Next steps:")
        print("   1. Check Render dashboard for archived/paused databases")
        print("   2. Create a new PostgreSQL database if needed")
        print("   3. Update DATABASE_URL in your backend service")

