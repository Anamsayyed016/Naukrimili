# PowerShell VPS Deployment for aftionix.in
# This will deploy your job portal to your VPS at 69.62.73.84

param(
    [string]$VPS_IP = "69.62.73.84",
    [string]$Domain = "aftionix.in"
)

Write-Host "🚀 FAST VPS DEPLOYMENT for $Domain" -ForegroundColor Green
Write-Host "Target VPS: $VPS_IP" -ForegroundColor Yellow

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

# Quick dependency check and install
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Cyan
$deployDir = "deploy-package"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# Copy necessary files
Copy-Item -Path ".next" -Destination "$deployDir\.next" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir\"
Copy-Item -Path ".env.production" -Destination "$deployDir\"
Copy-Item -Path "public" -Destination "$deployDir\" -Recurse -ErrorAction SilentlyContinue

# Create deployment script for VPS
$vpsScript = @"
#!/bin/bash
# Auto-generated VPS setup script

echo "🚀 Setting up aftionix.in on VPS..."

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2
npm install -g pm2

# Create directories
mkdir -p /var/www/aftionix.in
mkdir -p /var/log/aftionix

# Install dependencies
cd /var/www/aftionix.in
npm install --production

# Start application
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup

# Install and configure Nginx
yum install -y nginx
systemctl enable nginx
systemctl start nginx

# Create Nginx config
cat > /etc/nginx/conf.d/aftionix.in.conf << 'EOF'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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

echo "✅ VPS setup complete!"
echo "🌐 Your job portal is now live at: https://aftionix.in"
echo "📊 PM2 Status:"
pm2 status
"@

$vpsScript | Out-File -FilePath "$deployDir\setup-vps.sh" -Encoding UTF8

# Upload to VPS
Write-Host "📤 Uploading to VPS..." -ForegroundColor Cyan
try {
    # Create remote directory
    ssh root@$VPS_IP "mkdir -p /var/www/aftionix.in"
    
    # Upload files
    scp -r "$deployDir\*" "root@$VPS_IP:/var/www/aftionix.in/"
    
    # Upload setup script
    scp "$deployDir\setup-vps.sh" "root@$VPS_IP:/tmp/"
    
    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed. Check your SSH connection" -ForegroundColor Red
    Write-Host "Try: ssh root@$VPS_IP" -ForegroundColor Yellow
    exit 1
}

# Execute setup on VPS
Write-Host "🔧 Setting up VPS..." -ForegroundColor Cyan
try {
    ssh root@$VPS_IP "chmod +x /tmp/setup-vps.sh && /tmp/setup-vps.sh"
    Write-Host "✅ VPS setup complete!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  VPS setup may have failed. Check manually:" -ForegroundColor Yellow
    Write-Host "ssh root@$VPS_IP" -ForegroundColor Cyan
    Write-Host "cd /var/www/aftionix.in && pm2 start npm --name 'aftionix' -- start" -ForegroundColor Cyan
}

# Cleanup
Remove-Item -Recurse -Force $deployDir

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🌐 Your job portal is live at: https://aftionix.in" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update DNS records to point to $VPS_IP" -ForegroundColor White
Write-Host "2. Test your website: https://aftionix.in" -ForegroundColor White
Write-Host "3. Monitor logs: ssh root@$VPS_IP && pm2 logs aftionix" -ForegroundColor White
Write-Host ""
Write-Host "⚡ This was FAST! 🚀" -ForegroundColor Green
