#!/bin/bash

# Production Server Setup Script
# Sets up everything needed for automatic production deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="jobportal"
PROJECT_DIR="/root/jobportal"
BACKUP_DIR="/root/backups/jobportal"
LOG_DIR="/var/log/jobportal"
PM2_APP_NAME="jobportal"

# Function to log with timestamp
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log "❌ This script must be run as root" "$RED"
        log "Please run: sudo $0" "$YELLOW"
        exit 1
    fi
}

# Function to update system
update_system() {
    log "🔄 Updating system packages..." "$BLUE"
    
    # Update package lists
    apt-get update -y
    
    # Upgrade existing packages
    apt-get upgrade -y
    
    # Install essential packages
    apt-get install -y curl wget git unzip software-properties-common
    
    log "✅ System updated successfully" "$GREEN"
}

# Function to install Node.js
install_nodejs() {
    log "📦 Installing Node.js..." "$BLUE"
    
    # Check if Node.js is already installed
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log "✅ Node.js already installed: $NODE_VERSION" "$GREEN"
        return 0
    fi
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log "✅ Node.js installed: $NODE_VERSION" "$GREEN"
    log "✅ npm installed: $NPM_VERSION" "$GREEN"
}

# Function to install PM2
install_pm2() {
    log "📦 Installing PM2..." "$BLUE"
    
    # Check if PM2 is already installed
    if command -v pm2 >/dev/null 2>&1; then
        PM2_VERSION=$(pm2 --version)
        log "✅ PM2 already installed: $PM2_VERSION" "$GREEN"
        return 0
    fi
    
    # Install PM2 globally
    npm install -g pm2
    
    # Setup PM2 startup script
    pm2 startup systemd -u root --hp /root
    
    # Verify installation
    PM2_VERSION=$(pm2 --version)
    log "✅ PM2 installed: $PM2_VERSION" "$GREEN"
}

# Function to create directories
create_directories() {
    log "📁 Creating necessary directories..." "$BLUE"
    
    # Create project directory
    mkdir -p "$PROJECT_DIR"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Create log files
    touch "$LOG_DIR/combined.log"
    touch "$LOG_DIR/out.log"
    touch "$LOG_DIR/error.log"
    touch "/var/log/auto-deploy.log"
    touch "/var/log/monitor-server.log"
    
    # Set proper permissions
    chmod 755 "$PROJECT_DIR"
    chmod 755 "$BACKUP_DIR"
    chmod 755 "$LOG_DIR"
    chmod 644 "$LOG_DIR"/*.log
    chmod 644 "/var/log/auto-deploy.log"
    chmod 644 "/var/log/monitor-server.log"
    
    log "✅ Directories created successfully" "$GREEN"
}

# Function to setup cron jobs
setup_cron() {
    log "⏰ Setting up cron jobs..." "$BLUE"
    
    # Create cron job for monitoring
    cat > /etc/cron.d/jobportal-monitor << EOF
# Job Portal Monitoring - Every 5 minutes
*/5 * * * * root $PROJECT_DIR/monitor-server.sh check >> /var/log/monitor-server.log 2>&1

# Job Portal Health Check - Every hour
0 * * * * root $PROJECT_DIR/monitor-server.sh status >> /var/log/monitor-server.log 2>&1

# Log Rotation - Daily at midnight
0 0 * * * root find $LOG_DIR -name "*.log" -mtime +7 -delete
EOF
    
    # Set proper permissions
    chmod 644 /etc/cron.d/jobportal-monitor
    
    # Restart cron service
    systemctl restart cron
    
    log "✅ Cron jobs setup successfully" "$GREEN"
}

# Function to setup log rotation
setup_log_rotation() {
    log "📋 Setting up log rotation..." "$BLUE"
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/jobportal << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/auto-deploy.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}

/var/log/monitor-server.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    
    # Set proper permissions
    chmod 644 /etc/logrotate.d/jobportal
    
    log "✅ Log rotation setup successfully" "$GREEN"
}

# Function to setup firewall
setup_firewall() {
    log "🔥 Setting up firewall..." "$BLUE"
    
    # Check if ufw is installed
    if ! command -v ufw >/dev/null 2>&1; then
        apt-get install -y ufw
    fi
    
    # Configure firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 3000/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    log "✅ Firewall configured successfully" "$GREEN"
}

# Function to setup nginx (optional)
setup_nginx() {
    log "🌐 Setting up Nginx (optional)..." "$BLUE"
    
    # Check if nginx is already installed
    if command -v nginx >/dev/null 2>&1; then
        log "✅ Nginx already installed" "$GREEN"
        return 0
    fi
    
    # Install nginx
    apt-get install -y nginx
    
    # Create nginx configuration
    cat > /etc/nginx/sites-available/jobportal << EOF
server {
    listen 80;
    server_name your-domain.com;  # Update with your domain
    
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
    
    # Enable site
    ln -sf /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    log "✅ Nginx configured successfully" "$GREEN"
    log "⚠️ Please update the server_name in /etc/nginx/sites-available/jobportal" "$YELLOW"
}

# Function to create systemd service
create_systemd_service() {
    log "⚙️ Creating systemd service..." "$BLUE"
    
    # Create systemd service file
    cat > /etc/systemd/system/jobportal.service << EOF
[Unit]
Description=Job Portal Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs --env production
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    systemctl daemon-reload
    systemctl enable jobportal.service
    
    log "✅ Systemd service created successfully" "$GREEN"
}

# Function to setup monitoring
setup_monitoring() {
    log "📊 Setting up monitoring..." "$BLUE"
    
    # Make scripts executable
    chmod +x "$PROJECT_DIR/auto-deploy-server.sh"
    chmod +x "$PROJECT_DIR/monitor-server.sh"
    chmod +x "$PROJECT_DIR/deploy-production.sh"
    chmod +x "$PROJECT_DIR/emergency-chunk-cleanup.sh"
    
    # Create monitoring script
    cat > /usr/local/bin/jobportal-monitor << EOF
#!/bin/bash
cd $PROJECT_DIR
./monitor-server.sh "\$@"
EOF
    
    chmod +x /usr/local/bin/jobportal-monitor
    
    log "✅ Monitoring setup successfully" "$GREEN"
}

# Function to show final instructions
show_final_instructions() {
    log "🎉 Production server setup completed!" "$GREEN"
    echo ""
    echo "=================================="
    echo "🚀 SETUP COMPLETE - NEXT STEPS"
    echo "=================================="
    echo ""
    echo "1. 📁 Upload your project files to: $PROJECT_DIR"
    echo "2. 🔧 Update configuration files:"
    echo "   - ecosystem.config.cjs (update paths and settings)"
    echo "   - auto-deploy-server.sh (update PROJECT_DIR if needed)"
    echo "   - monitor-server.sh (update paths if needed)"
    echo ""
    echo "3. 🚀 Deploy your application:"
    echo "   cd $PROJECT_DIR"
    echo "   ./auto-deploy-server.sh"
    echo ""
    echo "4. 📊 Monitor your application:"
    echo "   ./monitor-server.sh status"
    echo "   ./monitor-server.sh monitor"
    echo ""
    echo "5. 🔄 For future deployments:"
    echo "   ./auto-deploy-server.sh"
    echo ""
    echo "6. 🆘 Emergency fixes:"
    echo "   ./emergency-chunk-cleanup.sh"
    echo ""
    echo "=================================="
    echo "📋 USEFUL COMMANDS"
    echo "=================================="
    echo "• Check status: pm2 status"
    echo "• View logs: pm2 logs $PM2_APP_NAME"
    echo "• Restart app: pm2 restart $PM2_APP_NAME"
    echo "• Monitor: ./monitor-server.sh monitor"
    echo "• Deploy: ./auto-deploy-server.sh"
    echo "• Emergency: ./emergency-chunk-cleanup.sh"
    echo "=================================="
}

# Main setup function
main() {
    log "🚀 Starting Production Server Setup" "$PURPLE"
    log "Project: $PROJECT_NAME" "$CYAN"
    log "Directory: $PROJECT_DIR" "$CYAN"
    
    # Check if running as root
    check_root
    
    # Update system
    update_system
    
    # Install Node.js
    install_nodejs
    
    # Install PM2
    install_pm2
    
    # Create directories
    create_directories
    
    # Setup cron jobs
    setup_cron
    
    # Setup log rotation
    setup_log_rotation
    
    # Setup firewall
    setup_firewall
    
    # Setup nginx (optional)
    read -p "Do you want to setup Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_nginx
    fi
    
    # Create systemd service
    create_systemd_service
    
    # Setup monitoring
    setup_monitoring
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"
