#!/bin/bash

echo "🏃‍♂️ Fleet Management System - Quick Setup"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ .env.local created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your MongoDB URI"
    echo "   1. Get MongoDB Atlas connection string"
    echo "   2. Replace the MONGODB_URI value in .env.local"
    echo "   3. Update other environment variables as needed"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.local with your MongoDB URI"
    echo "2. Run: npm run dev"
    echo "3. Open http://localhost:3000"
    echo "4. Click 'Initialize System' on first visit"
    echo ""
    echo "📖 For deployment instructions, see README.md"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
