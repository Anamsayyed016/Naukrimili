#!/bin/bash

echo "🔧 Fixing OAuth 502 Bad Gateway Error..."

# Navigate to project directory
cd /var/www/naukrimili

# Backup current NextAuth config
echo "📦 Creating backup of current config..."
cp lib/nextauth-config.ts lib/nextauth-config.ts.backup-$(date +%Y%m%d-%H%M%S)

# Stop PM2 process
echo "⏹️ Stopping PM2 process..."
pm2 stop naukrimili

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Clear any existing cookies/sessions
echo "🧹 Clearing existing sessions..."
rm -rf .next/cache
rm -rf .next/server

# Start PM2 process
echo "▶️ Starting PM2 process..."
pm2 start ecosystem.config.cjs --env production

# Check status
echo "✅ Checking PM2 status..."
pm2 status

echo "🎉 OAuth 502 fix applied! Test Gmail authentication now."
echo "📊 Monitor logs with: pm2 logs naukrimili --lines 20"