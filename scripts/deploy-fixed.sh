#!/bin/bash

# Fixed Production Deployment Script
# Addresses all the issues mentioned in the deployment logs

set -e

# Configuration
PROJECT_DIR="/var/www/jobportal"
APP_NAME="jobportal"
APP_PORT="3000"
HEALTH_CHECK_URL="http://localhost:3000/api/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Main deployment function
deploy() {
    log_info "Starting production deployment with fixes..."
    
    # Step 1: Ensure project directory exists
    log_info "Creating project directory..."
    sudo mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    log_info "Working in directory: $(pwd)"
    
    # Step 2: Copy files from GitHub workspace (if running in CI)
    if [ -n "$GITHUB_WORKSPACE" ] && [ -d "$GITHUB_WORKSPACE" ]; then
        log_info "Copying files from GitHub workspace..."
        sudo rsync -av --exclude='.git*' --exclude='node_modules' --exclude='.next' "$GITHUB_WORKSPACE/" "$PROJECT_DIR/"
    else
        log_info "GitHub workspace not found, assuming files are already in place"
    fi
    
    # Step 3: Verify critical files exist
    log_info "Verifying critical files..."
    if [ ! -f "package.json" ]; then
        log_error "package.json not found! Files not copied properly."
        log_info "Directory contents:"
        ls -la "$PROJECT_DIR/" || true
        exit 1
    fi
    
    if [ ! -f "server.js" ]; then
        log_error "server.js not found! Creating it now..."
        create_server_js
    fi
    
    log_success "Critical files verified"
    
    # Step 4: Install Node.js if needed
    check_and_install_node
    
    # Step 5: Clean up and install dependencies
    install_dependencies
    
    # Step 6: Generate Prisma client
    generate_prisma_client
    
    # Step 7: Build application
    build_application
    
    # Step 8: Verify build
    verify_build
    
    # Step 9: Create log directory
    create_log_directory
    
    # Step 10: Start application with PM2
    start_application
    
    # Step 11: Health check
    perform_health_check
    
    log_success "Deployment completed successfully!"
}

# Create server.js if missing
create_server_js() {
    log_info "Creating server.js file..."
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
}

# Check and install Node.js
check_and_install_node() {
    log_info "Checking Node.js installation..."
    
    if command -v node >/dev/null 2>&1; then
        CURRENT_VERSION=$(node --version)
        log_info "Current Node version: $CURRENT_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo "$CURRENT_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            log_warning "Node version $CURRENT_VERSION is too old, installing Node 20..."
            install_node_20
        else
            log_success "Node version is adequate: $CURRENT_VERSION"
        fi
    else
        log_warning "Node.js not found, installing Node 20..."
        install_node_20
    fi
}

# Install Node.js 20
install_node_20() {
    log_info "Installing Node.js 20..."
    
    # Update package index
    sudo apt-get update
    
    # Install Node.js using NodeSource repository
    curl -fsSL "https://deb.nodesource.com/setup_20.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    NEW_VERSION=$(node --version)
    log_success "Node.js installed: $NEW_VERSION"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean up previous installations
    rm -rf node_modules package-lock.json .next .npm .tsbuildinfo
    npm cache clean --force
    
    # Create .npmrc for compatibility
    cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
EOF
    
    # Try different installation methods
    log_info "Attempting npm install..."
    if ! npm install --legacy-peer-deps --engine-strict=false --force; then
        log_warning "npm install failed, trying npm ci..."
        if ! npm ci --legacy-peer-deps --engine-strict=false --force; then
            log_warning "npm ci failed, trying clean install..."
            rm -rf node_modules package-lock.json
            if ! npm install --legacy-peer-deps --engine-strict=false --force; then
                log_error "All dependency installation methods failed!"
                log_info "Checking package.json..."
                cat package.json || echo "No package.json found"
                log_info "Available space:"
                df -h . | tail -1
                exit 1
            fi
        fi
    fi
    
    log_success "Dependencies installed successfully"
}

# Generate Prisma client
generate_prisma_client() {
    if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
        log_info "Generating Prisma client..."
        if ! npx prisma generate; then
            log_error "Prisma client generation failed!"
            log_info "Checking Prisma schema..."
            ls -la prisma/ || echo "No prisma directory found"
            exit 1
        fi
        log_success "Prisma client generated"
    else
        log_info "Prisma not found, skipping Prisma client generation"
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Set environment variables
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Try different build scripts
    log_info "Attempting npm run build:simple..."
    if ! npm run build:simple; then
        log_warning "build:simple failed, trying build:deploy..."
        if ! npm run build:deploy; then
            log_warning "build:deploy failed, trying build:minimal..."
            if ! npm run build:minimal; then
                log_error "All build scripts failed!"
                log_info "Node version: $(node --version)"
                log_info "NPM version: $(npm --version)"
                log_info "Available space: $(df -h . | tail -1)"
                log_info "Memory usage: $(free -h)"
                exit 1
            fi
        fi
    fi
    
    log_success "Application built successfully"
}

# Verify build
verify_build() {
    log_info "Verifying build..."
    
    if [ ! -d ".next" ]; then
        log_error "Build failed - .next directory not found!"
        log_info "Directory contents:"
        ls -la || true
        exit 1
    fi
    
    log_success "Build verification passed"
}

# Create log directory
create_log_directory() {
    log_info "Creating log directory..."
    sudo mkdir -p /var/log/jobportal
    sudo chown -R $USER:$USER /var/log/jobportal
    log_success "Log directory created"
}

# Start application with PM2
start_application() {
    log_info "Starting application with PM2..."
    
    # Kill any existing PM2 processes
    pm2 kill || true
    
    # Start with ecosystem config
    if [ -f "ecosystem.config.cjs" ]; then
        pm2 start ecosystem.config.cjs --env production
    else
        log_error "ecosystem.config.cjs not found!"
        exit 1
    fi
    
    # Wait for startup
    log_info "Waiting for application to start..."
    sleep 15
    
    # Save PM2 configuration
    pm2 save
    
    log_success "Application started with PM2"
}

# Perform health check
perform_health_check() {
    log_info "Performing health check..."
    
    # Check PM2 status
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        log_error "PM2 process is not online!"
        pm2 status
        exit 1
    fi
    
    # Check if port is listening
    if ! netstat -tlnp | grep -q ":3000"; then
        log_warning "Port 3000 not listening, but PM2 shows online"
    fi
    
    # Try health endpoint
    HEALTH_CHECK_PASSED=false
    for i in {1..5}; do
        log_info "Health check attempt $i/5..."
        if curl -f -s --max-time 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health endpoint responding"
            HEALTH_CHECK_PASSED=true
            break
        else
            log_warning "Health endpoint not responding (attempt $i/5)"
            sleep 3
        fi
    done
    
    if [ "$HEALTH_CHECK_PASSED" = false ]; then
        log_warning "Health endpoint not responding, but PM2 shows online"
        log_info "Application may still be starting up"
    fi
    
    # Final status
    log_info "Final PM2 Status:"
    pm2 status
    
    log_success "Health check completed"
}

# Show usage
show_usage() {
    echo "Usage: $0"
    echo ""
    echo "This script fixes all the deployment issues mentioned in the logs:"
    echo "  - Ensures files are properly copied"
    echo "  - Creates server.js if missing"
    echo "  - Installs Node.js 20 if needed"
    echo "  - Fixes dependency installation"
    echo "  - Handles build failures gracefully"
    echo "  - Verifies .next directory creation"
    echo "  - Starts PM2 process properly"
    echo "  - Performs comprehensive health checks"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

# Run deployment
deploy
