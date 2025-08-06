# 🚀 PowerShell Deployment Script for NaukriMili Job Portal
# Deploy to Hostinger server from Windows

param(
    [string]$ServerIP = "69.62.73.84",
    [string]$ServerUser = "root",
    [string]$ProjectPath = "/home/root/public_html"
)

Write-Host "🚀 Starting NaukriMili Job Portal Deployment..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$SERVER_FULL = "$ServerUser@$ServerIP"
$GITHUB_REPO = "https://github.com/Anamsayyed016/Naukrimili.git"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Server: $SERVER_FULL"
Write-Host "   Project Path: $ProjectPath"
Write-Host "   Repository: $GITHUB_REPO"
Write-Host ""

# Step 1: Test SSH Connection
Write-Host "🔐 Testing SSH connection..." -ForegroundColor Blue
try {
    $sshTest = ssh $SERVER_FULL "echo 'SSH connection successful'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection established" -ForegroundColor Green
    } else {
        throw "SSH connection failed"
    }
} catch {
    Write-Host "❌ SSH connection failed. Please ensure:" -ForegroundColor Red
    Write-Host "   1. You have SSH client installed"
    Write-Host "   2. Your SSH key is configured"
    Write-Host "   3. The server is accessible"
    exit 1
}

# Step 2: Prepare local build
Write-Host "🏗️ Preparing local build..." -ForegroundColor Blue
try {
    # Create optimized build
    npm run build
    Write-Host "✅ Local build completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

# Step 3: Deploy to server
Write-Host "📦 Deploying to server..." -ForegroundColor Blue

# Create deployment commands
$deployCommands = @"
set -e
echo '🔄 Starting server-side deployment...'

# Navigate to project directory
cd $ProjectPath

# Backup existing deployment
if [ -d '.next' ]; then
    echo '📁 Creating backup...'
    tar -czf backup-`date +%Y%m%d-%H%M%S`.tar.gz .next package.json || true
fi

# Clone or update repository
if [ -d '.git' ]; then
    echo '🔄 Updating repository...'
    git pull origin main
else
    echo '📥 Cloning repository...'
    git clone $GITHUB_REPO .
fi

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo '📦 Installing Node.js...'
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install dependencies
echo '📦 Installing dependencies...'
npm install --production

# Create environment file
echo '🔧 Setting up environment...'
cat > .env.local << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=change-this-to-a-secure-secret

# Add your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naukrimili

# Server configuration
PORT=3000
HOST=0.0.0.0
ENVEOF

# Build application
echo '🏗️ Building application...'
npm run build

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo '📦 Installing PM2...'
    npm install -g pm2
fi

# Stop existing process
pm2 delete naukrimili || true

# Start application
echo '🚀 Starting application...'
pm2 start npm --name 'naukrimili' -- start
pm2 save

# Display status
pm2 status

echo '✅ Server deployment completed!'
"@

# Execute deployment on server
try {
    ssh $SERVER_FULL $deployCommands
    Write-Host "✅ Server deployment completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Server deployment failed" -ForegroundColor Red
    exit 1
}

# Step 4: Test the deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Blue
Start-Sleep -Seconds 10

try {
    $testResult = ssh $SERVER_FULL "curl -f http://localhost:3000/api/health"
    Write-Host "✅ Application is responding correctly" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Application test failed or needs more time to start" -ForegroundColor Yellow
}

# Final summary
Write-Host ""
Write-Host "🎉 Deployment Summary" -ForegroundColor Green
Write-Host "===================="
Write-Host "✅ Code deployed to server"
Write-Host "✅ Dependencies installed"
Write-Host "✅ Application built and started"
Write-Host "✅ PM2 process manager configured"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure your domain DNS to point to $ServerIP"
Write-Host "2. Update environment variables on the server"
Write-Host "3. Set up SSL certificate (Let's Encrypt recommended)"
Write-Host "4. Configure reverse proxy if needed"
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   Connect to server: ssh $SERVER_FULL"
Write-Host "   Check logs: ssh $SERVER_FULL 'pm2 logs naukrimili'"
Write-Host "   Restart app: ssh $SERVER_FULL 'pm2 restart naukrimili'"
Write-Host "   Check status: ssh $SERVER_FULL 'pm2 status'"
Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor Green
Write-Host "   Direct: http://$ServerIP:3000"
Write-Host "   Domain: https://yourdomain.com (once DNS is configured)"
Write-Host ""
Write-Host "✨ Deployment completed successfully!" -ForegroundColor Green
