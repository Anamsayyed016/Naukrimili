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

# Build application with timeout protection
echo "🏗️ Building application..."
echo "⏱️  Build started at $(date)"
timeout 1800 next build --webpack || {
    echo "❌ Build timed out or failed after 30 minutes"
    echo "💡 Try: npm run build:linux (uses inline env vars)"
    exit 1
}

# Create build ID
echo "📝 Creating build ID..."
node -e "require('fs').writeFileSync('.next/BUILD_ID', Date.now().toString())"

echo "✅ Build completed successfully!"

