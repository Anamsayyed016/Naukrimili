#!/bin/bash
# Server Security Hardening Script
# Run AFTER malware removal to prevent reinfection

set -euo pipefail

echo "=========================================="
echo "SERVER SECURITY HARDENING"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

HARDEN_LOG="/tmp/security_harden_$(date +%s).log"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$HARDEN_LOG"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$HARDEN_LOG"
}

# ============================================
# 1. Filesystem Hardening
# ============================================
log "=== 1. Filesystem Hardening ==="

if [ "$EUID" -eq 0 ]; then
    # Secure /tmp
    if ! mount | grep -q "/tmp.*noexec"; then
        log "Securing /tmp with noexec, nosuid, nodev..."
        mount -o remount,noexec,nosuid,nodev /tmp 2>/dev/null || log_warn "Could not remount /tmp"
    fi
    
    # Secure /var/tmp
    if ! mount | grep -q "/var/tmp.*noexec"; then
        log "Securing /var/tmp..."
        mount -o remount,noexec,nosuid,nodev /var/tmp 2>/dev/null || log_warn "Could not remount /var/tmp"
    fi
    
    log "✅ Filesystem hardening applied"
else
    log_warn "Not running as root - filesystem hardening skipped"
fi

# ============================================
# 2. File Permissions
# ============================================
log "=== 2. Securing File Permissions ==="

PROJECT_DIR="/var/www/naukrimili"

if [ -d "$PROJECT_DIR" ]; then
    # Remove world-writable permissions
    find "$PROJECT_DIR" -type f -perm -002 -exec chmod 644 {} \; 2>/dev/null || true
    find "$PROJECT_DIR" -type d -perm -002 -exec chmod 755 {} \; 2>/dev/null || true
    
    # Secure sensitive files
    [ -f "$PROJECT_DIR/.env" ] && chmod 600 "$PROJECT_DIR/.env" 2>/dev/null || true
    [ -f "$PROJECT_DIR/.env.local" ] && chmod 600 "$PROJECT_DIR/.env.local" 2>/dev/null || true
    
    log "✅ File permissions secured"
fi

# ============================================
# 3. Firewall Rules (if ufw/iptables available)
# ============================================
log "=== 3. Firewall Configuration ==="

if command -v ufw >/dev/null 2>&1; then
    log "Configuring UFW firewall..."
    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    # Enable firewall (if not already)
    ufw --force enable 2>/dev/null || true
    log "✅ UFW configured"
elif command -v iptables >/dev/null 2>&1 && [ "$EUID" -eq 0 ]; then
    log "Configuring iptables..."
    # Basic rules (adjust as needed)
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true
    log "✅ iptables configured (rules may need to be saved)"
else
    log_warn "No firewall tool found - configure manually"
fi

# ============================================
# 4. SSH Hardening Recommendations
# ============================================
log "=== 4. SSH Hardening ==="

SSH_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSH_CONFIG" ] && [ "$EUID" -eq 0 ]; then
    log "SSH Configuration Recommendations:"
    log "  - PermitRootLogin no"
    log "  - PasswordAuthentication no (use keys)"
    log "  - AllowUsers your_username"
    log "  - Port 2222 (change from default)"
    log "  - MaxAuthTries 3"
    log ""
    log "Review and edit: $SSH_CONFIG"
    log "Then restart: systemctl restart sshd"
else
    log_warn "Cannot access SSH config (need root or file doesn't exist)"
fi

# ============================================
# 5. Monitor Cron Jobs
# ============================================
log "=== 5. Cron Monitoring ==="

log "Setting up cron monitoring..."
# Create a script to monitor cron changes
MONITOR_SCRIPT="/usr/local/bin/monitor-cron.sh"
if [ "$EUID" -eq 0 ]; then
    cat > "$MONITOR_SCRIPT" << 'EOF'
#!/bin/bash
# Monitor cron jobs for changes
LOG="/var/log/cron-monitor.log"
for user in $(cut -d: -f1 /etc/passwd); do
    crontab -u "$user" -l 2>/dev/null | while read line; do
        if echo "$line" | grep -qE "wget|curl|base64|eval"; then
            echo "[$(date)] Suspicious cron in $user: $line" >> "$LOG"
        fi
    done
done
EOF
    chmod +x "$MONITOR_SCRIPT"
    log "✅ Cron monitor script created"
else
    log_warn "Cannot create monitor script (need root)"
fi

# ============================================
# 6. Fail2Ban Setup (if available)
# ============================================
log "=== 6. Fail2Ban Configuration ==="

if command -v fail2ban-client >/dev/null 2>&1; then
    log "Fail2Ban is installed"
    if [ "$EUID" -eq 0 ]; then
        systemctl enable fail2ban 2>/dev/null || true
        systemctl start fail2ban 2>/dev/null || true
        log "✅ Fail2Ban enabled"
    fi
else
    log_warn "Fail2Ban not installed - consider installing for brute-force protection"
fi

# ============================================
# 7. Disable Unnecessary Services
# ============================================
log "=== 7. Service Audit ==="

if command -v systemctl >/dev/null 2>&1 && [ "$EUID" -eq 0 ]; then
    log "Checking for unnecessary services..."
    # List running services
    systemctl list-units --type=service --state=running | grep -vE "ssh|nginx|pm2|postgresql|systemd" | head -10
    log "Review and disable unnecessary services manually"
fi

# ============================================
# SUMMARY
# ============================================
log ""
log "=== HARDENING COMPLETE ==="
log "Log file: $HARDEN_LOG"
log ""
log "Next steps:"
log "1. Review SSH configuration: /etc/ssh/sshd_config"
log "2. Configure firewall rules"
log "3. Install fail2ban if not installed"
log "4. Set up log monitoring"
log "5. Review and disable unnecessary services"

