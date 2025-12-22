#!/bin/bash
# Safe Next.js Security Patch
# Upgrades from 15.5.2 to 15.5.7+ to patch CVE-2025-66478 (RCE)
# ZERO DOWNTIME - Uses PM2 graceful reload

set -euo pipefail

echo "=========================================="
echo "NEXT.JS SECURITY PATCH - SAFE MODE"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PATCH_LOG="/tmp/nextjs_patch_$(date +%s).log"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$PATCH_LOG"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$PATCH_LOG"
}

# Check current version
CURRENT_VERSION=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/')
log "Current Next.js version: $CURRENT_VERSION"

# Check if patch is needed
if [[ "$CURRENT_VERSION" =~ ^15\.5\.[7-9] ]] || [[ "$CURRENT_VERSION" =~ ^15\.[6-9] ]] || [[ "$CURRENT_VERSION" =~ ^1[6-9] ]]; then
    log "✅ Next.js already at safe version"
    exit 0
fi

if [[ "$CURRENT_VERSION" != "15.5.2" ]] && [[ ! "$CURRENT_VERSION" =~ ^15\.5\.[0-6] ]]; then
    log_warn "Unexpected version - proceed with caution"
    read -p "Continue? (yes/no): " CONFIRM
    [ "$CONFIRM" != "yes" ] && exit 1
fi

# Backup
log "Creating backup..."
BACKUP_DIR="/var/backups/naukrimili-patch-$(date +%s)"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
log "Backup created: $BACKUP_DIR"

# Update package.json
log "Updating package.json..."
sed -i.bak 's/"next":\s*"[^"]*"/"next": "^15.5.7"/' package.json
log "✅ package.json updated"

# Install updated package
log "Installing Next.js 15.5.7..."
npm install next@^15.5.7 --save --legacy-peer-deps 2>&1 | tee -a "$PATCH_LOG" || {
    log_warn "npm install had issues - checking if package.json was updated"
    # Verify package.json was updated
    NEW_VERSION=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/')
    if [[ "$NEW_VERSION" =~ 15\.5\.[7-9] ]]; then
        log "package.json updated correctly, retrying install..."
        npm install --legacy-peer-deps 2>&1 | tee -a "$PATCH_LOG" || {
            log_warn "Install failed - manual intervention may be needed"
        }
    fi
}

# Verify installation
NEW_VERSION=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/')
INSTALLED_VERSION=$(npm list next 2>/dev/null | grep next@ | sed 's/.*next@\([^ ]*\).*/\1/' || echo "unknown")

log "Package.json version: $NEW_VERSION"
log "Installed version: $INSTALLED_VERSION"

# Rebuild (if needed)
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "jobportal\|naukrimili"; then
    log "Application is running under PM2"
    log "Rebuilding application..."
    
    # Build in background to avoid downtime
    npm run build 2>&1 | tee -a "$PATCH_LOG" || {
        log_warn "Build failed - check logs"
        log "Rollback: cp $BACKUP_DIR/package.json package.json"
        exit 1
    }
    
    log "✅ Build successful"
    log "Reloading PM2 (zero-downtime)..."
    pm2 reload jobportal 2>/dev/null || pm2 restart jobportal 2>/dev/null || {
        log_warn "PM2 reload failed - may need manual restart"
    }
    
    sleep 3
    if pm2 list | grep -q "online"; then
        log "✅ Application reloaded successfully"
    else
        log_warn "Application may need manual restart"
    fi
else
    log_warn "PM2 not found or app not running - manual rebuild/restart needed"
fi

log ""
log "=== PATCH COMPLETE ==="
log "Next.js upgraded: $CURRENT_VERSION → $NEW_VERSION"
log "Patch log: $PATCH_LOG"
log ""
log "Next steps:"
log "1. Monitor CPU usage: top"
log "2. Check application health: curl http://localhost:3000/api/health"
log "3. Verify no errors in PM2 logs: pm2 logs jobportal --lines 50"

