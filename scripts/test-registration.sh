#!/bin/bash

# Test registration endpoint
echo "🧪 Testing registration endpoint..."

# Test if backend is running
echo "Checking if backend is running on port 8000..."
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Start it with:"
    echo "   cd backend && PYTHONPATH=.. .venv/bin/python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000"
    exit 1
fi

# Test registration endpoint
echo "🧪 Testing registration endpoint with curl..."

curl -X POST "http://localhost:8000/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "If you see HTTP Status: 400, the user might already exist."
echo "If you see HTTP Status: 200, registration works fine!"
echo "If you see other errors, check the backend logs."
