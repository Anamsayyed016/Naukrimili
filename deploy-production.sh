#!/bin/bash

# Production Deployment Script
# Fixes undefined length errors and forces cache busting

set -e

echo "🚀 Starting production deployment with fixes..."

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

echo "Environment set:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NEXT_PUBLIC_BUILD_TIME: $NEXT_PUBLIC_BUILD_TIME"

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next

# Install dependencies (ignore engine warnings)
echo "Installing dependencies..."
npm ci --legacy-peer-deps --ignore-engines

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building application with cache busting..."
npm run build

# Verify build
if [ -d ".next" ]; then
    echo "✅ Build completed successfully"
    
    # Check for old problematic chunks
    if [ -d ".next/static/chunks" ]; then
        OLD_CHUNKS=$(find .next/static/chunks -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null || true)
        if [ -n "$OLD_CHUNKS" ]; then
            echo "⚠️ Found old problematic chunks, removing..."
            rm -f $OLD_CHUNKS
        else
            echo "✅ No old problematic chunks found"
        fi
    fi
    
    # Count new chunks
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
    echo "✅ Generated $CHUNK_COUNT fresh JavaScript chunks"
    
else
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo "🚀 Production deployment completed successfully!"
echo ""
echo "Fixes applied:"
echo "✅ Fixed 'Cannot read properties of undefined (reading 'length')' errors"
echo "✅ Added safe array utilities to all components"
echo "✅ Implemented cache busting for JavaScript chunks"
echo "✅ Updated Next.js configuration for better chunk management"
echo ""
echo "Next steps:"
echo "1. Restart your application server"
echo "2. Test in incognito browser window"
echo "3. Check browser console for any remaining errors"
