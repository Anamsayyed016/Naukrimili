#!/bin/bash
# 🚀 NaukriMili - Deploy Welcome Email Fix
# This script deploys the NextAuth configuration with Gmail welcome email integration

echo "🚀 Deploying Welcome Email Fix to Production Server..."
echo "=================================================="
echo ""

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code from GitHub..."
cd /var/www/naukrimili
git stash
git pull origin main
echo "✅ Code updated"
echo ""

# Step 2: Install dependencies (if any new ones)
echo "📦 Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Build the application
echo "🔨 Step 3: Building application..."
npm run build
echo "✅ Build completed"
echo ""

# Step 4: Delete and restart PM2 to reload environment
echo "🔄 Step 4: Restarting PM2 with fresh environment..."
pm2 delete naukrimili
pm2 start ecosystem.config.cjs --env production
echo "✅ PM2 restarted"
echo ""

# Step 5: Verify PM2 is running
echo "📊 Step 5: Checking PM2 status..."
pm2 status
echo ""

# Step 6: Verify Gmail environment variables are loaded
echo "🔍 Step 6: Verifying Gmail OAuth2 environment variables..."
pm2 env 0 | grep -E "(GMAIL|GOOGLE_CLIENT|NEXTAUTH)" | head -10
echo ""

# Step 7: Clear old logs and monitor new logs
echo "📝 Step 7: Monitoring logs for 10 seconds..."
pm2 flush naukrimili
sleep 2
timeout 10s pm2 logs naukrimili --lines 20 || true
echo ""

echo "=================================================="
echo "✅ Deployment Complete!"
echo ""
echo "🧪 TEST INSTRUCTIONS:"
echo "1. Open https://naukrimili.com in incognito mode"
echo "2. Click 'Sign Up' or 'Login'"
echo "3. Select 'Continue with Google'"
echo "4. Complete Google OAuth"
echo "5. Check your email for welcome message"
echo ""
echo "📊 Monitor logs: pm2 logs naukrimili --lines 50"
echo "🔍 Check Gmail vars: pm2 env 0 | grep GMAIL"
echo "=================================================="

