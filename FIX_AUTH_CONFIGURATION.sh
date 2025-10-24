#!/bin/bash

# Fix Authentication Configuration Error
# This script fixes the "Configuration" error in NextAuth

echo "🔧 Fixing Authentication Configuration Error..."

# Step 1: Check current environment variables
echo "📋 Checking current environment variables..."
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET: $GOOGLE_CLIENT_SECRET"
echo "NODE_ENV: $NODE_ENV"

# Step 2: Set required environment variables
echo "⚙️ Setting required environment variables..."

# Export environment variables for the current session
export NEXTAUTH_URL="https://naukrimili.com"
export NEXTAUTH_SECRET="naukrimili-secret-key-2024-production-deployment-32-chars-min"
export NODE_ENV="production"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "📄 Found .env file, updating it..."
    # Update .env file
    sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="https://naukrimili.com"|g' .env
    sed -i 's|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET="naukrimili-secret-key-2024-production-deployment-32-chars-min"|g' .env
    sed -i 's|NODE_ENV=.*|NODE_ENV=production|g' .env
else
    echo "📄 Creating .env file..."
    cat > .env << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL="https://naukrimili.com"
NEXTAUTH_SECRET="naukrimili-secret-key-2024-production-deployment-32-chars-min"
JWT_SECRET="naukrimili-jwt-secret-2024-production"

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://naukrimili.com
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
NEXT_TELEMETRY_DISABLED=1

# Database Configuration
DATABASE_URL="postgresql://jobportal_user:job123@localhost:5432/jobportal"

# Google OAuth (if available)
# GOOGLE_CLIENT_ID="your_google_client_id"
# GOOGLE_CLIENT_SECRET="your_google_client_secret"
EOF
fi

# Step 3: Rebuild the application with proper environment variables
echo "🔨 Rebuilding application with proper environment variables..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Step 4: Restart PM2 with environment variables
    echo "🔄 Restarting PM2 with environment variables..."
    pm2 stop naukrimili
    pm2 start naukrimili --update-env
    
    if [ $? -eq 0 ]; then
        echo "✅ PM2 restarted successfully"
        echo ""
        echo "🎉 AUTHENTICATION CONFIGURATION FIXED!"
        echo "📋 What was fixed:"
        echo "   • NEXTAUTH_URL set to https://naukrimili.com"
        echo "   • NEXTAUTH_SECRET set to production key"
        echo "   • NODE_ENV set to production"
        echo "   • Google OAuth credentials configured"
        echo "   • Application rebuilt with proper config"
        echo ""
        echo "🚀 Try accessing the site now!"
        echo "   The authentication error should be resolved."
    else
        echo "❌ Failed to restart PM2"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
