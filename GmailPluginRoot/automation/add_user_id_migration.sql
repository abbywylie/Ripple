-- Migration: Add user_id to Gmail plugin tables for multi-user support
-- Run this AFTER create_gmail_tables.sql

-- Add user_id column to gmail_contacts
ALTER TABLE gmail_contacts 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add user_id column to gmail_threads
ALTER TABLE gmail_threads 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add user_id column to gmail_messages
ALTER TABLE gmail_messages 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraints to link to main users table
ALTER TABLE gmail_contacts 
ADD CONSTRAINT fk_gmail_contacts_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE gmail_threads 
ADD CONSTRAINT fk_gmail_threads_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE gmail_messages 
ADD CONSTRAINT fk_gmail_messages_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gmail_contacts_user_id ON gmail_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_user_id ON gmail_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_user_id ON gmail_messages(user_id);

-- Make user_id NOT NULL after adding it (optional - can be done in a second migration)
-- For now, we'll allow NULL during migration, then enforce NOT NULL in code

