# gmail_sync_service.py
# Server-side Gmail sync service for Ripple backend

import os
import json
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from models.database_functions import get_session, User
from sqlalchemy import text

# Gmail API scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# OAuth2 client configuration
# These should be set as environment variables on Render
CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
# Redirect URI should point to backend, not frontend
BACKEND_URL = os.getenv("BACKEND_URL", "https://ripple-backend-6uou.onrender.com")
REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", f"{BACKEND_URL}/api/gmail/oauth/callback")

# Path to client secrets file (fallback if env vars not set)
CLIENT_SECRETS_FILE = os.getenv(
    "GOOGLE_CREDENTIALS_FILE",
    str(Path(__file__).parent.parent.parent / "GmailPluginRoot" / "plugin" / "client_secret_test.json")
)


def get_oauth_flow() -> Flow:
    """Create OAuth2 flow for Gmail authentication."""
    if CLIENT_ID and CLIENT_SECRET:
        # Use environment variables
        client_config = {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        }
        return Flow.from_client_config(client_config, SCOPES, redirect_uri=REDIRECT_URI)
    elif os.path.exists(CLIENT_SECRETS_FILE):
        # Use client secrets file
        return Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES, redirect_uri=REDIRECT_URI)
    else:
        raise ValueError("Gmail OAuth credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET or provide GOOGLE_CREDENTIALS_FILE")


def get_authorization_url(user_id: int, state: Optional[str] = None) -> str:
    """
    Generate OAuth authorization URL for user.
    
    Args:
        user_id: Ripple user ID
        state: Optional state parameter (can include user_id for verification)
    
    Returns:
        Authorization URL to redirect user to
    """
    flow = get_oauth_flow()
    
    # Include user_id in state for verification
    if not state:
        state = f"user_{user_id}"
    
    authorization_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state,
        prompt='consent'  # Force consent to get refresh token
    )
    
    return authorization_url


def handle_oauth_callback(code: str, state: str) -> Dict[str, Any]:
    """
    Handle OAuth callback and store tokens.
    
    Args:
        code: Authorization code from OAuth callback
        state: State parameter (should contain user_id)
    
    Returns:
        Dict with user_id and success status
    """
    try:
        # Extract user_id from state
        if state.startswith("user_"):
            user_id = int(state.replace("user_", ""))
        else:
            raise ValueError("Invalid state parameter")
        
        # Exchange code for tokens
        flow = get_oauth_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Store tokens in database
        store_gmail_tokens(
            user_id=user_id,
            token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_uri=credentials.token_uri,
            client_id=credentials.client_id,
            client_secret=credentials.client_secret,
            scopes=credentials.scopes
        )
        
        return {"success": True, "user_id": user_id}
    
    except Exception as e:
        print(f"Error handling OAuth callback: {e}")
        return {"success": False, "error": str(e)}


def store_gmail_tokens(
    user_id: int,
    token: str,
    refresh_token: Optional[str],
    token_uri: str,
    client_id: str,
    client_secret: str,
    scopes: list
):
    """Store Gmail OAuth tokens in database."""
    with get_session() as session:
        # Check if tokens already exist
        result = session.execute(
            text("SELECT user_id FROM gmail_oauth_tokens WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        existing = result.fetchone()
        
        tokens_json = json.dumps({
            "token": token,
            "refresh_token": refresh_token,
            "token_uri": token_uri,
            "client_id": client_id,
            "client_secret": client_secret,
            "scopes": scopes
        })
        
        if existing:
            # Update existing tokens
            session.execute(
                text("""
                    UPDATE gmail_oauth_tokens 
                    SET tokens_json = :tokens_json, updated_at = :updated_at
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "tokens_json": tokens_json,
                    "updated_at": datetime.utcnow()
                }
            )
        else:
            # Insert new tokens
            session.execute(
                text("""
                    INSERT INTO gmail_oauth_tokens (user_id, tokens_json, created_at, updated_at)
                    VALUES (:user_id, :tokens_json, :created_at, :updated_at)
                """),
                {
                    "user_id": user_id,
                    "tokens_json": tokens_json,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )


def get_gmail_credentials(user_id: int) -> Optional[Credentials]:
    """Get Gmail credentials for user from database."""
    with get_session() as session:
        result = session.execute(
            text("SELECT tokens_json FROM gmail_oauth_tokens WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        row = result.fetchone()
        
        if not row:
            return None
        
        tokens_data = json.loads(row[0])
        
        credentials = Credentials(
            token=tokens_data["token"],
            refresh_token=tokens_data.get("refresh_token"),
            token_uri=tokens_data["token_uri"],
            client_id=tokens_data["client_id"],
            client_secret=tokens_data["client_secret"],
            scopes=tokens_data["scopes"]
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                # Update stored token
                store_gmail_tokens(
                    user_id=user_id,
                    token=credentials.token,
                    refresh_token=credentials.refresh_token,
                    token_uri=credentials.token_uri,
                    client_id=credentials.client_id,
                    client_secret=credentials.client_secret,
                    scopes=credentials.scopes
                )
            except Exception as e:
                print(f"Error refreshing token for user {user_id}: {e}")
                return None
        
        return credentials


def get_gmail_service_for_user(user_id: int):
    """Get authenticated Gmail service for user."""
    credentials = get_gmail_credentials(user_id)
    if not credentials:
        raise ValueError(f"No Gmail credentials found for user {user_id}")
    
    return build("gmail", "v1", credentials=credentials)


def sync_gmail_for_user(user_id: int) -> Dict[str, Any]:
    """
    Sync Gmail messages for a user.
    This is the main function that processes emails and stores them in the database.
    
    Args:
        user_id: Ripple user ID
    
    Returns:
        Dict with sync status and statistics
    """
    try:
        # Get Gmail service
        service = get_gmail_service_for_user(user_id)
        
        # Get user's email from Ripple database
        with get_session() as session:
            user = session.get(User, user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            gmail_email = user.email.lower().strip()
        
        # Import Gmail plugin processing functions
        # Add parent directory to path to import plugin modules
        import sys
        from pathlib import Path
        
        # Try multiple paths for plugin modules
        plugin_paths = [
            Path(__file__).parent.parent.parent / "GmailPluginRoot" / "automation",
            Path(__file__).parent.parent / "GmailPluginRoot" / "automation",
        ]
        
        plugin_imported = False
        for plugin_path in plugin_paths:
            if plugin_path.exists() and str(plugin_path) not in sys.path:
                sys.path.insert(0, str(plugin_path))
                try:
                    from processor import process_message
                    from gmail_client import fetch_recent_messages
                    plugin_imported = True
                    break
                except ImportError:
                    continue
        
        if not plugin_imported:
            return {"success": False, "error": "Gmail plugin modules not found. Please ensure GmailPluginRoot/automation exists."}
        
        # Fetch recent messages
        messages = []
        
        # Fetch inbound-only from Primary category
        inbox_primary = fetch_recent_messages(
            service,
            label_ids=["INBOX"],
            query="category:primary",
        )
        
        # Fetch outbound messages from Sent
        sent_msgs = fetch_recent_messages(
            service,
            label_ids=["SENT"],
            query=None,
        )
        
        messages.extend(inbox_primary)
        messages.extend(sent_msgs)
        
        # Process messages
        networking_count = 0
        errors = []
        
        for msg in messages:
            try:
                if process_message(msg, user_id, gmail_email):
                    networking_count += 1
            except Exception as e:
                errors.append(str(e))
        
        # Update last sync time
        with get_session() as session:
            session.execute(
                text("""
                    UPDATE gmail_oauth_tokens 
                    SET last_sync_at = :last_sync_at
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "last_sync_at": datetime.utcnow()
                }
            )
        
        return {
            "success": True,
            "messages_processed": len(messages),
            "networking_messages": networking_count,
            "errors": errors[:5] if errors else []  # Limit error messages
        }
    
    except Exception as e:
        print(f"Error syncing Gmail for user {user_id}: {e}")
        return {"success": False, "error": str(e)}


def get_gmail_sync_status(user_id: int) -> Dict[str, Any]:
    """Get Gmail sync status for user."""
    with get_session() as session:
        result = session.execute(
            text("""
                SELECT tokens_json, last_sync_at, created_at
                FROM gmail_oauth_tokens
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
        row = result.fetchone()
        
        if not row:
            return {
                "connected": False,
                "last_sync": None
            }
        
        last_sync = row[1].isoformat() if row[1] else None
        
        return {
            "connected": True,
            "last_sync": last_sync,
            "connected_at": row[2].isoformat() if row[2] else None
        }

