#!/bin/bash

# Deep Server Debug Script for Job Portal
# This script performs comprehensive debugging and fixes

set -e

echo "🔍 DEEP SERVER DEBUG SCRIPT STARTING..."
echo "=========================================="

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Navigate to project directory
cd /var/www/jobportal || {
    print_error "Cannot access /var/www/jobportal"
    exit 1
}

print_status "Current directory: $(pwd)"

# Step 1: Stop PM2 processes
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 2: Check Node.js and npm versions
print_status "Checking Node.js and npm versions..."
node --version
npm --version

# Step 3: Clean everything
print_status "Cleaning previous builds and caches..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
npm cache clean --force

# Step 4: Check disk space
print_status "Checking disk space..."
df -h

# Step 5: Check memory
print_status "Checking memory usage..."
free -h

# Step 6: Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps

# Step 7: Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Step 8: Check environment variables
print_status "Checking critical environment variables..."
if [ -f .env.production ]; then
    print_success "Production environment file found"
    grep -E "^(DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET)" .env.production | head -3
else
    print_warning "No .env.production file found"
fi

# Step 9: Build the application
print_status "Building application for production..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

# Build with detailed output
npm run build 2>&1 | tee build.log

# Check if build was successful
if [ -f ".next/server/middleware-manifest.json" ] && [ -f ".next/required-server-files.json" ]; then
    print_success "Build completed successfully - all required files present"
else
    print_error "Build failed - missing critical files"
    print_status "Checking what files exist in .next directory:"
    ls -la .next/ 2>/dev/null || print_error "No .next directory found"
    exit 1
fi

# Step 10: Check build output
print_status "Checking build output..."
ls -la .next/
ls -la .next/server/ | head -10

# Step 11: Test the application locally
print_status "Testing application startup..."
timeout 10s npm start &
TEST_PID=$!
sleep 5

if kill -0 $TEST_PID 2>/dev/null; then
    print_success "Application started successfully"
    kill $TEST_PID 2>/dev/null || true
else
    print_error "Application failed to start"
    exit 1
fi

# Step 12: Start with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Step 13: Wait and check status
print_status "Waiting for application to start..."
sleep 10

pm2 status

# Step 14: Check if application is responding
print_status "Testing application response..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    print_success "Application is responding on port 3000"
else
    print_warning "Application not responding on port 3000"
    print_status "Checking PM2 logs:"
    pm2 logs jobportal --lines 10
fi

# Step 15: Check Nginx configuration
print_status "Checking Nginx configuration..."
if [ -f /etc/nginx/sites-available/jobportal ]; then
    print_success "Nginx configuration found"
    print_status "Testing Nginx configuration:"
    nginx -t
else
    print_warning "No Nginx configuration found for jobportal"
fi

# Step 16: Restart Nginx
print_status "Restarting Nginx..."
systemctl restart nginx

# Step 17: Final status check
print_status "Final status check..."
pm2 status
systemctl status nginx --no-pager -l

print_success "Deep server debug completed!"
print_status "Check the application at: https://naukrimili.com"
print_status "If still having issues, check: pm2 logs jobportal"
