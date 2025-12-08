-- Migration: Fix timestamp columns to use BIGINT instead of INTEGER
-- Gmail timestamps are in milliseconds and exceed INTEGER range (2.1 billion)
-- Run this in Supabase SQL Editor if tables already exist

-- Fix gmail_contacts.last_contact_ts
ALTER TABLE gmail_contacts 
ALTER COLUMN last_contact_ts TYPE BIGINT;

-- Fix gmail_threads timestamps
ALTER TABLE gmail_threads 
ALTER COLUMN first_message_ts TYPE BIGINT;

ALTER TABLE gmail_threads 
ALTER COLUMN last_updated_ts TYPE BIGINT;

-- Fix gmail_messages.timestamp
ALTER TABLE gmail_messages 
ALTER COLUMN timestamp TYPE BIGINT;

