#!/bin/bash
# Emergency Security Scan Script
# SAFE MODE - Read-only operations first
# Run with: bash scripts/security-emergency-scan.sh

set -euo pipefail

echo "=========================================="
echo "EMERGENCY SECURITY SCAN - SAFE MODE"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCAN_REPORT="/tmp/security_scan_$(date +%s).txt"
echo "Scan report will be saved to: $SCAN_REPORT"
echo ""

# Function to log findings
log_finding() {
    echo -e "$1" | tee -a "$SCAN_REPORT"
}

# ============================================
# PHASE 1: PROCESS ANALYSIS (READ-ONLY)
# ============================================
log_finding "${YELLOW}=== PHASE 1: PROCESS ANALYSIS ===${NC}"

echo "Checking CPU usage..."
TOP_PROCESSES=$(top -bn1 | head -20)
log_finding "$TOP_PROCESSES"

echo ""
echo "High CPU processes (>10%):"
ps aux --sort=-%cpu | head -20 | awk '{if($3>10.0) print $0}' | tee -a "$SCAN_REPORT"

echo ""
echo "Suspicious process names:"
ps aux | grep -iE "crypto|miner|mining|xmrig|ccminer|stratum|nicehash|monero|bitcoin|torrent|wget.*sh|curl.*sh|base64|eval|php.*system" | grep -v grep | tee -a "$SCAN_REPORT" || echo "No obvious suspicious processes found"

echo ""
echo "Processes with suspicious command lines:"
ps auxww | grep -E "wget|curl|bash.*-c|sh.*-c|perl.*-e|python.*-c" | grep -v grep | tee -a "$SCAN_REPORT" || echo "No suspicious command lines found"

# ============================================
# PHASE 2: FILE SYSTEM SCAN (READ-ONLY)
# ============================================
log_finding ""
log_finding "${YELLOW}=== PHASE 2: FILE SYSTEM SCAN ===${NC}"

echo "Scanning for suspicious files in common locations..."

# Check temp directories
echo "Checking /tmp:"
find /tmp -type f -name "*.sh" -o -name "*.php" -o -name "*miner*" -o -name "*crypto*" 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || true

echo ""
echo "Checking /var/tmp:"
find /var/tmp -type f -name "*.sh" -o -name "*.php" -o -name "*miner*" 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || true

echo ""
echo "Checking project directory for suspicious files:"
PROJECT_DIR="/var/www/naukrimili"
if [ -d "$PROJECT_DIR" ]; then
    # Look for suspicious PHP files (shouldn't exist in Next.js project)
    find "$PROJECT_DIR" -type f -name "*.php" 2>/dev/null | tee -a "$SCAN_REPORT" || echo "No PHP files found (expected)"
    
    # Look for suspicious shell scripts
    find "$PROJECT_DIR" -type f -name "*.sh" -exec grep -l "base64\|eval\|wget.*sh\|curl.*sh" {} \; 2>/dev/null | tee -a "$SCAN_REPORT" || echo "No suspicious shell scripts found"
    
    # Look for files with suspicious content
    find "$PROJECT_DIR" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" \) -exec grep -l "eval\|base64\|atob\|Function\|new Function" {} \; 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || echo "No suspicious JS/TS files found"
fi

# Check for hidden files in home directories
echo ""
echo "Checking for hidden suspicious files:"
find /home -type f -name ".*" -size +1M 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || true

# ============================================
# PHASE 3: PERSISTENCE MECHANISMS (READ-ONLY)
# ============================================
log_finding ""
log_finding "${YELLOW}=== PHASE 3: PERSISTENCE MECHANISMS ===${NC}"

echo "Checking cron jobs:"
echo "--- User crontabs ---"
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -u "$user" -l 2>/dev/null | grep -v "^#" | grep -v "^$" | while read line; do
        if [ -n "$line" ]; then
            echo "User: $user | $line" | tee -a "$SCAN_REPORT"
        fi
    done
done

echo ""
echo "--- System crontabs ---"
cat /etc/crontab 2>/dev/null | grep -v "^#" | grep -v "^$" | tee -a "$SCAN_REPORT" || true
ls -la /etc/cron.d/ 2>/dev/null | tee -a "$SCAN_REPORT" || true
ls -la /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/ /etc/cron.monthly/ 2>/dev/null | tee -a "$SCAN_REPORT" || true

echo ""
echo "Checking systemd services:"
systemctl list-units --type=service --state=running | grep -iE "miner|crypto|stratum|torrent" | tee -a "$SCAN_REPORT" || echo "No suspicious services found"

echo ""
echo "Checking for suspicious systemd timers:"
systemctl list-timers --all | grep -v "^$" | tee -a "$SCAN_REPORT" || true

# ============================================
# PHASE 4: NETWORK CONNECTIONS (READ-ONLY)
# ============================================
log_finding ""
log_finding "${YELLOW}=== PHASE 4: NETWORK CONNECTIONS ===${NC}"

echo "Active network connections:"
netstat -tulpn 2>/dev/null | grep -E "ESTABLISHED|LISTEN" | head -30 | tee -a "$SCAN_REPORT" || ss -tulpn 2>/dev/null | head -30 | tee -a "$SCAN_REPORT"

echo ""
echo "Suspicious outbound connections:"
netstat -tulpn 2>/dev/null | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20 | tee -a "$SCAN_REPORT" || true

# ============================================
# PHASE 5: FILE PERMISSIONS & OWNERSHIP
# ============================================
log_finding ""
log_finding "${YELLOW}=== PHASE 5: FILE PERMISSIONS ===${NC}"

echo "Checking for world-writable files in project:"
if [ -d "$PROJECT_DIR" ]; then
    find "$PROJECT_DIR" -type f -perm -002 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || echo "No world-writable files found"
fi

echo ""
echo "Checking for setuid/setgid files:"
find /var/www -type f \( -perm -4000 -o -perm -2000 \) 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || echo "No setuid/setgid files found"

# ============================================
# PHASE 6: RECENT FILE MODIFICATIONS
# ============================================
log_finding ""
log_finding "${YELLOW}=== PHASE 6: RECENT MODIFICATIONS ===${NC}"

echo "Files modified in last 24 hours in /var/www:"
find /var/www -type f -mtime -1 2>/dev/null | head -30 | tee -a "$SCAN_REPORT" || true

echo ""
echo "Files modified in last 24 hours in /tmp:"
find /tmp -type f -mtime -1 2>/dev/null | head -20 | tee -a "$SCAN_REPORT" || true

# ============================================
# SUMMARY
# ============================================
log_finding ""
log_finding "${GREEN}=== SCAN COMPLETE ===${NC}"
log_finding "Full report saved to: $SCAN_REPORT"
log_finding ""
log_finding "${YELLOW}NEXT STEPS:${NC}"
log_finding "1. Review the scan report: cat $SCAN_REPORT"
log_finding "2. If malware found, run remediation script (after review)"
log_finding "3. Do NOT delete files without verification"
echo ""
echo "Scan complete. Review report before taking action."

