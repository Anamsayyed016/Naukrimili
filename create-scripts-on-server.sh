#!/bin/bash

# Commands to create scripts directly on the server
# Run these commands on your Linux server

echo "🚀 Creating deployment scripts on server..."

# Create auto-deploy-server.sh
cat > auto-deploy-server.sh << 'EOF'
#!/bin/bash

# Auto Deploy Server Script - Simplified Version
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

PROJECT_DIR="/root/jobportal"
PM2_APP_NAME="jobportal"

log "🚀 Starting Auto Deploy..." "$BLUE"

cd "$PROJECT_DIR"

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)

log "Environment set - Build Time: $NEXT_PUBLIC_BUILD_TIME" "$GREEN"

# Clean previous build
log "🧹 Cleaning previous build..." "$BLUE"
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
log "📦 Installing dependencies..." "$BLUE"
npm ci --legacy-peer-deps --ignore-engines

# Generate Prisma client
log "🔧 Generating Prisma client..." "$BLUE"
npx prisma generate

# Build application
log "🏗️ Building application..." "$BLUE"
npm run build

# Cleanup old chunks
log "🧹 Cleaning up old chunks..." "$BLUE"
if [ -d ".next/static/chunks" ]; then
    find .next -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
    find .next -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true
fi

# Restart application
log "🔄 Restarting application..." "$BLUE"
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs --name "$PM2_APP_NAME" || pm2 start "npm run start" --name "$PM2_APP_NAME"
pm2 save

# Wait and verify
sleep 5
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    log "✅ Application restarted successfully" "$GREEN"
else
    log "❌ Application failed to start" "$RED"
    pm2 logs "$PM2_APP_NAME" --lines 10
fi

log "🎉 Auto deployment completed!" "$GREEN"
EOF

# Create emergency-chunk-cleanup.sh
cat > emergency-chunk-cleanup.sh << 'EOF'
#!/bin/bash

echo "🚨 Emergency Chunk Cleanup Script"
echo "=================================="

PROJECT_DIR="/root/jobportal"
cd "$PROJECT_DIR"

echo "🛑 Stopping application..."
pm2 stop jobportal 2>/dev/null || echo "Application not running"

echo "🗑️ Removing all build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
find . -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
find . -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true

echo "🏗️ Building fresh application..."
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
npm run build

echo "🔄 Restarting application..."
pm2 start ecosystem.config.cjs --name jobportal || pm2 start "npm run start" --name jobportal

echo "✅ Emergency cleanup completed!"
EOF

# Create ecosystem.config.cjs
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'npm',
      args: 'start',
      cwd: '/root/jobportal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1'
      },
      log_file: '/var/log/jobportal/combined.log',
      out_file: '/var/log/jobportal/out.log',
      error_file: '/var/log/jobportal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Create setup-oauth.js
cat > setup-oauth.js << 'EOF'
#!/usr/bin/env node

console.log('🔐 Google OAuth Setup Script');
console.log('============================\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local file already exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasGoogleClientId = envContent.includes('GOOGLE_CLIENT_ID=') && 
                           !envContent.includes('GOOGLE_CLIENT_ID=your-');
  
  if (hasGoogleClientId) {
    console.log('✅ Google OAuth credentials are configured');
  } else {
    console.log('❌ Google OAuth credentials are missing');
    console.log('📝 Please add to your .env.local file:');
    console.log('GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com');
    console.log('GOOGLE_CLIENT_SECRET=your-google-client-secret\n');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('📝 Please create .env.local with Google OAuth credentials\n');
}

console.log('🚀 Google OAuth Setup Instructions:');
console.log('===================================');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Google+ API');
console.log('4. Create OAuth 2.0 credentials');
console.log('5. Add redirect URIs: http://localhost:3000/api/auth/callback/google');
console.log('6. Copy credentials to .env.local file');
console.log('7. Restart server: npm run dev');
EOF

# Make scripts executable
chmod +x auto-deploy-server.sh
chmod +x emergency-chunk-cleanup.sh
chmod +x setup-oauth.js

# Create log directory
mkdir -p /var/log/jobportal

echo "✅ Scripts created successfully!"
echo ""
echo "📋 Available commands:"
echo "  ./auto-deploy-server.sh      - Full deployment"
echo "  ./emergency-chunk-cleanup.sh - Emergency cleanup"
echo "  node setup-oauth.js          - OAuth setup"
echo ""
echo "🚀 Run: ./auto-deploy-server.sh to deploy!"
