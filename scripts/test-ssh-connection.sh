#!/bin/bash

# 🔑 SSH Connection Test Script
# This script tests the SSH connection to the VPS

set -e

echo "🔑 Testing SSH Connection to VPS"
echo "================================"

# Configuration
HOST="69.62.73.84"
USER="root"
PORT="22"

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

# Test 1: Basic SSH connection
log "🔍 Testing basic SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "echo 'SSH connection successful'" 2>/dev/null; then
    success "✅ SSH connection works"
else
    error "❌ SSH connection failed"
    echo "Please check:"
    echo "1. SSH key is properly configured in GitHub secrets"
    echo "2. Public key is added to VPS authorized_keys"
    echo "3. VPS is running and accessible"
    exit 1
fi

# Test 2: Check if project directory exists
log "🔍 Checking project directory..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "test -d /var/www/jobportal && echo 'Directory exists'" 2>/dev/null; then
    success "✅ Project directory exists"
else
    warning "⚠️ Project directory /var/www/jobportal not found"
    log "Creating project directory..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "mkdir -p /var/www/jobportal"
    success "✅ Project directory created"
fi

# Test 3: Check Node.js installation
log "🔍 Checking Node.js installation..."
NODE_VERSION=$(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "node --version 2>/dev/null || echo 'not-installed'" 2>/dev/null)
if [[ "$NODE_VERSION" =~ ^v[0-9] ]]; then
    success "✅ Node.js installed: $NODE_VERSION"
else
    warning "⚠️ Node.js not installed or not working"
fi

# Test 4: Check PM2 installation
log "🔍 Checking PM2 installation..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "pm2 --version > /dev/null 2>&1 && echo 'PM2 installed'" 2>/dev/null; then
    success "✅ PM2 is installed"
else
    warning "⚠️ PM2 not installed"
fi

# Test 5: Check git access
log "🔍 Checking git access..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "git --version > /dev/null 2>&1 && echo 'Git available'" 2>/dev/null; then
    success "✅ Git is available"
else
    warning "⚠️ Git not available"
fi

# Test 6: Check port 3000 availability
log "🔍 Checking port 3000 availability..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "lsof -i :3000 > /dev/null 2>&1 && echo 'Port 3000 in use' || echo 'Port 3000 available'" 2>/dev/null; then
    success "✅ Port 3000 check completed"
else
    warning "⚠️ Could not check port 3000"
fi

success "🎉 SSH connection test completed!"
echo ""
echo "📋 Summary:"
echo "- SSH Connection: ✅ Working"
echo "- Project Directory: ✅ Ready"
echo "- Node.js: $NODE_VERSION"
echo "- PM2: $(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "pm2 --version 2>/dev/null || echo 'Not installed'")"
echo "- Git: $(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT $USER@$HOST "git --version 2>/dev/null || echo 'Not available'")"
echo ""
echo "🚀 Ready for deployment!"
