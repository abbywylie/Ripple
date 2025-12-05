-- =====================================================
-- Ripple Database Schema for Supabase
-- =====================================================
-- Run this script in Supabase SQL Editor to create all tables
-- Order matters: tables are created in dependency order
-- =====================================================

-- Drop existing tables if they exist (in reverse dependency order)
-- WARNING: This will delete all data! Only run if starting fresh.
-- Uncomment the following lines if you want to drop existing tables:
/*
DROP TABLE IF EXISTS synced_events CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS goal_steps CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS public_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
*/

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    company_or_school VARCHAR(200),
    role VARCHAR(200),
    experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'experienced'
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    has_public_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. PUBLIC_PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    school VARCHAR(200),
    role VARCHAR(200),
    industry_tags TEXT, -- Comma-separated string
    contact_method VARCHAR(50), -- 'email' or 'linkedin'
    contact_info VARCHAR(500), -- Email address or LinkedIn URL
    visibility BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_public_profiles_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Index on user_id (already unique, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_public_profiles_user_id ON public_profiles(user_id);
-- Index on visibility for filtering public profiles
CREATE INDEX IF NOT EXISTS idx_public_profiles_visibility ON public_profiles(visibility);

-- =====================================================
-- 3. CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
    contact_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    company VARCHAR(200),
    job_title VARCHAR(200),
    category VARCHAR(100) DEFAULT 'Professional', -- Professional, Personal, Academic, etc.
    date_first_meeting DATE,
    date_next_follow_up DATE,
    date_created DATE NOT NULL,
    -- Relationship tracking fields
    relationship_stage VARCHAR(100), -- e.g., "Outreach Sent", "Meeting Scheduled"
    timeline TEXT, -- JSON string of timeline stages
    gmail_thread_id VARCHAR(500), -- For future Gmail plugin integration
    last_interaction_date DATE, -- Last touchpoint date
    CONSTRAINT fk_contacts_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_date_next_follow_up ON contacts(date_next_follow_up);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction_date ON contacts(last_interaction_date);

-- =====================================================
-- 4. MEETINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
    meeting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    meeting_date DATE,
    start_time TIME,
    end_time TIME,
    meeting_type VARCHAR(100),
    location VARCHAR(200),
    meeting_notes TEXT,
    thank_you BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_meetings_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_meetings_contact 
        FOREIGN KEY (contact_id) 
        REFERENCES contacts(contact_id) 
        ON DELETE CASCADE
);

-- Indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings(meeting_date);

-- =====================================================
-- 5. GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value INTEGER NOT NULL, -- The number to achieve (e.g., 10 contacts)
    current_value INTEGER NOT NULL DEFAULT 0, -- Current progress (e.g., 7)
    deadline DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'In Progress', -- In Progress, Completed, etc.
    date_created DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_goals_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- =====================================================
-- 6. GOAL_STEPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_steps (
    step_id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0, -- For ordering steps
    CONSTRAINT fk_goal_steps_goal 
        FOREIGN KEY (goal_id) 
        REFERENCES goals(goal_id) 
        ON DELETE CASCADE
);

-- Indexes for goal_steps
CREATE INDEX IF NOT EXISTS idx_goal_steps_goal_id ON goal_steps(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_steps_order_index ON goal_steps(goal_id, order_index);

-- =====================================================
-- 7. INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'text', 'other'
    interaction_date DATE DEFAULT CURRENT_DATE,
    interaction_time TIME,
    subject VARCHAR(500),
    content TEXT, -- For emails this could be the email content, for calls the notes
    tag VARCHAR(100), -- Tag to categorize the interaction
    direction VARCHAR(20) NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound', 'mutual'
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interactions_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_interactions_contact 
        FOREIGN KEY (contact_id) 
        REFERENCES contacts(contact_id) 
        ON DELETE CASCADE
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_interaction_date ON interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date ON interactions(follow_up_date);

-- =====================================================
-- 8. CALENDAR_INTEGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_integrations (
    integration_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(20) NOT NULL, -- 'google', 'outlook', 'icloud'
    access_token TEXT,
    refresh_token TEXT,
    calendar_id VARCHAR(500), -- External calendar ID
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendar_integrations_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Indexes for calendar_integrations
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(provider);

-- =====================================================
-- 9. SYNCED_EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synced_events (
    sync_id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL,
    integration_id INTEGER NOT NULL,
    external_event_id VARCHAR(500) NOT NULL, -- Event ID in external calendar
    last_modified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_synced_events_meeting 
        FOREIGN KEY (meeting_id) 
        REFERENCES meetings(meeting_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_synced_events_integration 
        FOREIGN KEY (integration_id) 
        REFERENCES calendar_integrations(integration_id) 
        ON DELETE CASCADE
);

-- Indexes for synced_events
CREATE INDEX IF NOT EXISTS idx_synced_events_meeting_id ON synced_events(meeting_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_integration_id ON synced_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_external_event_id ON synced_events(external_event_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify tables were created:

-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- SELECT 
--     table_name,
--     (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public' 
--     AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

