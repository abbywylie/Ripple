# Registration Fix Guide

## Quick Debug Instructions

**Please try this:**

1. Open your browser to http://localhost:8080
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Try to register with any email/password
5. **Copy and share the error message** from the console

OR:

1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Try to register
4. Click on the `/api/register` request
5. Check the **Response** tab for error details
6. **Share the response message**

---

## Most Likely Issues:

### If you see: "Network Error" or "Failed to fetch"
- Backend not running → Start backend: `uvicorn api.main:app --reload`

### If you see: "CORS" error
- Already configured, shouldn't happen
- But if it does, restart backend

### If you see: "Cannot find module" error
- Frontend not built properly
- Run: `cd frontend && rm -rf node_modules && npm install`

### If you see: "Registration failed" with no details
- Check Network tab for actual backend error
- The toast message might not show the real error

---

## Test Registration Directly

Open browser console (F12 → Console) and paste:

```javascript
// Test registration
fetch('http://localhost:8000/api/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: "Browser Test User",
    email: "browsertest@example.com",
    password: "password123"
  })
})
.then(r => {
  console.log("Status:", r.status);
  return r.text();
})
.then(data => {
  console.log("Response:", data);
  try {
    const json = JSON.parse(data);
    console.log("Parsed:", json);
  } catch(e) {
    console.log("Not JSON:", data);
  }
})
.catch(e => console.error("Fetch Error:", e));
```

**Share the console output!**

---

This will help me see the exact error.

