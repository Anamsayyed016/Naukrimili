# 🔍 Google OAuth & Gemini API Verification Script (PowerShell)
# This script checks if the keys are properly loaded and working

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 Google OAuth & Gemini API Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check 1: PM2 Status
Write-Host "📊 Step 1: Checking PM2 Status..." -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────"
pm2 describe naukrimili | Select-String -Pattern "status|uptime|restarts"
Write-Host ""

# Check 2: Check Environment Variables in .env
Write-Host "🔑 Step 2: Verifying Keys in .env File..." -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────"

$envContent = Get-Content .env -ErrorAction SilentlyContinue

if ($envContent -match "GOOGLE_CLIENT_ID=") {
    Write-Host "✅ GOOGLE_CLIENT_ID found in .env" -ForegroundColor Green
} else {
    Write-Host "❌ GOOGLE_CLIENT_ID not found in .env" -ForegroundColor Red
}

if ($envContent -match "GOOGLE_CLIENT_SECRET=") {
    Write-Host "✅ GOOGLE_CLIENT_SECRET found in .env" -ForegroundColor Green
} else {
    Write-Host "❌ GOOGLE_CLIENT_SECRET not found in .env" -ForegroundColor Red
}

if ($envContent -match "GEMINI_API_KEY=") {
    Write-Host "✅ GEMINI_API_KEY found in .env" -ForegroundColor Green
} else {
    Write-Host "❌ GEMINI_API_KEY not found in .env" -ForegroundColor Red
}
Write-Host ""

# Check 3: Check PM2 Logs for Initialization Messages
Write-Host "📝 Step 3: Checking PM2 Logs for Initialization..." -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────"
Write-Host ""

Write-Host "🔍 Checking for Google OAuth initialization..."
$logs = pm2 logs naukrimili --lines 200 --nostream 2>&1 | Out-String

if ($logs -match "Google OAuth provider configured successfully") {
    Write-Host "✅ Google OAuth provider configured successfully" -ForegroundColor Green
    $logs -split "`n" | Select-String "Google OAuth" | Select-Object -Last 3
} else {
    Write-Host "❌ Google OAuth initialization message not found" -ForegroundColor Red
    Write-Host "   Looking for warnings..."
    $logs -split "`n" | Select-String -Pattern "google" -SimpleMatch | Select-Object -Last 5
}
Write-Host ""

Write-Host "🔍 Checking for Gemini API initialization..."
if ($logs -match "Gemini client initialized") {
    Write-Host "✅ Gemini client initialized" -ForegroundColor Green
    $logs -split "`n" | Select-String "Gemini" | Select-Object -Last 3
} else {
    Write-Host "❌ Gemini initialization message not found" -ForegroundColor Red
    Write-Host "   Looking for warnings..."
    $logs -split "`n" | Select-String -Pattern "gemini" -SimpleMatch | Select-Object -Last 5
}
Write-Host ""

# Check 4: Test API Endpoints
Write-Host "🌐 Step 4: Testing API Endpoints..." -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────"

Write-Host "Testing /api/auth/providers..."
try {
    $providersResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/providers" -Method Get -TimeoutSec 5
    if ($providersResponse.google) {
        Write-Host "✅ Google OAuth provider available via API" -ForegroundColor Green
        Write-Host "   Provider: $($providersResponse.google.name)"
    } else {
        Write-Host "❌ Google OAuth provider NOT available via API" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to connect to API endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}
Write-Host ""

# Check 5: Recent Logs (Last 30 lines)
Write-Host "📋 Step 5: Recent Server Logs (Last 30 lines)..." -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────"
$recentLogs = pm2 logs naukrimili --lines 30 --nostream 2>&1 | Out-String
$recentLogs -split "`n" | Select-String -Pattern "NextAuth|Google|Gemini|OAuth|Error|Warning"
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$checksPassed = 0
$totalChecks = 4

# Check Google OAuth
if ($logs -match "Google OAuth provider configured successfully") {
    $checksPassed++
    Write-Host "✅ Google OAuth Configuration: WORKING" -ForegroundColor Green
} else {
    Write-Host "❌ Google OAuth Configuration: NOT DETECTED" -ForegroundColor Red
}

# Check Gemini
if ($logs -match "Gemini client initialized") {
    $checksPassed++
    Write-Host "✅ Gemini API Configuration: WORKING" -ForegroundColor Green
} else {
    Write-Host "❌ Gemini API Configuration: NOT DETECTED" -ForegroundColor Red
}

# Check API endpoint
try {
    $providersTest = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/providers" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($providersTest.google) {
        $checksPassed++
        Write-Host "✅ OAuth API Endpoint: RESPONDING" -ForegroundColor Green
    } else {
        Write-Host "❌ OAuth API Endpoint: NOT RESPONDING" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ OAuth API Endpoint: NOT RESPONDING" -ForegroundColor Red
}

# Check PM2 status
$pm2Status = pm2 describe naukrimili 2>&1 | Out-String
if ($pm2Status -match "online") {
    $checksPassed++
    Write-Host "✅ PM2 Server Status: ONLINE" -ForegroundColor Green
} else {
    Write-Host "❌ PM2 Server Status: OFFLINE" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Result: $checksPassed/$totalChecks checks passed" -ForegroundColor $(if ($checksPassed -eq $totalChecks) { "Green" } else { "Yellow" })
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($checksPassed -eq $totalChecks) {
    Write-Host "🎉 SUCCESS! All systems are working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Visit https://naukrimili.com/auth/signin"
    Write-Host "  2. Click 'Sign in with Google'"
    Write-Host "  3. Test resume upload with AI parsing"
} else {
    Write-Host "⚠️  Some checks failed. Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Check if .env file is in the correct location"
    Write-Host "  2. Restart PM2: pm2 restart naukrimili"
    Write-Host "  3. View full logs: pm2 logs naukrimili"
    Write-Host "  4. Check for errors: pm2 logs naukrimili --err"
}

Write-Host ""

