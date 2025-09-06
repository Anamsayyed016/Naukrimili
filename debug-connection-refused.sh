#!/bin/bash

# Debug ERR_CONNECTION_REFUSED issue
echo "🔍 Debugging ERR_CONNECTION_REFUSED issue..."

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

print_step "3. Checking if port 80 is listening..."
netstat -tlnp | grep :80

print_step "4. Checking nginx status..."
systemctl status nginx --no-pager

print_step "5. Testing local application..."
curl -v http://localhost:3000/api/health

print_step "6. Testing nginx locally..."
curl -v http://localhost/api/health

print_step "7. Testing external IP..."
curl -v http://69.62.73.84/api/health

print_step "8. Checking nginx configuration..."
nginx -t

print_step "9. Checking nginx logs..."
tail -10 /var/log/nginx/error.log

print_step "10. Checking firewall status..."
ufw status

print_step "11. Checking what's listening on port 80..."
lsof -i :80

print_step "12. Checking nginx config details..."
cat /etc/nginx/sites-available/aftionix.in

print_status "Debug completed. Check the output above for issues."

