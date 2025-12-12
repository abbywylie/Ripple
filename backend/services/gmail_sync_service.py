# gmail_sync_service.py
# Server-side Gmail sync service for Ripple backend

import os
import json
import threading
import time
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
        
        # Add services directory to Python path to ensure imports work
        import sys
        from pathlib import Path
        services_dir = Path(__file__).parent
        if str(services_dir) not in sys.path:
            sys.path.insert(0, str(services_dir))
        
        # Strategy 1: Try direct import (same directory, most reliable)
        try:
            from gmail_processor import process_message
            from gmail_client import fetch_recent_messages
            plugin_imported = True
            print("✅ Imported Gmail plugin from direct imports")
        except ImportError as e:
            import_error_messages.append(f"Direct import failed: {e}")
            
            # Strategy 2: Try relative import (same package)
            try:
                from .gmail_processor import process_message
                from .gmail_client import fetch_recent_messages
                plugin_imported = True
                print("✅ Imported Gmail plugin from relative imports")
            except ImportError as e2:
                import_error_messages.append(f"Relative import failed: {e2}")
                
                # Strategy 3: Try absolute import from services package
                try:
                    from services.gmail_processor import process_message
                    from services.gmail_client import fetch_recent_messages
                    plugin_imported = True
                    print("✅ Imported Gmail plugin from services package")
                except ImportError as e3:
                    import_error_messages.append(f"Services package import failed: {e3}")
                    
                    # Strategy 4: Try importing from GmailPluginRoot/automation (for local dev)
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
        
        print(f"📬 Fetched {len(inbox_primary)} inbox messages and {len(sent_msgs)} sent messages (total: {len(messages)})")
        
        # Process messages
        networking_count = 0
        errors = []
        processed_emails = set()
        
        for msg in messages:
            try:
                # Extract email addresses from message for logging
                from_list = msg.get("from_list", []) or []
                to_list = msg.get("to_list", []) or []
                msg_emails = [e for _, e in from_list + to_list if e and e.lower() != gmail_email.lower()]
                if msg_emails:
                    processed_emails.add(msg_emails[0].lower())
                
                if process_message(msg, user_id, gmail_email):
                    networking_count += 1
                    print(f"  ✅ Processed networking message from/to: {', '.join(msg_emails[:2])}")
            except Exception as e:
                error_msg = str(e)
                errors.append(error_msg)
                print(f"  ❌ Error processing message: {error_msg}")
        
        print(f"📊 Processed {len(messages)} messages, found {networking_count} networking emails")
        print(f"📧 Unique email addresses seen: {len(processed_emails)}")
        if processed_emails:
            print(f"   Emails: {', '.join(list(processed_emails)[:5])}")
        
        # Sync Gmail contacts to main contacts table
        try:
            print(f"🔄 Starting Gmail contacts sync to main contacts for user {user_id}...")
            sync_result = _sync_gmail_contacts_to_main_contacts(user_id)
            print(f"✅ Gmail contacts sync completed: {sync_result}")
        except Exception as e:
            print(f"❌ Warning: Failed to sync Gmail contacts to main contacts: {e}")
            import traceback
            traceback.print_exc()
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
                SELECT tokens_json, last_sync_at, created_at, 
                       COALESCE(auto_sync_enabled, true) as auto_sync_enabled
                FROM gmail_oauth_tokens
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
        row = result.fetchone()
        
        if not row:
            return {
                "oauth_connected": False,
                "last_sync": None,
                "auto_sync_enabled": True
            }
        
        # Format timestamps with UTC timezone indicator
        # If datetime is timezone-naive, assume it's UTC and append 'Z'
        last_sync = None
        if row[1]:
            dt = row[1]
            if dt.tzinfo is None:
                # Timezone-naive datetime, assume UTC and append 'Z'
                last_sync = dt.isoformat() + 'Z'
            else:
                # Timezone-aware datetime, convert to UTC and append 'Z'
                last_sync = dt.astimezone(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
        
        connected_at = None
        if row[2]:
            dt = row[2]
            if dt.tzinfo is None:
                connected_at = dt.isoformat() + 'Z'
            else:
                connected_at = dt.astimezone(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
        
        auto_sync_enabled = row[3] if row[3] is not None else True
        
        return {
            "oauth_connected": True,
            "last_sync": last_sync,
            "connected_at": connected_at,
            "auto_sync_enabled": auto_sync_enabled
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
            
            print(f"📧 Found {len(gmail_contacts)} Gmail contacts for user {user_id}")
            
            if not gmail_contacts:
                print(f"⚠️  No Gmail contacts found for user {user_id} - nothing to sync")
                return {"synced": 0, "created": 0, "updated": 0}
            
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
                
                print(f"  🔍 Processing Gmail contact: {gmail_email} (name: {gmail_name})")
                
                # Convert timestamp to date if available
                last_interaction_date = None
                if last_contact_ts:
                    try:
                        last_interaction_date = datetime.fromtimestamp(last_contact_ts / 1000).date().isoformat()
                        print(f"     Last contact timestamp: {last_contact_ts} -> {last_interaction_date}")
                    except:
                        pass
                
                # Check if contact already exists
                if email_lower in existing_contacts:
                    print(f"  ✓ Contact already exists in main contacts table")
                    # Update existing contact
                    existing_contact = existing_contacts[email_lower]
                    update_data = {}
                    
                    print(f"     Existing contact ID: {existing_contact.contact_id}, name: {existing_contact.name}")
                    print(f"     Gmail thread_id: {gmail_thread_id}, existing gmail_thread_id: {existing_contact.gmail_thread_id}")
                    
                    # Update name if Gmail has a better name
                    if gmail_name and gmail_name.strip() and (not existing_contact.name or existing_contact.name.strip() == ""):
                        update_data["name"] = gmail_name.strip()
                        print(f"     Will update name to: {gmail_name.strip()}")
                    
                    # Update gmail_thread_id if we have one
                    if gmail_thread_id and not existing_contact.gmail_thread_id:
                        update_data["gmail_thread_id"] = gmail_thread_id
                        print(f"     Will update gmail_thread_id to: {gmail_thread_id}")
                    
                    # Update last_interaction_date if newer
                    if last_interaction_date:
                        # Convert to date for comparison
                        new_date = datetime.fromisoformat(last_interaction_date).date() if isinstance(last_interaction_date, str) else last_interaction_date
                        existing_date = existing_contact.last_interaction_date
                        
                        print(f"     New date: {new_date}, existing date: {existing_date}")
                        
                        if not existing_date or (new_date > existing_date):
                            update_data["last_interaction_date"] = last_interaction_date
                            print(f"     Will update last_interaction_date to: {last_interaction_date}")
                    
                    if update_data:
                        print(f"  🔄 Updating contact with: {update_data}")
                        try:
                            update_contact_service(
                                contact_id=existing_contact.contact_id,
                                user_id=user_id,
                                **update_data
                            )
                            updated_count += 1
                            print(f"  ✅ Updated contact {existing_contact.contact_id}")
                        except Exception as e:
                            print(f"  ❌ Error updating contact {existing_contact.contact_id}: {e}")
                            import traceback
                            traceback.print_exc()
                    else:
                        print(f"  ⚠️  No updates needed for contact {existing_contact.contact_id}")
                else:
                    # Create new contact
                    print(f"  ➕ Contact does NOT exist in main contacts - will create new one")
                    try:
                        contact_name = gmail_name.strip() if gmail_name and gmail_name.strip() else gmail_email.split("@")[0]
                        print(f"     Creating contact: {contact_name} ({gmail_email})")
                        contact_dict = create_contact(
                            user_id=user_id,
                            name=contact_name,
                            email=gmail_email,
                            category="Professional",  # Default category
                        )
                        print(f"     Contact created with ID: {contact_dict.get('contact_id')}")
                        
                        # Update with Gmail-specific fields if needed
                        if gmail_thread_id or last_interaction_date:
                            print(f"     Updating with Gmail fields: thread_id={gmail_thread_id}, last_interaction_date={last_interaction_date}")
                            update_contact_service(
                                contact_id=contact_dict["contact_id"],
                                user_id=user_id,
                                gmail_thread_id=gmail_thread_id,
                                last_interaction_date=last_interaction_date,
                            )
                        created_count += 1
                        print(f"  ✅ Created contact {contact_dict['contact_id']} for {gmail_email}")
                    except Exception as e:
                        print(f"  ❌ Error creating contact for {gmail_email}: {e}")
                        import traceback
                        traceback.print_exc()
                
                synced_count += 1
            
            result = {
                "synced": synced_count,
                "created": created_count,
                "updated": updated_count
            }
            print(f"✅ Synced {synced_count} Gmail contacts to main contacts (created: {created_count}, updated: {updated_count})")
            return result
            
    except Exception as e:
        print(f"❌ Error syncing Gmail contacts to main contacts: {e}")
        import traceback
        traceback.print_exc()
        raise


# ============================================================================
# Background Sync Service (runs every 5 minutes)
# ============================================================================

_background_sync_thread: Optional[threading.Thread] = None
_background_sync_running = False
_background_sync_lock = threading.Lock()


def _sync_all_users_with_gmail():
    """Sync Gmail for all users who have OAuth connected and auto-sync enabled."""
    try:
        with get_session() as session:
            # Get all users with Gmail OAuth tokens AND auto_sync_enabled = true
            result = session.execute(
                text("""
                    SELECT DISTINCT user_id 
                    FROM gmail_oauth_tokens 
                    WHERE COALESCE(auto_sync_enabled, true) = true
                """)
            )
            user_ids = [row[0] for row in result.fetchall()]
        
        if not user_ids:
            print("📧 Background sync: No users with Gmail OAuth connected")
            return
        
        print(f"📧 Background sync: Syncing Gmail for {len(user_ids)} user(s)")
        
        for user_id in user_ids:
            try:
                print(f"  🔄 Syncing Gmail for user {user_id}...")
                result = sync_gmail_for_user(user_id)
                if result.get("success"):
                    print(f"  ✅ User {user_id}: Processed {result.get('messages_processed', 0)} messages, found {result.get('networking_messages', 0)} networking emails")
                else:
                    print(f"  ⚠️  User {user_id}: Sync failed - {result.get('error', 'Unknown error')}")
            except Exception as e:
                print(f"  ❌ User {user_id}: Error during sync - {e}")
                # Continue with other users even if one fails
                continue
        
        print(f"✅ Background sync completed for {len(user_ids)} user(s)")
    
    except Exception as e:
        print(f"❌ Background sync error: {e}")
        import traceback
        traceback.print_exc()


def _background_sync_loop():
    """Background sync loop that runs every 5 minutes."""
    global _background_sync_running
    
    while _background_sync_running:
        try:
            _sync_all_users_with_gmail()
        except Exception as e:
            print(f"❌ Error in background sync loop: {e}")
        
        # Wait 5 minutes (300 seconds) before next sync
        # Check _background_sync_running every 10 seconds to allow graceful shutdown
        for _ in range(30):  # 30 * 10 seconds = 5 minutes
            if not _background_sync_running:
                break
            time.sleep(10)


def start_background_sync():
    """Start the background Gmail sync service (runs every 5 minutes)."""
    global _background_sync_thread, _background_sync_running
    
    with _background_sync_lock:
        if _background_sync_running:
            print("⚠️  Background sync is already running")
            return
        
        _background_sync_running = True
        _background_sync_thread = threading.Thread(
            target=_background_sync_loop,
            daemon=True,  # Thread will exit when main process exits
            name="GmailBackgroundSync"
        )
        _background_sync_thread.start()
        print("✅ Background Gmail sync started (runs every 5 minutes)")


def stop_background_sync():
    """Stop the background Gmail sync service."""
    global _background_sync_thread, _background_sync_running
    
    with _background_sync_lock:
        if not _background_sync_running:
            return
        
        print("🛑 Stopping background Gmail sync...")
        _background_sync_running = False
        
        if _background_sync_thread and _background_sync_thread.is_alive():
            _background_sync_thread.join(timeout=10)  # Wait up to 10 seconds for thread to finish
        
        print("✅ Background Gmail sync stopped")


def set_auto_sync_enabled(user_id: int, enabled: bool) -> Dict[str, Any]:
    """Set auto-sync enabled/disabled for a user."""
    try:
        with get_session() as session:
            # Check if user has OAuth tokens
            result = session.execute(
                text("SELECT user_id FROM gmail_oauth_tokens WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            if not result.fetchone():
                return {"success": False, "error": "User does not have Gmail OAuth connected"}
            
            # Update auto_sync_enabled
            session.execute(
                text("""
                    UPDATE gmail_oauth_tokens 
                    SET auto_sync_enabled = :enabled
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id, "enabled": enabled}
            )
            
            return {"success": True, "auto_sync_enabled": enabled}
    except Exception as e:
        print(f"Error setting auto-sync enabled: {e}")
        return {"success": False, "error": str(e)}

