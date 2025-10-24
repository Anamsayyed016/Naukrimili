#!/bin/bash

# 🚀 Quick Fix Deployment Script
# This script fixes the current hanging deployment

set -e

echo "🔧 Quick Fix Deployment Script"
echo "=============================="

# Configuration
PROJECT_DIR="/var/www/jobportal"
PM2_APP_NAME="jobportal"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Navigate to project directory
cd "$PROJECT_DIR" || {
    error "Failed to navigate to $PROJECT_DIR"
    exit 1
}

log "📁 Working in: $(pwd)"

# Force kill all PM2 processes
log "💀 Force killing all PM2 processes..."
pm2 kill 2>/dev/null || true
pkill -f "pm2" 2>/dev/null || true
sleep 3

# Clear PM2 logs
log "🧹 Clearing PM2 logs..."
pm2 flush 2>/dev/null || true

# Check if application is already running on port 3000
log "🔍 Checking if port 3000 is in use..."
if lsof -i :3000 > /dev/null 2>&1; then
    warning "Port 3000 is in use, killing processes..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start PM2 process fresh
log "▶️ Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production --no-daemon

# Wait for startup
log "⏳ Waiting for application to start..."
sleep 15

# Check PM2 status
log "📊 PM2 Status:"
pm2 status

# Quick health check
log "🏥 Quick health check..."
if curl -f -s --max-time 10 http://localhost:3000/api/health > /dev/null 2>&1; then
    success "✅ Application is running and healthy!"
    log "🌐 Application is available at: http://localhost:3000"
else
    warning "⚠️ Health check failed, but PM2 process may still be running"
    log "📋 PM2 logs:"
    pm2 logs "$PM2_APP_NAME" --lines 10
    log "📊 PM2 status:"
    pm2 status
fi

success "Quick fix deployment completed!"
log "📊 Use 'pm2 status' to check application status"
log "📋 Use 'pm2 logs $PM2_APP_NAME' to view logs"
