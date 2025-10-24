# Ultra-fast server deployment script for Windows
Write-Host "🚀 Starting ultra-fast server deployment..." -ForegroundColor Green

try {
    Write-Host "[STEP 1] Stopping PM2 process..." -ForegroundColor Blue
    pm2 stop jobportal 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "PM2 process not running" -ForegroundColor Yellow }

    Write-Host "[STEP 2] Pulling latest changes..." -ForegroundColor Blue
    git fetch origin
    git reset --hard origin/main
    Write-Host "✅ Git pull completed" -ForegroundColor Green

    Write-Host "[STEP 3] Installing dependencies..." -ForegroundColor Blue
    npm ci --only=production --legacy-peer-deps --silent
    Write-Host "✅ Dependencies installed" -ForegroundColor Green

    Write-Host "[STEP 4] Generating Prisma client..." -ForegroundColor Blue
    npx prisma generate --silent
    Write-Host "✅ Prisma client generated" -ForegroundColor Green

    Write-Host "[STEP 5] Building application (ultra-fast mode)..." -ForegroundColor Blue
    $env:NODE_OPTIONS = "--max-old-space-size=8192"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    npx next build --no-lint --experimental-build-mode=compile
    Write-Host "✅ Build completed" -ForegroundColor Green

    Write-Host "[STEP 6] Starting PM2 process..." -ForegroundColor Blue
    pm2 start ecosystem.optimized.cjs --env production
    Write-Host "✅ PM2 process started" -ForegroundColor Green

    Write-Host "[STEP 7] Verifying deployment..." -ForegroundColor Blue
    Start-Sleep -Seconds 3
    pm2 status

    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your application is running on port 3000" -ForegroundColor Cyan
    Write-Host "📊 Use 'pm2 logs jobportal' to view logs" -ForegroundColor Cyan
    Write-Host "🔧 Use 'pm2 monit' to monitor the application" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
