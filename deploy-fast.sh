#!/bin/bash

# Fast deployment script for production server
set -e

echo "🚀 Starting fast deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from project root."
    exit 1
fi

print_status "Stopping PM2 process..."
pm2 stop jobportal || print_warning "PM2 process not running"

print_status "Pulling latest changes..."
git pull origin main

print_status "Installing dependencies..."
npm ci --only=production --legacy-peer-deps

print_status "Generating Prisma client..."
npx prisma generate

print_status "Building application (optimized)..."
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint

print_status "Starting PM2 process..."
pm2 start ecosystem.config.cjs --env production

print_status "Checking PM2 status..."
pm2 status

print_status "Showing recent logs..."
pm2 logs jobportal --lines 20

print_status "✅ Deployment completed successfully!"
print_status "🌐 Your application should be running on port 3000"
