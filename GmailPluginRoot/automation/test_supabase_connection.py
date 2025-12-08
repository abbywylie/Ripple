#!/usr/bin/env python3
"""Test script to verify Supabase connection for Gmail plugin."""

import os
from db import init_db, get_session, GmailContact, GmailThread, GmailMessage

def test_connection():
    """Test database connection and table creation."""
    print("🔍 Testing Supabase connection for Gmail plugin...\n")
    
    # Check if DATABASE_URL is set
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url or "sqlite" in db_url.lower():
        print("❌ DATABASE_URL not set or pointing to SQLite!")
        print("   Please set DATABASE_URL environment variable to your Supabase connection string.")
        print("   Example: export DATABASE_URL='postgresql://postgres:...@db....supabase.co:5432/postgres'")
        return False
    
    if "supabase" not in db_url.lower() and "postgresql" not in db_url.lower():
        print("⚠️  Warning: DATABASE_URL doesn't look like a Supabase/PostgreSQL URL")
    
    print(f"✅ DATABASE_URL is set: {db_url[:50]}...\n")
    
    try:
        # Initialize database (creates tables if they don't exist)
        print("📦 Initializing database schema...")
        init_db()
        print("✅ Database schema initialized\n")
        
        # Test connection by querying tables
        print("🔍 Testing database connection...")
        with get_session() as session:
            # Check if tables exist by trying to query them
            contact_count = session.query(GmailContact).count()
            thread_count = session.query(GmailThread).count()
            message_count = session.query(GmailMessage).count()
            
            print(f"✅ Successfully connected to Supabase!")
            print(f"   - gmail_contacts: {contact_count} records")
            print(f"   - gmail_threads: {thread_count} records")
            print(f"   - gmail_messages: {message_count} records")
            print("\n🎉 Gmail plugin is ready to connect to Supabase!")
            return True
            
    except Exception as e:
        print(f"\n❌ Connection test failed: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your DATABASE_URL is correct")
        print("2. Check that you ran create_gmail_tables.sql in Supabase SQL Editor")
        print("3. Ensure your Supabase database is accessible")
        return False

if __name__ == "__main__":
    test_connection()

