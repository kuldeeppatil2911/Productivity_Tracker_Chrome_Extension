#!/bin/bash

echo "🚀 Setting up Productivity Tracker Full Stack Application"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running (optional)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Make sure to start MongoDB or use MongoDB Atlas."
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file. Please update it with your MongoDB URI and JWT secret."
fi

# Create extension icons directory
mkdir -p chrome-extension/icons

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your MongoDB connection string"
echo "2. Start MongoDB if using local installation"
echo "3. Run 'npm run dev' to start both backend and frontend"
echo "4. Load the Chrome extension from chrome-extension/ folder"
echo ""
echo "🌐 URLs:"
echo "- Backend API: http://localhost:5000"
echo "- Frontend Dashboard: http://localhost:3000"
echo ""
echo "📖 See README.md for detailed instructions"
