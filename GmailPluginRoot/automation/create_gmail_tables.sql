-- Gmail Plugin Tables for Supabase
-- Run this in Supabase SQL Editor to create the Gmail plugin tables

-- Gmail Contacts Table
CREATE TABLE IF NOT EXISTS gmail_contacts (
    email VARCHAR(255),
    user_id INTEGER NOT NULL,
    name VARCHAR(200),
    last_contact_ts BIGINT DEFAULT 0,  -- Gmail timestamps are in milliseconds (requires BIGINT)
    
    -- Checklist flags
    has_reached_out BOOLEAN DEFAULT FALSE,
    has_contact_responded BOOLEAN DEFAULT FALSE,
    has_scheduled_meeting BOOLEAN DEFAULT FALSE,
    awaiting_reply_from_user BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (email, user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Gmail Threads Table
CREATE TABLE IF NOT EXISTS gmail_threads (
    thread_id VARCHAR(500),
    user_id INTEGER NOT NULL,
    contact_email VARCHAR(255),
    subject TEXT,
    
    -- LLM networking classification
    is_networking BOOLEAN NOT NULL,
    
    first_message_ts BIGINT,  -- Gmail timestamps are in milliseconds (requires BIGINT)
    last_updated_ts BIGINT,  -- Gmail timestamps are in milliseconds (requires BIGINT)
    
    -- Meeting flag
    meeting_scheduled BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (thread_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    -- Note: contact_email foreign key removed - composite FK requires both columns to match
    -- We'll handle contact_email validation in application code
);

-- Gmail Messages Table
CREATE TABLE IF NOT EXISTS gmail_messages (
    gmail_id VARCHAR(500),
    user_id INTEGER NOT NULL,
    thread_id VARCHAR(500),
    contact_email VARCHAR(255),
    timestamp BIGINT DEFAULT 0,  -- Gmail timestamps are in milliseconds (requires BIGINT)
    direction VARCHAR(20),  -- "sent" or "received"
    summary TEXT,
    
    PRIMARY KEY (gmail_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    -- Note: Composite foreign keys removed - PostgreSQL requires exact column match
    -- We'll handle thread_id and contact_email validation in application code
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gmail_contacts_user_id ON gmail_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_thread_id ON gmail_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_user_id ON gmail_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_contact_email ON gmail_messages(contact_email);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_timestamp ON gmail_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_user_id ON gmail_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_contact_email ON gmail_threads(contact_email);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_is_networking ON gmail_threads(is_networking);

