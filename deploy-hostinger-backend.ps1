# PowerShell Script to Deploy Job Portal Backend to Hostinger KVM 2
# Run this script to automate the deployment process

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath = ""
)

# Colors for output
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Validate parameters
if (-not $ServerIP -or -not $Username -or -not $Domain) {
    Write-Error "Missing required parameters"
    Write-Host "Usage: .\deploy-hostinger-backend.ps1 -ServerIP 'your.server.ip' -Username 'username' -Domain 'your-domain.com' [-SSHKeyPath 'path/to/key']"
    exit 1
}

Write-Info "🚀 Starting Job Portal Backend Deployment to Hostinger KVM 2"
Write-Info "Server: $ServerIP"
Write-Info "User: $Username"
Write-Info "Domain: $Domain"
Write-Host ""

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH is not available. Please install OpenSSH or use WSL."
    Write-Info "Install OpenSSH: Settings > Apps > Optional Features > Add OpenSSH Client"
    exit 1
}

# Check if SCP is available
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error "SCP is not available. Please install OpenSSH."
    exit 1
}

# Build SSH connection string
$sshConnection = "$Username@$ServerIP"
$sshOptions = "-o StrictHostKeyChecking=no"

if ($SSHKeyPath) {
    if (Test-Path $SSHKeyPath) {
        $sshOptions += " -i `"$SSHKeyPath`""
        Write-Info "Using SSH key: $SSHKeyPath"
    } else {
        Write-Error "SSH key not found: $SSHKeyPath"
        exit 1
    }
}

Write-Info "📋 Testing SSH connection..."
$testConnection = ssh $sshOptions.Split(' ') $sshConnection "echo 'Connection successful'"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to connect to server. Please check your credentials."
    exit 1
}
Write-Success "SSH connection successful"

# Create temporary deployment directory
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
Write-Info "Created temporary directory: $tempDir"

try {
    # Step 1: Copy backend files
    Write-Info "📁 Preparing backend files..."
    
    # Copy backend directory
    if (Test-Path ".\backend") {
        Copy-Item -Path ".\backend" -Destination $tempDir -Recurse
        Write-Success "Backend files copied to temporary directory"
    } else {
        Write-Error "Backend directory not found. Please run this script from the project root."
        exit 1
    }
    
    # Copy deployment script
    if (Test-Path ".\deploy-hostinger-backend.sh") {
        Copy-Item -Path ".\deploy-hostinger-backend.sh" -Destination $tempDir
        Write-Success "Deployment script copied"
    } else {
        Write-Error "Deployment script not found: deploy-hostinger-backend.sh"
        exit 1
    }
    
    # Step 2: Upload files to server
    Write-Info "📤 Uploading files to server..."
    
    # Create project directory on server
    ssh $sshOptions.Split(' ') $sshConnection "mkdir -p ~/jobportal-backend"
    
    # Upload backend files
    Write-Info "Uploading backend directory..."
    scp -r $sshOptions.Split(' ') "$tempDir\backend" "${sshConnection}:~/jobportal-backend/"
    
    # Upload deployment script
    Write-Info "Uploading deployment script..."
    scp $sshOptions.Split(' ') "$tempDir\deploy-hostinger-backend.sh" "${sshConnection}:~/jobportal-backend/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Files uploaded successfully"
    } else {
        Write-Error "Failed to upload files"
        exit 1
    }
    
    # Step 3: Make deployment script executable and run it
    Write-Info "🔧 Making deployment script executable..."
    ssh $sshOptions.Split(' ') $sshConnection "chmod +x ~/jobportal-backend/deploy-hostinger-backend.sh"
    
    Write-Info "🚀 Running deployment script on server..."
    Write-Warning "This may take several minutes. Please wait..."
    
    # Modify deployment script with domain
    ssh $sshOptions.Split(' ') $sshConnection "sed -i 's/your-domain.com/$Domain/g' ~/jobportal-backend/deploy-hostinger-backend.sh"
    
    # Run deployment script
    ssh $sshOptions.Split(' ') $sshConnection "cd ~/jobportal-backend && ./deploy-hostinger-backend.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment script executed successfully"
    } else {
        Write-Warning "Deployment script completed with warnings. Please check the output above."
    }
    
    # Step 4: Start the backend service
    Write-Info "🔧 Starting backend service..."
    ssh $sshOptions.Split(' ') $sshConnection "sudo systemctl start jobportal-backend"
    
    # Check service status
    Write-Info "📊 Checking service status..."
    ssh $sshOptions.Split(' ') $sshConnection "sudo systemctl status jobportal-backend --no-pager -l"
    
    # Step 5: Test the API
    Write-Info "🧪 Testing API endpoint..."
    Start-Sleep -Seconds 5  # Wait for service to start
    
    ssh $sshOptions.Split(' ') $sshConnection "curl -f http://localhost:8000/health || echo 'API test failed - service may still be starting'"
    
    # Step 6: Display final instructions
    Write-Success "🎉 Backend deployment completed!"
    Write-Host ""
    Write-Info "📋 Next Steps:"
    Write-Host "1. Install SSL certificate on server:"
    Write-Host "   ssh $sshConnection 'sudo certbot --nginx -d $Domain -d www.$Domain'"
    Write-Host ""
    Write-Host "2. Update your frontend .env.local:"
    Write-Host "   NEXT_PUBLIC_API_URL=https://$Domain"
    Write-Host ""
    Write-Host "3. Test your API:"
    Write-Host "   https://$Domain/health"
    Write-Host "   https://$Domain/api/jobs/search?q=developer"
    Write-Host ""
    Write-Info "🔧 Server Management Commands:"
    Write-Host "- Connect to server: ssh $sshConnection"
    Write-Host "- Check backend status: sudo systemctl status jobportal-backend"
    Write-Host "- View backend logs: sudo journalctl -u jobportal-backend -f"
    Write-Host "- Restart backend: sudo systemctl restart jobportal-backend"
    Write-Host "- Check NGINX status: sudo systemctl status nginx"
    Write-Host ""
    Write-Info "🌐 Your API will be available at:"
    Write-Host "- Health check: https://$Domain/health"
    Write-Host "- Job search: https://$Domain/api/jobs/search"
    Write-Host "- Documentation: https://$Domain/docs"
    Write-Host ""
    Write-Warning "⚠️  Important Security Steps:"
    Write-Host "1. SSH to server and run: sudo mysql_secure_installation"
    Write-Host "2. Change database password in ~/jobportal-backend/backend/.env"
    Write-Host "3. Configure firewall: sudo ufw enable && sudo ufw allow 22,80,443/tcp"
    Write-Host "4. Set up regular backups for your database"
    Write-Host ""
    Write-Success "✅ Deployment completed successfully!"

} catch {
    Write-Error "Deployment failed: $_"
    exit 1
} finally {
    # Cleanup temporary directory
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
        Write-Info "Cleaned up temporary directory"
    }
}

Write-Host ""
Write-Info "📞 Need help? Check the deployment logs on your server:"
Write-Host "ssh $sshConnection 'sudo journalctl -u jobportal-backend -f'"
