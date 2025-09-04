# Server Deployment and Database Cleanup Script for Windows/PowerShell
# This script deploys the application and cleans the database

Write-Host "🚀 Starting server deployment and database cleanup..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if environment variables are set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  Warning: DATABASE_URL not set. Make sure your .env file is configured." -ForegroundColor Yellow
}

Write-Host "✅ Building application..." -ForegroundColor Green
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Application built successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build error: $_" -ForegroundColor Red
    exit 1
}

# Ask for confirmation before database cleanup
Write-Host ""
Write-Host "⚠️  WARNING: This will delete ALL data from the database!" -ForegroundColor Red
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Database cleanup cancelled." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cleaning database..." -ForegroundColor Green
try {
    node scripts/server-reset-database.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database cleaned successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database cleanup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Database cleanup error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Starting production server..." -ForegroundColor Green
try {
    npm run start
} catch {
    Write-Host "❌ Server start error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
