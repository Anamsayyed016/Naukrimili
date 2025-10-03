#!/bin/bash

# Quick Server Fix Script
# Run this on your server to fix the 502 error

echo "🔧 QUICK SERVER FIX SCRIPT"
echo "=========================="

# Navigate to project directory
cd /var/www/jobportal

# Stop PM2
echo "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Clean and reinstall
echo "Cleaning and reinstalling..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build application
echo "Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

npm run build

# Check if build was successful
if [ -f ".next/server/middleware-manifest.json" ] && [ -f ".next/required-server-files.json" ]; then
    echo "✅ Build successful - all required files present"
else
    echo "❌ Build failed - missing critical files"
    exit 1
fi

# Start with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Wait and check status
echo "Waiting for application to start..."
sleep 10

pm2 status

# Test application
echo "Testing application..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Application is responding on port 3000"
else
    echo "⚠️ Application not responding on port 3000"
    pm2 logs jobportal --lines 10
fi

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "✅ Server fix completed!"
echo "Check your application at: https://aftionix.in"
