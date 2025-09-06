#!/bin/bash

# Test SSH Connection Script
# This script tests the SSH connection to your VPS

echo "🔍 Testing SSH Connection to Hostinger VPS"
echo "=========================================="

# Test basic SSH connection
echo "Testing SSH connection to 69.62.73.84..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes root@69.62.73.84 "echo 'SSH connection successful!'" 2>/dev/null; then
    echo "✅ SSH connection successful!"
else
    echo "❌ SSH connection failed!"
    echo ""
    echo "Possible issues:"
    echo "1. SSH key not added to VPS"
    echo "2. Wrong IP address or username"
    echo "3. Firewall blocking SSH"
    echo "4. SSH service not running on VPS"
    echo ""
    echo "To fix:"
    echo "1. Add your public key to ~/.ssh/authorized_keys on VPS"
    echo "2. Check if SSH service is running: systemctl status ssh"
    echo "3. Check firewall: ufw status"
fi

echo ""
echo "Testing if required directories exist..."
ssh root@69.62.73.84 "ls -la /home/root/" 2>/dev/null || echo "Cannot access /home/root/"

echo ""
echo "Testing if PM2 is installed..."
ssh root@69.62.73.84 "pm2 --version" 2>/dev/null || echo "PM2 not installed"

echo ""
echo "Testing if Node.js is installed..."
ssh root@69.62.73.84 "node --version" 2>/dev/null || echo "Node.js not installed"

echo ""
echo "Test completed!"
