$keyId = "rzp_test_RmJIe9drDBjHeC"
$keySecret = "m4cVgW16U4Plei3gFa1YP2hR"
$envPath = ".env.local"

Write-Host "Adding Razorpay credentials to .env.local..." -ForegroundColor Green

$newContent = @"
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=$keyId
RAZORPAY_KEY_SECRET=$keySecret
"@

if (Test-Path $envPath) {
    $existing = Get-Content $envPath | Where-Object { 
        $_ -notmatch "^RAZORPAY_KEY_ID=" -and `
        $_ -notmatch "^RAZORPAY_KEY_SECRET=" -and `
        $_ -notmatch "^# Razorpay"
    }
    $content = $existing + $newContent
} else {
    $content = $newContent
}

$content | Set-Content -Path $envPath -Force

Write-Host "Done! Razorpay credentials added." -ForegroundColor Green
Write-Host "Key ID: $keyId" -ForegroundColor Cyan
Write-Host "Restart your dev server with: npm run dev" -ForegroundColor Yellow

