#!/bin/bash

# Quick fix for 504 Gateway Timeout error
echo "🚨 Fixing 504 Gateway Timeout error..."

# Kill all processes on port 3000
echo "Killing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Stop PM2
echo "Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Clear PM2 logs
echo "Clearing PM2 logs..."
pm2 flush

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

# Navigate to project directory
cd /var/www/jobportal

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build application
echo "Building application..."
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint

# Start PM2
echo "Starting PM2..."
pm2 start ecosystem.optimized.cjs --env production

# Wait and check
echo "Waiting for application to start..."
sleep 10

# Check status
echo "Checking status..."
pm2 status

# Test local connection
echo "Testing local connection..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Application is responding locally"
else
    echo "❌ Application is not responding locally"
    echo "Checking logs..."
    pm2 logs jobportal --lines 20
fi

echo "🎉 Fix completed!"
