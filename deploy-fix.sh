#!/bin/bash
set -e

echo "🚀 Starting production deployment with fixes..."

# Navigate to project directory
cd /var/www/jobportal
echo "📁 Working in: $(pwd)"

# Kill existing PM2 processes
echo "💀 Killing existing PM2 processes..."
pm2 kill || true

# Clean up previous build artifacts
echo "🧹 Cleaning up previous build artifacts..."
rm -rf .next
rm -rf node_modules

# Verify files exist
echo "🔍 Verifying files..."
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found"
  exit 1
fi

if [ ! -f "server.js" ]; then
  echo "❌ server.js not found"
  exit 1
fi

echo "✅ All required files found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --force

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

npm run build:simple

# Verify build
echo "🔍 Verifying build..."
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found"
  exit 1
fi

echo "✅ Build successful"

# Create log directory
echo "📁 Creating log directory..."
sudo mkdir -p /var/log/jobportal
sudo chown -R $USER:$USER /var/log/jobportal

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait for startup
echo "⏳ Waiting for startup..."
sleep 10

# Check status
echo "📊 PM2 Status:"
pm2 status

# Save PM2 config
echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Deployment completed successfully!"
