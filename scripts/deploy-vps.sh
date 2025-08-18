#!/bin/bash

echo "🚀 Starting deployment at $(date)"

# Navigate to project directory
cd /home/root/jobportal

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build the application
echo "🔨 Building application..."
npm run build

# Restart the application
echo "🔄 Restarting application..."
pm2 restart jobportal || pm2 start npm --name "jobportal" -- start

echo "✅ Deployment completed at $(date)"
echo "🌐 Your job portal is now live at: https://aftionix.in"
