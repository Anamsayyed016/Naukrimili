#!/bin/bash
# Security Remediation Script - SAFE MODE
# Only removes files/processes identified as malicious
# Run ONLY after reviewing security-emergency-scan.sh output

set -euo pipefail

echo "=========================================="
echo "SECURITY REMEDIATION - SAFE MODE"
echo "=========================================="
echo "WARNING: This script will REMOVE malicious files"
echo "Ensure you have reviewed the scan report first!"
echo ""
read -p "Have you reviewed the scan report? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborting. Please review scan report first."
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMEDIATION_LOG="/tmp/remediation_$(date +%s).log"
echo "Remediation log: $REMEDIATION_LOG"
echo ""

# Function to safely kill process
kill_malicious_process() {
    local PID=$1
    local NAME=$2
    echo -e "${YELLOW}Killing malicious process: $NAME (PID: $PID)${NC}"
    kill -9 "$PID" 2>/dev/null && echo "Process killed" || echo "Process not found"
    echo "Killed: $NAME (PID: $PID)" >> "$REMEDIATION_LOG"
}

# Function to safely remove file
remove_malicious_file() {
    local FILE=$1
    if [ -f "$FILE" ]; then
        echo -e "${YELLOW}Removing: $FILE${NC}"
        # Backup first
        cp "$FILE" "${FILE}.malware_backup_$(date +%s)" 2>/dev/null || true
        rm -f "$FILE" && echo "File removed" || echo "Failed to remove"
        echo "Removed: $FILE" >> "$REMEDIATION_LOG"
    else
        echo "File not found: $FILE"
    fi
}

# ============================================
# STEP 1: Kill malicious processes
# ============================================
echo -e "${YELLOW}=== STEP 1: Killing Malicious Processes ===${NC}"

# Find and kill crypto miners
ps aux | grep -iE "xmrig|ccminer|stratum|nicehash|miner" | grep -v grep | while read line; do
    PID=$(echo "$line" | awk '{print $2}')
    NAME=$(echo "$line" | awk '{print $11}')
    kill_malicious_process "$PID" "$NAME"
done

# Find suspicious processes with wget/curl downloading scripts
ps aux | grep -E "wget.*\.sh|curl.*\.sh|bash.*-c.*wget|bash.*-c.*curl" | grep -v grep | while read line; do
    PID=$(echo "$line" | awk '{print $2}')
    NAME=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
    kill_malicious_process "$PID" "$NAME"
done

# ============================================
# STEP 2: Remove malicious files from temp
# ============================================
echo ""
echo -e "${YELLOW}=== STEP 2: Cleaning Temp Directories ===${NC}"

# Remove suspicious files from /tmp
find /tmp -type f \( -name "*miner*" -o -name "*crypto*" -o -name "*.sh" -size +100k \) 2>/dev/null | while read file; do
    # Check if it's suspicious
    if grep -qE "base64|eval|wget.*sh|curl.*sh|miner|crypto" "$file" 2>/dev/null; then
        remove_malicious_file "$file"
    fi
done

# Clean /var/tmp
find /var/tmp -type f \( -name "*miner*" -o -name "*crypto*" \) 2>/dev/null | while read file; do
    remove_malicious_file "$file"
done

# ============================================
# STEP 3: Remove malicious cron jobs
# ============================================
echo ""
echo -e "${YELLOW}=== STEP 3: Cleaning Cron Jobs ===${NC}"

# Backup crontabs before modification
for user in $(cut -f1 -d: /etc/passwd); do
    crontab_file="/tmp/crontab_backup_${user}_$(date +%s)"
    crontab -u "$user" -l > "$crontab_file" 2>/dev/null || continue
    
    # Check for suspicious entries
    if grep -qE "wget.*\.sh|curl.*\.sh|base64|eval|miner|crypto" "$crontab_file" 2>/dev/null; then
        echo "Suspicious cron found for user: $user"
        # Remove suspicious lines
        grep -vE "wget.*\.sh|curl.*\.sh|base64|eval|miner|crypto" "$crontab_file" | crontab -u "$user" - 2>/dev/null || true
        echo "Cleaned crontab for: $user" >> "$REMEDIATION_LOG"
    fi
done

# ============================================
# STEP 4: Remove malicious files from project
# ============================================
echo ""
echo -e "${YELLOW}=== STEP 4: Cleaning Project Directory ===${NC}"

PROJECT_DIR="/var/www/naukrimili"

if [ -d "$PROJECT_DIR" ]; then
    # Remove PHP files (shouldn't exist in Next.js project)
    find "$PROJECT_DIR" -type f -name "*.php" 2>/dev/null | while read file; do
        # Check if it's malicious
        if grep -qE "base64|eval|system|exec|shell_exec|passthru" "$file" 2>/dev/null; then
            remove_malicious_file "$file"
        fi
    done
    
    # Remove suspicious shell scripts
    find "$PROJECT_DIR" -type f -name "*.sh" -exec grep -l "base64\|eval\|wget.*sh\|curl.*sh" {} \; 2>/dev/null | while read file; do
        remove_malicious_file "$file"
    done
fi

# ============================================
# STEP 5: Clean systemd services/timers
# ============================================
echo ""
echo -e "${YELLOW}=== STEP 5: Cleaning System Services ===${NC}"

# Disable suspicious services
systemctl list-units --type=service --all | grep -iE "miner|crypto|stratum" | awk '{print $1}' | while read service; do
    echo "Disabling suspicious service: $service"
    systemctl stop "$service" 2>/dev/null || true
    systemctl disable "$service" 2>/dev/null || true
    echo "Disabled: $service" >> "$REMEDIATION_LOG"
done

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${GREEN}=== REMEDIATION COMPLETE ===${NC}"
echo "Remediation log: $REMEDIATION_LOG"
echo ""
echo "Next steps:"
echo "1. Review remediation log"
echo "2. Check CPU usage: top"
echo "3. Monitor for 5-10 minutes"
echo "4. If CPU normalizes, proceed to security hardening"

