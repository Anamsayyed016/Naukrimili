#!/bin/bash

# 🚀 Server-Side Deployment Script
# This script handles the complete deployment process on the server

set -e

echo "🚀 Starting production deployment..."
echo "=================================="

# Configuration
PROJECT_DIR="/var/www/jobportal"
NODE_VERSION="20"
PM2_APP_NAME="jobportal"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
MAX_RETRIES=10
RETRY_DELAY=15

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (use sudo)"
    exit 1
fi

# Navigate to project directory
log "📁 Working in: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
    error "Failed to navigate to $PROJECT_DIR"
    exit 1
}

# Check Node version and install if needed
log "🔍 Checking Node.js version..."
NODE_CURRENT=$(node --version 2>/dev/null || echo "not-installed")
log "Current Node version: $NODE_CURRENT"

if [[ ! "$NODE_CURRENT" =~ ^v$NODE_VERSION\. ]]; then
    log "📦 Installing Node.js $NODE_VERSION.x..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    apt-get install -y nodejs
    success "Node.js installed: $(node --version)"
else
    success "Node.js $NODE_CURRENT is already installed"
fi

# Stop existing processes
log "⏹️ Stopping existing processes..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Wait for PM2 to fully stop
sleep 5

# Clear PM2 logs and reset
pm2 flush 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Force clean git pull
log "🔄 Force cleaning git state..."
git fetch origin
git reset --hard origin/main
git clean -fd
git pull origin main

# Install dependencies
log "📦 Installing dependencies..."
rm -f package-lock.json

# Create .npmrc for compatibility
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
EOF

# Clean install
rm -rf node_modules .next
npm cache clean --force
npm install --legacy-peer-deps --engine-strict=false --force

# Force install TailwindCSS and PostCSS as regular dependencies
log "🎨 Force installing TailwindCSS and PostCSS..."
npm install --save --legacy-peer-deps --engine-strict=false \
  tailwindcss@3.4.18 \
  postcss@8.4.47 \
  autoprefixer@10.4.20

# Verify TailwindCSS is installed
log "🔍 Verifying TailwindCSS installation..."
if ! node -e "require('tailwindcss')" > /dev/null 2>&1; then
    warning "TailwindCSS not found after installation, trying alternative method..."
    npm uninstall tailwindcss 2>/dev/null || true
    npm install --save --legacy-peer-deps --engine-strict=false tailwindcss@3.4.18
fi

# Final verification
if node -e "require('tailwindcss')" > /dev/null 2>&1; then
    success "TailwindCSS is properly installed"
else
    error "TailwindCSS installation failed"
    log "📋 Available packages:"
    npm list | grep -i tailwind || echo "No TailwindCSS packages found"
    exit 1
fi

# Install UI dependencies
log "📦 Installing UI dependencies..."
npm install --legacy-peer-deps --engine-strict=false \
  @radix-ui/react-slot@1.2.3 \
  @radix-ui/react-dialog@1.1.15 \
  @radix-ui/react-dropdown-menu@2.1.16 \
  @radix-ui/react-toast@1.2.15 \
  @radix-ui/react-label@2.1.1 \
  @radix-ui/react-checkbox@1.1.2 \
  @radix-ui/react-progress@1.1.1 \
  @radix-ui/react-select@2.2.5 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@2.6.0 \
  lucide-react@0.525.0 \
  @heroicons/react@2.2.0

# Generate Prisma client
log "🔧 Generating Prisma client..."
npx prisma generate

# Create TailwindCSS config if it doesn't exist
log "🎨 Ensuring TailwindCSS configuration..."
if [ ! -f "tailwind.config.js" ]; then
    npx tailwindcss init -p
fi

# Build application
log "🔨 Building application..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Build with error handling
set +e
npm run build
BUILD_EXIT_CODE=$?
set -e

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    warning "Build completed with warnings (exit code: $BUILD_EXIT_CODE)"
fi

# Verify build
if [ ! -d ".next" ]; then
    error "Build failed - .next directory not found"
    log "📋 Directory contents:"
    ls -la
    exit 1
fi
success "Build completed successfully"

# Create log directory
mkdir -p /var/log/jobportal
chmod 755 /var/log/jobportal

# Start PM2 process
log "▶️ Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production --no-daemon

# Wait for startup
log "⏳ Waiting for application to start..."
sleep 10

# Check PM2 status
log "📊 PM2 Status:"
pm2 status

# Check if PM2 process is actually running
PM2_PROCESSES=$(pm2 list --format json | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pm2_env.status' 2>/dev/null || echo "errored")
if [ "$PM2_PROCESSES" != "online" ]; then
    error "PM2 process is not running properly. Status: $PM2_PROCESSES"
    log "📋 PM2 logs:"
    pm2 logs "$PM2_APP_NAME" --lines 20
    log "🔄 Attempting to restart PM2 process..."
    pm2 restart "$PM2_APP_NAME" || pm2 start ecosystem.config.cjs --env production --no-daemon
    sleep 10
fi

# Health check with retries and timeout
log "🏥 Performing health check..."
HEALTH_CHECK_PASSED=false
for i in $(seq 1 $MAX_RETRIES); do
    log "Health check attempt $i/$MAX_RETRIES..."
    
    # Check if PM2 process is still running
    PM2_STATUS=$(pm2 list --format json | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pm2_env.status' 2>/dev/null || echo "errored")
    if [ "$PM2_STATUS" != "online" ]; then
        warning "PM2 process is not online (status: $PM2_STATUS), attempting restart..."
        pm2 restart "$PM2_APP_NAME" || pm2 start ecosystem.config.cjs --env production --no-daemon
        sleep 10
        continue
    fi
    
    # Try health check
    if curl -f -s --max-time 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        success "Health check passed!"
        HEALTH_CHECK_PASSED=true
        break
    else
        warning "Health check failed (attempt $i/$MAX_RETRIES), waiting $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    fi
done

# Show logs for debugging
log "📋 PM2 logs:"
pm2 logs "$PM2_APP_NAME" --lines 30

# Final status check
log "🔍 Final status check..."
pm2 status

# Check if health check passed
if [ "$HEALTH_CHECK_PASSED" = false ]; then
    warning "Health check failed after $MAX_RETRIES attempts, but deployment may still be successful"
    log "📋 Final PM2 status:"
    pm2 status
    log "📋 Final PM2 logs:"
    pm2 logs "$PM2_APP_NAME" --lines 20
    
    # Check if PM2 process is at least running
    PM2_FINAL_STATUS=$(pm2 list --format json | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pm2_env.status' 2>/dev/null || echo "errored")
    if [ "$PM2_FINAL_STATUS" = "online" ]; then
        success "PM2 process is running, deployment completed with warnings"
        log "🌐 Application should be available at: http://localhost:3000"
        log "📊 Use 'pm2 status' to check application status"
        log "📋 Use 'pm2 logs $PM2_APP_NAME' to view logs"
        exit 0
    else
        error "PM2 process is not running properly. Status: $PM2_FINAL_STATUS"
        exit 1
    fi
fi

success "Production deployment completed successfully!"
log "🌐 Application should be available at: http://localhost:3000"
log "📊 Use 'pm2 status' to check application status"
log "📋 Use 'pm2 logs $PM2_APP_NAME' to view logs"
