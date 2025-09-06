# Simple SSH Fix Script for Windows
Write-Host "🔧 SSH Deployment Fix Script" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Create .ssh directory if it doesn't exist
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force
}

# Generate new SSH key pair
$keyPath = "$env:USERPROFILE\.ssh\github_deploy"
Write-Host "📝 Generating SSH key pair..." -ForegroundColor Yellow
ssh-keygen -t rsa -b 4096 -f $keyPath -N '""' -C "github-deploy@jobportal" -q

Write-Host "✅ SSH key pair generated!" -ForegroundColor Green

Write-Host ""
Write-Host "🔑 SSH Keys Generated" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PUBLIC KEY (add this to VPS):" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow
Get-Content "$keyPath.pub"
Write-Host ""

Write-Host "🔐 PRIVATE KEY (copy to GitHub SSH_KEY secret):" -ForegroundColor Magenta
Write-Host "----------------------------------------------" -ForegroundColor Magenta
Get-Content $keyPath
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. SSH into VPS: ssh root@69.62.73.84" -ForegroundColor White
Write-Host "2. Add public key to authorized_keys" -ForegroundColor White
Write-Host "3. Update GitHub SSH_KEY secret with private key above" -ForegroundColor White
Write-Host "4. Test deployment" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Setup complete!" -ForegroundColor Green
