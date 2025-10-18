#!/bin/bash

# Comprehensive Nginx Fix for 413 Request Entity Too Large Error
# This script finds and fixes ALL Nginx configurations

echo "🔧 Comprehensive Nginx Fix for 413 Error..."

# Step 1: Find all Nginx configuration files
echo "🔍 Finding Nginx configuration files..."

# Check main nginx.conf
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "📁 Found main config: /etc/nginx/nginx.conf"
    
    # Backup main config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # Add client_max_body_size to http block if not present
    if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
        echo "⚙️ Adding client_max_body_size to main nginx.conf..."
        sed -i '/http {/a\    client_max_body_size 10M;' /etc/nginx/nginx.conf
        sed -i '/http {/a\    client_body_timeout 60s;' /etc/nginx/nginx.conf
    fi
fi

# Check sites-available directory
if [ -d "/etc/nginx/sites-available" ]; then
    echo "📁 Found sites-available directory"
    for config in /etc/nginx/sites-available/*; do
        if [ -f "$config" ]; then
            echo "📄 Processing: $config"
            # Backup
            cp "$config" "${config}.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Add client_max_body_size to server blocks
            if ! grep -q "client_max_body_size" "$config"; then
                echo "⚙️ Adding client_max_body_size to $config"
                sed -i '/server {/a\    client_max_body_size 10M;' "$config"
                sed -i '/server {/a\    client_body_timeout 60s;' "$config"
            fi
        fi
    done
fi

# Check conf.d directory
if [ -d "/etc/nginx/conf.d" ]; then
    echo "📁 Found conf.d directory"
    for config in /etc/nginx/conf.d/*.conf; do
        if [ -f "$config" ]; then
            echo "📄 Processing: $config"
            # Backup
            cp "$config" "${config}.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Add client_max_body_size to server blocks
            if ! grep -q "client_max_body_size" "$config"; then
                echo "⚙️ Adding client_max_body_size to $config"
                sed -i '/server {/a\    client_max_body_size 10M;' "$config"
                sed -i '/server {/a\    client_body_timeout 60s;' "$config"
            fi
        fi
    done
fi

# Step 2: Create a specific configuration for naukrimili.com if it doesn't exist
echo "🎯 Creating naukrimili.com configuration..."

cat > /etc/nginx/sites-available/naukrimili.com << 'EOF'
server {
    listen 443 ssl http2;
    server_name naukrimili.com www.naukrimili.com;
    
    # CRITICAL: File upload settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # SSL Configuration (if certificates exist)
    ssl_certificate /etc/letsencrypt/live/naukrimili.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naukrimili.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
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
        
        # Extended timeouts for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }
    
    # Special handling for resume upload endpoint
    location /api/resumes/ultimate-upload {
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
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for API calls
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    server_name naukrimili.com www.naukrimili.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/naukrimili.com /etc/nginx/sites-enabled/

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
        echo "🎉 COMPREHENSIVE FIX COMPLETE!"
        echo "📋 What was fixed:"
        echo "   • Added client_max_body_size 10M to ALL server blocks"
        echo "   • Added client_body_timeout 60s to ALL server blocks"
        echo "   • Created specific naukrimili.com configuration"
        echo "   • Extended proxy timeouts for file uploads"
        echo "   • Special handling for /api/resumes/ultimate-upload"
        echo ""
        echo "🚀 Now try uploading your resume again!"
        echo "   The 413 error should be completely resolved."
        echo ""
        echo "📊 Current Nginx status:"
        systemctl status nginx --no-pager -l
    else
        echo "❌ Failed to reload Nginx"
        echo "🔄 Restoring backups..."
        find /etc/nginx -name "*.backup.*" -exec sh -c 'cp "$1" "${1%.backup.*}"' _ {} \;
        systemctl reload nginx
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backups..."
    find /etc/nginx -name "*.backup.*" -exec sh -c 'cp "$1" "${1%.backup.*}"' _ {} \;
    exit 1
fi
