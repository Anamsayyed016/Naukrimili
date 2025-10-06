#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop jobportal 2>/dev/null || true
pm2 delete jobportal 2>/dev/null || true

# Run production build
echo "🔨 Running production build..."
bash build-production.sh

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "🎉 Deployment completed!"
echo "🌐 Server should be running on port 3000"
