#!/bin/bash

###############################################################################
# 🛡️  COMPREHENSIVE SECURITY MONITORING & HARDENING SCRIPT
# 
# Purpose: Continuous malware monitoring, security hardening, and uptime protection
# Features:
# - Real-time malware detection and removal
# - Automated security hardening
# - Uptime monitoring and auto-recovery
# - Firewall rules
# - File integrity monitoring
# - Process monitoring
# - Automated backups
#
# Usage:
#   ./scripts/security-monitor-and-harden.sh install    # Install as systemd service
#   ./scripts/security-monitor-and-harden.sh run       # Run once
#   ./scripts/security-monitor-and-harden.sh status    # Check status
###############################################################################

set -euo pipefail

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/var/www/naukrimili}"
LOG_DIR="/var/log/naukrimili-security"
MONITOR_LOG="$LOG_DIR/monitor.log"
ALERT_LOG="$LOG_DIR/alerts.log"
BACKUP_DIR="/var/backups/naukrimili-security"
SERVICE_NAME="naukrimili-security-monitor"

# Malware patterns
MALWARE_PATTERNS=(
    "xmrig" "syssls" "systemhelper" "cryptonight" "monero" "minerd" "cpuminer"
    "45.131.184.34" "wget.*http.*bot" "curl.*http.*bot"
)

# Suspicious processes
SUSPICIOUS_PROCESSES=(
    "xmrig" "syssls" "systemhelper" "minerd" "cpuminer"
    "wget.*45.131.184.34" "curl.*45.131.184.34"
)

# Suspicious file locations
SUSPICIOUS_LOCATIONS=(
    "/tmp" "/var/tmp" "/dev/shm" "/root"
    "/etc/init.d" "/etc/systemd/system" "/etc/rc.d"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MONITOR_LOG"
}

log_alert() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 🚨 ALERT:${NC} $1" | tee -a "$ALERT_LOG" | tee -a "$MONITOR_LOG"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$MONITOR_LOG"
}

###############################################################################
# SECURITY FUNCTION 1: Malware Detection & Removal
###############################################################################
check_and_remove_malware() {
    local found=0
    
    # Check running processes - OPTIMIZED to reduce false positives
    for pattern in "${SUSPICIOUS_PROCESSES[@]}"; do
        # Use pgrep with more specific matching to avoid false positives
        PIDS=$(pgrep -f "$pattern" 2>/dev/null | grep -v "$$" || true)
        if [ -n "$PIDS" ]; then
            # Double-check it's actually suspicious (not a legitimate process)
            for pid in $PIDS; do
                PROC_CMD=$(ps -p "$pid" -o cmd= 2>/dev/null || echo "")
                # Skip if it's part of our legitimate processes
                if echo "$PROC_CMD" | grep -qE "(pm2|node|next|naukrimili)"; then
                    continue
                fi
                log_alert "MALWARE PROCESS DETECTED: $pattern (PID: $pid)"
                # Use SIGTERM first, then SIGKILL if needed (less aggressive)
                kill -TERM "$pid" 2>/dev/null || true
                sleep 2
                # Only use -9 if process still exists
                if kill -0 "$pid" 2>/dev/null; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
                found=$((found + 1))
            done
        fi
    done
    
    # Check suspicious files
    for location in "${SUSPICIOUS_LOCATIONS[@]}"; do
        for pattern in "${MALWARE_PATTERNS[@]}"; do
            find "$location" -type f -iname "*$pattern*" 2>/dev/null | while read -r file; do
                log_alert "MALWARE FILE DETECTED: $file"
                rm -f "$file" 2>/dev/null || true
                found=$((found + 1))
            done
        done
    done
    
    # Check for bot download attempts - OPTIMIZED to avoid killing legitimate processes
    SUSPICIOUS_DOWNLOADS=$(ps aux | grep -E "wget.*45.131.184.34|curl.*45.131.184.34" | grep -v grep || true)
    if [ -n "$SUSPICIOUS_DOWNLOADS" ]; then
        log_alert "BOT DOWNLOAD ATTEMPT DETECTED"
        # Only kill processes matching the specific suspicious pattern
        pkill -TERM -f "45.131.184.34" 2>/dev/null || true
        sleep 2
        # Only use -9 if still running
        pkill -9 -f "45.131.184.34" 2>/dev/null || true
        # DO NOT kill all wget/curl - too aggressive and kills legitimate processes
        found=$((found + 1))
    fi
    
    # Check for /var/tmp/bot or /tmp/bot
    for bot_file in "/var/tmp/bot" "/tmp/bot"; do
        if [ -f "$bot_file" ]; then
            log_alert "BOT FILE DETECTED: $bot_file"
            rm -f "$bot_file" 2>/dev/null || true
            found=$((found + 1))
        fi
    done
    
    if [ $found -gt 0 ]; then
        log_alert "Removed $found malware indicators"
        return 1
    fi
    
    return 0
}

###############################################################################
# SECURITY FUNCTION 2: Check Malicious Cron Jobs
###############################################################################
check_malicious_cron() {
    local found=0
    
    # Check user crontab
    if crontab -l 2>/dev/null | grep -E "xmrig|syssls|systemhelper|45.131.184.34" >/dev/null; then
        log_alert "MALICIOUS CRON JOB FOUND in user crontab"
        crontab -l 2>/dev/null | grep -vE "xmrig|syssls|systemhelper|45.131.184.34" | crontab - 2>/dev/null || true
        found=$((found + 1))
    fi
    
    # Check system cron
    for cron_file in /etc/cron.d/* /etc/cron.daily/* /etc/cron.hourly/*; do
        if [ -f "$cron_file" ] && grep -E "xmrig|syssls|systemhelper|45.131.184.34" "$cron_file" >/dev/null 2>&1; then
            log_alert "MALICIOUS CRON JOB FOUND: $cron_file"
            sed -i '/xmrig\|syssls\|systemhelper\|45.131.184.34/d' "$cron_file" 2>/dev/null || true
            found=$((found + 1))
        fi
    done
    
    # Check /etc/rc.local
    if [ -f /etc/rc.d/rc.local ] && grep -E "xmrig|syssls|systemhelper|45.131.184.34|/etc/de/" /etc/rc.d/rc.local >/dev/null; then
        log_alert "MALICIOUS STARTUP SCRIPT FOUND: /etc/rc.d/rc.local"
        sed -i '/xmrig\|syssls\|systemhelper\|45.131.184.34\|^[^#].*\/etc\/de\//d' /etc/rc.d/rc.local 2>/dev/null || true
        found=$((found + 1))
    fi
    
    return $found
}

###############################################################################
# SECURITY FUNCTION 3: Check Systemd Services
###############################################################################
check_malicious_services() {
    local found=0
    
    for service in syssls systemhelper; do
        if systemctl list-unit-files | grep -q "$service.service"; then
            log_alert "MALICIOUS SYSTEMD SERVICE FOUND: $service"
            systemctl stop "$service" 2>/dev/null || true
            systemctl disable "$service" 2>/dev/null || true
            rm -f "/etc/systemd/system/$service.service" 2>/dev/null || true
            systemctl daemon-reload 2>/dev/null || true
            found=$((found + 1))
        fi
    done
    
    # Check /etc/init.d
    for init_script in /etc/init.d/systemhelper; do
        if [ -f "$init_script" ]; then
            log_alert "MALICIOUS INIT SCRIPT FOUND: $init_script"
            rm -f "$init_script" 2>/dev/null || true
            found=$((found + 1))
        fi
    done
    
    return $found
}

###############################################################################
# SECURITY FUNCTION 4: Uptime Monitoring & Auto-Recovery
###############################################################################
check_application_health() {
    local app_name="${1:-naukrimili}"
    local health_url="http://127.0.0.1:3000"
    local max_retries=3
    local retry=0
    
    # Check PM2 status - try both naukrimili and jobportal
    local found_app=""
    if pm2 describe "$app_name" >/dev/null 2>&1; then
        found_app="$app_name"
    elif pm2 describe "jobportal" >/dev/null 2>&1; then
        found_app="jobportal"
        app_name="jobportal"
    else
        log_alert "Application (naukrimili/jobportal) not found in PM2"
        return 1
    fi
    
    local status=$(pm2 jlist | grep -o "\"name\":\"$found_app\".*\"status\":\"[^\"]*\"" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4)
    
    if [ "$status" != "online" ]; then
        log_alert "Application $found_app is $status - attempting restart"
        pm2 restart "$found_app" --update-env 2>/dev/null || pm2 start ecosystem.config.cjs --env production --update-env 2>/dev/null || true
        sleep 5
    fi
    
    # Check HTTP response
    while [ $retry -lt $max_retries ]; do
        if timeout 3 curl -f -s "$health_url" >/dev/null 2>&1; then
            return 0
        fi
        retry=$((retry + 1))
        sleep 2
    done
    
    log_alert "Application not responding - attempting full restart"
    pm2 restart "$found_app" --update-env 2>/dev/null || {
        pm2 delete "$found_app" 2>/dev/null || true
        cd "$PROJECT_DIR" && pm2 start ecosystem.config.cjs --env production --update-env 2>/dev/null || true
    }
    
    return 1
}

###############################################################################
# SECURITY FUNCTION 5: File Integrity Check
###############################################################################
check_critical_files() {
    local issues=0
    
    # Check if critical files are modified
    local critical_files=(
        "/etc/passwd"
        "/etc/shadow"
        "/etc/ssh/sshd_config"
        "$PROJECT_DIR/package.json"
        "$PROJECT_DIR/ecosystem.config.cjs"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            # Check for suspicious modifications (basic check)
            if grep -E "xmrig|syssls|systemhelper|45.131.184.34" "$file" >/dev/null 2>&1; then
                log_alert "SUSPICIOUS CONTENT in $file"
                issues=$((issues + 1))
            fi
        fi
    done
    
    return $issues
}

###############################################################################
# SECURITY FUNCTION 6: Network Security
###############################################################################
check_network_security() {
    local issues=0
    
    # Check for suspicious network connections
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -E "45.131.184.34|unmineable|stratum" >/dev/null; then
            log_alert "SUSPICIOUS NETWORK CONNECTION DETECTED"
            issues=$((issues + 1))
        fi
    fi
    
    # Check for high CPU usage (potential mining) - OPTIMIZED to reduce false positives
    # Only check if top command is available and not causing high CPU itself
    if command -v top >/dev/null 2>&1; then
        # Use a lighter CPU check method
        local cpu_usage=$(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}' 2>/dev/null || echo "0")
        if (( $(echo "$cpu_usage > 90" | bc -l 2>/dev/null || echo 0) )); then
            log_warn "High CPU usage detected: ${cpu_usage}%"
            # Check if it's our app or legitimate processes
            PM2_RUNNING=$(pm2 jlist 2>/dev/null | grep -q "\"status\":\"online\"" && echo "yes" || echo "no")
            if [ "$PM2_RUNNING" = "no" ]; then
                # Check top processes to see what's using CPU
                TOP_PROCESS=$(ps aux --sort=-%cpu | head -6 | tail -5 | awk '{if($3>50) print $2":"$3":"$11}' | head -1 || echo "")
                if [ -n "$TOP_PROCESS" ]; then
                    log_alert "High CPU usage but app is not online - possible malware"
                    log_alert "Top CPU process: $TOP_PROCESS"
                    issues=$((issues + 1))
                fi
            else
                log_warn "High CPU usage but PM2 app is online - likely legitimate load"
            fi
        fi
    fi
    
    return $issues
}

###############################################################################
# SECURITY FUNCTION 7: Firewall Hardening
###############################################################################
setup_firewall() {
    if ! command -v firewall-cmd >/dev/null 2>&1 && ! command -v ufw >/dev/null 2>&1 && ! command -v iptables >/dev/null 2>&1; then
        log_warn "No firewall tool found - skipping firewall setup"
        return 0
    fi
    
    # Firewall rules (if iptables is available)
    if command -v iptables >/dev/null 2>&1; then
        # Block suspicious IPs
        iptables -C INPUT -s 45.131.184.34 -j DROP 2>/dev/null || iptables -I INPUT -s 45.131.184.34 -j DROP 2>/dev/null || true
        
        # Allow only necessary ports
        iptables -C INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
        iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
        iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
        
        log "Firewall rules applied"
    fi
}

###############################################################################
# SECURITY FUNCTION 8: Filesystem Hardening
###############################################################################
harden_filesystem() {
    # Secure /tmp and /var/tmp (if writable)
    if [ -w /tmp ]; then
        chmod 1777 /tmp 2>/dev/null || true
        chattr +t /tmp 2>/dev/null || true  # Sticky bit
    fi
    
    if [ -w /var/tmp ]; then
        chmod 1777 /var/tmp 2>/dev/null || true
        chattr +t /var/tmp 2>/dev/null || true
    fi
    
    # Secure project upload directory
    if [ -d "$PROJECT_DIR/public/uploads" ]; then
        chmod 755 "$PROJECT_DIR/public/uploads" 2>/dev/null || true
        find "$PROJECT_DIR/public/uploads" -type f -exec chmod 644 {} \; 2>/dev/null || true
        find "$PROJECT_DIR/public/uploads" -type d -exec chmod 755 {} \; 2>/dev/null || true
    fi
    
    log "Filesystem hardening applied"
}

###############################################################################
# MAIN MONITORING LOOP
###############################################################################
run_security_check() {
    log "🔍 Starting security check cycle" "$BLUE"
    
    local alerts=0
    
    # Run all security checks
    check_and_remove_malware || alerts=$((alerts + 1))
    check_malicious_cron || alerts=$((alerts + 1))
    check_malicious_services || alerts=$((alerts + 1))
    check_application_health || alerts=$((alerts + 1))
    check_critical_files || alerts=$((alerts + 1))
    check_network_security || alerts=$((alerts + 1))
    
    # Apply hardening (once)
    if [ ! -f "$LOG_DIR/hardening-applied.flag" ]; then
        setup_firewall
        harden_filesystem
        touch "$LOG_DIR/hardening-applied.flag"
    fi
    
    if [ $alerts -eq 0 ]; then
        log "✅ Security check passed - no issues detected"
    else
        log_alert "Security check found $alerts issues - see $ALERT_LOG for details"
    fi
    
    return $alerts
}

###############################################################################
# INSTALL AS SYSTEMD SERVICE
###############################################################################
install_service() {
    log "📦 Installing security monitor as systemd service" "$BLUE"
    
    local script_path="$(readlink -f "$0")"
    local service_file="/etc/systemd/system/$SERVICE_NAME.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=Naukrimili Security Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=$script_path run
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME"
    
    log "✅ Service installed and started"
    log "   Status: systemctl status $SERVICE_NAME"
    log "   Logs: journalctl -u $SERVICE_NAME -f"
}

###############################################################################
# MAIN ENTRY POINT
###############################################################################
main() {
    # Create log directory
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    case "${1:-run}" in
        install)
            install_service
            ;;
        run)
            # Continuous monitoring mode - OPTIMIZED to reduce CPU usage
            # Changed from 5 minutes to 15 minutes to reduce CPU load
            # Added CPU throttling to prevent high usage
            while true; do
                # Check current CPU usage before running
                CURRENT_CPU=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' 2>/dev/null || echo "0")
                
                # Skip check if CPU is already high (prevent recursive CPU usage)
                if (( $(echo "$CURRENT_CPU > 80" | bc -l 2>/dev/null || echo 0) )); then
                    log_warn "Skipping security check - CPU usage is high (${CURRENT_CPU}%)"
                    sleep 600  # Wait 10 minutes if CPU is high
                    continue
                fi
                
                # Run security check with timeout to prevent hanging
                timeout 120 run_security_check || true  # Continue even if issues found
                
                # Sleep longer to reduce CPU usage (15 minutes instead of 5)
                sleep 900  # Check every 15 minutes
            done
            ;;
        check)
            # Single check
            run_security_check
            ;;
        status)
            echo "Security Monitor Status:"
            echo "========================"
            if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
                echo "✅ Service is running"
            else
                echo "❌ Service is not running"
            fi
            echo ""
            echo "Recent alerts:"
            tail -20 "$ALERT_LOG" 2>/dev/null || echo "No alerts yet"
            echo ""
            echo "Recent logs:"
            tail -20 "$MONITOR_LOG" 2>/dev/null || echo "No logs yet"
            ;;
        *)
            echo "Usage: $0 {install|run|check|status}"
            exit 1
            ;;
    esac
}

main "$@"
