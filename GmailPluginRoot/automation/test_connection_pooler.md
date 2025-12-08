# Try Connection Pooler URL

If the direct connection doesn't work, try using Supabase's connection pooler:

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to "Connection pooling"
3. Copy the "Session mode" or "Transaction mode" connection string
4. Update your .env file with that URL

The pooler URL format is usually:
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

This sometimes works better from local networks.
