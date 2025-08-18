#!/bin/bash

echo "🔧 Setting up VPS for automated deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p /home/$USER/jobportal/logs

# Make deployment script executable
echo "🔐 Making deployment script executable..."
chmod +x /home/$USER/scripts/deploy-vps.sh

# Setup PM2 startup script
echo "🚀 Setting up PM2 startup..."
pm2 startup
pm2 save

echo "✅ VPS setup completed!"
echo "📋 Next steps:"
echo "1. Add GitHub secrets (HOST, USERNAME, SSH_KEY, PORT)"
echo "2. Push your code to GitHub main branch"
echo "3. Watch the deployment in GitHub Actions tab"
