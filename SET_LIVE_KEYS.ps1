# PowerShell script to set Razorpay LIVE keys as environment variables
# Run this on your production server (Windows)

Write-Host "🔴 Setting Razorpay LIVE Keys for Production" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  IMPORTANT: This will process REAL MONEY transactions!" -ForegroundColor Yellow
Write-Host ""

# Prompt for LIVE Key ID
$LIVE_KEY_ID = Read-Host "Enter your Razorpay LIVE Key ID (starts with rzp_live_)"

# Validate key format
if (-not $LIVE_KEY_ID.StartsWith("rzp_live_")) {
    Write-Host "❌ Error: Key ID must start with 'rzp_live_'" -ForegroundColor Red
    exit 1
}

# Prompt for LIVE Key Secret (secure input)
$LIVE_KEY_SECRET = Read-Host "Enter your Razorpay LIVE Key Secret" -AsSecureString
$LIVE_KEY_SECRET_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($LIVE_KEY_SECRET)
)

if ([string]::IsNullOrEmpty($LIVE_KEY_SECRET_PLAIN)) {
    Write-Host "❌ Error: Key Secret cannot be empty" -ForegroundColor Red
    exit 1
}

# Set environment variables (for current session)
[Environment]::SetEnvironmentVariable("RAZORPAY_KEY_ID", $LIVE_KEY_ID, "Process")
[Environment]::SetEnvironmentVariable("RAZORPAY_KEY_SECRET", $LIVE_KEY_SECRET_PLAIN, "Process")

Write-Host ""
Write-Host "✅ Environment variables set for current session" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To make these permanent, add to your .env file or PM2 ecosystem config:" -ForegroundColor Cyan
Write-Host ""
Write-Host "RAZORPAY_KEY_ID=$LIVE_KEY_ID"
Write-Host "RAZORPAY_KEY_SECRET=$LIVE_KEY_SECRET_PLAIN"
Write-Host ""
Write-Host "🔄 After setting, restart your application:" -ForegroundColor Yellow
Write-Host "   pm2 restart naukrimili --update-env"
Write-Host ""

