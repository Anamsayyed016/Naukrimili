#!/bin/bash

# Server debugging and fix script
set -e

echo "🔍 Starting server debugging and fix process..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

print_step "1. Checking system resources..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h
echo ""

print_step "2. Checking PM2 status..."
pm2 status
echo ""

print_step "3. Checking if port 3000 is in use..."
netstat -tlnp | grep :3000 || echo "Port 3000 is not in use"
echo ""

print_step "4. Checking nginx status..."
systemctl status nginx --no-pager -l
echo ""

print_step "5. Checking nginx error logs..."
tail -20 /var/log/nginx/error.log
echo ""

print_step "6. Checking PM2 logs..."
pm2 logs jobportal --lines 20
echo ""

print_step "7. Checking if Next.js app is responding..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Next.js app is responding on localhost:3000"
else
    print_error "❌ Next.js app is NOT responding on localhost:3000"
fi

print_step "8. Checking nginx configuration..."
nginx -t
echo ""

print_step "9. Restarting services..."
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true

print_status "Killing any processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

print_status "Restarting nginx..."
systemctl restart nginx

print_status "Starting PM2 processes..."
pm2 start ecosystem.optimized.cjs --env production

print_step "10. Final verification..."
sleep 5
pm2 status
echo ""

if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Next.js app is now responding"
else
    print_error "❌ Next.js app is still not responding"
    print_status "Checking PM2 logs for errors..."
    pm2 logs jobportal --lines 50
fi

print_status "🎉 Debug and fix process completed!"
