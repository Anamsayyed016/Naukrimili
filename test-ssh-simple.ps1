# Simple PowerShell script to test SSH connection
# Quick version - just paste your key and test

param(
    [string]$SSH_USER = "root",
    [string]$SSH_HOST = "srv1054971.hstgr.cloud",
    [int]$SSH_PORT = 22
)

Write-Host "SSH Connection Test" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  User: $SSH_USER"
Write-Host "  Host: $SSH_HOST"
Write-Host "  Port: $SSH_PORT"
Write-Host ""

# Get SSH key from user
Write-Host "Paste your private SSH key (the one from GitHub secret SSH_KEY):" -ForegroundColor Yellow
Write-Host "Press Enter after pasting, then type 'DONE' on a new line" -ForegroundColor Yellow
Write-Host ""

$keyLines = @()
while ($true) {
    $line = Read-Host
    if ($line -eq "DONE") { break }
    $keyLines += $line
}

$keyContent = $keyLines -join "`n"
$keyFile = ".\test_key_$(Get-Date -Format 'yyyyMMddHHmmss').tmp"

# Save key
$keyContent | Out-File -FilePath $keyFile -Encoding ASCII -NoNewline

# Set permissions (Windows)
$acl = Get-Acl $keyFile
$acl.SetAccessRuleProtection($true, $false)
$permission = $env:USERNAME, "FullControl", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $keyFile $acl

Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow

# Test SSH
$sshArgs = @(
    "-i", "`"$keyFile`"",
    "-p", $SSH_PORT,
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=10",
    "$SSH_USER@$SSH_HOST",
    "echo 'SSH connection works!'"
)

$result = & ssh $sshArgs 2>&1
$exitCode = $LASTEXITCODE

# Cleanup
Remove-Item $keyFile -Force -ErrorAction SilentlyContinue

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! SSH connection works!" -ForegroundColor Green
    Write-Host $result -ForegroundColor Green
    Write-Host ""
    Write-Host "Your SSH key is valid and can connect to the server." -ForegroundColor Green
    Write-Host "Make sure this exact key is in your GitHub secret SSH_KEY." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ FAILED! SSH connection failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Ensure public key is in server's ~/.ssh/authorized_keys"
    Write-Host "  2. Verify SSH_USER, HOST, and SSH_PORT are correct"
    Write-Host "  3. Check server firewall allows your IP"
}
