#!/bin/bash

# Server Build Script - Linux compatible (no cross-env required)
# This script builds the application on Linux servers without requiring cross-env

set -e

echo "🚀 Starting server build..."

# Set environment variables (Linux compatible)
export NODE_ENV=production
export NEXTAUTH_SECRET=naukrimili-secret-key-2024-production-deployment
export NEXTAUTH_URL=https://naukrimili.com
export NEXT_PUBLIC_APP_URL=https://naukrimili.com
export NODE_OPTIONS=--max-old-space-size=4096
export NEXT_TELEMETRY_DISABLED=1
export ESLINT_NO_DEV_ERRORS=true
export SKIP_ENV_VALIDATION=1

# Clear cache
echo "🧹 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check available memory
echo "💾 Checking system resources..."
free -h || true
df -h . || true

# Build application - try multiple strategies
echo "🏗️ Building application..."
echo "⏱️  Build started at $(date)"

# Strategy 1: Try with --webpack flag (with verbose output)
echo "📋 Strategy 1: Building with --webpack flag..."
echo "💡 Monitoring build progress (will timeout after 30 minutes)..."
if timeout 1800 bash -c 'npx next build --webpack 2>&1 | tee build.log | while IFS= read -r line; do echo "[$(date +%H:%M:%S)] $line"; done'; then
    echo "✅ Build succeeded with --webpack"
else
    BUILD_EXIT_CODE=$?
    echo "⚠️  Build with --webpack failed or timed out (exit code: $BUILD_EXIT_CODE)"
    echo "📋 Last 50 lines of build log:"
    tail -50 build.log || true
    echo ""
    echo "💾 Memory usage at failure:"
    free -h || true
    
    # Strategy 2: Try without --webpack flag
    echo ""
    echo "📋 Strategy 2: Trying build without --webpack flag..."
    echo "🧹 Cleaning .next directory..."
    rm -rf .next
    echo "💡 Starting build without webpack flag..."
    if timeout 1800 bash -c 'npx next build 2>&1 | tee build-no-webpack.log | while IFS= read -r line; do echo "[$(date +%H:%M:%S)] $line"; done'; then
        echo "✅ Build succeeded without --webpack"
    else
        echo "❌ Build failed completely"
        echo "📋 Last 50 lines of build log:"
        tail -50 build-no-webpack.log || true
        echo "💾 Final memory usage:"
        free -h || true
        exit 1
    fi
fi

# Create build ID
echo "📝 Creating build ID..."
node -e "require('fs').writeFileSync('.next/BUILD_ID', Date.now().toString())"

echo "✅ Build completed successfully!"

