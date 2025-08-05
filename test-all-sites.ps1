# Quick Site Test Script
Write-Host "🧪 NaukriMili Site Testing Script" -ForegroundColor Green

$urls = @(
    "http://69.62.73.84",
    "http://srv939274.hstgr.cloud",
    "http://localhost:3000"
)

Write-Host "`n🔍 Testing all deployment targets..." -ForegroundColor Yellow

foreach ($url in $urls) {
    Write-Host "`nTesting: $url" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 15 -ErrorAction Stop
        Write-Host "  ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "  📏 Size: $($response.Content.Length) bytes" -ForegroundColor White
        
        # Check for key content
        $checks = @(
            @{ Pattern = "NaukriMili"; Name = "Brand Name" },
            @{ Pattern = "AI Power"; Name = "Hero Text" },
            @{ Pattern = "Browse Jobs"; Name = "CTA Button" },
            @{ Pattern = "bg-gradient"; Name = "Styling" }
        )
        
        foreach ($check in $checks) {
            if ($response.Content -match $check.Pattern) {
                Write-Host "  ✅ $($check.Name): Found" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ $($check.Name): Missing" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "  - If localhost works: Development is ready" -ForegroundColor White
Write-Host "  - If Hostinger works: Production is live" -ForegroundColor White
Write-Host "  - If both work: Full deployment success!" -ForegroundColor White

Write-Host "`n🎯 Next actions based on results:" -ForegroundColor Yellow
Write-Host "  - All working: Proceed to feature testing" -ForegroundColor White
Write-Host "  - Partial: Wait for deployment completion" -ForegroundColor White
Write-Host "  - None working: Check GitHub Actions for errors" -ForegroundColor White
