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

from models.database_functions import get_session, User, Contact
from services.service_api import create_contact, update_contact_service
from sqlalchemy import text, select

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
        # Try multiple import strategies
        plugin_imported = False
        import_error_messages = []
        
        # Strategy 1: Try relative import (same package)
        try:
            from .gmail_processor import process_message
            from .gmail_client import fetch_recent_messages
            plugin_imported = True
            print("✅ Imported Gmail plugin from relative imports")
        except ImportError as e:
            import_error_messages.append(f"Relative import failed: {e}")
            
            # Strategy 2: Try absolute import from services package
            try:
                from services.gmail_processor import process_message
                from services.gmail_client import fetch_recent_messages
                plugin_imported = True
                print("✅ Imported Gmail plugin from services package")
            except ImportError as e2:
                import_error_messages.append(f"Services package import failed: {e2}")
                
                # Strategy 3: Try direct import (same directory)
                try:
                    from gmail_processor import process_message
                    from gmail_client import fetch_recent_messages
                    plugin_imported = True
                    print("✅ Imported Gmail plugin from direct imports")
                except ImportError as e3:
                    import_error_messages.append(f"Direct import failed: {e3}")
                    
                    # Strategy 4: Try importing from GmailPluginRoot/automation (for local dev)
                    import sys
                    from pathlib import Path
                    
                    plugin_paths = [
                        Path(__file__).parent.parent.parent / "GmailPluginRoot" / "automation",
                        Path(__file__).parent.parent / "GmailPluginRoot" / "automation",
                    ]
                    
                    for plugin_path in plugin_paths:
                        if plugin_path.exists() and str(plugin_path) not in sys.path:
                            sys.path.insert(0, str(plugin_path))
                            try:
                                from processor import process_message
                                from gmail_client import fetch_recent_messages
                                plugin_imported = True
                                print(f"✅ Imported Gmail plugin from {plugin_path}")
                                break
                            except ImportError as e4:
                                import_error_messages.append(f"GmailPluginRoot import failed: {e4}")
                                continue
        
        if not plugin_imported:
            error_msg = "Gmail plugin modules not found. Import attempts:\n" + "\n".join(import_error_messages)
            print(f"❌ {error_msg}")
            return {"success": False, "error": "Gmail plugin modules not found. Please ensure Gmail plugin files are in backend/services/ or GmailPluginRoot/automation exists."}
        
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
        
        # Sync Gmail contacts to main contacts table
        try:
            _sync_gmail_contacts_to_main_contacts(user_id)
        except Exception as e:
            print(f"Warning: Failed to sync Gmail contacts to main contacts: {e}")
            errors.append(f"Contact sync error: {str(e)}")
        
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


def _sync_gmail_contacts_to_main_contacts(user_id: int):
    """
    Sync Gmail contacts to main contacts table.
    Creates or updates contacts in the main contacts table based on Gmail contacts.
    """
    try:
        with get_session() as session:
            # Get all Gmail contacts for this user
            gmail_contacts_result = session.execute(
                text("""
                    SELECT email, name, last_contact_ts
                    FROM gmail_contacts
                    WHERE user_id = :user_id
                    ORDER BY last_contact_ts DESC
                """),
                {"user_id": user_id}
            )
            gmail_contacts = gmail_contacts_result.fetchall()
            
            if not gmail_contacts:
                print(f"No Gmail contacts found for user {user_id}")
                return
            
            # Get existing main contacts for this user (by email)
            existing_contacts_result = session.execute(
                select(Contact).where(Contact.user_id == user_id)
            )
            existing_contacts = {c.email.lower(): c for c in existing_contacts_result.scalars().all() if c.email}
            
            # Get Gmail threads to link thread_id to contacts
            threads_result = session.execute(
                text("""
                    SELECT DISTINCT contact_email, thread_id
                    FROM gmail_threads
                    WHERE user_id = :user_id AND is_networking = true
                """),
                {"user_id": user_id}
            )
            thread_map = {row[0].lower(): row[1] for row in threads_result.fetchall() if row[0]}
            
            synced_count = 0
            created_count = 0
            updated_count = 0
            
            for gmail_email, gmail_name, last_contact_ts in gmail_contacts:
                if not gmail_email:
                    continue
                
                email_lower = gmail_email.lower()
                gmail_thread_id = thread_map.get(email_lower)
                
                # Convert timestamp to date if available
                last_interaction_date = None
                if last_contact_ts:
                    try:
                        last_interaction_date = datetime.fromtimestamp(last_contact_ts / 1000).date().isoformat()
                    except:
                        pass
                
                # Check if contact already exists
                if email_lower in existing_contacts:
                    # Update existing contact
                    existing_contact = existing_contacts[email_lower]
                    update_data = {}
                    
                    # Update name if Gmail has a better name
                    if gmail_name and gmail_name.strip() and (not existing_contact.name or existing_contact.name.strip() == ""):
                        update_data["name"] = gmail_name.strip()
                    
                    # Update gmail_thread_id if we have one
                    if gmail_thread_id and not existing_contact.gmail_thread_id:
                        update_data["gmail_thread_id"] = gmail_thread_id
                    
                    # Update last_interaction_date if newer
                    if last_interaction_date:
                        if not existing_contact.last_interaction_date or (
                            existing_contact.last_interaction_date and 
                            datetime.fromisoformat(last_interaction_date) > existing_contact.last_interaction_date
                        ):
                            update_data["last_interaction_date"] = last_interaction_date
                    
                    if update_data:
                        try:
                            update_contact_service(
                                contact_id=existing_contact.contact_id,
                                user_id=user_id,
                                **update_data
                            )
                            updated_count += 1
                        except Exception as e:
                            print(f"Error updating contact {existing_contact.contact_id}: {e}")
                else:
                    # Create new contact
                    try:
                        contact_dict = create_contact(
                            user_id=user_id,
                            name=gmail_name.strip() if gmail_name and gmail_name.strip() else gmail_email.split("@")[0],
                            email=gmail_email,
                            category="Professional",  # Default category
                        )
                        
                        # Update with Gmail-specific fields if needed
                        if gmail_thread_id or last_interaction_date:
                            update_contact_service(
                                contact_id=contact_dict["contact_id"],
                                user_id=user_id,
                                gmail_thread_id=gmail_thread_id,
                                last_interaction_date=last_interaction_date,
                            )
                        created_count += 1
                    except Exception as e:
                        print(f"Error creating contact for {gmail_email}: {e}")
                
                synced_count += 1
            
            print(f"✅ Synced {synced_count} Gmail contacts to main contacts (created: {created_count}, updated: {updated_count})")
            
    except Exception as e:
        print(f"Error syncing Gmail contacts to main contacts: {e}")
        raise

