#!/bin/bash

# Emergency Chunk Cleanup Script
# Use this when you're experiencing chunk issues on production

echo "🚨 Emergency Chunk Cleanup Script"
echo "=================================="
echo "This will aggressively clean all chunks and force fresh generation"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project directory. Please run this from the project root."
    exit 1
fi

echo "🧹 Starting aggressive cleanup..."

# Stop the application if running
echo "🛑 Stopping application..."
pm2 stop jobportal 2>/dev/null || echo "Application not running with pm2"

# Remove all build artifacts
echo "🗑️ Removing all build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm
rm -rf ~/.npm/_cacache
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Remove specific problematic chunks
echo "🎯 Removing problematic chunks..."
find . -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
find . -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true

# Set environment variables for fresh build
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)

echo "🏗️ Building fresh application..."
echo "Build timestamp: $NEXT_PUBLIC_BUILD_TIME"
echo "Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID"

# Build with fresh chunks
npm run build

# Verify build
if [ -d ".next" ]; then
    echo "✅ Build completed successfully"
    
    # Count new chunks
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
    echo "✅ Generated $CHUNK_COUNT fresh JavaScript chunks"
    
    # List new chunks
    echo "📋 New chunk files:"
    find .next/static/chunks -name "*.js" -exec basename {} \; | head -10
    
    # Verify no old chunks exist
    OLD_CHUNKS=$(find .next -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null || true)
    if [ -n "$OLD_CHUNKS" ]; then
        echo "❌ Still found old chunks: $OLD_CHUNKS"
        rm -f $OLD_CHUNKS
    else
        echo "✅ No old problematic chunks found"
    fi
    
else
    echo "❌ Build failed"
    exit 1
fi

# Restart application
echo "🔄 Restarting application..."
pm2 start jobportal || pm2 restart jobportal

echo ""
echo "🚀 Emergency cleanup completed!"
echo ""
echo "✅ Fresh chunks generated with timestamp: $NEXT_PUBLIC_BUILD_TIME"
echo "✅ Application restarted"
echo ""
echo "🔍 Next steps:"
echo "1. Test in incognito browser window"
echo "2. Check browser console for errors"
echo "3. Verify new chunk files are being served"
echo ""
echo "If issues persist, run: ./deploy-production.sh"
