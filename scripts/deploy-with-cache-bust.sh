#!/bin/bash

# Deploy with Cache Busting Script
# Forces new JavaScript chunk hashes and clears all caches

set -e

echo "🚀 Starting deployment with cache busting..."

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

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

print_status "Environment variables set:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NODE_OPTIONS: $NODE_OPTIONS"
echo "  NEXT_PUBLIC_BUILD_TIME: $NEXT_PUBLIC_BUILD_TIME"

# Clean build artifacts
print_status "Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel
print_success "Build artifacts cleaned"

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force
print_success "NPM cache cleared"

# Install dependencies (ignore engine warnings)
print_status "Installing dependencies..."
if [ "$1" = "--fresh-deps" ]; then
    print_warning "Fresh dependencies mode - removing node_modules"
    rm -rf node_modules
    rm -f package-lock.json
fi

npm ci --legacy-peer-deps --ignore-engines
print_success "Dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Build the application
print_status "Building application with cache busting..."
npm run build:production
print_success "Application built successfully"

# Check for old problematic files
print_status "Checking for old problematic chunks..."
if [ -d ".next/static/chunks" ]; then
    OLD_CHUNKS=$(find .next/static/chunks -name "*4bd1b696-100b9d70ed4e49c1*" 2>/dev/null || true)
    if [ -n "$OLD_CHUNKS" ]; then
        print_warning "Found old problematic chunks:"
        echo "$OLD_CHUNKS"
        print_status "Removing old chunks..."
        rm -f $OLD_CHUNKS
        print_success "Old chunks removed"
    else
        print_success "No old problematic chunks found"
    fi
fi

# Create .htaccess with cache busting headers
print_status "Creating .htaccess with cache busting headers..."
cat > .htaccess << 'EOF'
# Cache control for static assets - Aggressive cache busting for JS/CSS
<FilesMatch "\.(js|css)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header set ETag ""
    Header unset Last-Modified
</FilesMatch>

# Cache control for HTML files
<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>

# Cache control for images (allow caching but with revalidation)
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico)$">
    Header set Cache-Control "public, max-age=3600, must-revalidate"
</FilesMatch>

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
EOF
print_success ".htaccess created with cache busting headers"

# Create deployment info file
print_status "Creating deployment info..."
cat > deployment-info.json << EOF
{
  "deployment_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "build_timestamp": "$NEXT_PUBLIC_BUILD_TIME",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
print_success "Deployment info created"

# Restart application if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Restarting PM2 application..."
    pm2 restart jobportal || pm2 start ecosystem.config.cjs --env production
    print_success "PM2 application restarted"
else
    print_warning "PM2 not found. Please restart your application manually."
fi

# Final verification
print_status "Performing final verification..."
if [ -d ".next" ]; then
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
    print_success "Build verification complete. Found $CHUNK_COUNT JavaScript chunks."
else
    print_error "Build directory not found!"
    exit 1
fi

print_success "🚀 Deployment with cache busting completed successfully!"
print_status "Next steps:"
echo "  1. Test your website in an incognito browser window"
echo "  2. Check browser DevTools → Network tab for fresh JS files"
echo "  3. Verify no 'Cannot read properties of undefined (reading 'length')' errors"
echo "  4. Clear CDN cache if using a CDN service"