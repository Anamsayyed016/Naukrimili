#!/bin/bash
# Security Verification Script
# Run AFTER remediation to verify system is clean

set -euo pipefail

echo "=========================================="
echo "SECURITY VERIFICATION - POST REMEDIATION"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VERIFY_LOG="/tmp/security_verify_$(date +%s).log"
CPU_BEFORE=""
CPU_AFTER=""

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$VERIFY_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$VERIFY_LOG"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$VERIFY_LOG"
}

# ============================================
# 1. CPU Usage Check
# ============================================
log "=== 1. CPU Usage Verification ==="

CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
log "Current CPU Usage: ${CPU_USAGE}%"

if (( $(echo "$CPU_USAGE < 20" | bc -l) )); then
    log "✅ CPU usage is normal (<20%)"
elif (( $(echo "$CPU_USAGE < 50" | bc -l) )); then
    log_warn "CPU usage is moderate (${CPU_USAGE}%) - monitor"
else
    log_error "CPU usage is still high (${CPU_USAGE}%) - investigation needed"
fi

# Top processes
log "Top 5 CPU processes:"
top -bn1 | head -12 | tail -6 | tee -a "$VERIFY_LOG"

# ============================================
# 2. Malware Process Check
# ============================================
log ""
log "=== 2. Malware Process Check ==="

MALWARE_PROCESSES=0
for pattern in "xmrig" "syssls" "systemhelper" "minerd" "cpuminer" "crypto.*mining"; do
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        log_error "SUSPICIOUS PROCESS STILL RUNNING: $pattern"
        ps aux | grep -i "$pattern" | grep -v grep | tee -a "$VERIFY_LOG"
        MALWARE_PROCESSES=$((MALWARE_PROCESSES + 1))
    fi
done

if [ $MALWARE_PROCESSES -eq 0 ]; then
    log "✅ No malware processes detected"
else
    log_error "$MALWARE_PROCESSES suspicious processes still running"
fi

# ============================================
# 3. Malware File Check
# ============================================
log ""
log "=== 3. Malware File Check ==="

MALWARE_FILES=0
SCAN_DIRS=("/tmp" "/var/tmp" "/dev/shm" "/var/www/naukrimili/.next/cache")

for dir in "${SCAN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        for pattern in "xmrig" "syssls" "systemhelper" "minerd" "cpuminer"; do
            if find "$dir" -type f -iname "*$pattern*" 2>/dev/null | grep -q .; then
                log_error "MALWARE FILE FOUND in $dir: *$pattern*"
                find "$dir" -type f -iname "*$pattern*" 2>/dev/null | head -5 | tee -a "$VERIFY_LOG"
                MALWARE_FILES=$((MALWARE_FILES + 1))
            fi
        done
    fi
done

if [ $MALWARE_FILES -eq 0 ]; then
    log "✅ No malware files detected"
else
    log_error "$MALWARE_FILES malware files still present"
fi

# ============================================
# 4. Cron Job Check
# ============================================
log ""
log "=== 4. Cron Job Verification ==="

MALICIOUS_CRON=0
for user in $(cut -d: -f1 /etc/passwd); do
    crontab -u "$user" -l 2>/dev/null | grep -v "^#" | grep -v "^$" | while read line; do
        if echo "$line" | grep -qE "wget.*\.sh|curl.*\.sh|base64|eval|miner|crypto"; then
            log_error "MALICIOUS CRON in $user: $line"
            MALICIOUS_CRON=$((MALICIOUS_CRON + 1))
        fi
    done
done

if [ $MALICIOUS_CRON -eq 0 ]; then
    log "✅ No malicious cron jobs detected"
else
    log_error "$MALICIOUS_CRON malicious cron jobs found"
fi

# ============================================
# 5. Application Health Check
# ============================================
log ""
log "=== 5. Application Health Check ==="

# Check PM2
if command -v pm2 >/dev/null 2>&1; then
    PM2_STATUS=$(pm2 list | grep -E "jobportal|naukrimili" | grep -c "online" || echo "0")
    if [ "$PM2_STATUS" -gt 0 ]; then
        log "✅ PM2 application is running"
        pm2 list | grep -E "jobportal|naukrimili" | tee -a "$VERIFY_LOG"
    else
        log_error "PM2 application is not running"
    fi
fi

# Check HTTP endpoint
if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    log "✅ Application health endpoint responding"
else
    log_warn "Application health endpoint not responding (may be normal if endpoint doesn't exist)"
fi

# ============================================
# 6. Package Version Check
# ============================================
log ""
log "=== 6. Package Version Verification ==="

if [ -f "package.json" ]; then
    NEXTJS_VERSION=$(grep -E '"next":' package.json | sed -E 's/.*"next":\s*"([^"]+)".*/\1/')
    log "Next.js version: $NEXTJS_VERSION"
    
    # Check if version is safe (15.5.7+)
    if [[ "$NEXTJS_VERSION" =~ ^15\.5\.[7-9] ]] || [[ "$NEXTJS_VERSION" =~ ^15\.[6-9] ]] || [[ "$NEXTJS_VERSION" =~ ^1[6-9] ]]; then
        log "✅ Next.js is at safe version"
    elif [[ "$NEXTJS_VERSION" == "15.5.2" ]] || [[ "$NEXTJS_VERSION" < "15.5.7" ]]; then
        log_error "Next.js version $NEXTJS_VERSION is vulnerable (CVE-2025-66478)"
        log "Upgrade to 15.5.7+ required"
    else
        log_warn "Next.js version $NEXTJS_VERSION - verify if safe"
    fi
else
    log_warn "package.json not found"
fi

# ============================================
# 7. Network Connections Check
# ============================================
log ""
log "=== 7. Network Connections ==="

SUSPICIOUS_CONN=$(netstat -tulpn 2>/dev/null | grep -iE "xmrig|mining|stratum" || ss -tulpn 2>/dev/null | grep -iE "xmrig|mining|stratum" || echo "")
if [ -z "$SUSPICIOUS_CONN" ]; then
    log "✅ No suspicious network connections"
else
    log_error "Suspicious network connections found:"
    echo "$SUSPICIOUS_CONN" | tee -a "$VERIFY_LOG"
fi

# ============================================
# SUMMARY
# ============================================
log ""
log "=== VERIFICATION SUMMARY ==="
log "CPU Usage: ${CPU_USAGE}%"
log "Malware Processes: $MALWARE_PROCESSES"
log "Malware Files: $MALWARE_FILES"
log "Malicious Cron Jobs: $MALICIOUS_CRON"
log ""
log "Verification log: $VERIFY_LOG"

if [ $((MALWARE_PROCESSES + MALWARE_FILES + MALICIOUS_CRON)) -eq 0 ] && (( $(echo "$CPU_USAGE < 50" | bc -l) )); then
    log "✅ SYSTEM APPEARS CLEAN"
    exit 0
else
    log_error "⚠️  ISSUES DETECTED - Review log and take action"
    exit 1
fi

