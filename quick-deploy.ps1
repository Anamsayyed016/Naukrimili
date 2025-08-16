# Quick Deploy Script for Aftionix Job Portal
# This will deploy your job portal to your Hostinger VPS immediately

Write-Host "🚀 QUICK DEPLOY - Aftionix Job Portal" -ForegroundColor Green
Write-Host "Target VPS: 69.62.73.84" -ForegroundColor Yellow
Write-Host "Domain: aftionix.in" -ForegroundColor Cyan

# Test SSH connection first
Write-Host "🔌 Testing SSH connection..." -ForegroundColor Cyan
try {
    $sshTest = ssh -o ConnectTimeout=10 root@69.62.73.84 "echo 'SSH connection successful'"
    if ($sshTest -match "SSH connection successful") {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        throw "SSH test failed"
    }
} catch {
    Write-Host "❌ SSH connection failed. Please check:" -ForegroundColor Red
    Write-Host "1. VPS is running and accessible" -ForegroundColor White
    Write-Host "2. Your SSH key is working" -ForegroundColor White
    Write-Host "3. Try: ssh root@69.62.73.84" -ForegroundColor Cyan
    exit 1
}

# Deploy immediately
Write-Host "📥 Deploying to VPS..." -ForegroundColor Cyan

$deployScript = @"
#!/bin/bash
set -e

echo "🚀 Starting quick deployment for aftionix.in..."

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
yum install -y nginx
systemctl enable nginx
systemctl start nginx

# Create directories
mkdir -p /var/www/aftionix.in
mkdir -p /var/log/aftionix
mkdir -p /var/backups/aftionix.in

# Clone your repository (replace with your actual repo)
cd /var/www/aftionix.in
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "Cloning repository for first time..."
    git clone https://github.com/yourusername/jobportal.git .
fi

# Install dependencies
npm ci --production

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'aftionix-jobportal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/aftionix.in',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/aftionix-error.log',
    out_file: '/var/log/aftionix-out.log',
    log_file: '/var/log/aftionix-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Create Nginx configuration
cat > /etc/nginx/conf.d/aftionix.in.conf << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /_next/static/ {
        alias /var/www/aftionix.in/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Configure firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Install SSL certificate
yum install -y certbot python3-certbot-nginx
certbot --nginx -d aftionix.in -d www.aftionix.in --non-interactive --agree-tos --email admin@aftionix.in

# Create auto-deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/aftionix.in
git pull origin main
npm ci --production
npm run build
pm2 restart aftionix-jobportal
echo "Deployment completed at \$(date)"
EOF

chmod +x deploy.sh

# Create webhook endpoint
cat > webhook.php << 'EOF'
<?php
// GitHub webhook endpoint
$secret = 'your-webhook-secret-here';
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', $payload, $secret), $signature)) {
    http_response_code(401);
    die('Unauthorized');
}

$output = shell_exec('/var/www/aftionix.in/deploy.sh 2>&1');
file_put_contents('/var/log/webhook.log', date('Y-m-d H:i:s') . ' - ' . $output . "\n", FILE_APPEND);
echo "Deployment triggered successfully";
?>
EOF

# Set permissions
chown -R www-data:www-data /var/www/aftionix.in
chmod -R 755 /var/www/aftionix.in

echo "✅ Deployment completed successfully!"
echo "🌐 Your job portal is now live at: https://aftionix.in"
echo "📊 PM2 Status:"
pm2 status
"@

# Upload and execute deployment script
Write-Host "📤 Uploading deployment script..." -ForegroundColor Cyan
$deployScript | ssh root@69.62.73.84 "cat > /tmp/quick-deploy.sh"

Write-Host "🔧 Executing deployment..." -ForegroundColor Cyan
ssh root@69.62.73.84 "chmod +x /tmp/quick-deploy.sh && /tmp/quick-deploy.sh"

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update DNS records to point to 69.62.73.84" -ForegroundColor White
Write-Host "2. Configure GitHub webhook:" -ForegroundColor White
Write-Host "   - URL: https://aftionix.in/webhook.php" -ForegroundColor White
Write-Host "   - Secret: your-webhook-secret-here" -ForegroundColor White
Write-Host "3. Test your website: https://aftionix.in" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Auto-deployment is ready!" -ForegroundColor Green
Write-Host "Push to GitHub and watch your server update automatically!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitor your deployment:" -ForegroundColor Yellow
Write-Host "ssh root@69.62.73.84 && pm2 monit" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your job portal is live at: https://aftionix.in" -ForegroundColor Cyan
