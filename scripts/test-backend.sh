#!/bin/bash

# Test script for backend startup
echo "🧪 Testing backend server..."

cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Test imports
echo "📦 Testing imports..."
PYTHONPATH=.. .venv/bin/python -c "
try:
    from api.main import app
    print('✅ All imports successful!')
    print('✅ FastAPI app created successfully')
    
    # Count routes
    routes_count = len([r for r in app.routes if hasattr(r, 'path')])
    print(f'✅ {routes_count} routes configured')
except Exception as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo "🎉 Backend test passed! Ready to start server with:"
    echo "   cd backend && PYTHONPATH=.. .venv/bin/python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000"
else
    echo "❌ Backend test failed"
    exit 1
fi
