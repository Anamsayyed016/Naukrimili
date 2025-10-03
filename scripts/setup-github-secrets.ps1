# GitHub Secrets Setup Script
# This script helps you set up the required secrets for GitHub Actions deployment

Write-Host "🔐 GitHub Secrets Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: You can set secrets manually in GitHub web interface:" -ForegroundColor Yellow
    Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
    Write-Host "2. Click Settings > Secrets and variables > Actions" -ForegroundColor White
    Write-Host "3. Click 'New repository secret' for each required secret" -ForegroundColor White
    Write-Host ""
    Write-Host "Required secrets:" -ForegroundColor Yellow
    Write-Host "- HOST: Your VPS server IP or domain" -ForegroundColor White
    Write-Host "- SSH_USER: Username for SSH connection (usually 'root' or 'ubuntu')" -ForegroundColor White
    Write-Host "- SSH_KEY: Your private SSH key (the entire content of your private key file)" -ForegroundColor White
    Write-Host "- SSH_PORT: SSH port (usually 22)" -ForegroundColor White
    exit 1
}

Write-Host "✅ GitHub CLI is installed" -ForegroundColor Green
Write-Host ""

# Get repository information
$repo = gh repo view --json nameWithOwner -q .nameWithOwner
Write-Host "📁 Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Function to set a secret
function Set-GitHubSecret {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Value
    )
    
    Write-Host "Setting $Name..." -ForegroundColor Yellow
    try {
        echo $Value | gh secret set $Name
        Write-Host "✅ $Name set successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to set $Name: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Get secrets from user
Write-Host "Please provide your deployment secrets:" -ForegroundColor Yellow
Write-Host ""

# HOST
$HOST = Read-Host "Enter your VPS server IP or domain (e.g., 192.168.1.100 or myserver.com)"
if ($HOST) {
    Set-GitHubSecret -Name "HOST" -Description "VPS server address" -Value $HOST
}

# SSH_USER
$SSH_USER = Read-Host "Enter SSH username (usually 'root' or 'ubuntu')"
if ($SSH_USER) {
    Set-GitHubSecret -Name "SSH_USER" -Description "SSH username" -Value $SSH_USER
}

# SSH_PORT
$SSH_PORT = Read-Host "Enter SSH port (usually 22)"
if (-not $SSH_PORT) {
    $SSH_PORT = "22"
}
Set-GitHubSecret -Name "SSH_PORT" -Description "SSH port" -Value $SSH_PORT

# SSH_KEY
Write-Host ""
Write-Host "For SSH_KEY, you need to provide your private SSH key." -ForegroundColor Yellow
Write-Host "This is usually found in ~/.ssh/id_rsa or ~/.ssh/id_ed25519" -ForegroundColor White
Write-Host ""

$keyPath = Read-Host "Enter path to your private SSH key file (e.g., C:\Users\YourName\.ssh\id_rsa)"
if (Test-Path $keyPath) {
    $SSH_KEY = Get-Content $keyPath -Raw
    Set-GitHubSecret -Name "SSH_KEY" -Description "SSH private key" -Value $SSH_KEY
} else {
    Write-Host "❌ SSH key file not found at: $keyPath" -ForegroundColor Red
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 GitHub secrets setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run your deployment workflow." -ForegroundColor Cyan
Write-Host "Go to your repository on GitHub > Actions > Production Deployment > Run workflow" -ForegroundColor White
