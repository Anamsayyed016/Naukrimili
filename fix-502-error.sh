#!/bin/bash

# Fix 502 Bad Gateway Error - Port Mismatch Issue
# This script fixes the port mismatch between Nginx and PM2

echo "🔧 Fixing 502 Bad Gateway Error..."
echo "📊 Problem: Nginx trying to connect to port 3001, but PM2 running on port 3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo or as root"
    exit 1
fi

print_status "Starting 502 error fix process..."

# Step 1: Check current PM2 status
print_status "Checking PM2 application status..."
pm2 status

# Step 2: Check what's running on ports 3000 and 3001
print_status "Checking port usage..."
echo "Port 3000:"
lsof -i :3000 || echo "Nothing running on port 3000"
echo ""
echo "Port 3001:"
lsof -i :3001 || echo "Nothing running on port 3001"
echo ""

# Step 3: Update Nginx configuration
print_status "Updating Nginx configuration..."
if [ -f "/etc/nginx/sites-available/aftionix.in" ]; then
    # Ubuntu/Debian style
    NGINX_CONFIG="/etc/nginx/sites-available/aftionix.in"
elif [ -f "/etc/nginx/conf.d/aftionix.in.conf" ]; then
    # CentOS/RHEL style
    NGINX_CONFIG="/etc/nginx/conf.d/aftionix.in.conf"
else
    print_warning "Nginx config file not found in standard locations"
    print_status "Looking for Nginx config files..."
    find /etc/nginx -name "*aftionix*" -type f 2>/dev/null
    read -p "Enter the full path to your Nginx config file: " NGINX_CONFIG
fi

if [ -f "$NGINX_CONFIG" ]; then
    print_status "Found Nginx config: $NGINX_CONFIG"
    
    # Backup original config
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    print_success "Backed up original config"
    
    # Fix the port in the config
    sed -i 's/proxy_pass http:\/\/localhost:3001;/proxy_pass http:\/\/localhost:3000;/g' "$NGINX_CONFIG"
    print_success "Updated Nginx config to use port 3000"
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    if nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Reload Nginx
    print_status "Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        print_success "Nginx reloaded successfully"
    else
        print_error "Failed to reload Nginx"
        exit 1
    fi
else
    print_error "Nginx config file not found: $NGINX_CONFIG"
    exit 1
fi

# Step 4: Ensure PM2 app is running on port 3000
print_status "Checking PM2 application..."
pm2 list

# Check if jobportal app is running
if pm2 list | grep -q "jobportal.*online"; then
    print_success "PM2 jobportal app is running"
else
    print_warning "PM2 jobportal app is not running, starting it..."
    cd /path/to/your/jobportal || cd /var/www/jobportal || cd /home/*/jobportal
    
    # Find the project directory
    PROJECT_DIR=$(find /home /var/www -name "package.json" -path "*/jobportal/package.json" 2>/dev/null | head -1 | xargs dirname)
    if [ -n "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        print_status "Found project directory: $PROJECT_DIR"
        pm2 start ecosystem.config.cjs --env production
        print_success "Started PM2 application"
    else
        print_error "Could not find jobportal project directory"
        exit 1
    fi
fi

# Step 5: Test the connection
print_status "Testing connection to port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    print_success "Application is responding on port 3000"
else
    print_error "Application is not responding on port 3000"
    print_status "Checking PM2 logs..."
    pm2 logs jobportal --lines 20
fi

# Step 6: Test the website
print_status "Testing website accessibility..."
if curl -s -o /dev/null -w "%{http_code}" https://aftionix.in | grep -q "200\|301\|302"; then
    print_success "Website is accessible via HTTPS"
else
    print_warning "Website may not be accessible yet, checking logs..."
fi

# Step 7: Show final status
print_status "Final status check..."
echo ""
echo "=== PM2 Status ==="
pm2 status
echo ""
echo "=== Port Usage ==="
lsof -i :3000 || echo "Nothing on port 3000"
echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager -l
echo ""

print_success "502 error fix completed!"
print_status "If the issue persists, check:"
echo "1. PM2 logs: pm2 logs jobportal"
echo "2. Nginx logs: tail -f /var/log/nginx/error.log"
echo "3. Application logs: pm2 logs jobportal --lines 50"
echo ""
print_status "Test your resume upload at: https://aftionix.in/resumes/upload"
