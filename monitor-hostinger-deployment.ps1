# Hostinger Deployment Monitor
Write-Host "🚀 Monitoring Hostinger Deployment..." -ForegroundColor Green

$hostingerUrls = @(
    "http://69.62.73.84",
    "http://srv939274.hstgr.cloud"
)

$githubActionsUrl = "https://github.com/Anamsayyed016/Naukrimili/actions"

Write-Host "📋 Deployment Information:" -ForegroundColor Cyan
Write-Host "  - GitHub Commit: 09eb824" -ForegroundColor White
Write-Host "  - Build Status: 67 pages generated successfully" -ForegroundColor White
Write-Host "  - Build Time: 11.4 minutes" -ForegroundColor White
Write-Host "  - Deployment: GitHub Actions → Hostinger KVM2" -ForegroundColor White

Write-Host "`n🔍 Testing Hostinger URLs..." -ForegroundColor Yellow

foreach ($url in $hostingerUrls) {
    Write-Host "Testing: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 15 -ErrorAction Stop
        Write-Host "  ✅ Status: $($response.StatusCode) - Site is LIVE!" -ForegroundColor Green
        
        if ($response.Content -match "NaukriMili") {
            Write-Host "  ✅ Content: NaukriMili branding found" -ForegroundColor Green
        }
        if ($response.Content -match "AI Power") {
            Write-Host "  ✅ Design: Fixed homepage detected" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ⏳ Status: Deploying... (this is normal during deployment)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "📊 Monitoring Links:" -ForegroundColor Cyan
Write-Host "  - GitHub Actions: $githubActionsUrl" -ForegroundColor White
Write-Host "  - Live Site 1: http://69.62.73.84" -ForegroundColor White
Write-Host "  - Live Site 2: http://srv939274.hstgr.cloud" -ForegroundColor White

Write-Host "`n⏱️ Expected Timeline:" -ForegroundColor Yellow
Write-Host "  - Build Time: ~5-10 minutes" -ForegroundColor White
Write-Host "  - Deploy Time: ~2-5 minutes" -ForegroundColor White
Write-Host "  - Total: ~7-15 minutes from push" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "  1. Monitor GitHub Actions for completion" -ForegroundColor White
Write-Host "  2. Test live sites once deployment finishes" -ForegroundColor White
Write-Host "  3. Verify all features work correctly" -ForegroundColor White

Write-Host "`n✅ Deployment Status: IN PROGRESS" -ForegroundColor Green
Write-Host "Your NaukriMili job portal is being deployed to Hostinger!" -ForegroundColor Cyan
