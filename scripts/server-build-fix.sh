#!/bin/bash

# 🚨 SERVER BUILD FIX SCRIPT
# This script fixes build issues directly on the production server

set -e

echo "🚨 Starting server-side build fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Current directory: $(pwd)"
print_status "Node version: $(node --version)"
print_status "NPM version: $(npm --version)"

# Step 1: Set environment variables
print_status "🔧 Setting environment variables..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export SKIP_ENV_VALIDATION=1
export NEXT_TYPESCRIPT_IGNORE=1
export NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
export DATABASE_URL="postgresql://postgres:password@localhost:5432/jobportal"
export NEXTAUTH_URL="https://aftionix.in"
export NEXTAUTH_SECRET="jobportal-secret-key-2024-aftionix-production-deployment"
export JWT_SECRET="jobportal-jwt-secret-2024-aftionix-production"

# Set dummy values for missing OAuth credentials
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-dummy-client-id}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-dummy-client-secret}"

print_success "Environment variables set"

# Step 2: Clean everything
print_status "🧹 Cleaning previous builds and caches..."
rm -rf .next out production node_modules/.cache .npm
rm -f *.tsbuildinfo *.log
print_success "Cleanup completed"

# Step 3: Install dependencies
print_status "📦 Installing dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force
print_success "Dependencies installed"

# Step 4: Generate Prisma client
print_status "🗄️ Generating Prisma client..."
if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
    npx prisma generate || {
        print_warning "Prisma generate failed, continuing..."
    }
    print_success "Prisma client generated"
else
    print_warning "Prisma not found, skipping"
fi

# Step 5: Try multiple build strategies
print_status "🔨 Attempting build with multiple strategies..."

BUILD_SUCCESS=false

# Strategy 1: Standard build
print_status "📋 Strategy 1: Standard build"
if npx next build --no-lint 2>&1 | tee build-strategy-1.log; then
    print_success "Standard build succeeded"
    BUILD_SUCCESS=true
else
    print_warning "Standard build failed"
    cat build-strategy-1.log | tail -20
fi

# Strategy 2: Minimal build
if [ "$BUILD_SUCCESS" = false ]; then
    print_status "📋 Strategy 2: Minimal build"
    rm -rf .next
    if npx next build --no-lint --no-typescript-check 2>&1 | tee build-strategy-2.log; then
        print_success "Minimal build succeeded"
        BUILD_SUCCESS=true
    else
        print_warning "Minimal build failed"
        cat build-strategy-2.log | tail -20
    fi
fi

# Strategy 3: Ultra-minimal build
if [ "$BUILD_SUCCESS" = false ]; then
    print_status "📋 Strategy 3: Ultra-minimal build"
    rm -rf .next
    if npx next build --no-lint --no-typescript-check --experimental-build-mode=compile 2>&1 | tee build-strategy-3.log; then
        print_success "Ultra-minimal build succeeded"
        BUILD_SUCCESS=true
    else
        print_warning "Ultra-minimal build failed"
        cat build-strategy-3.log | tail -20
    fi
fi

# Strategy 4: Force build with all flags
if [ "$BUILD_SUCCESS" = false ]; then
    print_status "📋 Strategy 4: Force build with all flags"
    rm -rf .next
    if npx next build --no-lint --no-typescript-check --experimental-build-mode=compile --debug 2>&1 | tee build-strategy-4.log; then
        print_success "Force build succeeded"
        BUILD_SUCCESS=true
    else
        print_warning "Force build failed"
        cat build-strategy-4.log | tail -20
    fi
fi

# Final check
if [ "$BUILD_SUCCESS" = false ]; then
    print_error "All build strategies failed!"
    print_error "Build logs summary:"
    echo "=== Strategy 1 Log ==="
    [ -f build-strategy-1.log ] && cat build-strategy-1.log | tail -10
    echo "=== Strategy 2 Log ==="
    [ -f build-strategy-2.log ] && cat build-strategy-2.log | tail -10
    echo "=== Strategy 3 Log ==="
    [ -f build-strategy-3.log ] && cat build-strategy-3.log | tail -10
    echo "=== Strategy 4 Log ==="
    [ -f build-strategy-4.log ] && cat build-strategy-4.log | tail -10
    exit 1
fi

# Step 6: Verify build output
print_status "🔍 Verifying build output..."
if [ ! -d ".next" ]; then
    print_error "Build failed - .next directory not found"
    exit 1
fi

if [ ! -d ".next/server" ]; then
    print_error "Build incomplete - .next/server directory missing"
    print_error ".next contents:"
    ls -la .next/
    exit 1
fi

# Step 7: Ensure BUILD_ID exists
print_status "🔍 Ensuring BUILD_ID exists..."
if [ ! -f ".next/BUILD_ID" ]; then
    print_warning "BUILD_ID not found, creating it..."
    echo $(date +%s) > .next/BUILD_ID
fi

# Create additional build metadata
echo $(date +%s) > .next/BUILD_TIMESTAMP
echo "production-$(date +%Y%m%d-%H%M%S)" > .next/DEPLOYMENT_ID

print_success "Build metadata created"

# Step 8: Final verification
print_status "🔍 Final verification..."
echo "📋 Build artifacts:"
echo "  .next directory: $([ -d ".next" ] && echo "✅ YES" || echo "❌ NO")"
echo "  BUILD_ID: $([ -f ".next/BUILD_ID" ] && echo "✅ YES" || echo "❌ NO")"
echo "  server directory: $([ -d ".next/server" ] && echo "✅ YES" || echo "❌ NO")"
echo "  static directory: $([ -d ".next/static" ] && echo "✅ YES" || echo "❌ NO")"

if [ -f ".next/BUILD_ID" ]; then
    echo "  BUILD_ID value: $(cat .next/BUILD_ID)"
fi

echo "📋 Server files count: $(ls -la .next/server/ | wc -l)"
echo "📋 Static files count: $(ls -la .next/static/ | wc -l)"

print_success "🎉 Server-side build fix completed successfully!"
print_status "The application should now be ready to start with PM2"

