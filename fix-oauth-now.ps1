# OAuth Fix Script
Write-Host "🔧 Fixing Google OAuth redirect_uri_mismatch error..." -ForegroundColor Green

Write-Host "`n1. First, let's check your current configuration:" -ForegroundColor Yellow
Write-Host "Current GOOGLE_CLIENT_ID: 464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm.apps.googleusercontent.com"
Write-Host "Current NEXTAUTH_URL: http://localhost:3000"

Write-Host "`n2. Now opening Google Cloud Console for you..." -ForegroundColor Yellow
$clientId = "464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm"
$consoleUrl = "https://console.cloud.google.com/apis/credentials/oauthclient/$clientId"

Write-Host "Opening: $consoleUrl" -ForegroundColor Cyan
Start-Process $consoleUrl

Write-Host "`n3. In the Google Cloud Console, do the following:" -ForegroundColor Yellow
Write-Host "   ✅ Add these Authorized redirect URIs:"
Write-Host "      http://localhost:3000/api/auth/callback/google"
Write-Host "      http://127.0.0.1:3000/api/auth/callback/google"
Write-Host "`n   ✅ Add these Authorized JavaScript origins:"
Write-Host "      http://localhost:3000"
Write-Host "      http://127.0.0.1:3000"
Write-Host "`n   ✅ Click SAVE and wait 2-3 minutes for changes to propagate"

Write-Host "`n4. Press any key after you've updated Google Cloud Console..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n5. Testing your setup..." -ForegroundColor Yellow
Write-Host "Navigate to: http://localhost:3000/auth/login"
Write-Host "and try the Google login again."

Write-Host "`nOAuth should now work correctly!" -ForegroundColor Green
