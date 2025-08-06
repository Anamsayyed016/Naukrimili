#!/bin/bash

# 🚀 Direct Server Deployment Script for Hostinger KVM
# This script deploys your cleaned Next.js project directly to the server

echo "🚀 Starting deployment to Hostinger server..."
echo "================================================"

# Server configuration
SERVER_IP="69.62.73.84"
SERVER_USER="root"
PROJECT_DIR="/var/www/html/jobportal"
DOMAIN_DIR="/var/www/html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're on the server or local machine
if [ "$(hostname -I | grep -o "69.62.73.84")" ]; then
    print_status "Running on server - setting up project..."
    
    # We're on the server
    cd /root
    
    # Clone or update repository
    if [ -d "Naukrimili" ]; then
        print_status "Updating existing repository..."
        cd Naukrimili
        git pull origin main
    else
        print_status "Cloning repository..."
        git clone https://github.com/Anamsayyed016/Naukrimili.git
        cd Naukrimili
    fi
    
    # Install Node.js and pnpm if not installed
    print_status "Installing Node.js and pnpm..."
    curl -fsSL https://fnm.vercel.app/install | bash
    source ~/.bashrc
    fnm install --lts
    fnm use lts-latest
    npm install -g pnpm
    
    # Install dependencies
    print_status "Installing project dependencies..."
    pnpm install
    
    # Build the project
    print_status "Building the project..."
    pnpm build
    
    # Set up environment
    print_status "Setting up environment..."
    if [ ! -f ".env.production" ]; then
        cp .env.production.example .env.production
        print_warning "Please edit .env.production with your actual environment variables"
    fi
    
    # Set up web directory
    print_status "Setting up web directory..."
    mkdir -p $PROJECT_DIR
    cp -r .next $PROJECT_DIR/
    cp -r public $PROJECT_DIR/
    cp package.json $PROJECT_DIR/
    cp server.js $PROJECT_DIR/
    cp .env.production $PROJECT_DIR/.env.local
    
    # Set up systemd service
    print_status "Setting up systemd service..."
    cat > /etc/systemd/system/jobportal.service << EOF
[Unit]
Description=Job Portal Next.js Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/root/.local/share/fnm/node-versions/v20.*/installation/bin/node server.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    # Start the service
    print_status "Starting the service..."
    systemctl daemon-reload
    systemctl enable jobportal
    systemctl start jobportal
    
    # Set up nginx reverse proxy
    print_status "Setting up Nginx..."
    cat > /etc/nginx/sites-available/jobportal << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    print_success "Deployment completed!"
    print_status "Your job portal is now running at: http://$SERVER_IP"
    print_status "Service status: $(systemctl is-active jobportal)"
    
else
    # We're on local machine - sync to server
    print_status "Syncing local files to server..."
    
    # Build locally first
    print_status "Building project locally..."
    pnpm build
    
    # Sync files to server
    print_status "Uploading files to server..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.next' \
        . root@$SERVER_IP:/root/Naukrimili/
    
    # Run deployment on server
    print_status "Running deployment on server..."
    ssh root@$SERVER_IP "cd /root && bash Naukrimili/deploy-to-server.sh"
    
fi

print_success "Deployment script completed!"
