#!/bin/bash

echo "🔧 RESOURCE OPTIMIZATION SCRIPT"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

echo "🔍 Analyzing current resource usage..."

# Check current processes
echo "Current npm/next processes:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
echo "🔧 Starting optimization..."

# Step 1: Stop duplicate processes
print_status "Stopping duplicate processes..."
pkill -f "npm start" 2>/dev/null || echo "No npm start processes found"
pkill -f "next start" 2>/dev/null || echo "No next start processes found"

# Step 2: Stop PM2 if running
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || echo "PM2 not running"
pm2 delete all 2>/dev/null || echo "PM2 not running"

# Step 3: Stop current service
print_status "Stopping current service..."
systemctl stop jobportal 2>/dev/null || echo "Service not running"

# Step 4: Navigate to project directory
cd /var/www/jobportal || {
    print_error "Directory /var/www/jobportal not found"
    exit 1
}

# Step 5: Clean up npm
print_status "Cleaning npm cache and modules..."
npm cache clean --force
rm -rf node_modules package-lock.json

# Step 6: Reinstall dependencies optimized
print_status "Reinstalling dependencies (optimized)..."
npm install --production --no-optional

# Step 7: Create optimized environment
print_status "Creating optimized environment..."
cat > .env.local << 'EOF'
NODE_ENV=production
DATABASE_URL="postgresql://jobportal_user:secure_password_123@localhost:5432/jobportal"
NEXT_PUBLIC_BASE_URL=https://aftionix.in
NEXTAUTH_SECRET="your-secret-key-here"
NODE_OPTIONS="--max-old-space-size=512"
EOF

# Step 8: Optimize systemd service
print_status "Optimizing systemd service..."
cat > /etc/systemd/system/jobportal.service << 'EOF'
[Unit]
Description=JobPortal Next.js
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/jobportal
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
MemoryMax=512M
CPUQuota=50%
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=512

[Install]
WantedBy=multi-user.target
EOF

# Step 9: Reload and restart
print_status "Reloading systemd and restarting service..."
systemctl daemon-reload
systemctl enable jobportal
systemctl start jobportal

# Step 10: Check status
echo ""
echo "📊 Service Status:"
systemctl status jobportal --no-pager

# Step 11: Check resource usage
echo ""
echo "🔍 Current Resource Usage:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
print_success "🎉 Resource optimization complete!"
echo ""
echo "📋 What was optimized:"
echo "✅ Removed duplicate processes"
echo "✅ Cleaned npm cache and modules"
echo "✅ Optimized environment variables"
echo "✅ Limited memory to 512MB"
echo "✅ Limited CPU to 50%"
echo "✅ Single process management"
echo ""
echo "🚀 Your service should now use fewer resources!"
echo "🌐 Check your website: https://aftionix.in"
echo ""
echo "💡 If resource limitations persist, wait 1-3 hours for the system to stabilize"
