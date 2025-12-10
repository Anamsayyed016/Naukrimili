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
# Set build timestamp to avoid Date.now() execution during build
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

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

# Build application - try with webpack first, fallback to default if it hangs
echo "🏗️ Building application..."
echo "⏱️  Build started at $(date)"

# Strategy 1: Try with --webpack flag
echo "📋 Strategy 1: Building with --webpack flag..."
echo "💡 Using ultra-minimal webpack config..."

set +e  # Don't exit on error, we'll check manually
timeout 600 npx next build --webpack 2>&1 | tee build-webpack.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
set -e  # Re-enable exit on error

# Check if build succeeded or timed out
if [ $BUILD_EXIT_CODE -eq 124 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "⚠️  Build with --webpack timed out or failed (exit code: $BUILD_EXIT_CODE)"
    echo "📋 Last 30 lines of build log:"
    tail -30 build-webpack.log || true
    
    # Strategy 2: Try without --webpack flag (uses Next.js default/Turbopack)
    echo ""
    echo "📋 Strategy 2: Trying build WITHOUT --webpack flag (Next.js default mode)..."
    echo "🧹 Cleaning .next directory..."
    rm -rf .next
    
    set +e
    timeout 600 npx next build 2>&1 | tee build-default.log
    BUILD_EXIT_CODE=${PIPESTATUS[0]}
    set -e
    
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        echo "✅ Build succeeded without --webpack flag"
        # Use the default build log
        cp build-default.log build.log
    else
        echo "❌ Build failed with both strategies"
        echo "📋 Last 30 lines of default build log:"
        tail -30 build-default.log || true
        exit 1
    fi
else
    echo "✅ Build succeeded with --webpack flag"
    # Use the webpack build log
    cp build-webpack.log build.log
fi

# Check if build succeeded
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    # Also check if there are any error messages in the log
    if grep -qi "error\|failed\|❌" build.log; then
        echo "⚠️  Build completed but errors detected in log"
        echo "📋 Checking for critical errors..."
        if grep -qi "Build error occurred\|ERROR:" build.log; then
            echo "❌ Build failed - critical errors found"
            echo "📋 Last 50 lines of build log:"
            tail -50 build.log
            exit 1
        else
            echo "✅ Build succeeded (warnings only)"
        fi
    else
        echo "✅ Build succeeded with --webpack"
    fi
else
    echo "❌ Build failed or timed out (exit code: $BUILD_EXIT_CODE)"
    echo "📋 Last 50 lines of build log:"
    tail -50 build.log || true
    echo ""
    echo "💾 Memory usage at failure:"
    free -h || true
    exit 1
fi

# Create build ID
echo "📝 Creating build ID..."
node -e "require('fs').writeFileSync('.next/BUILD_ID', Date.now().toString())"

echo "✅ Build completed successfully!"

