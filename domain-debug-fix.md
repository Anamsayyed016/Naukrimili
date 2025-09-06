# Domain Connection Timeout Fix - aftionix.in

## Issue: ERR_CONNECTION_TIMED_OUT
Your domain `aftionix.in` is not properly connected to your server `69.62.73.84`.

## Step 1: Check Domain DNS Configuration

### Check Current DNS Settings
```bash
# Check if domain resolves to your server IP
nslookup aftionix.in
dig aftionix.in
ping aftionix.in
```

### Expected Result
Domain should resolve to `69.62.73.84`

## Step 2: Fix DNS Configuration

### Option A: Update DNS Records in Hostinger
1. **Log into Hostinger Control Panel**
2. **Go to Domain Management**
3. **Select aftionix.in**
4. **Go to DNS Zone Editor**
5. **Update these records:**

```
Type: A
Name: @
Value: 69.62.73.84
TTL: 14400

Type: A  
Name: www
Value: 69.62.73.84
TTL: 14400
```

### Option B: Check if domain is pointing to wrong server
```bash
# Check what IP the domain currently points to
dig +short aftionix.in
nslookup aftionix.in
```

## Step 3: Fix Nginx Configuration

### Check Current Nginx Config
```bash
# Check nginx configuration
nginx -t
cat /etc/nginx/sites-available/default
cat /etc/nginx/sites-enabled/default
```

### Create Proper Domain Configuration
```bash
# Create new nginx config for aftionix.in
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
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
        
        # Shorter timeout for health checks
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## Step 4: Test Server Connectivity

### Test if server is accessible
```bash
# Test if port 80 is open
netstat -tlnp | grep :80

# Test if nginx is listening
ss -tlnp | grep :80

# Test local connection
curl -I http://localhost:3000
curl -I http://aftionix.in
```

### Test from external
```bash
# Test if domain resolves
curl -I http://aftionix.in
wget --spider http://aftionix.in
```

## Step 5: Check Firewall Settings

### Check if ports are blocked
```bash
# Check firewall status
ufw status
iptables -L

# Check if port 80 is open
telnet aftionix.in 80
```

### Open required ports
```bash
# Open HTTP and HTTPS ports
ufw allow 80
ufw allow 443
ufw reload
```

## Step 6: Verify Everything Works

### Final verification commands
```bash
# Check PM2 status
pm2 status

# Check nginx status
systemctl status nginx

# Test local connection
curl http://localhost:3000/api/health

# Test domain connection
curl http://aftionix.in/api/health

# Check nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Quick Fix Commands (Run these on your server)

```bash
# 1. Create nginx config for aftionix.in
cat > /etc/nginx/sites-available/aftionix.in << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. Enable the site
ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/

# 3. Test and reload nginx
nginx -t && systemctl reload nginx

# 4. Check status
pm2 status
curl http://aftionix.in/api/health
```

## Expected Results
- ✅ Domain should resolve to 69.62.73.84
- ✅ Nginx should serve aftionix.in on port 80
- ✅ Requests should be proxied to localhost:3000
- ✅ Website should load without timeout errors

