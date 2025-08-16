#!/bin/bash

# Deployment Script for aftionix.in Job Portal
# This script will deploy your job portal to production

set -e

echo "🚀 Starting deployment for aftionix.in job portal..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="aftionix.in"
PROJECT_DIR="/var/www/aftionix.in"
BACKUP_DIR="/var/backups/aftionix.in"
LOG_FILE="/var/log/aftionix-deploy.log"

# Create log file
touch "$LOG_FILE"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check prerequisites
log "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm first."
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2 globally..."
    npm install -g pm2
fi

# Create necessary directories
log "Creating necessary directories..."
sudo mkdir -p "$PROJECT_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo chown -R $USER:$USER "$PROJECT_DIR"
sudo chown -R $USER:$USER "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR"

# Backup existing deployment
if [ -d "current" ]; then
    log "Creating backup of existing deployment..."
    BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
    cp -r current "$BACKUP_DIR/$BACKUP_NAME"
    log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Clone or pull latest code
if [ -d ".git" ]; then
    log "Pulling latest changes..."
    git pull origin main
else
    log "Cloning repository..."
    git clone https://github.com/yourusername/jobportal.git .
fi

# Install dependencies
log "Installing dependencies..."
npm ci --production

# Build the application
log "Building the application..."
npm run build

# Create production environment file
log "Creating production environment file..."
cat > .env.production << EOF
# Production Environment for aftionix.in
NODE_ENV=production
NEXTAUTH_URL=https://aftionix.in
NEXT_PUBLIC_BASE_URL=https://aftionix.in
NEXT_PUBLIC_DOMAIN=aftionix.in
NEXT_PUBLIC_SITE_NAME=Aftionix Job Portal

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth Configuration
NEXTAUTH_SECRET="your-production-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Security
JWT_SECRET="your-production-jwt-secret-here"
ENCRYPTION_KEY="your-production-encryption-key-here"

# Performance
ENABLE_LOGGING=true
LOG_LEVEL="warn"
NEXT_TELEMETRY_DISABLED=1
EOF

# Create PM2 ecosystem file
log "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'aftionix-jobportal',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/aftionix-error.log',
    out_file: '/var/log/aftionix-out.log',
    log_file: '/var/log/aftionix-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start or restart the application
log "Starting the application with PM2..."
if pm2 list | grep -q "aftionix-jobportal"; then
    log "Restarting existing application..."
    pm2 restart aftionix-jobportal
else
    log "Starting new application..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Create Nginx configuration
log "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/aftionix.in > /dev/null << EOF
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aftionix.in www.aftionix.in;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aftionix.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aftionix.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Root directory
    root $PROJECT_DIR/.next;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /_next/static/ {
        alias $PROJECT_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads
    location /uploads/ {
        alias $PROJECT_DIR/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
log "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/

# Test Nginx configuration
log "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
log "Reloading Nginx..."
sudo systemctl reload nginx

# Setup SSL certificate with Let's Encrypt
log "Setting up SSL certificate..."
if ! command -v certbot &> /dev/null; then
    log "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Check if SSL certificate exists
if [ ! -d "/etc/letsencrypt/live/aftionix.in" ]; then
    log "Obtaining SSL certificate..."
    sudo certbot --nginx -d aftionix.in -d www.aftionix.in --non-interactive --agree-tos --email your-email@aftionix.in
else
    log "SSL certificate already exists, renewing if needed..."
    sudo certbot renew --quiet
fi

# Setup automatic SSL renewal
log "Setting up automatic SSL renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Create health check script
log "Creating health check script..."
cat > /usr/local/bin/health-check-aftionix.sh << 'EOF'
#!/bin/bash
HEALTH_URL="https://aftionix.in/health"
LOG_FILE="/var/log/aftionix-health.log"

if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "$(date): Health check passed" >> "$LOG_FILE"
    exit 0
else
    echo "$(date): Health check failed" >> "$LOG_FILE"
    # Restart the application
    pm2 restart aftionix-jobportal
    exit 1
fi
EOF

chmod +x /usr/local/bin/health-check-aftionix.sh

# Setup health check cron job
log "Setting up health check cron job..."
sudo crontab -l 2>/dev/null | { cat; echo "*/5 * * * * /usr/local/bin/health-check-aftionix.sh"; } | sudo crontab -

# Final status check
log "Performing final status check..."
sleep 5

if curl -f -s "https://aftionix.in/health" > /dev/null; then
    log "✅ Deployment completed successfully!"
    log "🌐 Your job portal is now live at: https://aftionix.in"
    log "📊 PM2 Status:"
    pm2 status
    log "📝 Logs are available at: $LOG_FILE"
else
    error "❌ Deployment failed! Health check failed."
fi

echo ""
echo "🎉 Deployment Summary:"
echo "Domain: https://aftionix.in"
echo "Project Directory: $PROJECT_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo "Log File: $LOG_FILE"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to this server"
echo "2. Test all job portal features"
echo "3. Monitor performance and logs"
echo "4. Set up monitoring and alerts"
