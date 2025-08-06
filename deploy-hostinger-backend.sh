#!/bin/bash
# Hostinger KVM 2 Deployment Script for Job Portal Backend
# Run this script on your Hostinger KVM 2 server

set -e  # Exit on any error

echo "🚀 Starting Job Portal Backend Deployment on Hostinger KVM 2..."

# Configuration
PROJECT_NAME="jobportal-backend"
DOMAIN="your-domain.com"  # Change this to your domain
BACKEND_PORT=8000
PYTHON_VERSION="3.11"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_status "📋 System Information:"
echo "User: $(whoami)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
echo "Node: $(node --version 2>/dev/null || echo 'Not installed')"
echo ""

# Step 1: Update system packages
print_status "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Python 3.11 and dependencies
print_status "🐍 Installing Python ${PYTHON_VERSION} and dependencies..."
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-venv python${PYTHON_VERSION}-dev python3-pip

# Verify Python installation
if ! command -v python${PYTHON_VERSION} &> /dev/null; then
    print_error "Python ${PYTHON_VERSION} installation failed"
    exit 1
fi

print_success "Python ${PYTHON_VERSION} installed successfully"

# Step 3: Install and configure MySQL
print_status "🗄️ Installing MySQL Server..."
sudo apt install -y mysql-server

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation (you'll need to run this manually)
print_warning "Please run 'sudo mysql_secure_installation' manually after this script completes"

# Create database and user
print_status "🔧 Setting up database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS jobportal;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'jobportal_user'@'localhost' IDENTIFIED BY 'secure_password_123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON jobportal.* TO 'jobportal_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

print_success "Database setup completed"

# Step 4: Install Redis
print_status "📮 Installing Redis for caching..."
sudo apt install -y redis-server

# Configure Redis
sudo systemctl start redis
sudo systemctl enable redis

print_success "Redis installed and started"

# Step 5: Install NGINX
print_status "🌐 Installing NGINX..."
sudo apt install -y nginx

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

print_success "NGINX installed and started"

# Step 6: Create project directory
print_status "📁 Setting up project directory..."
PROJECT_DIR="/home/$(whoami)/${PROJECT_NAME}"
mkdir -p $PROJECT_DIR

# Step 7: Clone or copy backend code
print_status "📥 Setting up backend code..."
cd $PROJECT_DIR

# If you have the code in a git repository, uncomment and modify:
# git clone https://your-repo-url.git .

# For now, we'll create the directory structure
mkdir -p backend/{models,services,utils}

print_success "Project directory created at $PROJECT_DIR"

# Step 8: Create Python virtual environment
print_status "🔧 Creating Python virtual environment..."
cd $PROJECT_DIR
python${PYTHON_VERSION} -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

print_success "Virtual environment created"

# Step 9: Install Python dependencies
print_status "📦 Installing Python dependencies..."
# Create requirements.txt if it doesn't exist
if [ ! -f "backend/requirements.txt" ]; then
    cat > backend/requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
aiomysql==0.2.0
motor==3.3.2
pymongo==4.6.0
redis==5.0.1
aioredis==2.0.1
httpx==0.25.2
aiohttp==3.9.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
fastapi-cors==0.0.6
slowapi==0.1.9
python-dotenv==1.0.0
structlog==23.2.0
email-validator==2.1.0
python-dateutil==2.8.2
gunicorn==21.2.0
EOF
fi

pip install -r backend/requirements.txt

print_success "Python dependencies installed"

# Step 10: Create environment file
print_status "⚙️ Creating environment configuration..."
cat > backend/.env << EOF
# Database Configuration
DATABASE_TYPE=mysql
DATABASE_URL=mysql+aiomysql://jobportal_user:secure_password_123@localhost:3306/jobportal

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=jobportal_user
MYSQL_PASSWORD=secure_password_123
MYSQL_DATABASE=jobportal

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
CACHE_TTL=300

# API Configuration
API_HOST=0.0.0.0
API_PORT=${BACKEND_PORT}
API_DEBUG=False
API_RELOAD=False

# Security Configuration
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "https://${DOMAIN}", "https://www.${DOMAIN}"]
ALLOWED_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
ALLOWED_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# External APIs
GOOGLE_SEARCH_ENABLED=True

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json

# Job Search Configuration
DEFAULT_RESULTS_PER_PAGE=20
MAX_RESULTS_PER_PAGE=100
SEARCH_TIMEOUT=30

# Geographic Configuration
DEFAULT_COUNTRY=IN
SUPPORTED_COUNTRIES=["IN", "US", "GB", "AE"]

# Sample Data Configuration
LOAD_SAMPLE_DATA=True
SAMPLE_DATA_COUNT=100
EOF

print_success "Environment configuration created"

# Step 11: Create systemd service
print_status "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/jobportal-backend.service > /dev/null << EOF
[Unit]
Description=Job Portal FastAPI Backend
After=network.target mysql.service redis.service

[Service]
User=$(whoami)
Group=$(whoami)
WorkingDirectory=${PROJECT_DIR}/backend
Environment=PATH=${PROJECT_DIR}/venv/bin
ExecStart=${PROJECT_DIR}/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${BACKEND_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable jobportal-backend

print_success "Systemd service created"

# Step 12: Configure NGINX
print_status "🌐 Configuring NGINX..."
sudo tee /etc/nginx/sites-available/jobportal-backend > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files (if any)
    location /static/ {
        alias ${PROJECT_DIR}/backend/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/jobportal-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    print_success "NGINX configured successfully"
else
    print_error "NGINX configuration test failed"
    exit 1
fi

# Step 13: Install SSL with Let's Encrypt
print_status "🔒 Installing SSL certificate..."
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symbolic link
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

print_warning "To enable SSL, run: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

# Step 14: Set up log rotation
print_status "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/jobportal-backend > /dev/null << EOF
${PROJECT_DIR}/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        sudo systemctl reload jobportal-backend
    endscript
}
EOF

print_success "Log rotation configured"

# Step 15: Create log directory
mkdir -p ${PROJECT_DIR}/backend/logs

# Step 16: Final instructions
print_success "🎉 Backend deployment setup completed!"
echo ""
print_status "📋 Next Steps:"
echo "1. Copy your backend code to: ${PROJECT_DIR}/backend/"
echo "2. Update domain in NGINX config: sudo nano /etc/nginx/sites-available/jobportal-backend"
echo "3. Start the backend service: sudo systemctl start jobportal-backend"
echo "4. Check service status: sudo systemctl status jobportal-backend"
echo "5. Install SSL certificate: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "6. Update frontend .env.local: NEXT_PUBLIC_API_URL=https://${DOMAIN}"
echo ""
print_status "📊 Service Commands:"
echo "- Start backend: sudo systemctl start jobportal-backend"
echo "- Stop backend: sudo systemctl stop jobportal-backend"
echo "- Restart backend: sudo systemctl restart jobportal-backend"
echo "- View logs: sudo journalctl -u jobportal-backend -f"
echo "- Check NGINX: sudo systemctl status nginx"
echo ""
print_status "🔍 Debugging:"
echo "- Backend logs: tail -f ${PROJECT_DIR}/backend/logs/app.log"
echo "- NGINX logs: sudo tail -f /var/log/nginx/access.log"
echo "- System logs: sudo journalctl -f"
echo ""
print_warning "⚠️  Security Reminders:"
echo "1. Change default database password in ${PROJECT_DIR}/backend/.env"
echo "2. Run: sudo mysql_secure_installation"
echo "3. Configure firewall: sudo ufw enable && sudo ufw allow 22,80,443/tcp"
echo "4. Regular updates: sudo apt update && sudo apt upgrade"
echo ""
print_success "✅ Deployment script completed successfully!"
