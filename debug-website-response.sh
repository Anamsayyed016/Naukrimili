#!/bin/bash

# Debug website response issue
echo "🔍 Debugging website response issue..."

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

print_step "1. Checking PM2 status..."
pm2 status

print_step "2. Checking if port 3000 is listening..."
netstat -tlnp | grep :3000

print_step "3. Testing local application..."
curl -v http://localhost:3000/api/health

print_step "4. Testing domain from server..."
curl -v http://aftionix.in/api/health

print_step "5. Checking nginx status..."
systemctl status nginx --no-pager

print_step "6. Checking nginx configuration..."
nginx -t

print_step "7. Checking nginx sites enabled..."
ls -la /etc/nginx/sites-enabled/

print_step "8. Checking nginx access logs..."
tail -10 /var/log/nginx/access.log

print_step "9. Checking nginx error logs..."
tail -10 /var/log/nginx/error.log

print_step "10. Checking PM2 logs (last 20 lines)..."
pm2 logs jobportal --lines 20

print_step "11. Testing with different user agent..."
curl -H "User-Agent: Mozilla/5.0" http://aftionix.in

print_step "12. Checking if there are any firewall issues..."
iptables -L | grep -E "(80|3000)"

print_status "Debug completed. Check the output above for issues."

