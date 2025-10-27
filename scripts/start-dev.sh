#!/bin/bash

# Development startup script for Ripple

echo "🚀 Starting Ripple development environment..."

# Start backend
echo "📦 Starting backend server..."
cd backend
source .venv/bin/activate
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers are starting up!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes on script exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
