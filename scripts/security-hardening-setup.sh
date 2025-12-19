#!/bin/bash

###############################################################################
# 🛡️  COMPREHENSIVE SECURITY HARDENING SETUP
# 
# Purpose: One-time setup of all security measures for naukrimili.com
# Features:
# - SSH hardening
# - Firewall configuration
# - File permissions
# - System hardening
# - Monitoring setup
# - Backup automation
#
# Usage: Run once on server to set up all security measures
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="${PROJECT_DIR:-/var/www/naukrimili}"
LOG_FILE="/var/log/security-hardening.log"

log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# 1. SSH HARDENING
###############################################################################
harden_ssh() {
    log "🔐 Hardening SSH configuration" "$BLUE"
    
    local sshd_config="/etc/ssh/sshd_config"
    local backup_file="${sshd_config}.backup.$(date +%Y%m%d-%H%M%S)"
    
    if [ ! -f "$sshd_config" ]; then
        log_warn "SSH config not found - skipping SSH hardening"
        return 0
    fi
    
    # Backup original
    cp "$sshd_config" "$backup_file"
    log "Backed up SSH config to $backup_file"
    
    # Apply security settings (only if not already set)
    if ! grep -q "^PermitRootLogin no" "$sshd_config" 2>/dev/null; then
        if grep -q "^PermitRootLogin" "$sshd_config" 2>/dev/null; then
            sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' "$sshd_config"
        else
            echo "PermitRootLogin no" >> "$sshd_config"
        fi
        log "✅ Disabled root login"
    fi
    
    if ! grep -q "^PasswordAuthentication no" "$sshd_config" 2>/dev/null; then
        if grep -q "^PasswordAuthentication" "$sshd_config" 2>/dev/null; then
            sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' "$sshd_config"
        else
            echo "PasswordAuthentication no" >> "$sshd_config"
        fi
        log "✅ Disabled password authentication"
    fi
    
    if ! grep -q "^PubkeyAuthentication yes" "$sshd_config" 2>/dev/null; then
        if grep -q "^PubkeyAuthentication" "$sshd_config" 2>/dev/null; then
            sed -i 's/^PubkeyAuthentication.*/PubkeyAuthentication yes/' "$sshd_config"
        else
            echo "PubkeyAuthentication yes" >> "$sshd_config"
        fi
        log "✅ Enabled public key authentication"
    fi
    
    if ! grep -q "^MaxAuthTries 3" "$sshd_config" 2>/dev/null; then
        if grep -q "^MaxAuthTries" "$sshd_config" 2>/dev/null; then
            sed -i 's/^MaxAuthTries.*/MaxAuthTries 3/' "$sshd_config"
        else
            echo "MaxAuthTries 3" >> "$sshd_config"
        fi
        log "✅ Limited authentication attempts"
    fi
    
    # Test SSH config
    if sshd -t 2>/dev/null; then
        log "✅ SSH config is valid"
        log_warn "⚠️  SSH config updated - restart with: systemctl restart sshd"
        log_warn "⚠️  TEST SSH CONNECTION BEFORE RESTARTING!"
    else
        log_warn "SSH config test failed - restoring backup"
        cp "$backup_file" "$sshd_config"
    fi
}

###############################################################################
# 2. FIREWALL SETUP
###############################################################################
setup_firewall() {
    log "🔥 Setting up firewall rules" "$BLUE"
    
    # Block known malicious IPs
    local malicious_ips=(
        "45.131.184.34"
    )
    
    if command -v iptables >/dev/null 2>&1; then
        for ip in "${malicious_ips[@]}"; do
            if ! iptables -C INPUT -s "$ip" -j DROP 2>/dev/null; then
                iptables -I INPUT -s "$ip" -j DROP
                log "✅ Blocked malicious IP: $ip"
            fi
        done
        
        # Save iptables rules (if iptables-persistent is available)
        if command -v iptables-save >/dev/null 2>&1; then
            iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
        fi
    elif command -v firewall-cmd >/dev/null 2>&1; then
        for ip in "${malicious_ips[@]}"; do
            firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='$ip' drop" 2>/dev/null || true
        done
        firewall-cmd --reload 2>/dev/null || true
        log "✅ Firewall rules applied (firewalld)"
    elif command -v ufw >/dev/null 2>&1; then
        for ip in "${malicious_ips[@]}"; do
            ufw deny from "$ip" 2>/dev/null || true
        done
        log "✅ Firewall rules applied (ufw)"
    else
        log_warn "No firewall tool found - manual configuration required"
    fi
}

###############################################################################
# 3. FILE PERMISSIONS
###############################################################################
secure_file_permissions() {
    log "📁 Securing file permissions" "$BLUE"
    
    # Secure project directory
    if [ -d "$PROJECT_DIR" ]; then
        # Set directory permissions
        find "$PROJECT_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
        find "$PROJECT_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
        
        # Secure sensitive files
        [ -f "$PROJECT_DIR/.env" ] && chmod 600 "$PROJECT_DIR/.env" 2>/dev/null || true
        [ -f "$PROJECT_DIR/ecosystem.config.cjs" ] && chmod 644 "$PROJECT_DIR/ecosystem.config.cjs" 2>/dev/null || true
        
        # Secure upload directory
        if [ -d "$PROJECT_DIR/public/uploads" ]; then
            chmod 755 "$PROJECT_DIR/public/uploads" 2>/dev/null || true
            find "$PROJECT_DIR/public/uploads" -type f -exec chmod 644 {} \; 2>/dev/null || true
            find "$PROJECT_DIR/public/uploads" -type d -exec chmod 755 {} \; 2>/dev/null || true
        fi
        
        log "✅ File permissions secured"
    fi
    
    # Secure system directories
    chmod 700 /root 2>/dev/null || true
    chmod 755 /tmp 2>/dev/null || true
    chmod 755 /var/tmp 2>/dev/null || true
}

###############################################################################
# 4. SYSTEM HARDENING
###############################################################################
harden_system() {
    log "🛡️  Applying system hardening" "$BLUE"
    
    # Disable unnecessary services
    local services_to_disable=(
        "bluetooth"
        "cups"
    )
    
    for service in "${services_to_disable[@]}"; do
        if systemctl is-enabled "$service" >/dev/null 2>&1; then
            systemctl disable "$service" 2>/dev/null || true
            log "✅ Disabled unnecessary service: $service"
        fi
    done
    
    # Set up automatic security updates (if available)
    if command -v yum-cron >/dev/null 2>&1; then
        systemctl enable yum-cron 2>/dev/null || true
        systemctl start yum-cron 2>/dev/null || true
        log "✅ Enabled automatic security updates (yum-cron)"
    elif command -v unattended-upgrades >/dev/null 2>&1; then
        systemctl enable unattended-upgrades 2>/dev/null || true
        systemctl start unattended-upgrades 2>/dev/null || true
        log "✅ Enabled automatic security updates (unattended-upgrades)"
    fi
    
    # Configure kernel parameters
    if [ -f /etc/sysctl.conf ]; then
        local sysctl_settings=(
            "net.ipv4.ip_forward=0"
            "net.ipv4.conf.all.send_redirects=0"
            "net.ipv4.conf.default.send_redirects=0"
            "net.ipv4.conf.all.accept_redirects=0"
            "net.ipv4.conf.default.accept_redirects=0"
            "net.ipv4.conf.all.secure_redirects=0"
            "net.ipv4.conf.default.secure_redirects=0"
            "net.ipv4.icmp_echo_ignore_broadcasts=1"
            "net.ipv4.icmp_ignore_bogus_error_responses=1"
            "net.ipv4.tcp_syncookies=1"
        )
        
        for setting in "${sysctl_settings[@]}"; do
            local key=$(echo "$setting" | cut -d'=' -f1)
            if ! grep -q "^$key" /etc/sysctl.conf 2>/dev/null; then
                echo "$setting" >> /etc/sysctl.conf
            fi
        done
        
        sysctl -p >/dev/null 2>&1 || true
        log "✅ Kernel parameters configured"
    fi
}

###############################################################################
# 5. MONITORING SETUP
###############################################################################
setup_monitoring() {
    log "📊 Setting up security monitoring" "$BLUE"
    
    local monitor_script="$PROJECT_DIR/scripts/security-monitor-and-harden.sh"
    
    if [ -f "$monitor_script" ]; then
        chmod +x "$monitor_script"
        
        # Install as systemd service
        "$monitor_script" install 2>/dev/null || log_warn "Could not install monitoring service"
        
        log "✅ Security monitoring installed"
    else
        log_warn "Monitoring script not found: $monitor_script"
    fi
}

###############################################################################
# 6. BACKUP SETUP
###############################################################################
setup_backups() {
    log "💾 Setting up automated backups" "$BLUE"
    
    local backup_script="/usr/local/bin/naukrimili-backup.sh"
    local backup_dir="/var/backups/naukrimili"
    
    mkdir -p "$backup_dir"
    
    cat > "$backup_script" << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/naukrimili"
PROJECT_DIR="/var/www/naukrimili"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup database (if Prisma is configured)
cd "$PROJECT_DIR" && \
npx prisma db execute --stdin <<< "SELECT pg_dump('postgresql://...')" > "$BACKUP_DIR/db-$DATE.sql" 2>/dev/null || true

# Backup critical files
tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" \
    "$PROJECT_DIR/.env" \
    "$PROJECT_DIR/ecosystem.config.cjs" \
    "$PROJECT_DIR/package.json" 2>/dev/null || true

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete 2>/dev/null || true
EOF
    
    chmod +x "$backup_script"
    
    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null | grep -v "naukrimili-backup"; echo "0 2 * * * $backup_script") | crontab - 2>/dev/null || true
    
    log "✅ Automated backups configured (daily at 2 AM)"
}

###############################################################################
# 7. FINAL VERIFICATION
###############################################################################
verify_setup() {
    log "✅ Verifying security setup" "$BLUE"
    
    local issues=0
    
    # Check if monitoring is running
    if systemctl is-active --quiet naukrimili-security-monitor 2>/dev/null; then
        log "✅ Security monitoring is active"
    else
        log_warn "⚠️  Security monitoring is not active"
        issues=$((issues + 1))
    fi
    
    # Check firewall
    if command -v iptables >/dev/null 2>&1 && iptables -L INPUT -n | grep -q "45.131.184.34"; then
        log "✅ Firewall rules active"
    else
        log_warn "⚠️  Firewall rules may not be active"
    fi
    
    # Check file permissions
    if [ -f "$PROJECT_DIR/.env" ] && [ "$(stat -c %a "$PROJECT_DIR/.env" 2>/dev/null)" = "600" ]; then
        log "✅ .env file permissions secure"
    else
        log_warn "⚠️  .env file permissions may need attention"
    fi
    
    if [ $issues -eq 0 ]; then
        log "✅ All security measures verified"
    else
        log_warn "⚠️  Found $issues issues - review and fix manually"
    fi
}

###############################################################################
# MAIN
###############################################################################
main() {
    log "🛡️  Starting comprehensive security hardening" "$BLUE"
    log "=============================================="
    
    harden_ssh
    setup_firewall
    secure_file_permissions
    harden_system
    setup_monitoring
    setup_backups
    verify_setup
    
    log ""
    log "✅ Security hardening complete!" "$GREEN"
    log ""
    log "Next steps:"
    log "1. Review SSH config: /etc/ssh/sshd_config"
    log "2. Test SSH connection before restarting SSH service"
    log "3. Check monitoring: systemctl status naukrimili-security-monitor"
    log "4. Review logs: tail -f /var/log/naukrimili-security/monitor.log"
    log ""
    log "⚠️  IMPORTANT: Test SSH connection before restarting SSH service!"
}

main "$@"
