-- Add auto_sync_enabled column to gmail_oauth_tokens table
-- Defaults to true (automatic sync enabled by default)

ALTER TABLE gmail_oauth_tokens 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gmail_oauth_auto_sync ON gmail_oauth_tokens(auto_sync_enabled);

