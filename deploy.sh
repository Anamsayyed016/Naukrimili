#!/bin/bash

# Job Portal Deployment Script
# This script provides various deployment options for the job portal application

set -e

# Configuration
PROJECT_NAME="jobportal"
PROJECT_PATH="$(pwd)"
LOG_FILE="./logs/deploy.log"
BACKUP_PATH="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
setup_directories() {
    log "Setting up deployment environment..."
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_PATH"
    mkdir -p "./logs"
    touch "$LOG_FILE"
    success "Directories created successfully"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Installing PM2 globally..."
        npm install -g pm2
    fi
    
    success "All prerequisites are satisfied"
}

# Function to backup current deployment
backup_deployment() {
    if [ -d ".next" ] || [ -d "node_modules" ]; then
        log "Creating backup of current deployment..."
        BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
        mkdir -p "$BACKUP_PATH/$BACKUP_NAME"
        
        if [ -d ".next" ]; then
            cp -r .next "$BACKUP_PATH/$BACKUP_NAME/"
        fi
        
        if [ -d "node_modules" ]; then
            cp -r node_modules "$BACKUP_PATH/$BACKUP_NAME/"
        fi
        
        success "Backup created: $BACKUP_PATH/$BACKUP_NAME"
    fi
}

# Function to clean old backups (keep only last 5)
cleanup_backups() {
    log "Cleaning up old backups..."
    cd "$BACKUP_PATH"
    ls -t | tail -n +6 | xargs -r rm -rf
    cd "$PROJECT_PATH"
    success "Old backups cleaned up"
}

# Function to install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [ "$1" = "production" ]; then
        npm ci --only=production --legacy-peer-deps
        info "Production dependencies installed"
    else
        npm install
        info "All dependencies installed"
    fi
}

# Function to build the application
build_application() {
    log "Building application..."
    
    if [ "$1" = "production" ]; then
        npm run build:production
    elif [ "$1" = "fast" ]; then
        npm run build:fast
    else
        npm run build
    fi
    
    success "Application built successfully"
}

# Function to start the application
start_application() {
    log "Starting application..."
    
    if [ "$1" = "pm2" ]; then
        pm2 start ecosystem.pm2.js --env production
        success "Application started with PM2"
    elif [ "$1" = "production" ]; then
        npm run start:production
    else
        npm start
    fi
}

# Function to stop the application
stop_application() {
    log "Stopping application..."
    
    if [ "$1" = "pm2" ]; then
        pm2 stop "$PROJECT_NAME"
        success "Application stopped with PM2"
    else
        pkill -f "next start" || true
        success "Application stopped"
    fi
}

# Function to restart the application
restart_application() {
    log "Restarting application..."
    
    if [ "$1" = "pm2" ]; then
        pm2 reload ecosystem.pm2.js --env production
        success "Application restarted with PM2"
    else
        stop_application
        sleep 2
        start_application
    fi
}

# Function to show application status
show_status() {
    log "Showing application status..."
    
    if [ "$1" = "pm2" ]; then
        pm2 status
        pm2 logs "$PROJECT_NAME" --lines 20
    else
        echo "Application process:"
        ps aux | grep -E "(next|node)" | grep -v grep || echo "No application processes found"
    fi
}

# Function to monitor the application
monitor_application() {
    log "Starting application monitoring..."
    
    if [ "$1" = "pm2" ]; then
        pm2 monit
    else
        echo "Use 'htop' or 'top' for system monitoring"
        echo "Use 'npm run deploy:pm2:logs' for PM2 logs"
    fi
}

# Function to deploy to production
deploy_production() {
    log "Starting production deployment..."
    
    # Backup current deployment
    backup_deployment
    
    # Install production dependencies
    install_dependencies "production"
    
    # Build for production
    build_application "production"
    
    # Start with PM2
    start_application "pm2"
    
    success "Production deployment completed successfully"
}

# Function to deploy with hot reload
deploy_hot_reload() {
    log "Starting hot reload deployment..."
    
    # Stop current application
    stop_application "pm2"
    
    # Install dependencies
    install_dependencies
    
    # Build application
    build_application
    
    # Start with PM2
    start_application "pm2"
    
    success "Hot reload deployment completed successfully"
}

# Function to show logs
show_logs() {
    log "Showing application logs..."
    
    if [ "$1" = "pm2" ]; then
        pm2 logs "$PROJECT_NAME" --lines 50
    else
        if [ -f "./logs/combined.log" ]; then
            tail -f "./logs/combined.log"
        else
            echo "No log files found"
        fi
    fi
}

# Function to clean build artifacts
clean_build() {
    log "Cleaning build artifacts..."
    
    rm -rf .next
    rm -rf out
    rm -rf production
    rm -rf node_modules/.cache
    
    success "Build artifacts cleaned"
}

# Function to show help
show_help() {
    echo -e "${CYAN}Job Portal Deployment Script${NC}"
    echo ""
    echo "Usage: ./deploy.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup              - Setup deployment environment"
    echo "  check              - Check prerequisites"
    echo "  backup             - Create backup of current deployment"
    echo "  cleanup            - Clean up old backups"
    echo "  install            - Install dependencies [dev|production]"
    echo "  build              - Build application [dev|production|fast]"
    echo "  start              - Start application [dev|pm2|production]"
    echo "  stop               - Stop application [dev|pm2]"
    echo "  restart            - Restart application [dev|pm2]"
    echo "  status             - Show application status [dev|pm2]"
    echo "  monitor            - Monitor application [dev|pm2]"
    echo "  deploy:prod        - Deploy to production"
    echo "  deploy:hot         - Deploy with hot reload"
    echo "  logs               - Show application logs [dev|pm2]"
    echo "  clean              - Clean build artifacts"
    echo "  help               - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh setup"
    echo "  ./deploy.sh deploy:prod"
    echo "  ./deploy.sh start pm2"
    echo "  ./deploy.sh status pm2"
    echo "  ./deploy.sh logs pm2"
    echo ""
}

# Main script logic
main() {
    case "${1:-help}" in
        "setup")
            setup_directories
            ;;
        "check")
            check_prerequisites
            ;;
        "backup")
            backup_deployment
            ;;
        "cleanup")
            cleanup_backups
            ;;
        "install")
            install_dependencies "${2:-}"
            ;;
        "build")
            build_application "${2:-}"
            ;;
        "start")
            start_application "${2:-}"
            ;;
        "stop")
            stop_application "${2:-}"
            ;;
        "restart")
            restart_application "${2:-}"
            ;;
        "status")
            show_status "${2:-}"
            ;;
        "monitor")
            monitor_application "${2:-}"
            ;;
        "deploy:prod")
            deploy_production
            ;;
        "deploy:hot")
            deploy_hot_reload
            ;;
        "logs")
            show_logs "${2:-}"
            ;;
        "clean")
            clean_build
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
