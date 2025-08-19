#!/bin/bash

echo "🔧 Setting up PM2 for Persistent Operation"
echo "=========================================="

# VPS Details
VPS_IP="69.62.73.84"
VPS_USER="root"

echo "📡 Connecting to VPS: $VPS_IP"
echo "👤 User: $VPS_USER"
echo ""

# Setup PM2 for persistent operation
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'

echo "🔧 Configuring PM2 for persistent operation..."

# 1. Save current PM2 configuration
echo "💾 Saving current PM2 configuration..."
pm2 save

# 2. Generate startup script
echo "🚀 Generating PM2 startup script..."
pm2 startup

# 3. Create a more robust ecosystem config
echo "📝 Creating enhanced ecosystem configuration..."
cat > /home/root/jobportal/ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'jobportal',
    script: 'npm',
    args: 'start',
    cwd: '/home/root/jobportal',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging configuration
    log_file: '/home/root/jobportal/logs/combined.log',
    out_file: '/home/root/jobportal/logs/out.log',
    error_file: '/home/root/jobportal/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Process management
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Kill timeout
    kill_timeout: 5000,
    // Graceful shutdown
    listen_timeout: 8000,
    // Auto restart on file changes (optional)
    ignore_watch: ['node_modules', 'logs', '.git'],
    // Health check
    health_check_grace_period: 3000,
    // Memory and CPU limits
    node_args: '--max-old-space-size=1024',
    // Environment variables
    env_file: '/home/root/jobportal/.env.local'
  }]
};
ECOSYSTEM

# 4. Create logs directory
echo "📁 Creating logs directory..."
mkdir -p /home/root/jobportal/logs

# 5. Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 /home/root/jobportal/ecosystem.config.js
chmod 755 /home/root/jobportal/logs

# 6. Restart with new configuration
echo "🔄 Restarting with new PM2 configuration..."
pm2 delete all
pm2 start /home/root/jobportal/ecosystem.config.js

# 7. Save the new configuration
echo "💾 Saving new PM2 configuration..."
pm2 save

# 8. Generate startup script again
echo "🚀 Generating startup script for new configuration..."
pm2 startup

# 9. Show current status
echo ""
echo "📊 Current PM2 Status:"
pm2 status

echo ""
echo "📊 PM2 Startup Configuration:"
pm2 startup

echo ""
echo "✅ PM2 is now configured for persistent operation!"
echo "🌐 Your website will keep running even if terminal is closed"
echo "🔄 PM2 will auto-restart if the process crashes"
echo "💾 Configuration is saved and will persist across reboots"

EOF

echo ""
echo "🏁 PM2 persistent setup completed!"
echo "🌐 Your website will now run independently of terminal sessions"
