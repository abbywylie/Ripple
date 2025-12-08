-- Gmail OAuth Tokens Table
-- Stores OAuth tokens for each user's Gmail integration

CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
    user_id INTEGER NOT NULL PRIMARY KEY,
    tokens_json TEXT NOT NULL,  -- JSON string containing all OAuth token data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_sync_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gmail_oauth_tokens_user_id ON gmail_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_oauth_tokens_last_sync ON gmail_oauth_tokens(last_sync_at);

