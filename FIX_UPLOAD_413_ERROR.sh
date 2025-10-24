#!/bin/bash

# Fix for 413 Request Entity Too Large Error
# This script fixes the Nginx configuration to allow file uploads up to 10MB

echo "🔧 Fixing 413 Request Entity Too Large Error..."

# Step 1: Backup current Nginx configuration
echo "📦 Backing up current Nginx configuration..."
cp /etc/nginx/sites-available/naukrimili.com /etc/nginx/sites-available/naukrimili.com.backup.$(date +%Y%m%d_%H%M%S)

# Step 2: Update Nginx configuration with file upload limits
echo "⚙️ Updating Nginx configuration..."

# Create the updated configuration
cat > /etc/nginx/sites-available/naukrimili.com << 'EOF'
server {
    listen 443 ssl http2;
    server_name naukrimili.com www.naukrimili.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/naukrimili.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naukrimili.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # CRITICAL FIX: Increase file upload size limit
    client_max_body_size 10M;  # Allow up to 10MB file uploads
    
    # Increase timeout for large file uploads
    client_body_timeout 60s;
    client_header_timeout 60s;
    
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
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Main application
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CRITICAL: Increase timeouts for file uploads
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # API rate limiting with file upload support
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CRITICAL: Increase timeouts for API file uploads
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Special handling for resume upload endpoint
    location /api/resumes/ultimate-upload {
        # Allow larger files for resume uploads
        client_max_body_size 10M;
        client_body_timeout 60s;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for file processing
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Auth rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
    access_log /var/log/nginx/naukrimili.com.access.log;
    error_log /var/log/nginx/naukrimili.com.error.log;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    server_name naukrimili.com www.naukrimili.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}
EOF

# Step 3: Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Step 4: Reload Nginx
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        echo ""
        echo "🎉 FIX COMPLETE!"
        echo "📋 What was fixed:"
        echo "   • client_max_body_size increased to 10M"
        echo "   • client_body_timeout increased to 60s"
        echo "   • proxy timeouts increased to 300s"
        echo "   • Special handling for /api/resumes/ultimate-upload"
        echo ""
        echo "🚀 Now try uploading your resume again!"
        echo "   The 413 error should be resolved."
    else
        echo "❌ Failed to reload Nginx"
        echo "🔄 Restoring backup..."
        cp /etc/nginx/sites-available/naukrimili.com.backup.* /etc/nginx/sites-available/naukrimili.com
        systemctl reload nginx
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup..."
    cp /etc/nginx/sites-available/naukrimili.com.backup.* /etc/nginx/sites-available/naukrimili.com
    exit 1
fi
