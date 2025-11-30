#!/usr/bin/env python3
"""
Migration script to add has_public_profile column to users table.
Run this once to update the database schema.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///networking.db")

def migrate():
    """Add has_public_profile column to users table if it doesn't exist."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        if "postgresql" in DATABASE_URL.lower():
            # PostgreSQL
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='has_public_profile'
            """))
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                print("Adding has_public_profile column to users table...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN has_public_profile BOOLEAN NOT NULL DEFAULT FALSE
                """))
                conn.commit()
                print("✅ Successfully added has_public_profile column")
            else:
                print("✅ has_public_profile column already exists")
        else:
            # SQLite
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'has_public_profile' not in columns:
                print("Adding has_public_profile column to users table...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN has_public_profile BOOLEAN NOT NULL DEFAULT 0
                """))
                conn.commit()
                print("✅ Successfully added has_public_profile column")
            else:
                print("✅ has_public_profile column already exists")

if __name__ == "__main__":
    try:
        migrate()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

