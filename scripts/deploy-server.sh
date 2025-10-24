#!/bin/bash

echo "🚀 Starting server-side deployment..."

# Navigate to project directory
cd /home/root/jobportal

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart jobportal || pm2 start npm --name "jobportal" -- start

# Save PM2 configuration
pm2 save

echo "✅ Server deployment completed successfully!"
echo "🌐 Your job portal is now live!"
