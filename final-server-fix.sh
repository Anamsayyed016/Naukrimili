#!/bin/bash

# Final server fix script - Run this on your server
echo "🚀 Final server fix - deploying optimized build..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project directory. Please run from /var/www/jobportal"
    exit 1
fi

print_step "1. Stopping all processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f node 2>/dev/null || true

print_step "2. Killing any processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

print_step "3. Clearing PM2 logs..."
pm2 flush 2>/dev/null || true

print_step "4. Restarting nginx..."
systemctl restart nginx

print_step "5. Installing dependencies..."
npm ci --only=production --legacy-peer-deps

print_step "6. Generating Prisma client..."
npx prisma generate

print_step "7. Building application (optimized - should be ~10 seconds)..."
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint

print_step "8. Starting PM2 with optimized config..."
pm2 start ecosystem.config.cjs --env production

print_step "9. Waiting for application to start..."
sleep 10

print_step "10. Checking status..."
pm2 status

print_step "11. Testing local connection..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Application is responding locally"
else
    print_warning "⚠️ Application may not be responding yet"
    print_status "Checking PM2 logs..."
    pm2 logs jobportal --lines 20
fi

print_step "12. Saving PM2 configuration..."
pm2 save 2>/dev/null || true

print_status "🎉 Final fix completed!"
print_status "🌐 Check your website: http://mum.hostingerps.com"
print_status "📊 Use 'pm2 logs jobportal' to view logs"
print_status "🔧 Use 'pm2 monit' to monitor the application"
print_status "⚡ Build time should now be ~10 seconds instead of 4+ minutes!"

