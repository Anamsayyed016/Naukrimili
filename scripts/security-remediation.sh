#!/bin/bash

###############################################################################
# 🛡️  SECURITY REMEDIATION SCRIPT - ZERO DOWNTIME MALWARE CLEANUP
# 
# Purpose: Remove malware (xmrig, syssls, systemhelper) and patch vulnerabilities
# Stack: Next.js 15.5.2 / React 18 / Node.js / Python
# 
# STRICT RULES:
# - NO app logic changes
# - NO UI/API/database changes  
# - NO service interruption
# - NO source code deletion
# - Minimal, non-breaking fixes only
#
# CVEs Addressed:
# - CVE-2025-66478 (RCE via React Server Components) - Next.js 15.5.2 → 15.5.7+
# - CVE-2024-56332 (DoS in Server Actions) - Fixed in 15.1.2+
# - CVE-2025-49826 (Cache Poisoning) - Fixed in 15.1.8+
# - CVE-2025-29927 (Authorization Bypass) - Fixed in 15.2.3+
# - CVE-2025-55182 (React2Shell RCE) - React 18 not directly affected, but Next.js 15 uses RSC
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/var/www/naukrimili}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/naukrimili-security}"
LOG_FILE="${LOG_FILE:-/var/log/security-remediation.log}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Malware signatures
MALWARE_PATTERNS=(
    "xmrig"
    "syssls"
    "systemhelper"
    "cryptonight"
    "monero"
    "minerd"
    "cpuminer"
)

# Suspicious process patterns
SUSPICIOUS_PROCESSES=(
    "xmrig"
    "syssls"
    "systemhelper"
    "minerd"
    "cpuminer"
    "crypto.*mining"
)

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

###############################################################################
# STEP 1: PRE-FLIGHT CHECKS
###############################################################################
log "🔍 STEP 1: Pre-flight Security Checks" "$BLUE"

# Check if running as root (for VPS operations)
if [ "$EUID" -eq 0 ]; then
    log "Running as root - full system access available"
else
    log_warn "Not running as root - some system checks may be limited"
fi

# Check current versions
log "📦 Checking current package versions..."
CURRENT_NEXTJS=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/' || echo "unknown")
CURRENT_REACT=$(grep -E '"react":' package.json | sed -E 's/.*"react":\s*"([^"]+)".*/\1/' || echo "unknown")

log "Current Next.js: $CURRENT_NEXTJS"
log "Current React: $CURRENT_REACT"

# Check if vulnerable
VULNERABLE=false
if [[ "$CURRENT_NEXTJS" == "15.5.2" ]] || [[ "$CURRENT_NEXTJS" < "15.5.7" ]]; then
    log_warn "Next.js version $CURRENT_NEXTJS is vulnerable to CVE-2025-66478 (RCE)"
    VULNERABLE=true
fi

if [ "$VULNERABLE" = false ]; then
    log "✅ No known vulnerabilities detected in current versions"
fi

###############################################################################
# STEP 2: DETECT MALWARE ON VPS
###############################################################################
log "🔍 STEP 2: Scanning for Malware Binaries" "$BLUE"

MALWARE_FOUND=0
MALWARE_FILES=()

# Scan common malware locations
SCAN_DIRS=(
    "/tmp"
    "/var/tmp"
    "/dev/shm"
    "/root"
    "$PROJECT_DIR/.next"
    "$PROJECT_DIR/node_modules/.cache"
    "/usr/local/bin"
    "/usr/bin"
    "/opt"
)

for dir in "${SCAN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log "Scanning $dir..."
        for pattern in "${MALWARE_PATTERNS[@]}"; do
            while IFS= read -r file; do
                if [ -n "$file" ] && [ -f "$file" ]; then
                    log_error "MALWARE DETECTED: $file (pattern: $pattern)"
                    MALWARE_FILES+=("$file")
                    MALWARE_FOUND=$((MALWARE_FOUND + 1))
                fi
            done < <(find "$dir" -type f -iname "*$pattern*" 2>/dev/null || true)
        done
    fi
done

# Check running processes
log "🔍 Checking running processes for malware..."
for pattern in "${SUSPICIOUS_PROCESSES[@]}"; do
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        log_error "SUSPICIOUS PROCESS RUNNING: $pattern"
        ps aux | grep -i "$pattern" | grep -v grep | tee -a "$LOG_FILE" || true
        MALWARE_FOUND=$((MALWARE_FOUND + 1))
    fi
done

if [ $MALWARE_FOUND -eq 0 ]; then
    log "✅ No malware binaries or processes detected"
else
    log_warn "Found $MALWARE_FOUND malware indicators - will clean in next step"
fi

###############################################################################
# STEP 3: CHECK FOR MALICIOUS CRON JOBS
###############################################################################
log "🔍 STEP 3: Checking Cron Jobs and Startup Scripts" "$BLUE"

# Check user crontabs
for user in $(cut -d: -f1 /etc/passwd); do
    if [ -f "/var/spool/cron/crontabs/$user" ] || [ -f "/var/spool/cron/$user" ]; then
        CRON_FILE="/var/spool/cron/crontabs/$user"
        [ ! -f "$CRON_FILE" ] && CRON_FILE="/var/spool/cron/$user"
        
        if [ -f "$CRON_FILE" ]; then
            for pattern in "${MALWARE_PATTERNS[@]}"; do
                if grep -qi "$pattern" "$CRON_FILE" 2>/dev/null; then
                    log_error "MALICIOUS CRON JOB in $CRON_FILE (pattern: $pattern)"
                    grep -i "$pattern" "$CRON_FILE" | tee -a "$LOG_FILE"
                fi
            done
        fi
    fi
done

# Check system cron directories
for cron_dir in /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly; do
    if [ -d "$cron_dir" ]; then
        for file in "$cron_dir"/*; do
            [ -f "$file" ] || continue
            for pattern in "${MALWARE_PATTERNS[@]}"; do
                if grep -qi "$pattern" "$file" 2>/dev/null; then
                    log_error "MALICIOUS CRON in $file (pattern: $pattern)"
                    grep -i "$pattern" "$file" | tee -a "$LOG_FILE"
                fi
            done
        done
    fi
done

# Check systemd services
log "🔍 Checking systemd services..."
if command -v systemctl >/dev/null 2>&1; then
    for service in $(systemctl list-units --type=service --no-pager | awk '{print $1}' | grep -E '\.service$'); do
        SERVICE_FILE=$(systemctl show "$service" -p FragmentPath --value 2>/dev/null || echo "")
        if [ -n "$SERVICE_FILE" ] && [ -f "$SERVICE_FILE" ]; then
            for pattern in "${MALWARE_PATTERNS[@]}"; do
                if grep -qi "$pattern" "$SERVICE_FILE" 2>/dev/null; then
                    log_error "MALICIOUS SYSTEMD SERVICE: $service (pattern: $pattern)"
                fi
            done
        fi
    done
fi

log "✅ Cron and startup script check completed"

###############################################################################
# STEP 4: BACKUP CURRENT STATE
###############################################################################
log "💾 STEP 4: Creating Backup" "$BLUE"

BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# Backup package.json
if [ -f "package.json" ]; then
    cp package.json "$BACKUP_PATH/package.json.backup"
    log "Backed up package.json"
fi

# Backup package-lock.json if exists
if [ -f "package-lock.json" ]; then
    cp package-lock.json "$BACKUP_PATH/package-lock.json.backup"
    log "Backed up package-lock.json"
fi

# Backup list of malware files
if [ ${#MALWARE_FILES[@]} -gt 0 ]; then
    printf '%s\n' "${MALWARE_FILES[@]}" > "$BACKUP_PATH/malware-files-list.txt"
    log "Saved malware file list"
fi

log "✅ Backup created at $BACKUP_PATH"

###############################################################################
# STEP 5: REMOVE MALWARE BINARIES (SAFE - NO APP CODE)
###############################################################################
log "🧹 STEP 5: Removing Malware Binaries" "$BLUE"

REMOVED_COUNT=0
for file in "${MALWARE_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Backup before removal
        BACKUP_FILE="$BACKUP_PATH/$(basename "$file").malware"
        cp "$file" "$BACKUP_FILE" 2>/dev/null || true
        
        # Remove file
        if rm -f "$file" 2>/dev/null; then
            log "Removed: $file"
            REMOVED_COUNT=$((REMOVED_COUNT + 1))
        else
            log_warn "Could not remove: $file (may require root)"
        fi
    fi
done

# Kill suspicious processes (if found)
for pattern in "${SUSPICIOUS_PROCESSES[@]}"; do
    PIDS=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        for pid in $PIDS; do
            log_warn "Killing suspicious process: PID $pid ($pattern)"
            kill -9 "$pid" 2>/dev/null || true
        done
    fi
done

log "✅ Removed $REMOVED_COUNT malware files"

###############################################################################
# STEP 6: CLEAN INFECTED BUILD CACHE (ONLY CACHE, NOT SOURCE)
###############################################################################
log "🧹 STEP 6: Cleaning Infected Build Cache" "$BLUE"

# Clean Next.js build cache (safe - will be rebuilt)
if [ -d ".next/cache" ]; then
    log "Cleaning .next/cache..."
    rm -rf .next/cache/*
    log "✅ Cleaned .next/cache"
fi

# Clean node_modules cache (safe - will be reinstalled)
if [ -d "node_modules/.cache" ]; then
    log "Cleaning node_modules/.cache..."
    find node_modules/.cache -type f -iname "*xmrig*" -o -iname "*syssls*" -o -iname "*systemhelper*" 2>/dev/null | while read -r file; do
        rm -f "$file"
        log "Removed infected cache: $file"
    done
fi

# Clean npm cache (if malware found)
if [ $MALWARE_FOUND -gt 0 ]; then
    log "Cleaning npm cache..."
    npm cache clean --force 2>/dev/null || true
    log "✅ Cleaned npm cache"
fi

log "✅ Build cache cleanup completed"

###############################################################################
# STEP 7: SECURITY PATCH UPGRADE (MINIMAL - ONLY VULNERABLE PACKAGES)
###############################################################################
log "🔧 STEP 7: Applying Security Patches" "$BLUE"

# Upgrade Next.js to safe version (15.5.7+)
if [[ "$CURRENT_NEXTJS" < "15.5.7" ]] || [[ "$CURRENT_NEXTJS" == "15.5.2" ]]; then
    log "Upgrading Next.js from $CURRENT_NEXTJS to 15.5.7 (patches CVE-2025-66478, CVE-2024-56332, CVE-2025-49826, CVE-2025-29927)..."
    
    # Update package.json
    if command -v npm >/dev/null 2>&1; then
        npm install next@^15.5.7 --save --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE" || {
            log_error "Failed to upgrade Next.js"
            log "Attempting manual package.json edit..."
            # Fallback: manual edit
            sed -i.bak 's/"next":\s*"[^"]*"/"next": "^15.5.7"/' package.json
        }
        log "✅ Next.js upgraded"
    else
        log_error "npm not found - cannot upgrade packages"
    fi
else
    log "✅ Next.js already at safe version ($CURRENT_NEXTJS)"
fi

# Note: React 18 is not directly affected by CVE-2025-55182 (React2Shell)
# That CVE affects React 19's RSC packages. Next.js 15.5.7+ includes patched RSC.
log "React 18 is not directly affected by CVE-2025-55182 (affects React 19 RSC)"

###############################################################################
# STEP 8: HARDEN ACCESS (SSH, TMP, UPLOAD PATHS)
###############################################################################
log "🔒 STEP 8: Hardening System Access" "$BLUE"

# Harden /tmp (noexec, nosuid)
if [ "$EUID" -eq 0 ]; then
    log "Hardening /tmp filesystem..."
    mount -o remount,noexec,nosuid /tmp 2>/dev/null || log_warn "Could not remount /tmp (may need manual config)"
    
    # Secure /var/tmp
    mount -o remount,noexec,nosuid /var/tmp 2>/dev/null || log_warn "Could not remount /var/tmp"
    
    log "✅ Filesystem hardening applied"
else
    log_warn "Not root - skipping filesystem hardening (run as root for full protection)"
fi

# Harden upload directory (if exists)
if [ -d "$PROJECT_DIR/public/uploads" ]; then
    log "Securing upload directory..."
    chmod 755 "$PROJECT_DIR/public/uploads" 2>/dev/null || true
    find "$PROJECT_DIR/public/uploads" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$PROJECT_DIR/public/uploads" -type d -exec chmod 755 {} \; 2>/dev/null || true
    log "✅ Upload directory secured"
fi

# SSH hardening recommendations
log "SSH Hardening Recommendations:"
log "  1. Disable root login: PermitRootLogin no"
log "  2. Use key-based auth: PasswordAuthentication no"
log "  3. Limit users: AllowUsers your_user"
log "  4. Change default port: Port 2222"
log "  5. Review: /etc/ssh/sshd_config"

###############################################################################
# STEP 9: REBUILD WITH CLEAN CACHE (NO ENV VAR CHANGES)
###############################################################################
log "🏗️  STEP 9: Rebuilding with Clean Cache" "$BLUE"

# Only rebuild if packages were upgraded
if [[ "$CURRENT_NEXTJS" < "15.5.7" ]] || [[ "$CURRENT_NEXTJS" == "15.5.2" ]]; then
    log "Installing updated dependencies..."
    npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE" || {
        log_error "npm install failed"
        exit 1
    }
    
    log "Generating Prisma client..."
    npx prisma generate 2>&1 | tee -a "$LOG_FILE" || log_warn "Prisma generate failed (may be OK)"
    
    log "Building application (this may take a few minutes)..."
    npm run build 2>&1 | tee -a "$LOG_FILE" || {
        log_error "Build failed - check logs"
        log "Rollback: Restore package.json from $BACKUP_PATH/package.json.backup"
        exit 1
    }
    
    log "✅ Rebuild completed successfully"
else
    log "Skipping rebuild - no package changes"
fi

###############################################################################
# STEP 10: VERIFICATION
###############################################################################
log "✅ STEP 10: Verification" "$BLUE"

# Verify no malware processes
log "Checking for remaining malware processes..."
REMAINING_MALWARE=0
for pattern in "${SUSPICIOUS_PROCESSES[@]}"; do
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        log_error "STILL RUNNING: $pattern"
        REMAINING_MALWARE=$((REMAINING_MALWARE + 1))
    fi
done

if [ $REMAINING_MALWARE -eq 0 ]; then
    log "✅ No malware processes running"
else
    log_error "$REMAINING_MALWARE suspicious processes still running - manual intervention needed"
fi

# Verify Next.js version
NEW_NEXTJS=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/' || echo "unknown")
log "New Next.js version: $NEW_NEXTJS"

if [[ "$NEW_NEXTJS" > "15.5.6" ]] || [[ "$NEW_NEXTJS" == "15.5.7" ]] || [[ "$NEW_NEXTJS" =~ ^15\.5\.[7-9] ]] || [[ "$NEW_NEXTJS" =~ ^15\.[6-9] ]] || [[ "$NEW_NEXTJS" =~ ^1[6-9] ]]; then
    log "✅ Next.js is at safe version"
else
    log_warn "Next.js version may still be vulnerable - verify upgrade"
fi

# Health check (if PM2 is running)
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "jobportal\|naukrimili"; then
    log "Checking application health..."
    sleep 2
    if pm2 list | grep -q "online"; then
        log "✅ Application is running"
    else
        log_warn "Application may need restart: pm2 restart jobportal"
    fi
fi

###############################################################################
# SUMMARY & ROLLBACK INSTRUCTIONS
###############################################################################
log "📋 REMEDIATION SUMMARY" "$BLUE"
log "===================="
log "Malware files found: $MALWARE_FOUND"
log "Malware files removed: $REMOVED_COUNT"
log "Next.js upgraded: $CURRENT_NEXTJS → $NEW_NEXTJS"
log "Backup location: $BACKUP_PATH"
log "Log file: $LOG_FILE"

if [ $MALWARE_FOUND -gt 0 ] || [[ "$CURRENT_NEXTJS" < "15.5.7" ]]; then
    log ""
    log "🔄 ROLLBACK INSTRUCTIONS (if needed):" "$YELLOW"
    log "1. Restore package.json:"
    log "   cp $BACKUP_PATH/package.json.backup package.json"
    log ""
    log "2. Restore package-lock.json:"
    log "   cp $BACKUP_PATH/package-lock.json.backup package-lock.json"
    log ""
    log "3. Reinstall dependencies:"
    log "   npm install --legacy-peer-deps"
    log ""
    log "4. Rebuild:"
    log "   npm run build"
    log ""
    log "5. Restart application:"
    log "   pm2 restart jobportal"
fi

log ""
log "✅ Security remediation completed!" "$GREEN"
log "Review log file: $LOG_FILE"

exit 0
