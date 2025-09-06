#!/bin/bash

# Fix domain timeout issue - aftionix.in
echo "🔧 Fixing domain timeout issue for aftionix.in..."

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

print_step "1. Checking current nginx configuration..."
nginx -t

print_step "2. Creating nginx config for aftionix.in..."
cat > /etc/nginx/sites-available/aftionix.in << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
    # Increase timeout values
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    send_timeout 60s;
    
    # Increase buffer sizes
    proxy_buffering on;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Main location block
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

print_step "3. Enabling the site..."
ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/

print_step "4. Testing nginx configuration..."
if nginx -t; then
    print_status "✅ Nginx configuration is valid"
else
    print_error "❌ Nginx configuration has errors"
    exit 1
fi

print_step "5. Reloading nginx..."
systemctl reload nginx

print_step "6. Checking PM2 status..."
pm2 status

print_step "7. Testing local connection..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_status "✅ Local application is responding"
else
    print_warning "⚠️ Local application may not be responding"
fi

print_step "8. Testing domain connection..."
if curl -f http://aftionix.in/api/health >/dev/null 2>&1; then
    print_status "✅ Domain is responding"
else
    print_warning "⚠️ Domain may not be responding yet (DNS propagation may take time)"
fi

print_step "9. Checking nginx logs..."
print_status "Recent nginx access logs:"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No access logs found"

print_status "Recent nginx error logs:"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No error logs found"

print_step "10. Checking if port 80 is listening..."
if netstat -tlnp | grep :80 >/dev/null; then
    print_status "✅ Port 80 is listening"
else
    print_warning "⚠️ Port 80 may not be listening"
fi

print_status "🎉 Domain fix completed!"
print_status "🌐 Test your website: http://aftionix.in"
print_status "🔍 If still not working, check DNS settings in Hostinger control panel"
print_status "📊 Use 'pm2 logs jobportal' to check application logs"

