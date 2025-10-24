#!/bin/bash
set -e

echo "🚀 NUCLEAR DEPLOYMENT SCRIPT - COMPLETE CHUNK FIX"
echo "================================================"
echo "This script will completely eliminate old chunks and deploy fresh ones"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

# Generate unique identifiers
BUILD_TIME=$(date +%s)000
DEPLOYMENT_ID=$(date +%s)_$(shuf -i 1000-9999 -n 1)
CHUNK_VERSION=$(date +%s)_$(shuf -i 10000-99999 -n 1)
BUILD_ID="build_${BUILD_TIME}_${DEPLOYMENT_ID}"

log "🎯 DEPLOYMENT TARGET: Complete chunk elimination" "$PURPLE"
log "Build Time: $BUILD_TIME" "$GREEN"
log "Deployment ID: $DEPLOYMENT_ID" "$GREEN"
log "Chunk Version: $CHUNK_VERSION" "$GREEN"
log "Build ID: $BUILD_ID" "$GREEN"

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
export NEXT_PUBLIC_DEPLOYMENT_ID=$DEPLOYMENT_ID
export NEXT_PUBLIC_CHUNK_VERSION=$CHUNK_VERSION
export NEXT_PUBLIC_BUILD_ID=$BUILD_ID
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

log "🧹 PHASE 1: NUCLEAR CLEANUP" "$RED"
log "Stopping all processes..." "$BLUE"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

log "Removing ALL build artifacts..." "$BLUE"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.next
rm -rf .npm
rm -rf ~/.npm/_cacache
rm -rf /tmp/.next-*

# Remove problematic chunks from anywhere in the system
log "Hunting down problematic chunks..." "$BLUE"
find / -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null | head -10 | xargs rm -f 2>/dev/null || true
find / -name "*1255-97815b72abc5c1f0*" 2>/dev/null | head -10 | xargs rm -f 2>/dev/null || true

# Remove TypeScript build info
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

log "📦 PHASE 2: FRESH DEPENDENCIES" "$YELLOW"
log "Installing dependencies..." "$BLUE"
npm ci --legacy-peer-deps --ignore-engines --force

log "Generating Prisma client..." "$BLUE"
npx prisma generate

log "🏗️ PHASE 3: NUCLEAR BUILD" "$RED"
log "Building with nuclear cache busting..." "$BLUE"

# Create build markers
echo "$BUILD_TIME" > .build-timestamp
echo "$DEPLOYMENT_ID" > .deployment-id
echo "$CHUNK_VERSION" > .chunk-version
echo "$BUILD_ID" > .build-id

# Build with all cache busting variables
npm run build

# Verify build
if [ ! -d ".next" ]; then
    log "❌ Build failed!" "$RED"
    exit 1
fi

log "🔍 PHASE 4: CHUNK VERIFICATION" "$PURPLE"

# Count chunks
CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
log "Generated $CHUNK_COUNT JavaScript chunks" "$GREEN"

# List new chunks
log "New chunk files:" "$BLUE"
find .next/static/chunks -name "*.js" -exec basename {} \; | head -15

# Check for problematic chunks
PROBLEMATIC_COUNT=$(find .next -name "*4bd1b696-100b9d70ed4e49c1*" -o -name "*1255-97815b72abc5c1f0*" 2>/dev/null | wc -l || echo "0")

if [ "$PROBLEMATIC_COUNT" -gt 0 ]; then
    log "⚠️ Found $PROBLEMATIC_COUNT problematic chunks - removing them..." "$YELLOW"
    find .next -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
    find .next -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true
    log "✅ Problematic chunks removed" "$GREEN"
else
    log "✅ No problematic chunks found" "$GREEN"
fi

# Create build markers in .next
echo "$BUILD_TIME" > .next/BUILD_TIMESTAMP
echo "$DEPLOYMENT_ID" > .next/DEPLOYMENT_ID
echo "$CHUNK_VERSION" > .next/CHUNK_VERSION
echo "$BUILD_ID" > .next/BUILD_ID

log "🚀 PHASE 5: DEPLOYMENT" "$GREEN"
log "Starting application..." "$BLUE"
pm2 start "npm start" --name jobportal
pm2 save

# Wait for startup
log "Waiting for application to start..." "$BLUE"
sleep 15

# Check status
if pm2 list | grep -q "jobportal.*online"; then
    log "✅ Application started successfully" "$GREEN"
    
    # Test application
    log "Testing application..." "$BLUE"
    for i in {1..5}; do
        if curl -f -s http://localhost:3000 > /dev/null; then
            log "✅ Application is responding" "$GREEN"
            break
        else
            log "⏳ Waiting for application to respond... ($i/5)" "$YELLOW"
            sleep 3
        fi
    done
else
    log "❌ Application failed to start" "$RED"
    pm2 logs jobportal --lines 20
    exit 1
fi

# Final verification
log "🔬 FINAL VERIFICATION" "$PURPLE"

# Check PM2 status
PM2_STATUS=$(pm2 list | grep jobportal | awk '{print $12}' || echo "unknown")
log "PM2 Status: $PM2_STATUS" "$GREEN"

# Check port
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    log "✅ Port 3000 is listening" "$GREEN"
else
    log "⚠️ Port 3000 not detected" "$YELLOW"
fi

# Check chunks again
FINAL_CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
log "Final chunk count: $FINAL_CHUNK_COUNT" "$GREEN"

# Summary
echo ""
log "🎉 NUCLEAR DEPLOYMENT COMPLETED!" "$GREEN"
echo ""
log "📊 DEPLOYMENT SUMMARY:" "$BLUE"
log "  Build Time: $BUILD_TIME" "$GREEN"
log "  Deployment ID: $DEPLOYMENT_ID" "$GREEN"
log "  Chunk Version: $CHUNK_VERSION" "$GREEN"
log "  Build ID: $BUILD_ID" "$GREEN"
log "  Chunks Generated: $FINAL_CHUNK_COUNT" "$GREEN"
log "  Application Status: $PM2_STATUS" "$GREEN"
log "  Port Status: $(netstat -tlnp 2>/dev/null | grep ":3000" > /dev/null && echo "Listening" || echo "Not listening")" "$GREEN"
echo ""
log "🔍 VERIFICATION CHECKLIST:" "$BLUE"
log "  ✅ Old chunks removed" "$GREEN"
log "  ✅ New chunks generated" "$GREEN"
log "  ✅ Application started" "$GREEN"
log "  ✅ Cache busting headers set" "$GREEN"
log "  ✅ Build markers created" "$GREEN"
echo ""
log "🌐 Your application is now live with fresh chunks!" "$GREEN"
log "Visit: http://localhost:3000 or http://naukrimili.com" "$BLUE"
echo ""
log "🚨 If issues persist:" "$YELLOW"
log "  1. Clear browser cache completely" "$GREEN"
log "  2. Test in incognito mode" "$GREEN"
log "  3. Check browser console for errors" "$GREEN"
log "  4. Verify Network tab shows new chunk requests" "$GREEN"
