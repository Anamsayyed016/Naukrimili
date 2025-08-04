# Complete Fix Script for Job Portal
Write-Host "🚀 Complete Job Portal Fix Script" -ForegroundColor Green

# 1. Clean everything
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 2. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# 3. Build project
Write-Host "🏗️ Building project..." -ForegroundColor Yellow
$buildResult = pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 4. Test local server
Write-Host "🌐 Testing local server..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock { Set-Location $args[0]; pnpm dev } -ArgumentList (Get-Location)
Start-Sleep 15

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "✅ Local server working! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Local server not responding yet" -ForegroundColor Yellow
}

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue

# 5. Check deployment status
Write-Host "🚀 Checking deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://69.62.73.84" -TimeoutSec 10
    Write-Host "✅ Production site is live! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Production site not responding - deployment may still be in progress" -ForegroundColor Yellow
    Write-Host "📋 Check GitHub Actions: https://github.com/Anamsayyed016/Naukrimili/actions" -ForegroundColor Cyan
}

Write-Host "🎉 Fix script completed!" -ForegroundColor Green
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "  - Build: Successful ✅" -ForegroundColor White
Write-Host "  - Local Dev: Check http://localhost:3000" -ForegroundColor White  
Write-Host "  - Production: Check http://69.62.73.84" -ForegroundColor White
Write-Host "  - GitHub Actions: https://github.com/Anamsayyed016/Naukrimili/actions" -ForegroundColor White
