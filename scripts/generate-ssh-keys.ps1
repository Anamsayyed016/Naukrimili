# SSH Key Generation Script
# This script helps you generate SSH keys for GitHub Actions deployment

Write-Host "🔑 SSH Key Generation Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSH is available
if (!(Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
    Write-Host "❌ OpenSSH is not available on this system." -ForegroundColor Red
    Write-Host "Please install OpenSSH or use WSL/Git Bash to generate SSH keys." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use Git Bash or WSL:" -ForegroundColor Yellow
    Write-Host "ssh-keygen -t ed25519 -C 'github-actions-deploy'" -ForegroundColor White
    Write-Host "ssh-keygen -t rsa -b 4096 -C 'github-actions-deploy'" -ForegroundColor White
    exit 1
}

Write-Host "✅ OpenSSH is available" -ForegroundColor Green
Write-Host ""

# Get key type
Write-Host "Choose key type:" -ForegroundColor Yellow
Write-Host "1. ED25519 (recommended, more secure)" -ForegroundColor White
Write-Host "2. RSA 4096 (widely supported)" -ForegroundColor White
Write-Host ""
$keyType = Read-Host "Enter choice (1 or 2)"

# Get key name
$keyName = Read-Host "Enter key name (default: github_actions_deploy)"
if (-not $keyName) {
    $keyName = "github_actions_deploy"
}

# Get key directory
$keyDir = Read-Host "Enter directory to save keys (default: $env:USERPROFILE\.ssh)"
if (-not $keyDir) {
    $keyDir = "$env:USERPROFILE\.ssh"
}

# Create directory if it doesn't exist
if (!(Test-Path $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir -Force
    Write-Host "✅ Created directory: $keyDir" -ForegroundColor Green
}

$privateKeyPath = Join-Path $keyDir "$keyName"
$publicKeyPath = Join-Path $keyDir "$keyName.pub"

# Generate key based on type
if ($keyType -eq "1") {
    Write-Host "Generating ED25519 key..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f $privateKeyPath -N '""'
} else {
    Write-Host "Generating RSA 4096 key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f $privateKeyPath -N '""'
}

if (Test-Path $privateKeyPath) {
    Write-Host "✅ SSH keys generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Private key: $privateKeyPath" -ForegroundColor Cyan
    Write-Host "📁 Public key: $publicKeyPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Display public key
    Write-Host "🔑 Your public key (copy this to your VPS authorized_keys):" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Get-Content $publicKeyPath
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Display private key
    Write-Host "🔐 Your private key (copy this to GitHub SSH_KEY secret):" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Get-Content $privateKeyPath
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the public key above to your VPS ~/.ssh/authorized_keys file" -ForegroundColor White
    Write-Host "2. Copy the private key above to GitHub repository secrets as SSH_KEY" -ForegroundColor White
    Write-Host "3. Set up other GitHub secrets (HOST, SSH_USER, SSH_PORT)" -ForegroundColor White
    Write-Host "4. Run the deployment workflow" -ForegroundColor White
    
} else {
    Write-Host "❌ Failed to generate SSH keys" -ForegroundColor Red
}
