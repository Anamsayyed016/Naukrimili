#!/bin/bash

# Job Portal Deployment Script
# Usage: ./deploy.sh [start|stop|restart|deploy|status|logs|update]

set -e

# Configuration
APP_NAME="jobportal"
APP_DIR="/var/www/jobportal"
REPO_URL="https://github.com/Anamsayyed016/Naukrimili.git"
BRANCH="main"
PM2_CONFIG="ecosystem.config.cjs"
LOG_DIR="/var/log/jobportal"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 globally..."
        npm install -g pm2
    fi
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js $NODE_VERSION or later"
        exit 1
    fi
    
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        warning "Node.js version $NODE_VER detected. Recommended version is 18 or later"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "/var/www/jobportal/scripts"
    chown -R www-data:www-data "$APP_DIR"
    chown -R www-data:www-data "$LOG_DIR"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    cd "$APP_DIR"
    npm ci --production
}

# Build the application
build_app() {
    log "Building the application..."
    cd "$APP_DIR"
    npm run build
}

# Start the application
start_app() {
    log "Starting $APP_NAME..."
    check_pm2
    cd "$APP_DIR"
    
    if [ -f "$PM2_CONFIG" ]; then
        pm2 start "$PM2_CONFIG" --env production
    else
        pm2 start server.js --name "$APP_NAME" --env production
    fi
    
    pm2 save
    pm2 startup
    log "Application started successfully"
}

# Stop the application
stop_app() {
    log "Stopping $APP_NAME..."
    pm2 stop "$APP_NAME" || true
    pm2 delete "$APP_NAME" || true
    log "Application stopped"
}

# Restart the application
restart_app() {
    log "Restarting $APP_NAME..."
    pm2 restart "$APP_NAME" || start_app
    log "Application restarted"
}

# Deploy the application
deploy_app() {
    log "Starting deployment process..."
    
    # Backup current version
    if [ -d "$APP_DIR" ]; then
        log "Creating backup..."
        cp -r "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)" || true
    fi
    
    # Clone/update repository
    if [ -d "$APP_DIR/.git" ]; then
        log "Updating repository..."
        cd "$APP_DIR"
        git fetch origin
        git reset --hard origin/$BRANCH
    else
        log "Cloning repository..."
        git clone -b $BRANCH $REPO_URL "$APP_DIR"
    fi
    
    # Set permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true
    
    # Install dependencies and build
    install_dependencies
    build_app
    
    # Restart application
    restart_app
    
    log "Deployment completed successfully"
}

# Show application status
show_status() {
    log "Application Status:"
    pm2 status "$APP_NAME" || info "Application not running"
    
    echo ""
    log "System Resources:"
    echo "Memory Usage:"
    free -h
    echo ""
    echo "Disk Usage:"
    df -h "$APP_DIR"
    echo ""
    echo "Process Information:"
    ps aux | grep -E "(node|pm2)" | grep -v grep || true
}

# Show logs
show_logs() {
    log "Showing application logs (Press Ctrl+C to exit):"
    pm2 logs "$APP_NAME" --lines 100
}

# Update application
update_app() {
    log "Updating application..."
    stop_app
    deploy_app
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if PM2 process is running
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log "✓ PM2 process is running"
    else
        error "✗ PM2 process is not running"
        return 1
    fi
    
    # Check if port is listening
    if netstat -tlnp | grep -q ":3000"; then
        log "✓ Application is listening on port 3000"
    else
        error "✗ Application is not listening on port 3000"
        return 1
    fi
    
    # Check if logs directory exists and is writable
    if [ -w "$LOG_DIR" ]; then
        log "✓ Log directory is writable"
    else
        error "✗ Log directory is not writable"
        return 1
    fi
    
    log "Health check completed successfully"
}

# Clean up old logs
cleanup_logs() {
    log "Cleaning up old logs..."
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete || true
    log "Log cleanup completed"
}

# Main script logic
main() {
    case "${1:-}" in
        "start")
            check_root
            check_node
            create_directories
            start_app
            ;;
        "stop")
            check_root
            stop_app
            ;;
        "restart")
            check_root
            restart_app
            ;;
        "deploy")
            check_root
            check_node
            create_directories
            deploy_app
            health_check
            ;;
        "update")
            check_root
            update_app
            health_check
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "health")
            health_check
            ;;
        "cleanup")
            cleanup_logs
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|deploy|update|status|logs|health|cleanup}"
            echo ""
            echo "Commands:"
            echo "  start    - Start the application"
            echo "  stop     - Stop the application"
            echo "  restart  - Restart the application"
            echo "  deploy   - Deploy/update the application"
            echo "  update   - Update and restart the application"
            echo "  status   - Show application status"
            echo "  logs     - Show application logs"
            echo "  health   - Perform health check"
            echo "  cleanup  - Clean up old logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
