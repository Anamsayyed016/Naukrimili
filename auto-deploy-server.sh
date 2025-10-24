#!/bin/bash

# Auto Deploy Server Script
# Handles every new production change automatically
# Prevents chunk issues and ensures smooth deployments

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
PROJECT_DIR="/root/jobportal"  # Adjust this to your actual project directory
BACKUP_DIR="/root/backups/jobportal"
LOG_FILE="/var/log/auto-deploy.log"
PM2_APP_NAME="jobportal"

# Function to log with timestamp
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    log "🔍 Checking system requirements..." "$BLUE"
    
    if ! command_exists node; then
        log "❌ Node.js not found. Please install Node.js first." "$RED"
        exit 1
    fi
    
    if ! command_exists npm; then
        log "❌ npm not found. Please install npm first." "$RED"
        exit 1
    fi
    
    if ! command_exists pm2; then
        log "❌ PM2 not found. Installing PM2..." "$YELLOW"
        npm install -g pm2
    fi
    
    if ! command_exists git; then
        log "❌ Git not found. Please install Git first." "$RED"
        exit 1
    fi
    
    log "✅ All requirements satisfied" "$GREEN"
}

# Function to create backup
create_backup() {
    log "📦 Creating backup of current deployment..." "$BLUE"
    
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$BACKUP_PATH"
        log "✅ Backup created: $BACKUP_PATH" "$GREEN"
    else
        log "⚠️ No existing project directory found, skipping backup" "$YELLOW"
    fi
}

# Function to clean old backups (keep last 5)
cleanup_backups() {
    log "🧹 Cleaning up old backups..." "$BLUE"
    
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        # Keep only the last 5 backups
        ls -t | tail -n +6 | xargs -r rm -rf
        log "✅ Old backups cleaned up" "$GREEN"
    fi
}

# Function to update from git
update_from_git() {
    log "📥 Updating from Git repository..." "$BLUE"
    
    cd "$PROJECT_DIR"
    
    # Check if git repository exists
    if [ ! -d ".git" ]; then
        log "❌ Not a Git repository. Please initialize Git first." "$RED"
        exit 1
    fi
    
    # Fetch latest changes
    git fetch origin
    
    # Check if there are new changes
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log "ℹ️ No new changes detected" "$YELLOW"
        return 1
    fi
    
    # Pull latest changes
    git pull origin main
    log "✅ Code updated from Git" "$GREEN"
    return 0
}

# Function to install dependencies
install_dependencies() {
    log "📦 Installing dependencies..." "$BLUE"
    
    cd "$PROJECT_DIR"
    
    # Clean npm cache
    npm cache clean --force
    
    # Install dependencies
    npm ci --legacy-peer-deps --ignore-engines --production=false
    
    log "✅ Dependencies installed" "$GREEN"
}

# Function to generate Prisma client
generate_prisma() {
    log "🔧 Generating Prisma client..." "$BLUE"
    
    cd "$PROJECT_DIR"
    
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        log "✅ Prisma client generated" "$GREEN"
    else
        log "⚠️ No Prisma schema found, skipping Prisma generation" "$YELLOW"
    fi
}

# Function to build application
build_application() {
    log "🏗️ Building application..." "$BLUE"
    
    cd "$PROJECT_DIR"
    
    # Set environment variables for production build
    export NODE_ENV=production
    export NODE_OPTIONS="--max-old-space-size=4096"
    export NEXT_TELEMETRY_DISABLED=1
    export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
    export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)
    
    # Clean previous build
    rm -rf .next
    rm -rf node_modules/.cache
    
    # Build application
    npm run build
    
    if [ -d ".next" ]; then
        log "✅ Application built successfully" "$GREEN"
        
        # Count chunks
        CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
        log "📊 Generated $CHUNK_COUNT JavaScript chunks" "$CYAN"
        
        # Create build info file
        echo "Build completed at: $(date)" > .next/BUILD_INFO
        echo "Build timestamp: $NEXT_PUBLIC_BUILD_TIME" >> .next/BUILD_INFO
        echo "Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID" >> .next/BUILD_INFO
        echo "Chunk count: $CHUNK_COUNT" >> .next/BUILD_INFO
        
    else
        log "❌ Build failed - .next directory not found" "$RED"
        exit 1
    fi
}

# Function to restart application
restart_application() {
    log "🔄 Restarting application..." "$BLUE"
    
    # Stop existing application
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || log "⚠️ No existing PM2 process found" "$YELLOW"
    
    # Start application
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.cjs --name "$PM2_APP_NAME" || pm2 start "npm run start" --name "$PM2_APP_NAME"
    
    # Save PM2 configuration
    pm2 save
    
    # Wait for application to start
    sleep 5
    
    # Check if application is running
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        log "✅ Application restarted successfully" "$GREEN"
    else
        log "❌ Application failed to start" "$RED"
        pm2 logs "$PM2_APP_NAME" --lines 20
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..." "$BLUE"
    
    # Get application URL (adjust as needed)
    APP_URL="http://localhost:3000"
    
    # Wait for application to be ready
    sleep 10
    
    # Check if application responds
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200"; then
        log "✅ Application is responding" "$GREEN"
    else
        log "⚠️ Application may not be responding properly" "$YELLOW"
    fi
    
    # Check PM2 status
    pm2 status "$PM2_APP_NAME"
    
    # Show recent logs
    log "📋 Recent application logs:" "$CYAN"
    pm2 logs "$PM2_APP_NAME" --lines 10 --nostream
}

# Function to cleanup old chunks
cleanup_chunks() {
    log "🧹 Cleaning up old chunks..." "$BLUE"
    
    cd "$PROJECT_DIR"
    
    if [ -d ".next/static/chunks" ]; then
        # Remove specific problematic chunks
        find .next -name "*4bd1b696-100b9d70ed4e49c1*" -delete 2>/dev/null || true
        find .next -name "*1255-97815b72abc5c1f0*" -delete 2>/dev/null || true
        
        log "✅ Old chunks cleaned up" "$GREEN"
    fi
}

# Function to show deployment summary
show_summary() {
    log "📊 Deployment Summary" "$PURPLE"
    echo "=================================="
    echo "Project: $PROJECT_NAME"
    echo "Directory: $PROJECT_DIR"
    echo "Build Time: $(date)"
    echo "Build Timestamp: $NEXT_PUBLIC_BUILD_TIME"
    echo "Deployment ID: $NEXT_PUBLIC_DEPLOYMENT_ID"
    echo "Chunk Count: $(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")"
    echo "PM2 Status: $(pm2 list | grep "$PM2_APP_NAME" | awk '{print $10}' || echo "Unknown")"
    echo "=================================="
}

# Main deployment function
main() {
    log "🚀 Starting Auto Deploy Server Script" "$PURPLE"
    log "Project: $PROJECT_NAME" "$CYAN"
    log "Directory: $PROJECT_DIR" "$CYAN"
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log "❌ Project directory not found: $PROJECT_DIR" "$RED"
        log "Please update PROJECT_DIR in the script" "$YELLOW"
        exit 1
    fi
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Update from Git
    if ! update_from_git; then
        log "ℹ️ No new changes to deploy" "$YELLOW"
        exit 0
    fi
    
    # Step 4: Install dependencies
    install_dependencies
    
    # Step 5: Generate Prisma client
    generate_prisma
    
    # Step 6: Build application
    build_application
    
    # Step 7: Cleanup old chunks
    cleanup_chunks
    
    # Step 8: Restart application
    restart_application
    
    # Step 9: Verify deployment
    verify_deployment
    
    # Step 10: Cleanup old backups
    cleanup_backups
    
    # Step 11: Show summary
    show_summary
    
    log "🎉 Auto deployment completed successfully!" "$GREEN"
    log "Application is running and ready for production" "$GREEN"
}

# Handle script arguments
case "${1:-}" in
    "backup")
        create_backup
        ;;
    "build")
        build_application
        ;;
    "restart")
        restart_application
        ;;
    "verify")
        verify_deployment
        ;;
    "cleanup")
        cleanup_chunks
        ;;
    "status")
        pm2 status "$PM2_APP_NAME"
        ;;
    "logs")
        pm2 logs "$PM2_APP_NAME" --lines 50
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  - Full deployment process"
        echo "  backup     - Create backup only"
        echo "  build      - Build application only"
        echo "  restart    - Restart application only"
        echo "  verify     - Verify deployment"
        echo "  cleanup    - Cleanup old chunks"
        echo "  status     - Show PM2 status"
        echo "  logs       - Show application logs"
        echo "  help       - Show this help"
        ;;
    *)
        main
        ;;
esac
