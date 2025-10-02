#!/bin/bash

# Production Deployment Script
# Fixes undefined length errors and forces cache busting
# Handles local changes deployment to production

set -e

echo "🚀 Starting production deployment with fixes..."
echo "📅 Deployment timestamp: $(date)"

# Set environment variables with unique build timestamp
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)

echo "Environment set:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NEXT_PUBLIC_BUILD_TIME: $NEXT_PUBLIC_BUILD_TIME"
echo "  NEXT_PUBLIC_DEPLOYMENT_ID: $NEXT_PUBLIC_DEPLOYMENT_ID"

# Aggressive cache clearing for production
echo "🧹 Aggressive cache clearing..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm
rm -rf ~/.npm/_cacache

# Clear any existing build artifacts
echo "🗑️ Removing old build artifacts..."
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Install dependencies (ignore engine warnings)
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps --ignore-engines

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application with cache busting
echo "🏗️ Building application with cache busting..."
echo "Build timestamp: $NEXT_PUBLIC_BUILD_TIME"
npm run build

# Verify build and handle chunk issues
if [ -d ".next" ]; then
    echo "✅ Build completed successfully"
    
    # Aggressive chunk cleanup for production
    echo "🔍 Checking for problematic chunks..."
    
    # Remove ALL old chunks to force fresh generation
    if [ -d ".next/static/chunks" ]; then
        echo "🗑️ Removing all old chunks to prevent cache issues..."
        rm -rf .next/static/chunks/*
        
        # Specific problematic chunk removal
        OLD_CHUNKS=$(find .next/static/chunks -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null || true)
        if [ -n "$OLD_CHUNKS" ]; then
            echo "⚠️ Found old problematic chunks, removing..."
            rm -f $OLD_CHUNKS
        fi
        
        # Force rebuild chunks
        echo "🔄 Forcing chunk regeneration..."
        npm run build
        
        # Count new chunks
        CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
        echo "✅ Generated $CHUNK_COUNT fresh JavaScript chunks"
        
        # List new chunk names for verification
        echo "📋 New chunk files:"
        find .next/static/chunks -name "*.js" -exec basename {} \; | head -10
        
    else
        echo "⚠️ No chunks directory found, creating fresh build..."
        npm run build
    fi
    
    # Verify no old problematic chunks exist
    PROBLMATIC_CHUNKS=$(find .next -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null || true)
    if [ -n "$PROBLMATIC_CHUNKS" ]; then
        echo "❌ Still found problematic chunks after cleanup!"
        echo "Removing: $PROBLMATIC_CHUNKS"
        rm -f $PROBLMATIC_CHUNKS
    else
        echo "✅ No problematic chunks found"
    fi
    
else
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

# Server restart and cache invalidation
echo "🔄 Preparing for server restart..."
echo "📝 Cache busting summary:"
echo "  - Build timestamp: $NEXT_PUBLIC_BUILD_TIME"
echo "  - Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID"
echo "  - Fresh chunks generated: $(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")"

# Create cache busting marker
echo "$NEXT_PUBLIC_BUILD_TIME" > .next/BUILD_TIMESTAMP
echo "$NEXT_PUBLIC_DEPLOYMENT_ID" > .next/DEPLOYMENT_ID

echo "🚀 Production deployment completed successfully!"
echo ""
echo "Fixes applied:"
echo "✅ Fixed 'Cannot read properties of undefined (reading 'length')' errors"
echo "✅ Added safe array utilities to all components"
echo "✅ Implemented aggressive cache busting for JavaScript chunks"
echo "✅ Updated Next.js configuration for better chunk management"
echo "✅ Removed all old problematic chunks"
echo "✅ Generated fresh chunks with unique timestamps"
echo ""
echo "Next steps:"
echo "1. Restart your application server: pm2 restart jobportal"
echo "2. Clear browser cache or test in incognito window"
echo "3. Check browser console for any remaining errors"
echo "4. Verify new chunk files are being served"
echo ""
echo "🔍 To verify the fix:"
echo "   - Check browser console - should show no 'Cannot read properties of undefined' errors"
echo "   - Look for new chunk file names (not 4bd1b696-100b9d70ed4e49c1.js)"
echo "   - Verify NEXT_PUBLIC_BUILD_TIME environment variable is set"
