#!/usr/bin/env python3
"""
Import exported data from JSON files into Supabase.

Usage:
    python scripts/import_to_supabase.py

Environment Variables:
    TARGET_DATABASE_URL: Supabase PostgreSQL connection string
    EXPORT_DIR: Directory with exported JSON files (default: ./exports)
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuration
TARGET_DATABASE_URL = os.getenv(
    "TARGET_DATABASE_URL",
    os.getenv("DATABASE_URL", "sqlite:///./networking.db")
)
EXPORT_DIR = Path(os.getenv("EXPORT_DIR", "./exports"))

# Tables to import (in order to respect foreign keys)
TABLES_ORDER = [
    "users",
    "public_profiles",
    "contacts",
    "meetings",
    "goals",
    "goal_steps",
    "interactions",
    "calendar_integrations",
    "synced_events",
    "reminders",
]

def import_table_from_json(session, table_name: str, rows: List[Dict[str, Any]], truncate: bool = True) -> int:
    """Import rows into a table."""
    if not rows:
        return 0
    
    try:
        # Truncate table if requested
        if truncate:
            session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
            session.commit()
        
        # Get column names from first row
        columns = list(rows[0].keys())
        
        # Build INSERT statement
        cols_str = ", ".join(columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        insert_stmt = text(f"INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders})")
        
        # Convert rows to dict format for SQLAlchemy
        import_rows = []
        for row in rows:
            import_row = {}
            for col in columns:
                val = row.get(col)
                # Convert ISO date strings back to dates if needed
                # SQLAlchemy will handle the conversion
                import_row[col] = val
            import_rows.append(import_row)
        
        # Insert in batches
        batch_size = 100
        total_inserted = 0
        for i in range(0, len(import_rows), batch_size):
            batch = import_rows[i:i+batch_size]
            session.execute(insert_stmt, batch)
            session.commit()
            total_inserted += len(batch)
        
        return total_inserted
    except Exception as e:
        session.rollback()
        print(f"⚠️  Error importing {table_name}: {e}")
        raise

def main():
    print("🚀 Starting database import to Supabase...")
    print(f"📊 Target: {TARGET_DATABASE_URL.split('@')[-1] if '@' in TARGET_DATABASE_URL else TARGET_DATABASE_URL}")
    print(f"📁 Export directory: {EXPORT_DIR.absolute()}\n")
    
    if not EXPORT_DIR.exists():
        print(f"❌ Export directory not found: {EXPORT_DIR}")
        print("   Run export_to_supabase.py first!")
        sys.exit(1)
    
    # Check for metadata
    metadata_path = EXPORT_DIR / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        print(f"📋 Export date: {metadata.get('export_date', 'unknown')}")
        print(f"📊 Tables in export: {len(metadata.get('tables', {}))}\n")
    
    # Create engine and session
    try:
        engine = create_engine(TARGET_DATABASE_URL, echo=False)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Test connection
        session.execute(text("SELECT 1"))
        print("✅ Connected to Supabase\n")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        print("\n💡 Make sure:")
        print("   1. Supabase project is set up")
        print("   2. DATABASE_URL is set correctly")
        print("   3. Tables exist in Supabase (run SQLAlchemy first)")
        sys.exit(1)
    
    # Import tables in order
    total_imported = 0
    for table_name in TABLES_ORDER:
        json_path = EXPORT_DIR / f"{table_name}.json"
        
        if not json_path.exists():
            print(f"⏭️  Skipping {table_name} (file not found)")
            continue
        
        print(f"📥 Importing {table_name}...", end=" ")
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                rows = json.load(f)
            
            if not rows:
                print("✅ 0 rows (empty)")
                continue
            
            # Import data
            imported = import_table_from_json(session, table_name, rows, truncate=True)
            total_imported += imported
            print(f"✅ {imported} rows")
            
        except Exception as e:
            print(f"❌ Failed: {e}")
            print(f"   Continuing with other tables...")
            continue
    
    session.close()
    
    print(f"\n✅ Import complete!")
    print(f"📊 Total rows imported: {total_imported}")
    print(f"\n📝 Next steps:")
    print(f"   1. Verify data in Supabase Dashboard → Table Editor")
    print(f"   2. Test your application")
    print(f"   3. Update Render environment variables")

if __name__ == "__main__":
    main()

