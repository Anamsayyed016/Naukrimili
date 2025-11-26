#!/bin/bash
# Command 2: Check Nginx status and find config files
echo "📋 Checking Nginx installation and configuration..."
echo ""
echo "1. Check if Nginx is installed:"
which nginx
echo ""
echo "2. Check Nginx service status:"
systemctl status nginx 2>&1 | head -10 || service nginx status 2>&1 | head -10
echo ""
echo "3. Check main Nginx config file:"
ls -la /etc/nginx/nginx.conf 2>/dev/null || echo "nginx.conf not found"
echo ""
echo "4. List all Nginx config directories:"
ls -la /etc/nginx/ 2>/dev/null || echo "Nginx not installed"
echo ""
echo "5. Check if Nginx is running:"
ps aux | grep nginx | grep -v grep || echo "Nginx not running"

