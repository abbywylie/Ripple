#!/usr/bin/env python3
"""
Export data from Render PostgreSQL to JSON/CSV for Supabase import.

Usage:
    python scripts/export_to_supabase.py

Environment Variables:
    SOURCE_DATABASE_URL: Render PostgreSQL connection string
    EXPORT_DIR: Directory to save exports (default: ./exports)
"""

import os
import sys
import json
import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Configuration
SOURCE_DATABASE_URL = os.getenv(
    "SOURCE_DATABASE_URL",
    os.getenv("DATABASE_URL", "sqlite:///./networking.db")
)
EXPORT_DIR = Path(os.getenv("EXPORT_DIR", "./exports"))
EXPORT_DIR.mkdir(exist_ok=True)

# Tables to export (in order to respect foreign keys)
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

def export_table_to_json(session, table_name: str) -> List[Dict[str, Any]]:
    """Export a table to a list of dictionaries."""
    try:
        result = session.execute(text(f"SELECT * FROM {table_name}"))
        columns = result.keys()
        rows = []
        for row in result:
            row_dict = {}
            for col, val in zip(columns, row):
                # Convert datetime/date objects to ISO strings
                if isinstance(val, datetime):
                    row_dict[col] = val.isoformat()
                elif hasattr(val, 'isoformat'):  # date objects
                    row_dict[col] = val.isoformat()
                else:
                    row_dict[col] = val
            rows.append(row_dict)
        return rows
    except Exception as e:
        print(f"⚠️  Error exporting {table_name}: {e}")
        return []

def export_table_to_csv(session, table_name: str, output_path: Path):
    """Export a table to CSV."""
    try:
        result = session.execute(text(f"SELECT * FROM {table_name}"))
        columns = result.keys()
        rows = list(result)
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            for row in rows:
                writer.writerow(row)
        return True
    except Exception as e:
        print(f"⚠️  Error exporting {table_name} to CSV: {e}")
        return False

def get_table_schema(session, table_name: str) -> Dict[str, Any]:
    """Get table schema information."""
    try:
        if "postgresql" in SOURCE_DATABASE_URL.lower():
            result = session.execute(text(f"""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """))
            return [dict(row._mapping) for row in result]
        else:
            # SQLite
            result = session.execute(text(f"PRAGMA table_info({table_name})"))
            return [{"column_name": row[1], "data_type": row[2], "is_nullable": not row[3]} for row in result]
    except Exception as e:
        print(f"⚠️  Error getting schema for {table_name}: {e}")
        return []

def main():
    print("🚀 Starting database export...")
    print(f"📊 Source: {SOURCE_DATABASE_URL.split('@')[-1] if '@' in SOURCE_DATABASE_URL else SOURCE_DATABASE_URL}")
    print(f"📁 Export directory: {EXPORT_DIR.absolute()}\n")
    
    # Create engine and session
    try:
        engine = create_engine(SOURCE_DATABASE_URL, echo=False)
        Session = sessionmaker(bind=engine)
        session = Session()
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)
    
    # Get all tables if not specified
    inspector = inspect(engine)
    all_tables = inspector.get_table_names()
    
    # Filter to only tables we care about
    tables_to_export = [t for t in TABLES_ORDER if t in all_tables]
    tables_to_export.extend([t for t in all_tables if t not in TABLES_ORDER])
    
    print(f"📋 Found {len(tables_to_export)} tables to export\n")
    
    # Export metadata
    metadata = {
        "export_date": datetime.utcnow().isoformat(),
        "source_database": SOURCE_DATABASE_URL.split('@')[-1] if '@' in SOURCE_DATABASE_URL else "local",
        "tables": {}
    }
    
    # Export each table
    total_rows = 0
    for table_name in tables_to_export:
        print(f"📤 Exporting {table_name}...", end=" ")
        
        # Export to JSON
        rows = export_table_to_json(session, table_name)
        json_path = EXPORT_DIR / f"{table_name}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(rows, f, indent=2, default=str)
        
        # Export to CSV
        csv_path = EXPORT_DIR / f"{table_name}.csv"
        export_table_to_csv(session, table_name, csv_path)
        
        # Get schema
        schema = get_table_schema(session, table_name)
        
        # Update metadata
        metadata["tables"][table_name] = {
            "row_count": len(rows),
            "columns": [col["column_name"] for col in schema],
            "schema": schema
        }
        
        total_rows += len(rows)
        print(f"✅ {len(rows)} rows")
    
    # Save metadata
    metadata_path = EXPORT_DIR / "metadata.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    # Create import script for Supabase
    import_script = EXPORT_DIR / "import_to_supabase.sql"
    with open(import_script, 'w', encoding='utf-8') as f:
        f.write("-- Supabase Import Script\n")
        f.write(f"-- Generated: {datetime.utcnow().isoformat()}\n\n")
        f.write("-- This script can be used to import data into Supabase\n")
        f.write("-- Note: Tables should already exist (created by SQLAlchemy)\n\n")
        
        for table_name in tables_to_export:
            json_path = EXPORT_DIR / f"{table_name}.json"
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8') as json_file:
                    rows = json.load(json_file)
                    if rows:
                        # Get column names from first row
                        columns = list(rows[0].keys())
                        f.write(f"\n-- Import {table_name}\n")
                        f.write(f"TRUNCATE TABLE {table_name} CASCADE;\n\n")
                        
                        # Generate INSERT statements (batch of 100)
                        for i in range(0, len(rows), 100):
                            batch = rows[i:i+100]
                            f.write(f"-- Batch {i//100 + 1}\n")
                            for row in batch:
                                values = []
                                for col in columns:
                                    val = row.get(col)
                                    if val is None:
                                        values.append("NULL")
                                    elif isinstance(val, str):
                                        # Escape single quotes
                                        val = val.replace("'", "''")
                                        values.append(f"'{val}'")
                                    elif isinstance(val, bool):
                                        values.append("TRUE" if val else "FALSE")
                                    else:
                                        values.append(str(val))
                                
                                cols_str = ", ".join(columns)
                                vals_str = ", ".join(values)
                                f.write(f"INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str});\n")
                            f.write("\n")
    
    session.close()
    
    print(f"\n✅ Export complete!")
    print(f"📊 Total rows exported: {total_rows}")
    print(f"📁 Files saved to: {EXPORT_DIR.absolute()}")
    print(f"\n📝 Next steps:")
    print(f"   1. Review exported files in {EXPORT_DIR}")
    print(f"   2. Set up Supabase project (see SUPABASE_MIGRATION.md)")
    print(f"   3. Update DATABASE_URL to Supabase connection string")
    print(f"   4. Run SQLAlchemy to create tables in Supabase")
    print(f"   5. Import data using import_to_supabase.sql or JSON files")

if __name__ == "__main__":
    main()

