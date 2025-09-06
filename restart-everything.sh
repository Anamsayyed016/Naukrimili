#!/bin/bash

# Restart everything to fix website response
echo "🔄 Restarting everything to fix website response..."

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

print_step "1. Stopping PM2 processes..."
pm2 stop all
pm2 delete all

print_step "2. Killing any stuck processes..."
pkill -f node
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

print_step "3. Clearing PM2 logs..."
pm2 flush

print_step "4. Restarting nginx..."
systemctl restart nginx

print_step "5. Waiting 3 seconds..."
sleep 3

print_step "6. Starting PM2 with fresh process..."
pm2 start ecosystem.config.cjs --env production

print_step "7. Waiting for application to start..."
sleep 10

print_step "8. Checking PM2 status..."
pm2 status

print_step "9. Testing local connection..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Local application is responding"
else
    print_warning "⚠️ Local application is not responding"
    print_status "Checking PM2 logs..."
    pm2 logs jobportal --lines 10
fi

print_step "10. Testing domain connection..."
if curl -f http://aftionix.in/api/health >/dev/null 2>&1; then
    print_status "✅ Domain is responding"
else
    print_warning "⚠️ Domain is not responding"
    print_status "Testing with verbose curl..."
    curl -v http://aftionix.in/api/health
fi

print_step "11. Checking nginx logs..."
print_status "Recent nginx access logs:"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No access logs found"

print_status "Recent nginx error logs:"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No error logs found"

print_status "🎉 Restart completed!"
print_status "🌐 Test your website: http://aftionix.in"

