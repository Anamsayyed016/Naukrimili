# Deep Server Debug Script for Job Portal (PowerShell Version)
# Run this on your local machine to prepare, then run the Linux script on server

Write-Host "🔍 DEEP SERVER DEBUG SCRIPT (PowerShell)" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

# Step 1: Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Not in project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ In project root directory" -ForegroundColor Green

# Step 2: Clean local build
Write-Host "🧹 Cleaning local build..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }

# Step 3: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Step 4: Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Step 5: Build application
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

npm run build

# Step 6: Check build output
Write-Host "🔍 Checking build output..." -ForegroundColor Yellow
if (Test-Path ".next/server/middleware-manifest.json") {
    Write-Host "✅ middleware-manifest.json found" -ForegroundColor Green
} else {
    Write-Host "❌ middleware-manifest.json missing" -ForegroundColor Red
}

if (Test-Path ".next/required-server-files.json") {
    Write-Host "✅ required-server-files.json found" -ForegroundColor Green
} else {
    Write-Host "❌ required-server-files.json missing" -ForegroundColor Red
}

Write-Host "📋 Build files in .next/server/:" -ForegroundColor Yellow
Get-ChildItem ".next/server/" | Select-Object Name, Length | Format-Table

Write-Host "✅ Local preparation complete!" -ForegroundColor Green
Write-Host "Now run these commands on your server:" -ForegroundColor Cyan
Write-Host "1. cd /var/www/jobportal" -ForegroundColor White
Write-Host "2. chmod +x scripts/deep-server-debug.sh" -ForegroundColor White
Write-Host "3. ./scripts/deep-server-debug.sh" -ForegroundColor White