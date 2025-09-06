# SSH Deployment Fix Script for Windows
# This script generates a new SSH key pair and provides setup instructions

Write-Host "🔧 SSH Deployment Fix Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if OpenSSH is available
if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
    Write-Host "❌ OpenSSH not found. Please install OpenSSH or use Git Bash." -ForegroundColor Red
    Write-Host "Download from: https://github.com/PowerShell/Win32-OpenSSH/releases" -ForegroundColor Yellow
    exit 1
}

# Generate new SSH key pair
Write-Host "📝 Generating new SSH key pair..." -ForegroundColor Yellow
$keyPath = "$env:USERPROFILE\.ssh\jobportal_deploy"

# Create .ssh directory if it doesn't exist
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force
}

# Generate SSH key
ssh-keygen -t rsa -b 4096 -f $keyPath -N '""' -C "jobportal-deploy@github"

Write-Host ""
Write-Host "✅ SSH key pair generated successfully!" -ForegroundColor Green
Write-Host ""

# Display public key
Write-Host "📋 PUBLIC KEY (copy this to your VPS ~/.ssh/authorized_keys):" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Get-Content "$keyPath.pub"
Write-Host ""

# Display private key
Write-Host "🔐 PRIVATE KEY (copy this to GitHub SSH_KEY secret):" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
Get-Content $keyPath
Write-Host ""

Write-Host "📋 SETUP INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add the PUBLIC KEY to your VPS:" -ForegroundColor White
Write-Host "   ssh root@69.62.73.84" -ForegroundColor Gray
Write-Host "   echo '$(Get-Content "$keyPath.pub")' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update GitHub Secrets:" -ForegroundColor White
Write-Host "   Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   Update these secrets:" -ForegroundColor Gray
Write-Host "   - HOST: 69.62.73.84" -ForegroundColor Gray
Write-Host "   - SSH_USER: root" -ForegroundColor Gray
Write-Host "   - SSH_KEY: [Copy the entire private key above]" -ForegroundColor Gray
Write-Host "   - SSH_PORT: 22" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test SSH connection:" -ForegroundColor White
Write-Host "   ssh -i $keyPath root@69.62.73.84" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Push changes to trigger deployment:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Fix SSH deployment authentication'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Setup complete! The deployment should work now." -ForegroundColor Green
