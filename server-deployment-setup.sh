#!/bin/bash

echo "🔧 Setting up server for deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x if not present
NODE_VERSION=$(node --version 2>/dev/null || echo "not-installed")
echo "🔍 Current Node version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "📦 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed: $(pm2 --version)"
fi

# Install jq for JSON parsing
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq..."
    sudo apt install -y jq
fi

# Create project directory
echo "📁 Setting up project directory..."
sudo mkdir -p /var/www/jobportal
sudo chown -R $USER:$USER /var/www/jobportal
cd /var/www/jobportal

# Initialize git repository if not exists
if [ ! -d ".git" ]; then
    echo "📋 Initializing git repository..."
    git init
    git remote add origin https://github.com/anamsayyed58/jobportal.git
    git fetch origin main
    git reset --hard origin/main
else
    echo "📋 Git repository already exists, updating..."
    git fetch origin main
    git reset --hard origin/main
fi

# Create log directory
echo "📁 Creating log directory..."
sudo mkdir -p /var/log/jobportal
sudo chown -R $USER:$USER /var/log/jobportal

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 kill || true
pm2 start ecosystem.config.cjs --env production --no-daemon

# Wait and check status
echo "⏳ Waiting for application to start..."
sleep 15

echo "📊 PM2 Status:"
pm2 status

echo "🔍 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -f -s --max-time 10 http://localhost:3000/api/health 2>/dev/null || echo "failed")
if [ "$HEALTH_RESPONSE" != "failed" ]; then
    echo "✅ Application is healthy!"
    echo "📋 Health Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "📋 PM2 Logs:"
    pm2 logs jobportal --lines 20
fi

echo "🎉 Server setup complete!"
echo "🌐 Application should be available at: http://localhost:3000"
