# Generate SSH key for GitHub
$sshPath = "$env:USERPROFILE\.ssh"
$keyPath = "$sshPath\id_ed25519"

# Create .ssh directory if it doesn't exist
if (!(Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath -Force | Out-Null
}

Write-Host "Generating SSH key for GitHub..." -ForegroundColor Cyan

# Generate SSH key with empty passphrase
& ssh-keygen -t ed25519 -C "anamsayyed58@gmail.com" -f $keyPath -N """"

if (Test-Path "$keyPath.pub") {
    Write-Host ""
    Write-Host "SUCCESS! SSH key generated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your PUBLIC key (add this to GitHub):" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor DarkGray
    Get-Content "$keyPath.pub"
    Write-Host "============================================" -ForegroundColor DarkGray
    Write-Host ""
    
    # Copy to clipboard
    try {
        Get-Content "$keyPath.pub" | Set-Clipboard
        Write-Host "Public key copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "Could not copy to clipboard" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/settings/ssh/new"
    Write-Host "2. Title: Local Development Machine"
    Write-Host "3. Paste the public key above"
    Write-Host "4. Click 'Add SSH key'"
    Write-Host ""
    Write-Host "Then run these commands:" -ForegroundColor Cyan
    Write-Host "  git remote set-url origin git@github.com:Anamsayyed016/Naukrimili.git"
    Write-Host "  git push origin main"
    
} else {
    Write-Host "Failed to generate SSH key" -ForegroundColor Red
}

