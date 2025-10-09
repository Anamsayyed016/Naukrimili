#!/bin/bash

# Linux Server Setup Script for Job Portal
# Run this script on your production server (naukrimili.com)

set -e

# Configuration
APP_NAME="jobportal"
APP_DIR="/var/www/jobportal"
REPO_URL="https://github.com/Anamsayyed016/Naukrimili.git"
BRANCH="main"
DOMAIN="naukrimili.com"
EMAIL="admin@naukrimili.com"
NODE_VERSION="18"
PM2_USER="www-data"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root"
    exit 1
fi

log "Starting server setup for Job Portal..."

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18
log "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VER=$(node -v)
NPM_VER=$(npm -v)
log "Node.js version: $NODE_VER"
log "NPM version: $NPM_VER"

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
log "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER jobportal_user WITH PASSWORD 'secure_password_2024';"
sudo -u postgres psql -c "CREATE DATABASE jobportal OWNER jobportal_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;"

# Install Nginx
log "Installing Nginx..."
apt install -y nginx

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated after certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    
    # Main application
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
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
    
    # Auth rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    # Logging
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Install Certbot for SSL
log "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Create application directory
log "Creating application directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/$APP_NAME
chown -R $PM2_USER:$PM2_USER $APP_DIR
chown -R $PM2_USER:$PM2_USER /var/log/$APP_NAME

# Clone repository
log "Cloning repository..."
cd $APP_DIR
sudo -u $PM2_USER git clone -b $BRANCH $REPO_URL .

# Install dependencies
log "Installing dependencies..."
sudo -u $PM2_USER npm ci --production

# Build application
log "Building application..."
sudo -u $PM2_USER npm run build

# Create PM2 ecosystem config
log "Creating PM2 ecosystem configuration..."
cat > $APP_DIR/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'server.js',
      cwd: '/var/www/jobportal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true',
        NEXT_PUBLIC_APP_URL: 'https://naukrimili.com',
        NEXTAUTH_URL: 'https://naukrimili.com',
        NEXTAUTH_SECRET: 'jobportal-secret-key-2024-naukrimili-production-deployment',
        JWT_SECRET: 'jobportal-jwt-secret-2024-naukrimili-production',
        DATABASE_URL: 'postgresql://jobportal_user:secure_password_2024@localhost:5432/jobportal'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true',
        NEXT_PUBLIC_APP_URL: 'https://naukrimili.com',
        NEXTAUTH_URL: 'https://naukrimili.com',
        NEXTAUTH_SECRET: 'jobportal-secret-key-2024-naukrimili-production-deployment',
        JWT_SECRET: 'jobportal-jwt-secret-2024-naukrimili-production',
        DATABASE_URL: 'postgresql://jobportal_user:secure_password_2024@localhost:5432/jobportal'
      },
      log_file: '/var/log/jobportal/combined.log',
      out_file: '/var/log/jobportal/out.log',
      error_file: '/var/log/jobportal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: 'fork'
    }
  ]
};
EOF

# Set proper permissions
chown -R $PM2_USER:$PM2_USER $APP_DIR

# Start the application
log "Starting application..."
sudo -u $PM2_USER pm2 start $APP_DIR/ecosystem.config.cjs --env production
sudo -u $PM2_USER pm2 save
sudo -u $PM2_USER pm2 startup systemd -u $PM2_USER --hp /home/$PM2_USER

# Start and enable services
log "Starting and enabling services..."
systemctl start nginx
systemctl enable nginx
systemctl restart postgresql

# Configure firewall
log "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/jobportal << EOF
/var/log/jobportal/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $PM2_USER $PM2_USER
    postrotate
        sudo -u $PM2_USER pm2 reloadLogs
    endscript
}
EOF

# Create monitoring script
log "Creating monitoring script..."
cat > /usr/local/bin/jobportal-monitor.sh << 'EOF'
#!/bin/bash
# Job Portal Monitoring Script

APP_NAME="jobportal"
LOG_FILE="/var/log/jobportal/monitor.log"

# Check if PM2 process is running
if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo "$(date): $APP_NAME is not running, attempting restart..." >> $LOG_FILE
    sudo -u www-data pm2 restart $APP_NAME
fi

# Check memory usage
MEMORY_USAGE=$(pm2 jlist | jq -r '.[] | select(.name=="'$APP_NAME'") | .monit.memory')
if [ "$MEMORY_USAGE" -gt 1800000000 ]; then
    echo "$(date): High memory usage detected: $MEMORY_USAGE" >> $LOG_FILE
    sudo -u www-data pm2 restart $APP_NAME
fi

# Check disk space
DISK_USAGE=$(df /var/www/jobportal | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$(date): High disk usage detected: $DISK_USAGE%" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/jobportal-monitor.sh

# Add to crontab
log "Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/jobportal-monitor.sh") | crontab -

# Install jq for monitoring
apt install -y jq

log "Server setup completed successfully!"
log "Next steps:"
log "1. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
log "2. Test your application: https://$DOMAIN"
log "3. Monitor logs: pm2 logs $APP_NAME"
log "4. Check status: pm2 status"

# Show final status
log "Current status:"
pm2 status
systemctl status nginx --no-pager -l
systemctl status postgresql --no-pager -l

log "Setup complete! Your job portal is ready for production."
