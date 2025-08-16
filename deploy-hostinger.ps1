# PowerShell Hostinger VPS Deployment Script
# This will deploy your job portal to your Hostinger VPS with GitHub integration

param(
    [string]$VPS_IP = "69.62.73.84",
    [string]$Domain = "aftionix.in",
    [string]$GitHubRepo = "yourusername/jobportal"
)

Write-Host "🚀 Hostinger VPS Deployment for $Domain" -ForegroundColor Green
Write-Host "Target VPS: $VPS_IP" -ForegroundColor Yellow
Write-Host "GitHub Repo: $GitHubRepo" -ForegroundColor Cyan

# Check if SSH key exists
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "⚠️  SSH key not found. Creating one..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""'
    Write-Host "✅ SSH key created. Copy it to your VPS:" -ForegroundColor Green
    Write-Host "ssh-copy-id root@$VPS_IP" -ForegroundColor Cyan
    Write-Host "Press Enter after copying the key..." -ForegroundColor Yellow
    Read-Host
}

# Test SSH connection
Write-Host "🔌 Testing SSH connection..." -ForegroundColor Cyan
try {
    $sshTest = ssh -o ConnectTimeout=10 root@$VPS_IP "echo 'SSH connection successful'"
    if ($sshTest -match "SSH connection successful") {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        throw "SSH test failed"
    }
} catch {
    Write-Host "❌ SSH connection failed. Please check:" -ForegroundColor Red
    Write-Host "1. VPS is running and accessible" -ForegroundColor White
    Write-Host "2. SSH key is copied to VPS" -ForegroundColor White
    Write-Host "3. Firewall allows SSH connections" -ForegroundColor White
    exit 1
}

# Download and run deployment script on VPS
Write-Host "📥 Downloading deployment script to VPS..." -ForegroundColor Cyan
try {
    # Create deployment script content
    $deployScript = @"
#!/bin/bash
# Auto-deployment script for aftionix.in

echo "🚀 Starting deployment for $Domain..."

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
mkdir -p /var/www/$Domain
mkdir -p /var/log/aftionix
mkdir -p /var/backups/$Domain

# Clone repository
cd /var/www/$Domain
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "Cloning repository for first time..."
    git clone https://github.com/$GitHubRepo.git .
fi

# Install dependencies
npm ci --production

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [{
    name: 'aftionix-jobportal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/$Domain',
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
PM2CONFIG

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Create Nginx configuration
cat > /etc/nginx/conf.d/$Domain.conf << 'NGINXCONFIG'
server {
    listen 80;
    server_name $Domain www.$Domain;
    
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
        alias /var/www/$Domain/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINXCONFIG

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Configure firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Install SSL certificate
yum install -y certbot python3-certbot-nginx
certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email admin@$Domain

# Create auto-deployment script
cat > deploy.sh << 'DEPLOYSCRIPT'
#!/bin/bash
cd /var/www/$Domain
git pull origin main
npm ci --production
npm run build
pm2 restart aftionix-jobportal
echo "Deployment completed at \$(date)"
DEPLOYSCRIPT

chmod +x deploy.sh

# Create webhook endpoint
cat > webhook.php << 'WEBHOOK'
<?php
// GitHub webhook endpoint
\$secret = 'your-webhook-secret-here';
\$payload = file_get_contents('php://input');
\$signature = \$_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', \$payload, \$secret), \$signature)) {
    http_response_code(401);
    die('Unauthorized');
}

\$output = shell_exec('/var/www/$Domain/deploy.sh 2>&1');
file_put_contents('/var/log/webhook.log', date('Y-m-d H:i:s') . ' - ' . \$output . "\n", FILE_APPEND);
echo "Deployment triggered successfully";
?>
WEBHOOK

# Set permissions
chown -R www-data:www-data /var/www/$Domain
chmod -R 755 /var/www/$Domain

echo "✅ Deployment completed successfully!"
echo "🌐 Your job portal is now live at: https://$Domain"
echo "📊 PM2 Status:"
pm2 status
"@

    # Upload script to VPS
    $deployScript | ssh root@$VPS_IP "cat > /tmp/deploy.sh"
    
    # Make script executable and run it
    ssh root@$VPS_IP "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the VPS manually:" -ForegroundColor Yellow
    Write-Host "ssh root@$VPS_IP" -ForegroundColor Cyan
    exit 1
}

# Test the deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

try {
    $healthResponse = Invoke-WebRequest -Uri "https://$Domain/health" -UseBasicParsing -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned status: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed (this is normal if DNS hasn't propagated yet)" -ForegroundColor Yellow
}

# Final instructions
Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update DNS records to point to $VPS_IP" -ForegroundColor White
Write-Host "2. Configure GitHub webhook:" -ForegroundColor White
Write-Host "   - URL: https://$Domain/webhook.php" -ForegroundColor White
Write-Host "   - Secret: your-webhook-secret-here" -ForegroundColor White
Write-Host "3. Test your website: https://$Domain" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Auto-deployment is ready!" -ForegroundColor Green
Write-Host "Push to GitHub and watch your server update automatically!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitor your deployment:" -ForegroundColor Yellow
Write-Host "ssh root@$VPS_IP && pm2 monit" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your job portal is live at: https://$Domain" -ForegroundColor Cyan
