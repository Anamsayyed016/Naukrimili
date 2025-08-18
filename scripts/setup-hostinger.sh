#!/bin/bash

echo "🚀 Setting up Hostinger VPS for job portal deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📥 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo "📥 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📥 Installing Nginx..."
apt install -y nginx

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p /home/root/jobportal
cd /home/root/jobportal

# Clone repository (if not exists)
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/Anamsayyed016/Naukrimili.git .
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Configure PM2
echo "⚙️ Configuring PM2..."
pm2 start npm --name "jobportal" -- start
pm2 save
pm2 startup

# Configure Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/aftionix.in << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
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
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ Hostinger VPS setup completed!"
echo "🌐 Your website will be accessible at: https://aftionix.in"
echo "📋 Next steps:"
echo "1. Add SSH_KEY secret to GitHub repository"
echo "2. Push changes to trigger deployment"
echo "3. Configure SSL certificate in Hostinger panel"
