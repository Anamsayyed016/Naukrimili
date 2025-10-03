#!/bin/bash

# 🔐 GitHub Secrets Verification Script
# This script helps verify GitHub secrets are properly configured

echo "🔐 GitHub Secrets Verification"
echo "=============================="

# Check if we're in GitHub Actions
if [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "✅ Running in GitHub Actions environment"
    
    # Check required secrets
    echo ""
    echo "🔍 Checking required secrets..."
    
    if [ -n "$HOST" ]; then
        echo "✅ HOST secret is set"
    else
        echo "❌ HOST secret is missing"
    fi
    
    if [ -n "$SSH_USER" ]; then
        echo "✅ SSH_USER secret is set"
    else
        echo "❌ SSH_USER secret is missing"
    fi
    
    if [ -n "$SSH_KEY" ]; then
        echo "✅ SSH_KEY secret is set"
        # Check if it looks like a valid SSH key
        if [[ "$SSH_KEY" == *"BEGIN"*"PRIVATE KEY"* ]]; then
            echo "✅ SSH_KEY appears to be a valid private key"
        else
            echo "⚠️ SSH_KEY doesn't look like a standard private key format"
        fi
    else
        echo "❌ SSH_KEY secret is missing"
    fi
    
    if [ -n "$SSH_PORT" ]; then
        echo "✅ SSH_PORT secret is set: $SSH_PORT"
    else
        echo "❌ SSH_PORT secret is missing"
    fi
    
    echo ""
    echo "📋 Secret Summary:"
    echo "- HOST: ${HOST:-'NOT SET'}"
    echo "- SSH_USER: ${SSH_USER:-'NOT SET'}"
    echo "- SSH_KEY: ${SSH_KEY:0:50}... (truncated)"
    echo "- SSH_PORT: ${SSH_PORT:-'NOT SET'}"
    
else
    echo "ℹ️ Not running in GitHub Actions environment"
    echo "This script is designed to run in GitHub Actions to verify secrets"
fi

echo ""
echo "🔧 If secrets are missing, add them in:"
echo "GitHub Repository → Settings → Secrets and variables → Actions"
echo ""
echo "Required secrets:"
echo "- HOST: Your VPS IP address (e.g., 69.62.73.84)"
echo "- SSH_USER: SSH username (e.g., root)"
echo "- SSH_KEY: Your private SSH key (starts with -----BEGIN OPENSSH PRIVATE KEY-----)"
echo "- SSH_PORT: SSH port (usually 22)"
