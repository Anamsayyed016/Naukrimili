#!/bin/bash

# Final Server Deployment Script
# This script deploys the fully working application to the server

set -e

echo "🚀 Starting Final Server Deployment..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Current directory: $(pwd)"
print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Step 1: Pull latest changes
print_status "Pulling latest changes from repository..."
git pull origin main

# Step 2: Stop PM2 processes
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 3: Clean everything
print_status "Cleaning previous builds and caches..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
rm -rf ~/.npm/_cacache

# Step 4: Create proper .npmrc
print_status "Creating .npmrc for engine compatibility..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
EOF

# Step 5: Install dependencies with force
print_status "Installing dependencies with engine bypass..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 6: Install missing packages explicitly
print_status "Installing missing packages..."
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 7: Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Step 8: Build the application
print_status "Building Next.js application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
npx next build

# Step 9: Start PM2
print_status "Starting PM2 with the built application..."
pm2 start npm --name "jobportal" -- start

# Step 10: Restart Nginx
print_status "Restarting Nginx..."
systemctl restart nginx

# Step 11: Check status
print_status "Checking deployment status..."
sleep 5

# Check PM2 status
if pm2 list | grep -q "jobportal.*online"; then
    print_success "PM2 process is running"
else
    print_error "PM2 process failed to start"
    pm2 logs jobportal --lines 20
    exit 1
fi

# Check if the application is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    print_success "Application is responding on localhost:3000"
else
    print_warning "Application may not be responding yet, checking logs..."
    pm2 logs jobportal --lines 10
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    systemctl status nginx
fi

print_success "🎉 Final Server Deployment Complete!"
print_status "Application should be available at your domain"
print_status "PM2 Status:"
pm2 list
print_status "Nginx Status:"
systemctl status nginx --no-pager -l

echo ""
print_status "If you encounter any issues, check:"
print_status "1. PM2 logs: pm2 logs jobportal"
print_status "2. Nginx logs: journalctl -u nginx -f"
print_status "3. Application logs: pm2 logs jobportal --lines 50"
