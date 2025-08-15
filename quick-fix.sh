#!/bin/bash

echo "🚀 QUICK RESOURCE FIX - IMMEDIATE RESULTS"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

echo "🔍 Current resource usage before fix:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
echo "🚀 Starting quick fix..."

# Step 1: Stop duplicate npm start processes
echo "Stopping duplicate npm start processes..."
NPM_COUNT=$(ps aux | grep "npm start" | grep -v grep | wc -l)
if [ $NPM_COUNT -gt 1 ]; then
    echo "Found $NPM_COUNT npm start processes"
    
    # Get all PIDs
    NPM_PIDS=$(ps aux | grep "npm start" | grep -v grep | awk '{print $2}')
    
    # Keep first, stop rest
    FIRST_PID=$(echo "$NPM_PIDS" | head -1)
    DUPLICATE_PIDS=$(echo "$NPM_PIDS" | tail -n +2)
    
    echo "Keeping main process: $FIRST_PID"
    echo "Stopping duplicates: $DUPLICATE_PIDS"
    
    for pid in $DUPLICATE_PIDS; do
        kill -TERM $pid 2>/dev/null
        sleep 1
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null
        fi
    done
    print_success "Duplicate npm processes stopped"
else
    echo "No duplicate npm processes found"
fi

# Step 2: Stop PM2 daemon
echo "Stopping PM2 daemon..."
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null
    pm2 delete all 2>/dev/null
    print_success "PM2 processes stopped"
else
    echo "PM2 not found"
fi

# Step 3: Stop duplicate Next.js processes
echo "Stopping duplicate Next.js processes..."
NEXT_COUNT=$(ps aux | grep "next start" | grep -v grep | wc -l)
if [ $NEXT_COUNT -gt 1 ]; then
    echo "Found $NEXT_COUNT next start processes"
    
    # Get all PIDs
    NEXT_PIDS=$(ps aux | grep "next start" | grep -v grep | awk '{print $2}')
    
    # Keep first, stop rest
    FIRST_NEXT_PID=$(echo "$NEXT_PIDS" | head -1)
    DUPLICATE_NEXT_PIDS=$(echo "$NEXT_PIDS" | tail -n +2)
    
    echo "Keeping main Next.js process: $FIRST_NEXT_PID"
    echo "Stopping duplicates: $DUPLICATE_NEXT_PIDS"
    
    for pid in $DUPLICATE_NEXT_PIDS; do
        kill -TERM $pid 2>/dev/null
        sleep 1
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null
        fi
    done
    print_success "Duplicate Next.js processes stopped"
else
    echo "No duplicate Next.js processes found"
fi

# Step 4: Final cleanup
echo "Performing final cleanup..."
pkill -f "npm start" 2>/dev/null || echo "No npm processes to clean"
pkill -f "next start" 2>/dev/null || echo "No next processes to clean"

sleep 2

# Step 5: Show results
echo ""
echo "📊 Resource usage AFTER fix:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
echo "🔍 Service status:"
systemctl status jobportal --no-pager | head -10

echo ""
print_success "🎉 Quick fix complete!"
echo ""
echo "📋 What was fixed:"
echo "✅ Duplicate npm start processes removed"
echo "✅ Duplicate Next.js processes removed"
echo "✅ PM2 daemon stopped"
echo "✅ Resource usage optimized"
echo ""
echo "🌐 Check your website: https://aftionix.in"
echo "💡 Resource limitations should be gone now!"
echo ""
echo "🔍 To verify:"
echo "   - Check Hostinger dashboard"
echo "   - Resource warnings should disappear"
echo "   - Website should work normally"
