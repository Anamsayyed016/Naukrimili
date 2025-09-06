#!/bin/bash

# Setup HTTPS/SSL for aftionix.in
echo "🔒 Setting up HTTPS for aftionix.in..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

print_step "1. Installing Certbot for Let's Encrypt SSL..."
if ! command -v certbot &> /dev/null; then
    yum install -y certbot python3-certbot-nginx
else
    print_status "Certbot already installed"
fi

print_step "2. Stopping nginx temporarily..."
systemctl stop nginx

print_step "3. Obtaining SSL certificate..."
certbot certonly --standalone -d aftionix.in -d www.aftionix.in --non-interactive --agree-tos --email admin@aftionix.in

print_step "4. Creating HTTPS nginx configuration..."
cat > /etc/nginx/sites-available/aftionix.in << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name aftionix.in www.aftionix.in;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/aftionix.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aftionix.in/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy settings
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

print_step "5. Testing nginx configuration..."
if nginx -t; then
    print_status "✅ Nginx configuration is valid"
else
    print_error "❌ Nginx configuration has errors"
    exit 1
fi

print_step "6. Starting nginx..."
systemctl start nginx

print_step "7. Testing HTTPS connection..."
sleep 5
curl -k https://aftionix.in/api/health

print_step "8. Setting up auto-renewal..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

print_status "🎉 HTTPS setup completed!"
print_status "🌐 Your website is now available at: https://aftionix.in"
print_status "🔒 SSL certificate will auto-renew"

