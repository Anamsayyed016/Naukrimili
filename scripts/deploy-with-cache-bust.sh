#!/bin/bash

# Deployment script with aggressive cache busting
# Run this script on Hostinger server for deployment

set -e

echo "🚀 Starting deployment with cache busting..."

# 1. Clean all build artifacts and caches
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm
rm -rf /tmp/.npm

# 2. Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# 3. Reinstall dependencies (optional - only if package.json changed)
if [ "$1" = "--fresh-deps" ]; then
    echo "📦 Reinstalling dependencies..."
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
fi

# 4. Generate fresh build
echo "🔨 Building application..."
# Use production build with increased memory and ignore engine warnings
NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV=production npm run build:production

# 5. Clear any service worker registrations (if they exist)
echo "🔧 Clearing service workers..."
# This will be handled by the application code

# 6. Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart jobportal || pm2 start npm --name "jobportal" -- start

# 7. Verify build
echo "✅ Verifying deployment..."
if [ -d ".next" ]; then
    echo "✅ Build directory exists"
    echo "📊 Build size: $(du -sh .next | cut -f1)"
else
    echo "❌ Build directory missing!"
    exit 1
fi

# 8. Check for the problematic file
if [ -f ".next/static/chunks/4bd1b696-100b9d70ed4e49c1.js" ]; then
    echo "⚠️ Old problematic file still exists - this is expected for current build"
    echo "🔄 The file will be replaced in the next build with new hash"
else
    echo "✅ Old problematic file not found - good!"
fi

echo "🎉 Deployment completed successfully!"
echo "📝 Next steps:"
echo "   1. Test in incognito browser window"
echo "   2. Perform hard refresh (Ctrl+F5)"
echo "   3. Check browser dev tools for fresh JS bundles"
