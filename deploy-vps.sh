#!/bin/bash
# Quick VPS deployment for aftionix.in
VPS_IP="69.62.73.84"
DOMAIN="aftionix.in"

echo "🚀 Deploying to VPS: $VPS_IP"

# Build locally
npm run build

# Upload to VPS
scp -r .next/* root@$VPS_IP:/var/www/aftionix.in/
scp package.json root@$VPS_IP:/var/www/aftionix.in/
scp .env.production root@$VPS_IP:/var/www/aftionix.in/

# SSH and setup
ssh root@$VPS_IP << 'EOF'
cd /var/www/aftionix.in
npm install --production
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup

# Nginx config
cat > /etc/nginx/sites-available/aftionix.in << 'NGINX'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    root /var/www/aftionix.in;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL with Let's Encrypt
apt update && apt install -y certbot python3-certbot-nginx
certbot --nginx -d aftionix.in -d www.aftionix.in --non-interactive

echo "✅ Deployment complete! Visit: https://aftionix.in"
EOF