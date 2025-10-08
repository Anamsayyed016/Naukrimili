# Generate SSH key for GitHub
$sshPath = "$env:USERPROFILE\.ssh"
$keyPath = "$sshPath\id_ed25519"

# Create .ssh directory if it doesn't exist
if (!(Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath -Force | Out-Null
}

# Generate SSH key
Write-Host "🔑 Generating SSH key for GitHub..." -ForegroundColor Cyan

# Use an empty string for passphrase (press Enter when prompted)
$process = Start-Process -FilePath "ssh-keygen" -ArgumentList "-t ed25519 -C anamsayyed58@gmail.com -f `"$keyPath`" -N `"`"" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "✅ SSH key generated successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Display the public key
    Write-Host "📋 Your PUBLIC key (add this to GitHub):" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Get-Content "$keyPath.pub"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Copy to clipboard if possible
    try {
        Get-Content "$keyPath.pub" | Set-Clipboard
        Write-Host "✅ Public key copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not copy to clipboard automatically" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/settings/ssh/new" -ForegroundColor White
    Write-Host "2. Title: Local Development Machine" -ForegroundColor White
    Write-Host "3. Paste the public key above" -ForegroundColor White
    Write-Host "4. Click Add SSH key" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Then run: git remote set-url origin git@github.com:Anamsayyed016/Naukrimili.git" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
}

