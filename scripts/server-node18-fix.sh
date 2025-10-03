#!/bin/bash

# Server Fix Script for Node.js v18
# Handles engine compatibility issues and lock file sync

echo "🔧 SERVER FIX FOR NODE.JS v18"
echo "=============================="

# Navigate to project directory
cd /var/www/jobportal

# Stop PM2
echo "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Clean everything
echo "Cleaning previous builds and caches..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
npm cache clean --force

# Check Node.js version
echo "Current Node.js version:"
node --version

# Install with legacy peer deps and ignore engine warnings
echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps --engine-strict=false

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build application with Node.js v18 compatibility
echo "Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

# Use npm run build instead of npm ci
npm run build

# Check if build was successful
if [ -f ".next/server/middleware-manifest.json" ] && [ -f ".next/required-server-files.json" ]; then
    echo "✅ Build successful - all required files present"
else
    echo "❌ Build failed - missing critical files"
    echo "Checking what files exist in .next directory:"
    ls -la .next/ 2>/dev/null || echo "No .next directory found"
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
    echo "Checking PM2 logs:"
    pm2 logs jobportal --lines 10
fi

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "✅ Server fix completed!"
echo "Check your application at: https://aftionix.in"
