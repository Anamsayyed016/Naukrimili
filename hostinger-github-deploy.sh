#!/bin/bash

# Hostinger GitHub Auto-Deploy Script for aftionix.in
# This script will automatically deploy your job portal when you push to GitHub

set -e

# Configuration
GITHUB_REPO="yourusername/jobportal"
DOMAIN="aftionix.in"
VPS_IP="69.62.73.84"
DEPLOY_PATH="/var/www/aftionix.in"
BACKUP_PATH="/var/backups/aftionix.in"
LOG_FILE="/var/log/aftionix-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
log "Setting up deployment environment..."
mkdir -p "$DEPLOY_PATH"
mkdir -p "$BACKUP_PATH"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Function to backup current deployment
backup_deployment() {
    if [ -d "$DEPLOY_PATH" ] && [ "$(ls -A "$DEPLOY_PATH")" ]; then
        log "Creating backup of current deployment..."
        BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
        cp -r "$DEPLOY_PATH" "$BACKUP_PATH/$BACKUP_NAME"
        log "Backup created: $BACKUP_PATH/$BACKUP_NAME"
    fi
}

# Function to clean old backups (keep only last 5)
cleanup_backups() {
    log "Cleaning up old backups..."
    cd "$BACKUP_PATH"
    ls -t | tail -n +6 | xargs -r rm -rf
    log "Old backups cleaned up"
}

# Function to deploy from GitHub
deploy_from_github() {
    log "Deploying from GitHub repository: $GITHUB_REPO"
    
    cd "$DEPLOY_PATH"
    
    # Remove existing files (except backups and logs)
    if [ -d ".git" ]; then
        log "Updating existing repository..."
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    else
        log "Cloning repository for first time..."
        git clone "https://github.com/$GITHUB_REPO.git" .
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production
    
    # Build the application
    log "Building application..."
    npm run build
    
    # Set proper permissions
    log "Setting permissions..."
    chown -R www-data:www-data "$DEPLOY_PATH"
    chmod -R 755 "$DEPLOY_PATH"
    
    log "Deployment from GitHub completed successfully"
}

# Function to setup PM2 process
setup_pm2() {
    log "Setting up PM2 process manager..."
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Create PM2 ecosystem file
    cat > "$DEPLOY_PATH/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'aftionix-jobportal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/aftionix.in',
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
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', '.git', '.next']
  }]
};
EOF
    
    # Start or restart the application
    if pm2 list | grep -q "aftionix-jobportal"; then
        log "Restarting existing PM2 process..."
        pm2 restart aftionix-jobportal
    else
        log "Starting new PM2 process..."
        pm2 start "$DEPLOY_PATH/ecosystem.config.js"
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
}

# Function to setup Nginx configuration
setup_nginx() {
    log "Setting up Nginx configuration..."
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        log "Installing Nginx..."
        yum install -y nginx
        systemctl enable nginx
        systemctl start nginx
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/conf.d/aftionix.in.conf << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files with caching
    location /_next/static/ {
        alias /var/www/aftionix.in/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # Uploads
    location /uploads/ {
        alias /var/www/aftionix.in/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(node_modules|\.git|\.env) {
        deny all;
    }
}
EOF
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    
    log "Nginx configuration completed"
}

# Function to setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Install Certbot if not installed
    if ! command -v certbot &> /dev/null; then
        log "Installing Certbot..."
        yum install -y certbot python3-certbot-nginx
    fi
    
    # Check if SSL certificate exists
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log "Obtaining SSL certificate..."
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
    else
        log "SSL certificate already exists, renewing if needed..."
        certbot renew --quiet
    fi
    
    # Setup automatic SSL renewal
    log "Setting up automatic SSL renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log "SSL setup completed"
}

# Function to setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Configure firewall for HTTP, HTTPS, and SSH
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
    
    log "Firewall configuration completed"
}

# Function to create GitHub webhook endpoint
create_webhook_endpoint() {
    log "Creating GitHub webhook endpoint..."
    
    # Create webhook endpoint file
    cat > "$DEPLOY_PATH/webhook.php" << 'EOF'
<?php
// GitHub webhook endpoint for automatic deployment
$secret = 'your-webhook-secret-here'; // Change this to a secure secret

// Verify webhook signature
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', $payload, $secret), $signature)) {
    http_response_code(401);
    die('Unauthorized');
}

// Execute deployment script
$output = shell_exec('/var/www/aftionix.in/deploy.sh 2>&1');
file_put_contents('/var/log/webhook.log', date('Y-m-d H:i:s') . ' - ' . $output . "\n", FILE_APPEND);

echo "Deployment triggered successfully";
?>
EOF
    
    log "Webhook endpoint created at: $DEPLOY_PATH/webhook.php"
}

# Function to create deployment script
create_deploy_script() {
    log "Creating deployment script..."
    
    cat > "$DEPLOY_PATH/deploy.sh" << 'EOF'
#!/bin/bash
# Auto-deployment script triggered by GitHub webhook

cd /var/www/aftionix.in
git pull origin main
npm ci --production
npm run build
pm2 restart aftionix-jobportal

echo "Deployment completed at $(date)"
EOF
    
    chmod +x "$DEPLOY_PATH/deploy.sh"
    log "Deployment script created and made executable"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create health check script
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
    
    # Setup health check cron job (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check-aftionix.sh") | crontab -
    
    log "Monitoring setup completed"
}

# Main deployment function
main_deployment() {
    log "🚀 Starting Hostinger GitHub deployment for $DOMAIN..."
    
    # Check prerequisites
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install git first."
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    # Execute deployment steps
    backup_deployment
    cleanup_backups
    deploy_from_github
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    create_webhook_endpoint
    create_deploy_script
    setup_monitoring
    
    # Final status check
    log "Performing final status check..."
    sleep 5
    
    if curl -f -s "https://$DOMAIN/health" > /dev/null; then
        log "✅ Deployment completed successfully!"
        log "🌐 Your job portal is now live at: https://$DOMAIN"
        log "📊 PM2 Status:"
        pm2 status
    else
        warning "❌ Health check failed. Please check manually."
    fi
    
    log "🎉 Hostinger GitHub deployment completed!"
    log "📝 Logs are available at: $LOG_FILE"
    log "🔄 To enable auto-deployment, add this webhook to your GitHub repository:"
    log "   URL: https://$DOMAIN/webhook.php"
    log "   Secret: your-webhook-secret-here"
}

# Execute main deployment
main_deployment
