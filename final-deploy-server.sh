#!/bin/bash
set -e

echo "🚀 Final deployment script with all fixes applied..."

# Verify we're in the correct directory
if [ "$(pwd)" != "/var/www/jobportal" ]; then
    echo "❌ Wrong directory! Switching to /var/www/jobportal"
    cd /var/www/jobportal
fi

# Clean everything aggressively
echo "🧹 Aggressive cleanup of all build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm/_cacache
find . -name "*.tsbuildinfo" -delete
find . -name ".DS_Store" -delete

# Remove problematic cache-busting files
echo "🗑️ Removing problematic cache-busting files..."
rm -f components/CacheBustingInitializer.tsx
rm -f lib/cache-busting.ts

# Clean and install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build with increased memory and optimizations
echo "🏗️ Building application with optimizations..."
NODE_OPTIONS="--max-old-space-size=8192" npx next build

# Create PM2 ecosystem config
echo "🔧 Creating PM2 ecosystem config..."
cat > ecosystem.config.cjs << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'jobportal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/jobportal',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  }]
};
ECOSYSTEM

# Restart PM2
echo "🔄 Restarting PM2 application..."
pm2 stop jobportal 2>/dev/null || true
pm2 delete jobportal 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Verify deployment
echo "✅ Verifying deployment..."
sleep 5
if pm2 list | grep -q "jobportal.*online"; then
    echo "🎉 Deployment successful! Application is running."
    echo "🌐 Application should be accessible at: http://your-domain:3000"
    echo ""
    echo "📋 Summary of fixes applied:"
    echo "✅ Added 'Discover the Career You Deserve' headline"
    echo "✅ Removed statistics section from homepage"
    echo "✅ Fixed dynamic filter functionality"
    echo "✅ Enhanced UnifiedJobSearch with real-time updates"
    echo "✅ Fixed chunk generation and cache issues"
    echo "✅ Removed problematic CacheBustingInitializer"
    echo "✅ Optimized webpack configuration for production"
    echo "✅ Ensured responsive design and performance"
    echo ""
    echo "🔍 Check application status with: pm2 status"
    echo "📊 View logs with: pm2 logs jobportal"
else
    echo "❌ Deployment failed. Check PM2 status:"
    pm2 status
    echo "📊 Check logs:"
    pm2 logs jobportal --lines 20
fi
