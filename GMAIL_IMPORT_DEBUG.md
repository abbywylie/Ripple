# Gmail Import Debug Guide

## The Problem
When clicking "Sync Now", you get: "Gmail plugin modules not found"

## Why It Happens
The Gmail plugin files are in `backend/services/` but the import might be failing on Render due to Python path issues.

## Debug Steps

### 1. Check Render Logs
Go to Render Dashboard → Your Backend Service → Logs

Look for:
- `✅ Imported Gmail plugin from...` (success message)
- `❌ Gmail plugin modules not found...` (failure message)
- `Failed to import from services: ...` (import error details)

### 2. Check File Structure on Render
The files should be at:
- `backend/services/gmail_processor.py`
- `backend/services/gmail_client.py`
- `backend/services/gmail_db.py`
- `backend/services/gmail_llm_client.py`

### 3. Common Issues

#### Issue 1: Files Not Deployed
**Symptom**: Import fails immediately
**Fix**: Make sure all files are committed and pushed to GitHub

#### Issue 2: Import Path Wrong
**Symptom**: `ModuleNotFoundError: No module named 'services'`
**Fix**: The code tries multiple import strategies automatically

#### Issue 3: Circular Import
**Symptom**: Import hangs or fails with circular import error
**Fix**: Check if `gmail_processor.py` imports something that imports it back

#### Issue 4: Missing Dependencies
**Symptom**: Import succeeds but fails when calling functions
**Fix**: Check `requirements.txt` has all needed packages

## Current Import Strategy

The code tries imports in this order:
1. **Relative import**: `from .gmail_processor import ...` (same package)
2. **Absolute import**: `from services.gmail_processor import ...` (services package)
3. **Direct import**: `from gmail_processor import ...` (same directory)
4. **GmailPluginRoot**: `from processor import ...` (original location)

## What to Check

1. **Are the files in GitHub?**
   - Check: https://github.com/abbywylie/Ripple/tree/main/backend/services
   - Should see: `gmail_processor.py`, `gmail_client.py`, `gmail_db.py`, `gmail_llm_client.py`

2. **Are they deployed to Render?**
   - Render auto-deploys from GitHub
   - Check Render build logs for any errors

3. **Check Render logs for import errors**
   - Look for the detailed error messages we added
   - They'll tell you which import strategy failed and why

## Next Steps

If it's still failing after checking the above:
1. Share the exact error message from Render logs
2. Check if `gmail_processor.py` can import its dependencies (`gmail_db`, `gmail_client`, etc.)
3. Verify the Python path on Render includes the `backend` directory

