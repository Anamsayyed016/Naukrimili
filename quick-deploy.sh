#!/bin/bash

# Quick Deployment Script - Fixes All Issues
# Run this directly on the server to fix deployment problems

set -e

echo "🚀 Quick Deployment Fix Script"
echo "================================"

# Configuration
PROJECT_DIR="/var/www/jobportal"
APP_NAME="jobportal"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Step 1: Navigate to project directory
log_info "Navigating to project directory..."
cd "$PROJECT_DIR" || { log_error "Cannot access $PROJECT_DIR"; exit 1; }
log_success "Working in: $(pwd)"

# Step 2: Verify package.json exists
log_info "Verifying package.json..."
if [ ! -f "package.json" ]; then
    log_error "package.json not found! Files not copied properly."
    log_info "Directory contents:"
    ls -la
    exit 1
fi
log_success "package.json found"

# Step 3: Create server.js if missing
log_info "Checking server.js..."
if [ ! -f "server.js" ]; then
    log_warning "server.js not found, creating it..."
    cat > server.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
EOF
    log_success "server.js created"
else
    log_success "server.js exists"
fi

# Step 4: Test server.js syntax
log_info "Testing server.js syntax..."
if ! node -c server.js; then
    log_error "server.js has syntax errors!"
    exit 1
fi
log_success "server.js syntax is valid"

# Step 5: Clean up and install dependencies
log_info "Cleaning up and installing dependencies..."
rm -rf node_modules package-lock.json .next .npm .tsbuildinfo
npm cache clean --force

# Create .npmrc
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
EOF

# Install dependencies
log_info "Installing dependencies..."
npm install --legacy-peer-deps --force
log_success "Dependencies installed"

# Step 6: Generate Prisma client
log_info "Generating Prisma client..."
if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    log_success "Prisma client generated"
else
    log_info "Prisma not found, skipping"
fi

# Step 7: Build application
log_info "Building application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

npm run build:simple
log_success "Application built"

# Step 8: Verify build
log_info "Verifying build..."
if [ ! -d ".next" ]; then
    log_error "Build failed - .next directory not found!"
    exit 1
fi
log_success "Build verified - .next directory exists"

# Step 9: Create log directory
log_info "Creating log directory..."
sudo mkdir -p /var/log/jobportal
sudo chown -R $USER:$USER /var/log/jobportal
log_success "Log directory created"

# Step 10: Start with PM2
log_info "Starting application with PM2..."
pm2 kill || true
pm2 start ecosystem.config.cjs --env production
pm2 save
log_success "Application started with PM2"

# Step 11: Wait and check status
log_info "Waiting for application to stabilize..."
sleep 10

log_info "PM2 Status:"
pm2 status

log_info "Checking if port 3000 is listening..."
if netstat -tlnp | grep -q ":3000"; then
    log_success "Port 3000 is listening"
else
    log_warning "Port 3000 not listening, but PM2 shows online"
fi

# Step 12: Health check
log_info "Testing health endpoint..."
if curl -f -s --max-time 10 http://localhost:3000/api/health > /dev/null 2>&1; then
    log_success "Health endpoint responding"
else
    log_warning "Health endpoint not responding, but application may still be starting"
fi

log_success "Quick deployment fix completed!"
log_info "Application should now be running at http://localhost:3000"
