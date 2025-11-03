# Debug Registration Issue

## Current Status
- ✅ Backend is running on port 8000
- ✅ Direct curl test works: `curl -X POST http://localhost:8000/api/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","password":"test123"}'`
- ❌ Frontend registration fails

## Quick Debug Steps

### 1. Check Browser Console
Open browser console (F12) and look for errors when you try to register.

### 2. Check Network Tab
- Open Network tab in dev tools
- Try to register
- Look for the `/api/register` request
- Check:
  - Request URL (should be http://localhost:8000/api/register)
  - Request payload (should have name, email, password)
  - Response status code
  - Response body

### 3. Test Direct API Call
Open browser console and run:
```javascript
fetch('http://localhost:8000/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Browser Test",
    email: "browser@test.com",
    password: "test123"
  })
})
.then(r => r.json())
.then(d => console.log("Success:", d))
.catch(e => console.error("Error:", e))
```

## Common Issues

### Issue: CORS Error
**Symptom:** Console shows CORS errors
**Solution:** Already fixed - CORS is configured

### Issue: Network Error
**Symptom:** Request fails to reach backend
**Solution:** 
1. Ensure backend is running: `curl http://localhost:8000/docs`
2. Check firewall settings

### Issue: Wrong API URL
**Symptom:** Request goes to wrong URL
**Solution:** Check browser Network tab for actual request URL

### Issue: Wrong Payload Format
**Symptom:** Backend returns 422 validation error
**Solution:** Check request payload matches expected format

## Next Steps

1. Run the browser console test above
2. Share the error message from console
3. Check if any users were actually created in the database

## Temporary Workaround

You can use the test account if it exists:
- Email: `ripple@gmail.com`
- Password: `1234567890`

Or try to login with the account created via curl:
- Email: `test@example.com`
- Password: `test123`

