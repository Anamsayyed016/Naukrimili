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
export SKIP_DB_QUERIES=true
export SKIP_BUILD_DB_QUERIES=true
export SKIP_DB_VALIDATION=true
# CRITICAL: Prevent Next.js from trying to statically generate pages
export NEXT_PRIVATE_STANDALONE=true
# Set build timestamp to avoid Date.now() execution during build
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

# Clear cache
echo "🧹 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Generate Prisma client
echo "🔧 Generating Prisma client..."
# Use local project Prisma binary (6.18.0) to avoid global Prisma 7.x
./node_modules/.bin/prisma generate

# Provide safe build-time fallbacks so build logs don't spam missing-key warnings
# (runtime still uses real secrets from environment)
export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-"dummy-google-id"}
export GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-"dummy-google-secret"}
export OPENAI_API_KEY=${OPENAI_API_KEY:-"dummy-openai-key"}
export GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY:-"dummy-gemini-key"}
export GEMINI_API_KEY=${GEMINI_API_KEY:-"dummy-gemini-key"}
export GROQ_API_KEY=${GROQ_API_KEY:-"dummy-groq-key"}
export GOOGLE_CLOUD_OCR_API_KEY=${GOOGLE_CLOUD_OCR_API_KEY:-"dummy-ocr-key"}

# Check available memory
echo "💾 Checking system resources..."
free -h || true
df -h . || true

# Build application - try with webpack first, fallback to default if it hangs
echo "🏗️ Building application..."
echo "⏱️  Build started at $(date)"

# Strategy 1: Try WITHOUT --webpack flag first (Next.js default/Turbopack)
# This tests if the webpack config itself is causing the hang
echo "📋 Strategy 1: Building WITHOUT --webpack flag (Next.js default/Turbopack)..."
echo "💡 Testing if webpack config is causing the hang..."

set +e  # Don't exit on error, we'll check manually
# CRITICAL: Use --no-lint to speed up build and prevent ESLint hangs
# Increased timeout to 15 minutes (900 seconds) for large builds
timeout 900 npx next build --no-lint 2>&1 | tee build-no-webpack.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
set -e  # Re-enable exit on error

# Check if build succeeded
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build succeeded WITHOUT --webpack flag"
    echo "💡 This means the webpack config was causing the hang"
else
    echo "❌ Build without --webpack failed or timed out (exit code: $BUILD_EXIT_CODE)"
    echo "📋 Last 30 lines of build log:"
    tail -30 build-no-webpack.log || true
    
    # Strategy 2: If Strategy 1 fails, try with --webpack flag
    echo ""
    echo "📋 Strategy 2: Trying build WITH --webpack flag (15-minute timeout)..."
    echo "💡 Using ultra-minimal webpack config..."
    
    set +e
    timeout 900 npx next build --webpack --no-lint 2>&1 | tee build-webpack.log
    BUILD_WEBPACK_EXIT_CODE=${PIPESTATUS[0]}
    set -e
    
    if [ $BUILD_WEBPACK_EXIT_CODE -eq 0 ]; then
        echo "✅ Build succeeded WITH --webpack flag"
        BUILD_EXIT_CODE=0
    else
        echo "❌ Both build strategies failed or timed out."
        echo "📋 Last 30 lines of webpack build log:"
        tail -30 build-webpack.log || true
        exit 1
    fi
fi

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
    timeout 900 npx next build --no-lint 2>&1 | tee build-default.log
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

