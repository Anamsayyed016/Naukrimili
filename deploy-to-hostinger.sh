#!/bin/bash

# Deploy to Hostinger VPS
# This script runs the exact commands you specified

echo "🚀 Deploying to Hostinger VPS..."
echo "================================"

# Navigate to project directory
echo "📁 Navigating to project directory..."
cd /var/www/jobportal

# Stop PM2 process
echo "⏹️ Stopping PM2 process..."
pm2 stop jobportal

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🔨 Building application..."
npm run build:fast

# Start PM2 process with production environment
echo "▶️ Starting PM2 process with production environment..."
pm2 start ecosystem.config.cjs --env production

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed successfully!"
