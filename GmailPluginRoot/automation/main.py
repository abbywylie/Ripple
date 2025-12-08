# no need to call the API again if alredy know that this is a "networking" contact, no need to call the API again if already know it is a "networking" thread
# Workflow: Email arrives (or is sent), check threadId, if already seen this threadId before then either get summary (if in networking list) or throw away (we know its non-networking), if new threadId we haven't seen classify that email as networking or not and add it to the appropriate list (then get a summary of it and of course if it is a new email/contact add that approptiately), i think thats it?


# Next Steps (for me)
# 1. Implement the Bullet Checklist functionality
# 2. Try to grab / approximate meeting times from emails
# 3. Make it multi-user deployable

# Next Steps (overall project)
# 1. Implement Follow Up Reminder functionality based on timestamps in DB
# 2. Integrate with Google Calendar (optional, if have time)
# 3. Create notifications based on information in DB (optional, if have time)

# need everyone's emails for it to work (that is at the mass deployment stage)

# main.py
import time

from config import POLL_INTERVAL_SECONDS
from db import init_db, get_user_id_from_email, is_gmail_email
from gmail_client import get_gmail_service, fetch_recent_messages
from processor import process_message


def main() -> None:
    """
    Ripple backend main loop.

    Responsibilities:
      - Initialize SQLite DB (contacts, threads, messages).
      - Authenticate to Gmail once.
      - Get Gmail email and validate it's a Gmail address.
      - Look up user_id from Gmail email in Ripple users table.
      - Poll Gmail repeatedly:
            * Fetch recent PRIMARY INBOX messages
            * Fetch recent SENT messages
            * Pass each message to process_message(), which:
                  • Classifies networking
                  • Summarizes messages
                  • Updates contacts/threads
                  • Detects meetings
                  • Recomputes checklist
    """
    print("Initializing Ripple networking tracker backend...")
    init_db()
    print("Database initialized successfully.")

    # Authenticate once and reuse the service
    service = get_gmail_service()
    print("Gmail authenticated.")
    
    # Get Gmail account email address
    try:
        profile = service.users().getProfile(userId="me").execute()
        gmail_email = profile.get("emailAddress", "").lower().strip()
        print(f"Gmail account: {gmail_email}")
    except Exception as e:
        print(f"❌ Failed to get Gmail profile: {e}")
        print("   Cannot determine which Ripple user this Gmail belongs to.")
        return
    
    # Validate it's a Gmail address
    if not is_gmail_email(gmail_email):
        print(f"❌ Error: {gmail_email} is not a Gmail address.")
        print("   The Gmail plugin requires a Gmail account (@gmail.com or @googlemail.com).")
        print("   Please use a Gmail account or update your Ripple account to use a Gmail address.")
        return
    
    # Look up user_id from Gmail email
    user_id = get_user_id_from_email(gmail_email)
    if not user_id:
        print(f"❌ No Ripple user found with email {gmail_email}.")
        print("   Please register a Ripple account with this Gmail address first.")
        print("   The Gmail plugin can only process emails for users who have registered with a Gmail address.")
        return
    
    print(f"✅ Linked to Ripple user_id: {user_id}")
    print("Beginning polling loop...\n")

    while True:
        try:
            print("Polling Gmail for new PRIMARY INBOX + SENT messages...")

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

            networking_count = 0
            for msg in messages:
                try:
                    if process_message(msg, user_id, gmail_email):
                        networking_count += 1
                except Exception as inner_e:
                    print(f"[WARN] Error in process_message(): {inner_e}")

            print(
                f"Poll complete. Processed {len(messages)} messages, "
                f"tracked {networking_count} networking email(s). "
                f"Sleeping for {POLL_INTERVAL_SECONDS} seconds.\n"
            )

        except Exception as e:
            # Keep top-level error log, then continue polling.
            print(f"[ERROR] Fatal error in poll loop: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()