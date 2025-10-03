#!/bin/bash

# 🔍 Deployment Debug Script
# This script helps debug deployment issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check GitHub Secrets
check_github_secrets() {
    log_info "Checking GitHub Secrets..."
    
    if [ -z "$HOST" ]; then
        log_error "HOST secret is not set"
        return 1
    else
        log_success "HOST secret is set: $HOST"
    fi
    
    if [ -z "$SSH_USER" ]; then
        log_error "SSH_USER secret is not set"
        return 1
    else
        log_success "SSH_USER secret is set: $SSH_USER"
    fi
    
    if [ -z "$SSH_KEY" ]; then
        log_error "SSH_KEY secret is not set"
        return 1
    else
        log_success "SSH_KEY secret is set (length: ${#SSH_KEY})"
    fi
    
    if [ -z "$SSH_PORT" ]; then
        log_error "SSH_PORT secret is not set"
        return 1
    else
        log_success "SSH_PORT secret is set: $SSH_PORT"
    fi
    
    return 0
}

# Test SSH connection
test_ssh_connection() {
    log_info "Testing SSH connection..."
    
    if [ -z "$HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_KEY" ] || [ -z "$SSH_PORT" ]; then
        log_error "SSH secrets not available for testing"
        return 1
    fi
    
    # Create temporary SSH key file
    SSH_KEY_FILE=$(mktemp)
    echo "$SSH_KEY" > "$SSH_KEY_FILE"
    chmod 600 "$SSH_KEY_FILE"
    
    # Test SSH connection
    if ssh -i "$SSH_KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$HOST" "echo 'SSH connection successful'"; then
        log_success "SSH connection successful"
        rm -f "$SSH_KEY_FILE"
        return 0
    else
        log_error "SSH connection failed"
        rm -f "$SSH_KEY_FILE"
        return 1
    fi
}

# Check server prerequisites
check_server_prerequisites() {
    log_info "Checking server prerequisites..."
    
    if [ -z "$HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_KEY" ] || [ -z "$SSH_PORT" ]; then
        log_error "SSH secrets not available for server check"
        return 1
    fi
    
    # Create temporary SSH key file
    SSH_KEY_FILE=$(mktemp)
    echo "$SSH_KEY" > "$SSH_KEY_FILE"
    chmod 600 "$SSH_KEY_FILE"
    
    # Check server prerequisites
    ssh -i "$SSH_KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$HOST" "
        echo '🔍 Checking server prerequisites...'
        
        # Check if project directory exists
        if [ -d '/root/jobportal' ]; then
            echo '✅ Project directory exists: /root/jobportal'
        else
            echo '❌ Project directory not found: /root/jobportal'
            exit 1
        fi
        
        # Check Node.js
        if command -v node >/dev/null 2>&1; then
            NODE_VERSION=\$(node --version)
            echo \"✅ Node.js installed: \$NODE_VERSION\"
        else
            echo '❌ Node.js not installed'
            exit 1
        fi
        
        # Check npm
        if command -v npm >/dev/null 2>&1; then
            NPM_VERSION=\$(npm --version)
            echo \"✅ npm installed: \$NPM_VERSION\"
        else
            echo '❌ npm not installed'
            exit 1
        fi
        
        # Check PM2
        if command -v pm2 >/dev/null 2>&1; then
            PM2_VERSION=\$(pm2 --version)
            echo \"✅ PM2 installed: \$PM2_VERSION\"
        else
            echo '❌ PM2 not installed'
            exit 1
        fi
        
        # Check git
        if command -v git >/dev/null 2>&1; then
            GIT_VERSION=\$(git --version)
            echo \"✅ Git installed: \$GIT_VERSION\"
        else
            echo '❌ Git not installed'
            exit 1
        fi
        
        # Check curl
        if command -v curl >/dev/null 2>&1; then
            CURL_VERSION=\$(curl --version | head -n1)
            echo \"✅ curl installed: \$CURL_VERSION\"
        else
            echo '❌ curl not installed'
            exit 1
        fi
        
        echo '✅ All server prerequisites met'
    "
    
    local exit_code=$?
    rm -f "$SSH_KEY_FILE"
    
    if [ $exit_code -eq 0 ]; then
        log_success "Server prerequisites check passed"
        return 0
    else
        log_error "Server prerequisites check failed"
        return 1
    fi
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    if [ -z "$HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_KEY" ] || [ -z "$SSH_PORT" ]; then
        log_error "SSH secrets not available for deployment test"
        return 1
    fi
    
    # Create temporary SSH key file
    SSH_KEY_FILE=$(mktemp)
    echo "$SSH_KEY" > "$SSH_KEY_FILE"
    chmod 600 "$SSH_KEY_FILE"
    
    # Test deployment
    ssh -i "$SSH_KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$HOST" "
        echo '🚀 Testing deployment...'
        
        cd /root/jobportal
        
        # Test git pull
        echo '🔄 Testing git pull...'
        git fetch origin
        git reset --hard origin/main
        git clean -fd
        git pull origin main
        echo '✅ Git pull successful'
        
        # Test npm install
        echo '📦 Testing npm install...'
        rm -f package-lock.json
        cat > .npmrc << 'EOF'
        engine-strict=false
        legacy-peer-deps=true
        fund=false
        audit=false
        auto-install-peers=true
        EOF
        
        npm install --legacy-peer-deps --engine-strict=false --force
        echo '✅ npm install successful'
        
        # Test build
        echo '🔨 Testing build...'
        export NODE_OPTIONS='--max-old-space-size=4096'
        export NEXT_TELEMETRY_DISABLED=1
        export NODE_ENV=production
        
        npm run build
        echo '✅ Build successful'
        
        # Test PM2
        echo '▶️ Testing PM2...'
        pm2 stop jobportal 2>/dev/null || true
        pm2 delete jobportal 2>/dev/null || true
        pm2 start ecosystem.config.cjs --env production --no-daemon
        echo '✅ PM2 start successful'
        
        # Wait and test health
        echo '🏥 Testing health check...'
        sleep 10
        
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo '✅ Health check passed'
        else
            echo '❌ Health check failed'
            pm2 logs jobportal --lines 10
            exit 1
        fi
        
        echo '✅ Deployment test successful'
    "
    
    local exit_code=$?
    rm -f "$SSH_KEY_FILE"
    
    if [ $exit_code -eq 0 ]; then
        log_success "Deployment test passed"
        return 0
    else
        log_error "Deployment test failed"
        return 1
    fi
}

# Main function
main() {
    echo "🔍 Starting deployment debug..."
    
    # Check GitHub Secrets
    if ! check_github_secrets; then
        log_error "GitHub Secrets check failed"
        exit 1
    fi
    
    # Test SSH connection
    if ! test_ssh_connection; then
        log_error "SSH connection test failed"
        exit 1
    fi
    
    # Check server prerequisites
    if ! check_server_prerequisites; then
        log_error "Server prerequisites check failed"
        exit 1
    fi
    
    # Test deployment
    if ! test_deployment; then
        log_error "Deployment test failed"
        exit 1
    fi
    
    log_success "All checks passed! Deployment should work."
}

# Run main function
main "$@"
