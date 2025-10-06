#!/bin/bash
set -e

echo "🚀 Starting production build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf production

# Create necessary directories
mkdir -p logs
mkdir -p .next

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production --legacy-peer-deps --engine-strict=false

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Create BUILD_ID
echo "🆔 Creating BUILD_ID..."
echo $(date +%s) > .next/BUILD_ID

# Verify build
if [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ]; then
  echo "✅ Build completed successfully!"
  echo "📊 Build size:"
  du -sh .next
else
  echo "❌ Build failed - missing critical files"
  exit 1
fi

echo "🎉 Production build ready!"
