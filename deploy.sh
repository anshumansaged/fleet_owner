#!/bin/bash

echo "🚀 Fleet Management System Deployment Script"
echo "============================================="

# Check if environment file exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your MongoDB URI and other environment variables."
    echo "See .env.local.example for reference."
    exit 1
fi

# Check if MongoDB URI is set
if ! grep -q "MONGODB_URI" .env.local; then
    echo "❌ Error: MONGODB_URI not found in .env.local"
    echo "Please add your MongoDB Atlas connection string to .env.local"
    exit 1
fi

echo "✅ Environment variables found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Your Fleet Management System is ready for deployment!"
    echo ""
    echo "To deploy to Vercel:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Run: vercel"
    echo "3. Follow the prompts"
    echo "4. Add environment variables in Vercel dashboard"
    echo ""
    echo "Environment variables to add in Vercel:"
    echo "- MONGODB_URI"
    echo "- NEXTAUTH_SECRET"
    echo "- OWNER_AUTH_SECRET"
    echo ""
    echo "📖 For detailed instructions, see README.md"
else
    echo "❌ Build failed!"
    echo "Please check the error messages above and fix any issues."
    exit 1
fi
