#!/bin/bash
# Command 1: Check the active Nginx configuration
echo "📋 Checking active Nginx configuration..."
echo ""
echo "Current Nginx config location:"
nginx -t 2>&1 | head -5
echo ""
echo "Active Nginx sites:"
ls -la /etc/nginx/sites-enabled/
echo ""
echo "Checking for naukrimili.com config:"
grep -r "naukrimili.com" /etc/nginx/sites-enabled/ 2>/dev/null | head -10

