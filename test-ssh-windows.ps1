# PowerShell script to test SSH connection on Windows
# Replace the placeholders with your actual values

# Configuration - UPDATE THESE VALUES
$SSH_KEY_PATH = ".\test_key"
$SSH_USER = "root"  # Your SSH username
$SSH_HOST = "srv1054971.hstgr.cloud"  # Your server hostname
$SSH_PORT = 22  # Your SSH port (usually 22)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SSH Connection Test for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Save your private key to a file
Write-Host "Step 1: Setting up SSH key..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Paste your private SSH key below (including BEGIN and END lines):"
Write-Host "Press Enter after pasting, then type 'END' on a new line and press Enter again"
Write-Host ""

$keyLines = @()
$line = ""
while ($true) {
    $line = Read-Host
    if ($line -eq "END") {
        break
    }
    $keyLines += $line
}

# Save key to file
$keyContent = $keyLines -join "`n"
$keyContent | Out-File -FilePath $SSH_KEY_PATH -Encoding ASCII -NoNewline

# Set file permissions (Windows equivalent of chmod 600)
$acl = Get-Acl $SSH_KEY_PATH
$acl.SetAccessRuleProtection($true, $false)
$permission = $env:USERNAME, "FullControl", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $SSH_KEY_PATH $acl

Write-Host "✅ SSH key saved to: $SSH_KEY_PATH" -ForegroundColor Green
Write-Host ""

# Step 2: Verify key format
Write-Host "Step 2: Verifying key format..." -ForegroundColor Yellow
$keyContent = Get-Content $SSH_KEY_PATH -Raw

if ($keyContent -notmatch "BEGIN.*PRIVATE") {
    Write-Host "❌ ERROR: SSH key missing BEGIN marker" -ForegroundColor Red
    Write-Host "Key should start with: -----BEGIN ... PRIVATE KEY-----" -ForegroundColor Red
    exit 1
}

if ($keyContent -notmatch "END.*PRIVATE") {
    Write-Host "❌ ERROR: SSH key missing END marker" -ForegroundColor Red
    Write-Host "Key should end with: -----END ... PRIVATE KEY-----" -ForegroundColor Red
    exit 1
}

$keySize = (Get-Item $SSH_KEY_PATH).Length
Write-Host "✅ Key format valid ($keySize bytes)" -ForegroundColor Green
Write-Host ""

# Step 3: Test SSH connection
Write-Host "Step 3: Testing SSH connection..." -ForegroundColor Yellow
Write-Host "Connecting to: $SSH_USER@$SSH_HOST:$SSH_PORT" -ForegroundColor Cyan
Write-Host ""

# Test SSH connection
$sshCommand = "ssh -i `"$SSH_KEY_PATH`" -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SSH_USER@$SSH_HOST `"echo 'Connection successful!'`""

try {
    $result = Invoke-Expression $sshCommand 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH Connection Successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Server Response:" -ForegroundColor Cyan
        Write-Host $result
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ Your SSH key is working correctly!" -ForegroundColor Green
        Write-Host "You can use this key in GitHub Actions secrets." -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH Connection Failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error Output:" -ForegroundColor Red
        Write-Host $result
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. Public key not in server's ~/.ssh/authorized_keys"
        Write-Host "  2. Wrong username, host, or port"
        Write-Host "  3. Server firewall blocking connection"
        Write-Host "  4. SSH key format incorrect"
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "  1. Verify the public key is on the server:"
        Write-Host "     ssh $SSH_USER@$SSH_HOST 'cat ~/.ssh/authorized_keys'"
        Write-Host "  2. Check your GitHub secrets match these values:"
        Write-Host "     SSH_USER = $SSH_USER"
        Write-Host "     HOST = $SSH_HOST"
        Write-Host "     SSH_PORT = $SSH_PORT"
    }
} catch {
    Write-Host "❌ Error executing SSH command" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Cleaning up test key file..." -ForegroundColor Yellow
Remove-Item $SSH_KEY_PATH -Force -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green
