#!/bin/bash
set -e

echo "🚨 NUCLEAR CHUNK CLEANUP SCRIPT"
echo "=================================="
echo "This script will completely remove all old chunks and force new ones"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Set unique environment variables
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)_$(shuf -i 1000-9999 -n 1)
export NEXT_PUBLIC_CHUNK_VERSION=$(date +%s)

log "🚀 Starting Nuclear Chunk Cleanup..." "$BLUE"
log "Build Time: $NEXT_PUBLIC_BUILD_TIME" "$GREEN"
log "Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID" "$GREEN"
log "Chunk Version: $NEXT_PUBLIC_CHUNK_VERSION" "$GREEN"

# Stop any running processes
log "🛑 Stopping all processes..." "$BLUE"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Nuclear cleanup - remove EVERYTHING
log "💥 Nuclear cleanup - removing ALL build artifacts..." "$RED"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.next
rm -rf .npm
rm -rf ~/.npm/_cacache
rm -rf /tmp/.next-*

# Remove all TypeScript build info
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Remove any existing chunks with old patterns
find . -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
find . -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true

# Clear system caches
log "🧹 Clearing system caches..." "$BLUE"
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Install dependencies fresh
log "📦 Installing dependencies fresh..." "$BLUE"
npm ci --legacy-peer-deps --ignore-engines --force

# Generate Prisma client
log "🔧 Generating Prisma client..." "$BLUE"
npx prisma generate

# Create a unique build identifier
BUILD_ID=$(date +%s)_$(shuf -i 10000-99999 -n 1)
echo "BUILD_ID=$BUILD_ID" > .build-id

# Build with aggressive cache busting
log "🏗️ Building with nuclear cache busting..." "$BLUE"
NEXT_PUBLIC_BUILD_ID=$BUILD_ID npm run build

# Verify build completed
if [ ! -d ".next" ]; then
    log "❌ Build failed - .next directory not found" "$RED"
    exit 1
fi

# Remove any remaining problematic chunks
log "🗑️ Final cleanup of problematic chunks..." "$BLUE"
find .next -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
find .next -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true

# List all generated chunks
log "📋 Generated chunks:" "$GREEN"
if [ -d ".next/static/chunks" ]; then
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" | wc -l)
    log "✅ Generated $CHUNK_COUNT JavaScript chunks" "$GREEN"
    echo ""
    log "New chunk files:" "$BLUE"
    find .next/static/chunks -name "*.js" -exec basename {} \; | head -10
    echo ""
    
    # Check for problematic chunks
    PROBLEMATIC=$(find .next -name "*4bd1b696-100b9d70ed4e49c1*" -o -name "*1255-97815b72abc5c1f0*" 2>/dev/null || true)
    if [ -n "$PROBLEMATIC" ]; then
        log "⚠️ WARNING: Found problematic chunks after cleanup!" "$YELLOW"
        echo "$PROBLEMATIC"
        log "Removing them..." "$YELLOW"
        find .next -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
        find .next -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true
    else
        log "✅ No problematic chunks found" "$GREEN"
    fi
else
    log "⚠️ No chunks directory found" "$YELLOW"
fi

# Create build markers
echo "$NEXT_PUBLIC_BUILD_TIME" > .next/BUILD_TIMESTAMP
echo "$NEXT_PUBLIC_DEPLOYMENT_ID" > .next/DEPLOYMENT_ID
echo "$BUILD_ID" > .next/BUILD_ID

# Start application
log "🚀 Starting application..." "$BLUE"
pm2 start "npm start" --name jobportal
pm2 save

# Wait for startup
sleep 10

# Check status
if pm2 list | grep -q "jobportal.*online"; then
    log "✅ Application started successfully" "$GREEN"
    
    # Test the application
    log "🧪 Testing application..." "$BLUE"
    if curl -f -s http://localhost:3000 > /dev/null; then
        log "✅ Application is responding" "$GREEN"
    else
        log "⚠️ Application not responding on port 3000" "$YELLOW"
    fi
else
    log "❌ Application failed to start" "$RED"
    pm2 logs jobportal --lines 10
    exit 1
fi

# Final summary
echo ""
log "🎉 NUCLEAR CHUNK CLEANUP COMPLETED!" "$GREEN"
echo ""
log "Summary:" "$BLUE"
log "  - Build Time: $NEXT_PUBLIC_BUILD_TIME" "$GREEN"
log "  - Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID" "$GREEN"
log "  - Build ID: $BUILD_ID" "$GREEN"
log "  - Chunks Generated: $CHUNK_COUNT" "$GREEN"
log "  - Application Status: $(pm2 list | grep jobportal | awk '{print $12}')" "$GREEN"
echo ""
log "🔍 To verify the fix:" "$BLUE"
log "  1. Check browser console - should show no 'Cannot read properties of undefined' errors" "$GREEN"
log "  2. Look for new chunk file names (not 4bd1b696-100b9d70ed4e49c1.js)" "$GREEN"
log "  3. Verify application loads without infinite loading" "$GREEN"
log "  4. Check Network tab for new chunk requests" "$GREEN"
echo ""
log "🚀 Your application should now be working with fresh chunks!" "$GREEN"
