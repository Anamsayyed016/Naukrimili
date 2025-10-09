#!/bin/bash

echo "🔧 Setting up Systemd Service for Auto-Startup"
echo "==============================================="

# VPS Details
VPS_IP="69.62.73.84"
VPS_USER="root"

echo "📡 Connecting to VPS: $VPS_IP"
echo "👤 User: $VPS_USER"
echo ""

# Setup systemd service
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'

echo "🔧 Creating systemd service for jobportal..."

# 1. Create systemd service file
echo "📝 Creating systemd service configuration..."
cat > /etc/systemd/system/jobportal.service << 'SERVICE'
[Unit]
Description=Job Portal Next.js Application
Documentation=https://naukrimili.com
After=network.target
Wants=network.target

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/home/root/jobportal
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload jobportal
ExecStop=/usr/bin/pm2 stop jobportal
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jobportal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/home/root/jobportal
ProtectHome=true

[Install]
WantedBy=multi-user.target
SERVICE

# 2. Reload systemd
echo "🔄 Reloading systemd configuration..."
systemctl daemon-reload

# 3. Enable the service
echo "🚀 Enabling jobportal service..."
systemctl enable jobportal.service

# 4. Start the service
echo "▶️ Starting jobportal service..."
systemctl start jobportal.service

# 5. Check service status
echo ""
echo "📊 Service Status:"
systemctl status jobportal.service --no-pager

echo ""
echo "📊 Service Status (detailed):"
systemctl is-active jobportal.service
systemctl is-enabled jobportal.service

# 6. Show startup configuration
echo ""
echo "🚀 Startup Configuration:"
systemctl list-unit-files | grep jobportal

# 7. Test the service
echo ""
echo "🧪 Testing service restart..."
systemctl restart jobportal.service
sleep 3
systemctl status jobportal.service --no-pager

echo ""
echo "✅ Systemd service setup completed!"
echo "🌐 Your website will now start automatically on server reboot"
echo "🔄 Service will auto-restart if it crashes"
echo "📊 Use 'systemctl status jobportal' to check status"

EOF

echo ""
echo "🏁 Systemd service setup completed!"
echo "🌐 Your website will now run independently and auto-start on reboot"
