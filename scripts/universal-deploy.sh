#!/bin/bash

# Universal Production Deployment Script
# Works across any tech stack with minimal configuration

set -e

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/root/jobportal}"
NODE_VERSION="${NODE_VERSION:-20}"
APP_NAME="${APP_NAME:-jobportal}"
APP_PORT="${APP_PORT:-3000}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
MAX_RETRIES="${MAX_RETRIES:-10}"
RETRY_DELAY="${RETRY_DELAY:-15}"

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

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Check the logs above for details"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Main deployment function
deploy() {
    log_info "Starting production deployment..."
    
    # Navigate to project directory
    cd "$PROJECT_DIR"
    log_info "Working in directory: $(pwd)"
    
    # Check and install Node.js if needed
    check_node_version
    
    # Force clean git pull
    force_clean_git_pull
    
    # Install dependencies
    install_dependencies
    
    # Build application
    build_application
    
    # Start application
    start_application
    
    # Health check
    health_check
    
    log_success "Deployment completed successfully!"
}

# Check Node.js version and install if needed
check_node_version() {
    log_info "Checking Node.js version..."
    
    if command -v node >/dev/null 2>&1; then
        CURRENT_VERSION=$(node --version)
        log_info "Current Node version: $CURRENT_VERSION"
        
        if [[ ! "$CURRENT_VERSION" =~ ^v$NODE_VERSION\. ]]; then
            log_warning "Node $NODE_VERSION required, current version: $CURRENT_VERSION"
            install_node
        else
            log_success "Node version is correct: $CURRENT_VERSION"
        fi
    else
        log_warning "Node.js not found, installing..."
        install_node
    fi
}

# Install Node.js
install_node() {
    log_info "Installing Node.js $NODE_VERSION..."
    
    # Update package index
    sudo apt-get update
    
    # Install Node.js using NodeSource repository
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    NEW_VERSION=$(node --version)
    log_success "Node.js installed: $NEW_VERSION"
}

# Force clean git pull
force_clean_git_pull() {
    log_info "Force cleaning git state..."
    
    # Stop any running processes
    stop_application
    
    # Force clean git state
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    git pull origin main
    
    log_success "Git state cleaned and updated"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean up
    rm -rf node_modules .next .npm .tsbuildinfo
    npm cache clean --force
    
    # Create .npmrc for compatibility
    cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
EOF
    
    # Install dependencies
    npm install --legacy-peer-deps --engine-strict=false --force
    
    # Install specific dependencies if needed
    if [ -f "package.json" ]; then
        # Check if TailwindCSS is needed
        if grep -q "tailwindcss" package.json; then
            log_info "Installing TailwindCSS and PostCSS..."
            npm install --save-dev --legacy-peer-deps --engine-strict=false \
              tailwindcss@3.4.18 \
              postcss@8.4.47 \
              autoprefixer@10.4.20
        fi
        
        # Install UI dependencies if needed
        if grep -q "@radix-ui" package.json; then
            log_info "Installing UI dependencies..."
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
        fi
        
        # Generate Prisma client if needed
        if grep -q "prisma" package.json; then
            log_info "Generating Prisma client..."
            npx prisma generate
        fi
    fi
    
    log_success "Dependencies installed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Set environment variables
    export NODE_OPTIONS="--max-old-space-size=4096"
    export NEXT_TELEMETRY_DISABLED=1
    export NODE_ENV=production
    
    # Build based on package.json scripts
    if [ -f "package.json" ]; then
        if grep -q '"build"' package.json; then
            npm run build
        elif grep -q '"build:production"' package.json; then
            npm run build:production
        else
            log_warning "No build script found, skipping build"
        fi
    fi
    
    # Verify build
    if [ -d ".next" ] || [ -d "dist" ] || [ -d "build" ]; then
        log_success "Build completed"
    else
        log_warning "No build output found, continuing..."
    fi
}

# Stop application
stop_application() {
    log_info "Stopping application..."
    
    # Stop PM2 process if exists
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop "$APP_NAME" || true
        pm2 delete "$APP_NAME" || true
        pm2 kill || true
    fi
    
    # Kill any processes on the port
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null; then
        log_info "Killing processes on port $APP_PORT"
        lsof -Pi :$APP_PORT -sTCP:LISTEN -t | xargs kill -9 || true
    fi
    
    log_success "Application stopped"
}

# Start application
start_application() {
    log_info "Starting application..."
    
    # Create log directory
    mkdir -p /var/log/$APP_NAME
    chmod 755 /var/log/$APP_NAME
    
    # Start with PM2 if available
    if command -v pm2 >/dev/null 2>&1; then
        if [ -f "ecosystem.config.cjs" ]; then
            pm2 start ecosystem.config.cjs --env production --no-daemon
        elif [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --env production --no-daemon
        else
            # Create basic PM2 config
            cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  }]
};
EOF
            pm2 start ecosystem.config.cjs --env production --no-daemon
        fi
    else
        log_warning "PM2 not found, starting with npm start"
        nohup npm start > /var/log/$APP_NAME/app.log 2>&1 &
    fi
    
    # Wait for startup
    log_info "Waiting for application to start..."
    sleep 20
    
    # Check status
    if command -v pm2 >/dev/null 2>&1; then
        pm2 status
    fi
    
    log_success "Application started"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    HEALTH_CHECK_PASSED=false
    for i in $(seq 1 $MAX_RETRIES); do
        log_info "Health check attempt $i/$MAX_RETRIES..."
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health check passed!"
            HEALTH_CHECK_PASSED=true
            break
        else
            log_warning "Health check failed (attempt $i/$MAX_RETRIES), waiting $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    done
    
    if [ "$HEALTH_CHECK_PASSED" = false ]; then
        log_error "Health check failed after $MAX_RETRIES attempts"
        
        # Show logs for debugging
        if command -v pm2 >/dev/null 2>&1; then
            log_info "PM2 logs:"
            pm2 logs "$APP_NAME" --lines 50
        fi
        
        # Show process info
        log_info "Process information:"
        ps aux | grep node | grep -v grep || true
        
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --dir DIR          Project directory (default: /root/jobportal)"
    echo "  -n, --node-version VER Node.js version (default: 20)"
    echo "  -a, --app-name NAME    Application name (default: jobportal)"
    echo "  -p, --port PORT        Application port (default: 3000)"
    echo "  -h, --health-url URL   Health check URL (default: http://localhost:3000/api/health)"
    echo "  -r, --retries NUM      Max retries for health check (default: 10)"
    echo "  -w, --wait SECONDS     Wait time between retries (default: 15)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  PROJECT_DIR, NODE_VERSION, APP_NAME, APP_PORT, HEALTH_CHECK_URL, MAX_RETRIES, RETRY_DELAY"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir)
            PROJECT_DIR="$2"
            shift 2
            ;;
        -n|--node-version)
            NODE_VERSION="$2"
            shift 2
            ;;
        -a|--app-name)
            APP_NAME="$2"
            shift 2
            ;;
        -p|--port)
            APP_PORT="$2"
            shift 2
            ;;
        -h|--health-url)
            HEALTH_CHECK_URL="$2"
            shift 2
            ;;
        -r|--retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        -w|--wait)
            RETRY_DELAY="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run deployment
deploy
