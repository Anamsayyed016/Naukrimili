#!/bin/bash

echo "🔧 Fixing React Hydration Error #418..."

# 1. Clear all caches and build artifacts
echo "📦 Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache

# 2. Clear browser cache headers
echo "🧹 Clearing build artifacts..."

# 3. Rebuild with clean environment
echo "🔨 Building application with clean environment..."
NODE_ENV=production npm run build

# 4. Restart application
echo "🚀 Restarting application..."
pm2 restart naukrimili

echo "✅ Hydration fix completed!"
echo "🌐 Please clear your browser cache (Ctrl+Shift+Delete) and visit: https://naukrimili.com"
