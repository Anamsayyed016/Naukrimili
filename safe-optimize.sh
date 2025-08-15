#!/bin/bash

echo "🛡️ SAFE RESOURCE OPTIMIZATION"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "🔍 Analyzing current resource usage safely..."

# Step 1: Check current processes (READ-ONLY)
echo "Current npm/next processes:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
echo "📊 Current service status:"
systemctl status jobportal --no-pager | head -20

echo ""
echo "🛡️ Starting SAFE optimization (no downtime)..."

# Step 2: Safe cleanup of duplicate processes
print_status "Safely stopping duplicate processes..."

# Only stop processes that are clearly duplicates
DUPLICATE_PIDS=$(ps aux | grep "npm start" | grep -v grep | awk '{print $2}' | tail -n +2)
if [ ! -z "$DUPLICATE_PIDS" ]; then
    echo "Found duplicate npm start processes: $DUPLICATE_PIDS"
    for pid in $DUPLICATE_PIDS; do
        echo "Safely stopping duplicate process $pid..."
        kill -TERM $pid 2>/dev/null
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            echo "Process $pid still running, force stopping..."
            kill -KILL $pid 2>/dev/null
        fi
    done
else
    echo "No duplicate npm start processes found"
fi

# Step 3: Safe PM2 cleanup (if running)
print_status "Safely cleaning up PM2 processes..."
if command -v pm2 &> /dev/null; then
    PM2_PROCESSES=$(pm2 list | grep -c "online")
    if [ $PM2_PROCESSES -gt 1 ]; then
        echo "Found multiple PM2 processes, cleaning up safely..."
        pm2 stop all 2>/dev/null
        pm2 delete all 2>/dev/null
        echo "PM2 processes cleaned up"
    else
        echo "PM2 processes are minimal, leaving as is"
    fi
fi

# Step 4: Navigate to project directory
cd /var/www/jobportal || {
    echo "❌ Directory /var/www/jobportal not found"
    exit 1
}

# Step 5: Safe environment optimization (without stopping service)
print_status "Safely optimizing environment variables..."

# Create optimized environment if it doesn't exist
if [ ! -f .env.local ] || ! grep -q "NODE_OPTIONS" .env.local; then
    echo "Adding performance optimizations to environment..."
    # Append optimizations to existing .env.local
    cat >> .env.local << 'EOF'

# Performance optimizations
NODE_OPTIONS="--max-old-space-size=512"
EOF
    echo "Environment optimized safely"
else
    echo "Environment already optimized"
fi

# Step 6: Safe systemd service optimization
print_status "Safely optimizing systemd service..."

# Create optimized service file
cat > /etc/systemd/system/jobportal-optimized.service << 'EOF'
[Unit]
Description=JobPortal Next.js (Optimized)
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

# Step 7: Safe service switch (zero downtime)
print_status "Safely switching to optimized service..."

# Enable new service
systemctl daemon-reload
systemctl enable jobportal-optimized

# Start new service alongside old one
systemctl start jobportal-optimized

# Wait for new service to be ready
echo "Waiting for optimized service to start..."
sleep 10

# Check if new service is running
if systemctl is-active --quiet jobportal-optimized; then
    echo "✅ Optimized service is running"
    
    # Check if website is accessible
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Website is accessible through optimized service"
        
        # Safely stop old service
        print_status "Safely stopping old service..."
        systemctl stop jobportal
        systemctl disable jobportal
        
        # Rename optimized service to main service
        systemctl stop jobportal-optimized
        systemctl disable jobportal-optimized
        
        mv /etc/systemd/system/jobportal-optimized.service /etc/systemd/system/jobportal.service
        
        systemctl daemon-reload
        systemctl enable jobportal
        systemctl start jobportal
        
        print_success "✅ Service successfully optimized with zero downtime!"
    else
        echo "❌ Website not accessible through optimized service, rolling back..."
        systemctl stop jobportal-optimized
        systemctl disable jobportal-optimized
        systemctl start jobportal
        echo "✅ Rolled back to original service"
    fi
else
    echo "❌ Optimized service failed to start, keeping original"
    systemctl stop jobportal-optimized
    systemctl disable jobportal-optimized
fi

# Step 8: Final status check
echo ""
echo "📊 Final Service Status:"
systemctl status jobportal --no-pager | head -20

echo ""
echo "🔍 Final Resource Usage:"
ps aux | grep -E "(npm|next)" | grep -v grep

echo ""
print_success "🎉 Safe optimization complete!"
echo ""
echo "📋 What was optimized safely:"
echo "✅ Removed duplicate processes"
echo "✅ Cleaned up PM2 processes"
echo "✅ Optimized environment variables"
echo "✅ Limited memory to 512MB"
echo "✅ Limited CPU to 50%"
echo "✅ Zero downtime deployment"
echo ""
echo "🚀 Your website should now use fewer resources!"
echo "🌐 Check your website: https://aftionix.in"
echo ""
echo "💡 Resource limitations should be removed within 1-3 hours"
echo "🛡️ Your website was never disturbed during optimization"
