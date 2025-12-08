# db_inspect.py
# Inspect and validate the entire Ripple database.

from db import get_conn


def print_section(title: str):
    print("\n" + "=" * 60)
    print(f"=== {title}")
    print("=" * 60)


def main():
    with get_conn() as conn:
        cur = conn.cursor()

        # ------------------------------------------
        # CONTACTS
        # ------------------------------------------
        print_section("CONTACTS")
        cur.execute("""
            SELECT
                email,
                name,
                last_contact_ts,
                has_reached_out,
                has_contact_responded,
                has_scheduled_meeting,
                awaiting_reply_from_user
            FROM contacts
            ORDER BY last_contact_ts DESC;
        """)
        contacts = cur.fetchall()
        for row in contacts:
            print(row)
        print(f"\nTotal contacts: {len(contacts)}")

        # ------------------------------------------
        # THREADS
        # ------------------------------------------
        print_section("THREADS")
        cur.execute("""
            SELECT
                thread_id,
                contact_email,
                subject,
                is_networking,
                meeting_scheduled,
                first_message_ts,
                last_updated_ts
            FROM threads
            ORDER BY last_updated_ts DESC;
        """)
        threads = cur.fetchall()
        for row in threads:
            print(row)
        print(f"\nTotal threads: {len(threads)}")

        # ------------------------------------------
        # MESSAGES
        # ------------------------------------------
        print_section("MESSAGES")
        cur.execute("""
            SELECT
                gmail_id,
                thread_id,
                contact_email,
                timestamp,
                direction,
                summary
            FROM messages
            ORDER BY timestamp ASC;
        """)
        messages = cur.fetchall()
        for row in messages:
            print(row)
        print(f"\nTotal messages: {len(messages)}")

        # ======================================================
        # VALIDATION TESTS
        # ======================================================

        print_section("VALIDATION TESTS")

        errors = []

        # Test 1: Every message must reference a valid thread
        cur.execute("SELECT DISTINCT thread_id FROM messages;")
        msg_threads = {row[0] for row in cur.fetchall()}

        cur.execute("SELECT thread_id FROM threads;")
        all_threads = {row[0] for row in cur.fetchall()}

        missing_threads = msg_threads - all_threads
        if missing_threads:
            errors.append(
                f"ERROR: Messages reference non-existent threads: {missing_threads}"
            )
        else:
            print("✔ All messages reference valid threads")

        # Test 2: Every thread must have at least one message
        cur.execute("SELECT DISTINCT thread_id FROM messages;")
        threads_with_msgs = {row[0] for row in cur.fetchall()}

        thread_without_msgs = all_threads - threads_with_msgs
        if thread_without_msgs:
            errors.append(
                f"WARNING: Threads with no messages: {thread_without_msgs}"
            )
        else:
            print("✔ All threads have ≥1 message")

        # Test 3: Threads marked networking must contain ≥1 message
        cur.execute("SELECT thread_id FROM threads WHERE is_networking = 1;")
        networking_threads = {row[0] for row in cur.fetchall()}

        orphan_networking_threads = networking_threads - threads_with_msgs
        if orphan_networking_threads:
            errors.append(
                "ERROR: Networking threads exist with no messages: "
                f"{orphan_networking_threads}"
            )
        else:
            print("✔ All networking threads contain messages")

        # Test 4: Meeting detection sanity check
        cur.execute("SELECT thread_id FROM threads WHERE meeting_scheduled = 1;")
        meeting_threads = {row[0] for row in cur.fetchall()}

        if meeting_threads:
            print(f"✔ Meeting scheduled threads detected: {meeting_threads}")
        else:
            print("ℹ No threads have meeting_scheduled = 1 yet")

        # Summary of validation
        print("\n" + "-" * 60)
        if errors:
            print("VALIDATION COMPLETED WITH ISSUES:")
            for e in errors:
                print(" -", e)
        else:
            print("ALL VALIDATION TESTS PASSED SUCCESSFULLY")
        print("-" * 60)


if __name__ == "__main__":
    main()
