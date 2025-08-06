#!/bin/bash

# 🚀 Server Setup Script - Run this ON the server
# This script sets up your job portal on Hostinger KVM

echo "🚀 Setting up Job Portal on Hostinger Server..."
echo "=============================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /root/jobportal
cd /root/jobportal

# Clone repository
echo "📥 Cloning repository..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/Anamsayyed016/Naukrimili.git .
fi

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Build project
echo "🔨 Building project..."
pnpm build

# Setup environment
echo "⚙️ Setting up environment..."
if [ ! -f ".env.local" ]; then
    cp .env.production.example .env.local
    echo "✅ Environment file created (.env.local)"
fi

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/jobportal.service << 'EOF'
[Unit]
Description=Job Portal Next.js Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/jobportal
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt install -y nginx
fi

# Create nginx configuration
echo "🔧 Setting up Nginx reverse proxy..."
cat > /etc/nginx/sites-available/jobportal << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable nginx configuration
ln -sf /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable jobportal
systemctl start jobportal
systemctl enable nginx
systemctl restart nginx

# Check status
echo "📊 Checking service status..."
echo "================================"
echo "Job Portal Service:"
systemctl status jobportal --no-pager -l
echo ""
echo "Nginx Service:"
systemctl status nginx --no-pager -l

echo ""
echo "🎉 Setup completed!"
echo "================================"
echo "Your job portal is now running at:"
echo "🌐 http://$(curl -s ifconfig.me)"
echo ""
echo "Useful commands:"
echo "• systemctl status jobportal    - Check service status"
echo "• systemctl restart jobportal   - Restart service"
echo "• journalctl -u jobportal -f    - View live logs"
echo "• cd /root/jobportal             - Navigate to project"
echo "• node server.js                - Run manually"
echo ""
echo "🔄 To update your application:"
echo "• git pull origin main          - Pull latest changes"
echo "• pnpm install                  - Install dependencies"
echo "• pnpm build                    - Build project"
echo "• systemctl restart jobportal   - Restart service"
