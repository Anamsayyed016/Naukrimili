#!/bin/bash

# Server Monitoring Script
# Monitors application health and automatically fixes issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="jobportal"
PM2_APP_NAME="jobportal"
APP_URL="http://localhost:3000"
LOG_FILE="/var/log/monitor-server.log"
CHECK_INTERVAL=300 # 5 minutes
MAX_RESTARTS=3
RESTART_COUNT_FILE="/tmp/restart_count"

# Function to log with timestamp
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check application health
check_health() {
    local response_code
    local response_time
    
    # Check HTTP response
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || echo "000")
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL" 2>/dev/null || echo "0")
    
    if [ "$response_code" = "200" ]; then
        log "✅ Application is healthy (Response: $response_code, Time: ${response_time}s)" "$GREEN"
        return 0
    else
        log "❌ Application is unhealthy (Response: $response_code, Time: ${response_time}s)" "$RED"
        return 1
    fi
}

# Function to check PM2 status
check_pm2_status() {
    local status
    status=$(pm2 list | grep "$PM2_APP_NAME" | awk '{print $10}' 2>/dev/null || echo "not_found")
    
    case "$status" in
        "online")
            log "✅ PM2 process is online" "$GREEN"
            return 0
            ;;
        "stopped"|"errored"|"not_found")
            log "❌ PM2 process is $status" "$RED"
            return 1
            ;;
        *)
            log "⚠️ PM2 process status unknown: $status" "$YELLOW"
            return 1
            ;;
    esac
}

# Function to check memory usage
check_memory() {
    local memory_usage
    memory_usage=$(pm2 list | grep "$PM2_APP_NAME" | awk '{print $7}' 2>/dev/null || echo "0")
    
    # Remove 'MB' suffix and convert to number
    memory_usage=$(echo "$memory_usage" | sed 's/MB//')
    
    if [ "$memory_usage" -gt 800 ]; then
        log "⚠️ High memory usage: ${memory_usage}MB" "$YELLOW"
        return 1
    else
        log "✅ Memory usage normal: ${memory_usage}MB" "$GREEN"
        return 0
    fi
}

# Function to check for chunk errors in logs
check_chunk_errors() {
    local error_count
    error_count=$(pm2 logs "$PM2_APP_NAME" --lines 100 --nostream 2>/dev/null | grep -c "Cannot read properties of undefined" || echo "0")
    
    if [ "$error_count" -gt 0 ]; then
        log "❌ Found $error_count chunk errors in logs" "$RED"
        return 1
    else
        log "✅ No chunk errors found in logs" "$GREEN"
        return 0
    fi
}

# Function to restart application
restart_application() {
    local restart_count
    restart_count=$(cat "$RESTART_COUNT_FILE" 2>/dev/null || echo "0")
    restart_count=$((restart_count + 1))
    echo "$restart_count" > "$RESTART_COUNT_FILE"
    
    if [ "$restart_count" -gt "$MAX_RESTARTS" ]; then
        log "❌ Maximum restart attempts reached ($MAX_RESTARTS). Manual intervention required." "$RED"
        return 1
    fi
    
    log "🔄 Restarting application (Attempt $restart_count/$MAX_RESTARTS)..." "$YELLOW"
    
    # Stop application
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
    
    # Wait a moment
    sleep 5
    
    # Start application
    pm2 start "$PM2_APP_NAME" 2>/dev/null || {
        log "❌ Failed to restart application" "$RED"
        return 1
    }
    
    # Wait for application to start
    sleep 10
    
    log "✅ Application restarted successfully" "$GREEN"
    return 0
}

# Function to fix chunk issues
fix_chunk_issues() {
    log "🔧 Fixing chunk issues..." "$BLUE"
    
    # Run emergency chunk cleanup
    if [ -f "./emergency-chunk-cleanup.sh" ]; then
        bash ./emergency-chunk-cleanup.sh
    else
        log "⚠️ Emergency cleanup script not found" "$YELLOW"
    fi
}

# Function to perform full health check
full_health_check() {
    log "🔍 Performing full health check..." "$BLUE"
    
    local issues=0
    
    # Check PM2 status
    if ! check_pm2_status; then
        issues=$((issues + 1))
    fi
    
    # Check application health
    if ! check_health; then
        issues=$((issues + 1))
    fi
    
    # Check memory usage
    if ! check_memory; then
        issues=$((issues + 1))
    fi
    
    # Check for chunk errors
    if ! check_chunk_errors; then
        issues=$((issues + 1))
    fi
    
    if [ "$issues" -eq 0 ]; then
        log "✅ All health checks passed" "$GREEN"
        return 0
    else
        log "❌ Found $issues health issues" "$RED"
        return 1
    fi
}

# Function to auto-fix issues
auto_fix() {
    log "🔧 Attempting to auto-fix issues..." "$BLUE"
    
    # Check if PM2 process is running
    if ! check_pm2_status; then
        log "🔄 Restarting PM2 process..." "$YELLOW"
        restart_application
    fi
    
    # Check for chunk errors
    if ! check_chunk_errors; then
        log "🔧 Fixing chunk issues..." "$YELLOW"
        fix_chunk_issues
    fi
    
    # Check memory usage
    if ! check_memory; then
        log "🔄 Restarting due to high memory usage..." "$YELLOW"
        restart_application
    fi
}

# Function to show status
show_status() {
    log "📊 Application Status Report" "$PURPLE"
    echo "=================================="
    
    # PM2 Status
    echo "PM2 Status:"
    pm2 list | grep "$PM2_APP_NAME" || echo "Process not found"
    echo ""
    
    # Health Check
    echo "Health Check:"
    if check_health; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application is unhealthy"
    fi
    echo ""
    
    # Memory Usage
    echo "Memory Usage:"
    pm2 list | grep "$PM2_APP_NAME" | awk '{print "Memory: " $7 " | CPU: " $8}' || echo "Memory info not available"
    echo ""
    
    # Recent Logs
    echo "Recent Logs (last 5 lines):"
    pm2 logs "$PM2_APP_NAME" --lines 5 --nostream 2>/dev/null || echo "No logs available"
    echo "=================================="
}

# Function to start monitoring
start_monitoring() {
    log "🚀 Starting server monitoring..." "$PURPLE"
    log "Check interval: ${CHECK_INTERVAL} seconds" "$CYAN"
    log "Max restarts: $MAX_RESTARTS" "$CYAN"
    
    # Reset restart count
    echo "0" > "$RESTART_COUNT_FILE"
    
    while true; do
        log "🔍 Performing health check..." "$BLUE"
        
        if ! full_health_check; then
            log "⚠️ Health issues detected, attempting auto-fix..." "$YELLOW"
            auto_fix
            
            # Wait a bit before next check
            sleep 30
            
            # Check again after fix
            if ! full_health_check; then
                log "❌ Auto-fix failed, manual intervention may be required" "$RED"
            fi
        else
            log "✅ All systems healthy" "$GREEN"
        fi
        
        # Wait for next check
        log "⏰ Waiting ${CHECK_INTERVAL} seconds until next check..." "$CYAN"
        sleep "$CHECK_INTERVAL"
    done
}

# Main function
main() {
    case "${1:-}" in
        "check")
            full_health_check
            ;;
        "fix")
            auto_fix
            ;;
        "restart")
            restart_application
            ;;
        "status")
            show_status
            ;;
        "monitor")
            start_monitoring
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  check     - Perform one-time health check"
            echo "  fix       - Attempt to fix issues"
            echo "  restart   - Restart application"
            echo "  status    - Show current status"
            echo "  monitor   - Start continuous monitoring"
            echo "  help      - Show this help"
            ;;
        *)
            show_status
            ;;
    esac
}

# Run main function
main "$@"
