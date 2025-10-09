#!/bin/bash
set -e

echo "🚀 CRITICAL DEPLOYMENT FIX - Starting..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Check Node.js and npm versions
print_info "Checking Node.js and npm versions..."
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js: $node_version"
print_status "npm: $npm_version"

# 2. Clean everything
print_info "Cleaning previous builds and caches..."
rm -rf .next
rm -rf out
rm -rf production
rm -rf node_modules/.cache
rm -rf .next/cache
print_status "Cleanup completed"

# 3. Create necessary directories
print_info "Creating necessary directories..."
mkdir -p logs
mkdir -p .next
mkdir -p .next/server
print_status "Directories created"

# 4. Fix package.json if needed
print_info "Checking package.json..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi
print_status "package.json found"

# 5. Install dependencies with proper flags
print_info "Installing dependencies..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV=production

# Create .npmrc for production
cat > .npmrc << EOF
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
EOF

# Install dependencies
npm install --legacy-peer-deps --engine-strict=false --force
print_status "Dependencies installed"

# 6. Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# 7. Create BUILD_ID
print_info "Creating BUILD_ID..."
echo $(date +%s) > .next/BUILD_ID
print_status "BUILD_ID created: $(cat .next/BUILD_ID)"

# 8. Build the application
print_info "Building Next.js application..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

npm run build
print_status "Build completed"

# 9. Verify build files
print_info "Verifying build files..."
if [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ] && [ -f ".next/package.json" ]; then
    print_status "All critical build files present"
else
    print_error "Build verification failed - missing critical files"
    ls -la .next/
    exit 1
fi

# 10. Create optimized server.cjs
print_info "Creating optimized server.cjs..."
cat > server.cjs << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

console.log('🚀 Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);

const app = next({ 
  dev, 
  hostname, 
  port,
  dir: process.cwd()
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js app prepared');
  
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    console.log(`🎉 Server ready on http://${hostname}:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});
EOF
print_status "server.cjs created"

# 11. Create PM2 ecosystem config
print_info "Creating PM2 ecosystem config..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: "jobportal",
      script: "server.cjs",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      log_type: "json",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: "fork",
      ignore_watch: [
        "node_modules",
        ".next",
        "logs",
        "*.log",
        ".git"
      ]
    }
  ]
};
EOF
print_status "ecosystem.config.cjs created"

# 12. Stop existing PM2 processes
print_info "Stopping existing PM2 processes..."
pm2 stop jobportal 2>/dev/null || true
pm2 delete jobportal 2>/dev/null || true
print_status "PM2 processes stopped"

# 13. Start with PM2
print_info "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production
print_status "Application started with PM2"

# 14. Save PM2 configuration
print_info "Saving PM2 configuration..."
pm2 save
print_status "PM2 configuration saved"

# 15. Show status
print_info "Checking PM2 status..."
pm2 status

# 16. Test server
print_info "Testing server..."
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Server is responding on port 3000"
else
    print_warning "Server not responding yet, checking logs..."
    pm2 logs jobportal --lines 20
fi

echo ""
echo "================================================"
print_status "DEPLOYMENT FIX COMPLETED!"
echo "================================================"
echo ""
print_info "Next steps:"
echo "1. Check PM2 status: pm2 status"
echo "2. View logs: pm2 logs jobportal"
echo "3. Monitor: pm2 monit"
echo "4. Test URL: http://localhost:3000"
echo ""
print_info "If issues persist, check:"
echo "- Database connection"
echo "- Environment variables"
echo "- Port availability"
echo "- PM2 logs for errors"
echo ""
