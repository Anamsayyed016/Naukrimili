# Final Server Deployment Script (PowerShell)
# This script deploys the fully working application to the server

Write-Host "🚀 Starting Final Server Deployment..." -ForegroundColor Blue

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Blue
Write-Host "📦 Node.js version: $(node --version)" -ForegroundColor Blue
Write-Host "📦 npm version: $(npm --version)" -ForegroundColor Blue

# Step 1: Pull latest changes
Write-Host "📥 Pulling latest changes from repository..." -ForegroundColor Yellow
git pull origin main

# Step 2: Stop PM2 processes
Write-Host "🛑 Stopping PM2 processes..." -ForegroundColor Yellow
pm2 stop all 2>$null
pm2 delete all 2>$null

# Step 3: Clean everything
Write-Host "🧹 Cleaning previous builds and caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .npm -ErrorAction SilentlyContinue

# Step 4: Create proper .npmrc
Write-Host "⚙️ Creating .npmrc for engine compatibility..." -ForegroundColor Yellow
@"
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
"@ | Out-File -FilePath ".npmrc" -Encoding UTF8

# Step 5: Install dependencies with force
Write-Host "📦 Installing dependencies with engine bypass..." -ForegroundColor Yellow
npm install --legacy-peer-deps --engine-strict=false --force

# Step 6: Install missing packages explicitly
Write-Host "📦 Installing missing packages..." -ForegroundColor Yellow
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 7: Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Step 8: Build the application
Write-Host "🏗️ Building Next.js application..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_PUBLIC_BUILD_TIME = "$(Get-Date -UFormat %s)000"
npx next build

# Step 9: Start PM2
Write-Host "🚀 Starting PM2 with the built application..." -ForegroundColor Yellow
pm2 start npm --name "jobportal" -- start

# Step 10: Restart Nginx (if available)
Write-Host "🔄 Restarting Nginx..." -ForegroundColor Yellow
try {
    systemctl restart nginx
    Write-Host "✅ Nginx restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Nginx restart failed or not available" -ForegroundColor Yellow
}

# Step 11: Check status
Write-Host "🔍 Checking deployment status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check PM2 status
$pm2Status = pm2 list
if ($pm2Status -match "jobportal.*online") {
    Write-Host "✅ PM2 process is running" -ForegroundColor Green
} else {
    Write-Host "❌ PM2 process failed to start" -ForegroundColor Red
    pm2 logs jobportal --lines 20
    exit 1
}

# Check if the application is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is responding on localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Application responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Application may not be responding yet, checking logs..." -ForegroundColor Yellow
    pm2 logs jobportal --lines 10
}

Write-Host "🎉 Final Server Deployment Complete!" -ForegroundColor Green
Write-Host "📊 PM2 Status:" -ForegroundColor Blue
pm2 list
Write-Host "📊 Nginx Status:" -ForegroundColor Blue
try {
    systemctl status nginx --no-pager -l
} catch {
    Write-Host "Nginx status not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 If you encounter any issues, check:" -ForegroundColor Blue
Write-Host "1. PM2 logs: pm2 logs jobportal" -ForegroundColor White
Write-Host "2. Nginx logs: journalctl -u nginx -f" -ForegroundColor White
Write-Host "3. Application logs: pm2 logs jobportal --lines 50" -ForegroundColor White
