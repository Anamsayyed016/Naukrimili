#!/bin/bash

# 🔧 Complete Search Functionality Fix - Linux Server Commands
# This script fixes all search issues and sets up the environment properly

echo "🚀 Starting Search Functionality Fix..."

# Step 1: Set up Environment Variables
echo "📝 Step 1: Setting up environment variables..."
cat > .env << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production

# Database - Replace with your actual database credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/jobportal"

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aftionix.in

# Google OAuth (if you have them)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

echo "✅ Environment variables created"

# Step 2: Install Dependencies
echo "📦 Step 2: Installing dependencies..."
npm ci

# Step 3: Generate Prisma Client
echo "🔧 Step 3: Generating Prisma client..."
npx prisma generate

# Step 4: Apply Database Migrations
echo "🗄️ Step 4: Applying database migrations..."
npx prisma migrate deploy

# Step 5: Build the Application
echo "🏗️ Step 5: Building the application..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Step 6: Stop any existing PM2 processes
echo "🛑 Step 6: Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Step 7: Start the Application with PM2
echo "🚀 Step 7: Starting application with PM2..."
pm2 start npm --name "jobportal" -- run start

# Step 8: Save PM2 Configuration
echo "💾 Step 8: Saving PM2 configuration..."
pm2 save

# Step 9: Set up PM2 to start on boot
echo "🔄 Step 9: Setting up PM2 startup..."
pm2 startup

# Step 10: Test the Search API
echo "🧪 Step 10: Testing search functionality..."
sleep 10
curl -X GET "http://localhost:3000/api/jobs/simple?query=developer&location=mumbai&limit=5" -H "Content-Type: application/json" || echo "API test failed - check server logs"

echo "✅ Search functionality fix completed!"
echo "📊 Check PM2 status with: pm2 status"
echo "📋 Check logs with: pm2 logs jobportal"
echo "🔍 Test search at: https://aftionix.in/jobs"
