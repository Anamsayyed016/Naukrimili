#!/bin/bash

# Ultra-fast server deployment script
set -e

echo "🚀 Starting ultra-fast server deployment..."

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
    print_error "Not in project root directory. Please run from project root."
    exit 1
fi

print_step "1. Stopping PM2 process..."
pm2 stop jobportal 2>/dev/null || print_warning "PM2 process not running"

print_step "2. Pulling latest changes..."
git fetch origin
git reset --hard origin/main
print_status "✅ Git pull completed"

print_step "3. Installing dependencies (production only)..."
npm ci --only=production --legacy-peer-deps --silent
print_status "✅ Dependencies installed"

print_step "4. Generating Prisma client..."
npx prisma generate --silent
print_status "✅ Prisma client generated"

print_step "5. Building application (ultra-fast mode)..."
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint --experimental-build-mode=compile
print_status "✅ Build completed"

print_step "6. Starting PM2 process..."
pm2 start ecosystem.optimized.cjs --env production
print_status "✅ PM2 process started"

print_step "7. Verifying deployment..."
sleep 3
pm2 status

print_step "8. Health check..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Application is responding"
else
    print_warning "⚠️ Application may not be responding yet"
fi

print_status "🎉 Deployment completed successfully!"
print_status "🌐 Your application is running on port 3000"
print_status "📊 Use 'pm2 logs jobportal' to view logs"
print_status "🔧 Use 'pm2 monit' to monitor the application"
