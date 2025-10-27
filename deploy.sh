#!/bin/bash

# Deployment Helper Script
# This script helps prepare your app for deployment

echo "🚀 Preparing Ripple for deployment..."

# Check if we're in the right directory
if [ ! -f "backend/api/main.py" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << EOF
# Database URL (Railway/Render will provide this)
DATABASE_URL=sqlite:///./networking.db

# JWT Secret Key (generate a random string for production)
SECRET_KEY=your-secret-key-change-this-in-production

# CORS settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
    echo "✅ Created backend/.env file"
else
    echo "✅ backend/.env already exists"
fi

# Create requirements.txt if it doesn't exist
if [ ! -f "backend/requirements.txt" ]; then
    echo "📝 Creating backend/requirements.txt..."
    cat > backend/requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
python-multipart==0.0.6
bcrypt==4.1.2
PyJWT==2.8.0
python-dotenv==1.0.0
psycopg2-binary==2.9.9
EOF
    echo "✅ Created backend/requirements.txt"
else
    echo "✅ backend/requirements.txt already exists"
fi

# Build frontend
echo "🔨 Building frontend..."
cd frontend/ripple-connect-crafted-main
if [ -f "package.json" ]; then
    npm install
    npm run build
    echo "✅ Frontend built successfully"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

cd ../..

# Create Railway configuration
echo "📝 Creating railway.json..."
cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && PYTHONPATH=.. python -m uvicorn api.main:app --host 0.0.0.0 --port \$PORT",
    "healthcheckPath": "/docs",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
echo "✅ Created railway.json"

# Create Procfile for Heroku compatibility
echo "📝 Creating Procfile..."
cat > Procfile << EOF
web: cd backend && PYTHONPATH=.. python -m uvicorn api.main:app --host 0.0.0.0 --port \$PORT
EOF
echo "✅ Created Procfile"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
ENV/
env.bak/
venv.bak/

# Database
*.db
*.db-shm
*.db-wal

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
    echo "✅ Created .gitignore"
else
    echo "✅ .gitignore already exists"
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Prepare for deployment' && git push"
echo "2. Deploy backend to Railway: railway login && railway init && railway up"
echo "3. Deploy frontend to Vercel: Connect GitHub repo and deploy frontend/ripple-connect-crafted-main"
echo "4. Update API_BASE_URL in frontend/src/lib/api.ts to your Railway URL"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
