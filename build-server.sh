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

# Build application - use --webpack flag (required for webpack config)
echo "🏗️ Building application..."
echo "⏱️  Build started at $(date)"
echo "📋 Building with --webpack flag (required for custom webpack config)..."
echo "💡 This explicitly uses webpack instead of Turbopack..."

# Build with --webpack flag and capture exit code properly
set +e  # Don't exit on error, we'll check manually
timeout 1800 npx next build --webpack 2>&1 | tee build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
set -e  # Re-enable exit on error

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

