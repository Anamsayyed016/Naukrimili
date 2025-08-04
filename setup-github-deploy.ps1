# GitHub to KVM2 Server Auto-Deployment Setup
Write-Host "🚀 Setting up GitHub Auto-Deployment for KVM2..." -ForegroundColor Green

# Create deployment script for server
$deployScript = @'
#!/bin/bash

# 🚀 NaukriMili Auto-Deploy Script for KVM2 Server
# This script should be placed on your KVM2 server

echo "🚀 Starting GitHub Auto-Deployment..."

# Variables
REPO_URL="https://github.com/Anamsayyed016/Naukrimili.git"
PROJECT_DIR="/var/www/html"
BACKUP_DIR="/var/backups/naukrimili"
LOG_FILE="/var/log/naukrimili-deploy.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🔄 Starting deployment process..."

# Create backup of current deployment
if [ -d "$PROJECT_DIR" ]; then
    log "📦 Creating backup..."
    mkdir -p $BACKUP_DIR
    cp -r $PROJECT_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)
fi

# Clone or pull latest code
if [ ! -d "$PROJECT_DIR/.git" ]; then
    log "📥 Cloning repository..."
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
else
    log "🔄 Pulling latest changes..."
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/main
    git pull origin main
fi

# Install dependencies
log "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    log "❌ No package manager found!"
    exit 1
fi

# Build for production
log "🏗️ Building for production..."
export NODE_ENV=production
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

# Setup web server configuration
log "⚙️ Configuring web server..."

# Create nginx configuration
cat > /etc/nginx/sites-available/naukrimili << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/html/out;
    index index.html;

    # Handle Next.js static export
    location / {
        try_files $uri $uri.html $uri/index.html /index.html;
    }

    # Static assets
    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/naukrimili /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Set proper permissions
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

log "✅ Deployment completed successfully!"
log "🌐 Your site should now be live!"

# Optional: Setup PM2 for Node.js process management
if command -v pm2 &> /dev/null; then
    log "🔄 Setting up PM2..."
    pm2 delete naukrimili 2>/dev/null || true
    pm2 start npm --name "naukrimili" -- start
    pm2 save
    pm2 startup
fi

echo "🎉 Deployment finished! Check your domain."
'@

Set-Content "server-deploy.sh" $deployScript

# Create GitHub Actions workflow
$githubWorkflow = @'
name: Deploy to KVM2 Server

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 🚀 Deploy to Server
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        password: ${{ secrets.PASSWORD }}
        # or use key: ${{ secrets.KEY }}
        script: |
          cd /var/www/html
          git pull origin main
          pnpm install
          pnpm run build
          sudo systemctl reload nginx
          echo "✅ Deployment completed!"
'@

# Create .github/workflows directory
New-Item -ItemType Directory -Path ".github\workflows" -Force
Set-Content ".github\workflows\deploy.yml" $githubWorkflow

# Create environment setup script
$envSetup = @'
#!/bin/bash

# 🛠️ KVM2 Server Environment Setup for NaukriMili

echo "🛠️ Setting up KVM2 server environment..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git

# Start and enable services
systemctl start nginx
systemctl enable nginx

# Create web directory
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html

# Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ Server environment setup completed!"
echo "📋 Next steps:"
echo "1. Clone your repository to /var/www/html"
echo "2. Run the deployment script"
echo "3. Configure your domain DNS"
'@

Set-Content "server-setup.sh" $envSetup

Write-Host "✅ Auto-deployment setup created!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 FILES CREATED:" -ForegroundColor Yellow
Write-Host "1. server-deploy.sh - Main deployment script" -ForegroundColor White
Write-Host "2. .github/workflows/deploy.yml - GitHub Actions" -ForegroundColor White
Write-Host "3. server-setup.sh - Server environment setup" -ForegroundColor White
Write-Host ""
Write-Host "🚀 DEPLOYMENT STEPS:" -ForegroundColor Cyan
Write-Host "1. Push these files to GitHub" -ForegroundColor White
Write-Host "2. Run server-setup.sh on your KVM2 server" -ForegroundColor White
Write-Host "3. Setup GitHub Secrets (HOST, USERNAME, PASSWORD)" -ForegroundColor White
Write-Host "4. Push to main branch = Auto-deploy! 🎉" -ForegroundColor White
