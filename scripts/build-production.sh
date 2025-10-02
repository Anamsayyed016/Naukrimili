#!/bin/bash

# Production build script for Hostinger deployment
# Handles Node.js version warnings and memory issues

set -e

echo "🚀 Starting production build..."

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

echo "📦 Build environment:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NODE_OPTIONS: $NODE_OPTIONS"
echo "  BUILD_TIME: $NEXT_PUBLIC_BUILD_TIME"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next

# Install dependencies (ignore engine warnings)
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps --ignore-engines

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo "📊 Build directory size: $(du -sh .next | cut -f1)"
