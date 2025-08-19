#!/bin/bash

echo "🚀 Quick Deployment to Hostinger VPS"
echo "====================================="

# VPS Details
VPS_IP="69.62.73.84"
VPS_USER="root"
PROJECT_DIR="/home/root/jobportal"

echo "📡 Connecting to VPS: $VPS_IP"
echo "👤 User: $VPS_USER"
echo "📁 Project: $PROJECT_DIR"
echo ""

# Deploy to VPS
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'

echo "🔄 Starting deployment process..."

# Navigate to project directory
cd /home/root/jobportal

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci --production

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart jobportal || pm2 start npm --name "jobportal" -- start

echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Deployment completed successfully!"
echo "🌐 Your website is now updated at: https://aftionix.in"

# Show current status
echo ""
echo "📊 Current PM2 Status:"
pm2 status

echo ""
echo "📊 Current Git Status:"
git log --oneline -5

EOF

echo ""
echo "🏁 Deployment completed!"
echo "🌐 Check your website at: http://aftionix.in"
