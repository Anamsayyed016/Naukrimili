#!/bin/bash
set -e

echo "🔨 Building application with fixed environment variables..."

# Set required environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXTAUTH_SECRET="naukrimili-secret-key-2024-production-deployment"
export NEXTAUTH_URL="https://naukrimili.com"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Generate Prisma client if needed
if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
  echo "🗄️ Generating Prisma client..."
  npx prisma generate || echo "⚠️ Prisma generate failed, continuing..."
fi

# Build the application
echo "📋 Running Next.js build..."
npm run build

# Verify build output
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found"
  exit 1
fi

if [ ! -d ".next/server" ]; then
  echo "❌ Build failed - .next/server directory not found"
  exit 1
fi

echo "✅ Build completed successfully"
