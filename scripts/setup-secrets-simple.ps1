# Simple GitHub Secrets Setup Script
Write-Host "GitHub Secrets Setup" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
    Write-Host "GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI not found. Please install it from: https://cli.github.com/" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
    Write-Host "2. Click Settings > Secrets and variables > Actions" -ForegroundColor White
    Write-Host "3. Add these secrets:" -ForegroundColor White
    Write-Host "   - HOST: Your VPS IP or domain" -ForegroundColor White
    Write-Host "   - SSH_USER: root or ubuntu" -ForegroundColor White
    Write-Host "   - SSH_KEY: Your private SSH key content" -ForegroundColor White
    Write-Host "   - SSH_PORT: 22" -ForegroundColor White
    exit 1
}

# Get repository info
$repo = gh repo view --json nameWithOwner -q .nameWithOwner
Write-Host "Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Get secrets from user
Write-Host "Enter your deployment secrets:" -ForegroundColor Yellow
Write-Host ""

$HOST = Read-Host "VPS server IP or domain"
if ($HOST) {
    echo $HOST | gh secret set HOST
    Write-Host "HOST secret set" -ForegroundColor Green
}

$SSH_USER = Read-Host "SSH username (root or ubuntu)"
if ($SSH_USER) {
    echo $SSH_USER | gh secret set SSH_USER
    Write-Host "SSH_USER secret set" -ForegroundColor Green
}

$SSH_PORT = Read-Host "SSH port (default: 22)"
if (-not $SSH_PORT) {
    $SSH_PORT = "22"
}
echo $SSH_PORT | gh secret set SSH_PORT
Write-Host "SSH_PORT secret set" -ForegroundColor Green

Write-Host ""
Write-Host "For SSH_KEY, provide your private key file path:" -ForegroundColor Yellow
$keyPath = Read-Host "Path to private SSH key file"
if (Test-Path $keyPath) {
    $SSH_KEY = Get-Content $keyPath -Raw
    echo $SSH_KEY | gh secret set SSH_KEY
    Write-Host "SSH_KEY secret set" -ForegroundColor Green
} else {
    Write-Host "SSH key file not found: $keyPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Setup completed! You can now run your deployment workflow." -ForegroundColor Green
