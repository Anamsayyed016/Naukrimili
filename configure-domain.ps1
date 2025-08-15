# Domain Configuration Script for Hostinger + GoDaddy
# Run this on your local Windows machine

Write-Host "🌐 Domain Configuration Script for Hostinger + GoDaddy" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Get server information
Write-Host "📋 Server Information:" -ForegroundColor Yellow
try {
    $serverIP = Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing | Select-Object -ExpandProperty Content
    Write-Host "Server IP: $serverIP" -ForegroundColor Green
} catch {
    Write-Host "Could not get server IP" -ForegroundColor Red
}

Write-Host ""

# Check if domain is configured
$domainName = Read-Host "Enter your domain name (e.g., yourdomain.com)"

if ([string]::IsNullOrEmpty($domainName)) {
    Write-Host "❌ Domain name is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Configuration Steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ GO TO GODADDY:" -ForegroundColor Green
Write-Host "   - Login to godaddy.com" -ForegroundColor White
Write-Host "   - Go to My Products → Your Domain → DNS" -ForegroundColor White
Write-Host "   - Change Nameservers to Hostinger:" -ForegroundColor White
Write-Host "     ns1.hostinger.com" -ForegroundColor Cyan
Write-Host "     ns2.hostinger.com" -ForegroundColor Cyan
Write-Host "     ns3.hostinger.com" -ForegroundColor Cyan
Write-Host "     ns4.hostinger.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣ GO TO HOSTINGER:" -ForegroundColor Green
Write-Host "   - Login to hostinger.com" -ForegroundColor White
Write-Host "   - Go to Websites → Manage → Add Website" -ForegroundColor White
Write-Host "   - Enter domain: $domainName" -ForegroundColor White
Write-Host "   - Select 'Use existing hosting'" -ForegroundColor White
Write-Host "   - Point to: /var/www/jobportal" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ UPDATE ENVIRONMENT:" -ForegroundColor Green
Write-Host "   - Create .env.local file with:" -ForegroundColor White
Write-Host "     NEXT_PUBLIC_BASE_URL=https://$domainName" -ForegroundColor Cyan
Write-Host "     NEXT_PUBLIC_DOMAIN=$domainName" -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣ BUILD AND DEPLOY:" -ForegroundColor Green
Write-Host "   - Run: npm run build" -ForegroundColor White
Write-Host "   - Restart service: systemctl restart jobportal" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣ TEST CONNECTION:" -ForegroundColor Green
Write-Host "   - Wait 24-48 hours for DNS propagation" -ForegroundColor White
Write-Host "   - Test: https://$domainName" -ForegroundColor White
Write-Host ""

Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host "📧 Need help? Check Hostinger support or GoDaddy support" -ForegroundColor Yellow

# Open relevant websites
$openGoDaddy = Read-Host "Open GoDaddy in browser? (y/n)"
if ($openGoDaddy -eq 'y' -or $openGoDaddy -eq 'Y') {
    Start-Process "https://godaddy.com"
}

$openHostinger = Read-Host "Open Hostinger in browser? (y/n)"
if ($openHostinger -eq 'y' -or $openHostinger -eq 'Y') {
    Start-Process "https://hostinger.com"
}
