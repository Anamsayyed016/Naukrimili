#!/bin/bash

# 🔐 SSH Authentication Fix Script
# This script helps debug and fix SSH authentication issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${CYAN}🔍 $1${NC}"; }

echo -e "${CYAN}"
echo "🔐 SSH AUTHENTICATION FIX"
echo "========================"
echo -e "${NC}"

# Step 1: Check SSH key format
log_header "Checking SSH Key Format..."

if [ -f "$HOME/.ssh/id_ed25519" ]; then
    log_info "SSH private key found"
    
    # Check key format
    if head -1 "$HOME/.ssh/id_ed25519" | grep -q "BEGIN OPENSSH PRIVATE KEY"; then
        log_success "SSH key format is correct (OpenSSH)"
    else
        log_error "SSH key format is incorrect"
        exit 1
    fi
    
    # Check key permissions
    KEY_PERMS=$(stat -c "%a" "$HOME/.ssh/id_ed25519" 2>/dev/null || stat -f "%OLp" "$HOME/.ssh/id_ed25519" 2>/dev/null)
    if [ "$KEY_PERMS" = "600" ]; then
        log_success "SSH key permissions are correct (600)"
    else
        log_warning "SSH key permissions are $KEY_PERMS (should be 600)"
        chmod 600 "$HOME/.ssh/id_ed25519"
        log_success "Fixed SSH key permissions"
    fi
else
    log_error "SSH private key not found at $HOME/.ssh/id_ed25519"
    exit 1
fi

# Step 2: Generate public key if missing
log_header "Checking Public Key..."

if [ ! -f "$HOME/.ssh/id_ed25519.pub" ]; then
    log_warning "Public key not found, generating..."
    ssh-keygen -y -f "$HOME/.ssh/id_ed25519" > "$HOME/.ssh/id_ed25519.pub"
    log_success "Public key generated"
fi

# Step 3: Display public key for server setup
log_header "Public Key for Server Setup"
echo -e "${YELLOW}"
echo "📋 Add this public key to your server's ~/.ssh/authorized_keys:"
echo -e "${NC}"
cat "$HOME/.ssh/id_ed25519.pub"
echo ""

# Step 4: Test SSH connection
log_header "Testing SSH Connection..."

# Get connection details
read -p "Enter server IP/domain (default: aftionix.in): " SERVER_HOST
SERVER_HOST=${SERVER_HOST:-aftionix.in}

read -p "Enter SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

read -p "Enter SSH port (default: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

log_info "Testing SSH connection to $SSH_USER@$SERVER_HOST:$SSH_PORT..."

# Test SSH connection
if ssh -i "$HOME/.ssh/id_ed25519" -p "$SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    log_success "SSH connection test passed!"
else
    log_error "SSH connection test failed"
    log_info "Possible solutions:"
    echo "1. Ensure the public key is added to ~/.ssh/authorized_keys on the server"
    echo "2. Check that SSH service is running on the server"
    echo "3. Verify firewall allows SSH connections on port $SSH_PORT"
    echo "4. Ensure the SSH user has proper permissions"
    echo ""
    log_info "To add the public key to the server, run:"
    echo "ssh-copy-id -i $HOME/.ssh/id_ed25519.pub -p $SSH_PORT $SSH_USER@$SERVER_HOST"
fi

# Step 5: Generate clean private key for GitHub
log_header "Generating Clean Private Key for GitHub..."

# Remove any trailing whitespace/newlines
CLEAN_PRIVATE_KEY=$(cat "$HOME/.ssh/id_ed25519" | tr -d '\r' | sed '$d' | sed '$s/$/\n/' | tr -d '\n' | sed 's/$/\n/')

echo -e "${YELLOW}"
echo "📋 Clean Private Key for GitHub Secret SSH_KEY:"
echo -e "${NC}"
echo "$CLEAN_PRIVATE_KEY"
echo ""

# Step 6: Display GitHub secrets
log_header "GitHub Secrets Configuration"
echo -e "${GREEN}"
echo "🔐 Add these secrets to GitHub repository:"
echo -e "${NC}"
echo "HOST: $SERVER_HOST"
echo "SSH_USER: $SSH_USER"
echo "SSH_PORT: $SSH_PORT"
echo "SSH_KEY: [Copy the clean private key above]"
echo ""

log_success "SSH authentication fix completed!"
