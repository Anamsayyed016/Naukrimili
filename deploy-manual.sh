#!/bin/bash

# Manual Deployment Script
# This matches your exact deployment workflow

echo "🚀 Starting manual deployment..."

# Navigate to project directory
cd /var/www/jobportal

# Stop PM2 process
echo "⏹️ Stopping PM2 process..."
pm2 stop jobportal

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies and build
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build:fast

# Start PM2 process with production environment
echo "▶️ Starting PM2 process..."
pm2 start ecosystem.config.cjs --env production

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed successfully!"
