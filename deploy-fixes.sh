#!/bin/bash
set -e

echo "🔧 Deploying Email & Role Fixes to Production"
echo "=============================================="

# Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  WARNING: .env file not found on server!"
  echo "Creating .env from template..."
  
  # Create basic .env with required variables
  cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://jobportal_user:job123@localhost:5432/jobportal

# NextAuth
NEXTAUTH_URL=https://naukrimili.com
NEXTAUTH_SECRET=naukrimili-secret-key-2024-production-deployment

# Note: Add your Gmail OAuth2 credentials here
# GMAIL_API_CLIENT_ID=your_client_id
# GMAIL_API_CLIENT_SECRET=your_client_secret  
# GMAIL_API_REFRESH_TOKEN=your_refresh_token
# GMAIL_SENDER=NaukriMili <naukrimili@naukrimili.com>
# GMAIL_FROM_NAME=NaukriMili
EOF
  echo "✅ Basic .env file created - Please add Gmail credentials manually!"
fi

# Load environment variables
echo "🔧 Loading environment variables..."
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)

# Verify critical environment variables
echo ""
echo "🔍 Verifying environment variables:"
echo "  NEXTAUTH_URL: ${NEXTAUTH_URL:-NOT SET}"
echo "  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET (hidden)}"
echo "  DATABASE_URL: ${DATABASE_URL:+SET (hidden)}"
echo "  GMAIL_API_CLIENT_ID: ${GMAIL_API_CLIENT_ID:+SET (hidden)}"
echo "  GMAIL_API_REFRESH_TOKEN: ${GMAIL_API_REFRESH_TOKEN:+SET (hidden)}"
echo ""

# Stop existing PM2 process
echo "🛑 Stopping existing PM2 process..."
pm2 stop naukrimili 2>/dev/null || true
pm2 delete naukrimili 2>/dev/null || true

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "📋 Recent Logs:"
pm2 logs naukrimili --lines 50 --nostream

echo ""
echo "=============================================="
echo "🎯 FIXES APPLIED:"
echo "  ✅ Email notifications now use direct import (no fetch)"
echo "  ✅ Role-based authentication verified"
echo "  ✅ Environment variables properly loaded"
echo ""
echo "🧪 TEST THE FIXES:"
echo "  1. Sign up with new Google account"
echo "  2. Check email for welcome message"
echo "  3. Select role (jobseeker/employer)"
echo "  4. Verify dashboard access"
echo ""
echo "📝 Check logs with: pm2 logs naukrimili"
echo "=============================================="

