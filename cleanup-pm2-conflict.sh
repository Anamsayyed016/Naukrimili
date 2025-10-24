#!/bin/bash

# PM2 Conflict Cleanup Script
# Run this on your server to fix the process conflict

echo "🔧 PM2 Conflict Cleanup"
echo "======================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash cleanup-pm2-conflict.sh"
    exit 1
fi

echo "📋 Current PM2 Status:"
pm2 status

echo ""
echo "🛑 Stopping conflicting processes..."

# Stop the jobportal process (the conflicting one)
echo "Stopping jobportal process..."
pm2 stop jobportal 2>/dev/null || echo "No jobportal process found"
pm2 delete jobportal 2>/dev/null || echo "No jobportal process to delete"

# Keep naukrimili process running
echo "✅ Keeping naukrimili process running..."

echo ""
echo "📋 Updated PM2 Status:"
pm2 status

echo ""
echo "✅ PM2 conflict cleanup completed!"
echo ""
echo "📋 Final Status:"
pm2 list

echo ""
echo "🎯 Only naukrimili process should be running now"
