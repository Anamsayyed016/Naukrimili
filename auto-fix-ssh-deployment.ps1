# Auto Fix SSH Deployment Script for Windows
# This script automatically fixes SSH authentication for GitHub Actions

Write-Host "🔧 Auto Fix SSH Deployment Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ Please run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Step 1: Generating new SSH key pair..." -ForegroundColor Yellow

# Create .ssh directory if it doesn't exist
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force
}

# Generate new SSH key pair
$keyPath = "$env:USERPROFILE\.ssh\github_deploy"
ssh-keygen -t rsa -b 4096 -f $keyPath -N '""' -C "github-deploy@jobportal" -q

Write-Host "✅ SSH key pair generated successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Step 2: Setting up project directory..." -ForegroundColor Yellow

# Ensure project directory exists
$projectDir = "E:\myprojects\jobportal"
if (-not (Test-Path $projectDir)) {
    New-Item -ItemType Directory -Path $projectDir -Force
}

Set-Location $projectDir

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    Write-Host "📥 Initializing git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/Anamsayyed016/Naukrimili.git
}

Write-Host "✅ Project directory ready!" -ForegroundColor Green

Write-Host ""
Write-Host "🔑 Step 3: SSH Keys Generated" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PUBLIC KEY (add this to VPS authorized_keys):" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow
Get-Content "$keyPath.pub"
Write-Host ""

Write-Host "🔐 PRIVATE KEY (copy this to GitHub SSH_KEY secret):" -ForegroundColor Magenta
Write-Host "----------------------------------------------------" -ForegroundColor Magenta
Get-Content $keyPath
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. SSH into your VPS: ssh root@69.62.73.84" -ForegroundColor White
Write-Host "2. Add the public key: echo '$(Get-Content `"$keyPath.pub`")' >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "3. Set permissions: chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "4. Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions" -ForegroundColor White
Write-Host "5. Update SSH_KEY secret with the private key above" -ForegroundColor White
Write-Host "6. Push changes to trigger deployment" -ForegroundColor White
Write-Host ""

Write-Host "🎉 SSH deployment setup complete!" -ForegroundColor Green
Write-Host "The deployment should work after updating the GitHub secret." -ForegroundColor Green
