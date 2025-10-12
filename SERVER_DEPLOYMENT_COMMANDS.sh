#!/bin/bash

###############################################################################
# NaukriMili - Gmail OAuth2 Email System Deployment
# Complete server deployment commands
# Execute these commands on your production server
###############################################################################

echo "======================================================================"
echo "  NaukriMili Gmail OAuth2 Deployment Script"
echo "  Server: naukrimili.com"
echo "  Email: info@naukrimili.com"
echo "======================================================================"
echo ""

# Step 1: Navigate to project directory
echo "Step 1: Navigating to project directory..."
cd /var/www/naukrimili || { echo "Error: Project directory not found"; exit 1; }
echo "✅ In project directory: $(pwd)"
echo ""

# Step 2: Check current PM2 status
echo "Step 2: Checking current PM2 status..."
pm2 status
echo ""

# Step 3: Pull latest changes from GitHub
echo "Step 3: Pulling latest changes from GitHub..."
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "❌ Git pull failed. Please resolve conflicts manually."
    exit 1
fi
echo ""

# Step 4: Install new dependencies
echo "Step 4: Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ npm install failed"
    exit 1
fi
echo ""

# Step 5: Build the application
echo "Step 5: Building application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed. Please check build errors."
    exit 1
fi
echo ""

# Step 6: Restart PM2 with environment reload
echo "Step 6: Restarting PM2 with environment reload..."
pm2 restart naukrimili --update-env
if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted successfully"
else
    echo "❌ PM2 restart failed"
    exit 1
fi
echo ""

# Step 7: Save PM2 configuration
echo "Step 7: Saving PM2 configuration..."
pm2 save
echo "✅ PM2 configuration saved"
echo ""

# Step 8: Wait for application to start
echo "Step 8: Waiting for application to start (5 seconds)..."
sleep 5
echo ""

# Step 9: Check PM2 status
echo "Step 9: Checking PM2 status..."
pm2 status
echo ""

# Step 10: Display recent logs
echo "Step 10: Displaying recent logs..."
echo "----------------------------------------------------------------------"
pm2 logs naukrimili --lines 30 --nostream
echo "----------------------------------------------------------------------"
echo ""

# Step 11: Verification
echo "======================================================================"
echo "  Deployment Complete!"
echo "======================================================================"
echo ""
echo "✅ Verification Steps:"
echo "   1. Check if Gmail OAuth2 initialized:"
echo "      Look for: '✅ Gmail OAuth2 service initialized successfully'"
echo ""
echo "   2. If you see warnings about credentials:"
echo "      - Edit .env file: nano .env"
echo "      - Add your Gmail OAuth2 credentials"
echo "      - Restart: pm2 restart naukrimili --update-env"
echo ""
echo "   3. Test email service:"
echo "      curl -X POST https://naukrimili.com/api/test-email \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"type\": \"welcome\", \"recipientEmail\": \"test@example.com\"}'"
echo ""
echo "======================================================================"
echo "  Additional Commands"
echo "======================================================================"
echo ""
echo "📋 View logs in real-time:"
echo "   pm2 logs naukrimili"
echo ""
echo "📋 Check environment variables:"
echo "   pm2 env 0 | grep GMAIL"
echo ""
echo "📋 Restart PM2:"
echo "   pm2 restart naukrimili --update-env"
echo ""
echo "📋 Edit environment file:"
echo "   nano .env"
echo ""
echo "======================================================================"

