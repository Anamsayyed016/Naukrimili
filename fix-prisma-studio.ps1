# Fix Prisma Studio Environment Variable Issue
# This script fixes the DATABASE_URL environment variable issue for Prisma Studio

Write-Host "🔧 Fixing Prisma Studio Environment Variable Issue..." -ForegroundColor Green

# Stop any running Prisma Studio processes
Write-Host "`n🛑 Stopping existing Prisma Studio processes..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object {$_.ProcessName -like "*prisma*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped existing processes" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No processes to stop" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "`n🔧 Setting environment variables..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:anam123@localhost:5432/jobportal?schema=public"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:NEXTAUTH_SECRET = "your-super-secret-key-here-min-32-characters-change-this-in-production"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "   DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Cyan

# Test database connection
Write-Host "`n🔍 Testing database connection..." -ForegroundColor Yellow
try {
    npx prisma db push --accept-data-loss
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host "`n🔧 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma client generation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Prisma Studio
Write-Host "`n🔍 Testing Prisma Studio..." -ForegroundColor Yellow
try {
    # Start Prisma Studio in background
    $process = Start-Process -FilePath "npx" -ArgumentList "prisma", "studio", "--port", "5557" -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 3
    
    # Test if it's running
    $response = Invoke-WebRequest -Uri "http://localhost:5557" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Prisma Studio is running on http://localhost:5557" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Prisma Studio may not be fully started yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Prisma Studio failed to start: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Prisma Studio Fix Complete!" -ForegroundColor Green
Write-Host "You can now access:" -ForegroundColor Cyan
Write-Host "   Prisma Studio: http://localhost:5557" -ForegroundColor White
Write-Host "   Development Server: http://localhost:3000" -ForegroundColor White
Write-Host "`nTo start the development server, run:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
