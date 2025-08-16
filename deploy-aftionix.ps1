# PowerShell Deployment Script for aftionix.in Job Portal
# This script will deploy your job portal to production on Windows

param(
    [string]$Environment = "production",
    [string]$Domain = "aftionix.in"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$ProjectDir = "C:\inetpub\wwwroot\aftionix.in"
$BackupDir = "C:\backups\aftionix.in"
$LogFile = "C:\logs\aftionix-deploy.log"

# Create necessary directories
New-Item -ItemType Directory -Force -Path $ProjectDir | Out-Null
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path "C:\logs" | Out-Null

# Create log file
New-Item -ItemType File -Force -Path $LogFile | Out-Null

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Error handling function
function Write-ErrorLog {
    param([string]$Message)
    Write-Log $Message "ERROR"
    throw $Message
}

try {
    Write-Log "🚀 Starting deployment for $Domain job portal..."

    # Check prerequisites
    Write-Log "Checking prerequisites..."

    # Check if Node.js is installed
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-ErrorLog "Node.js is not installed. Please install Node.js 18+ first."
    }

    # Check if npm is installed
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-ErrorLog "npm is not installed. Please install npm first."
    }

    # Check if PM2 is installed
    if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
        Write-Log "Installing PM2 globally..."
        npm install -g pm2
    }

    # Backup existing deployment
    if (Test-Path "$ProjectDir\current") {
        Write-Log "Creating backup of existing deployment..."
        $BackupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Path "$ProjectDir\current" -Destination "$BackupDir\$BackupName" -Recurse
        Write-Log "Backup created: $BackupDir\$BackupName"
    }

    # Navigate to project directory
    Set-Location $ProjectDir

    # Clone or pull latest code
    if (Test-Path ".git") {
        Write-Log "Pulling latest changes..."
        git pull origin main
    } else {
        Write-Log "Cloning repository..."
        git clone https://github.com/yourusername/jobportal.git .
    }

    # Install dependencies
    Write-Log "Installing dependencies..."
    npm ci --production

    # Build the application
    Write-Log "Building the application..."
    npm run build

    # Create production environment file
    Write-Log "Creating production environment file..."
    @"
# Production Environment for $Domain
NODE_ENV=production
NEXTAUTH_URL=https://$Domain
NEXT_PUBLIC_BASE_URL=https://$Domain
NEXT_PUBLIC_DOMAIN=$Domain
NEXT_PUBLIC_SITE_NAME=Aftionix Job Portal

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth Configuration
NEXTAUTH_SECRET="your-production-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Security
JWT_SECRET="your-production-jwt-secret-here"
ENCRYPTION_KEY="your-production-encryption-key-here"

# Performance
ENABLE_LOGGING=true
LOG_LEVEL="warn"
NEXT_TELEMETRY_DISABLED=1
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

    # Create PM2 ecosystem file
    Write-Log "Creating PM2 ecosystem file..."
    @"
module.exports = {
  apps: [{
    name: 'aftionix-jobportal',
    script: 'npm',
    args: 'start',
    cwd: '$ProjectDir',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'C:\\logs\\aftionix-error.log',
    out_file: 'C:\\logs\\aftionix-out.log',
    log_file: 'C:\\logs\\aftionix-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
"@ | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8

    # Start or restart the application
    Write-Log "Starting the application with PM2..."
    $pm2Status = pm2 list | Select-String "aftionix-jobportal"
    
    if ($pm2Status) {
        Write-Log "Restarting existing application..."
        pm2 restart aftionix-jobportal
    } else {
        Write-Log "Starting new application..."
        pm2 start ecosystem.config.js
    }

    # Save PM2 configuration
    pm2 save

    # Setup PM2 startup script
    pm2 startup

    # Create IIS configuration
    Write-Log "Creating IIS configuration..."
    
    # Create web.config file
    @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{CACHE_URL}" pattern="^(.*)" />
                    </conditions>
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
            <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
        </staticContent>
        <httpProtocol>
            <customHeaders>
                <add name="X-Frame-Options" value="DENY" />
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-XSS-Protection" value="1; mode=block" />
                <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
"@ | Out-File -FilePath "web.config" -Encoding UTF8

    # Create health check script
    Write-Log "Creating health check script..."
    @"
# Health check script for $Domain
$HealthUrl = "https://$Domain/health"
$LogFile = "C:\logs\aftionix-health.log"

try {
    $Response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 30
    if ($Response.StatusCode -eq 200) {
        $Message = "$(Get-Date): Health check passed"
        Add-Content -Path $LogFile -Value $Message
        exit 0
    } else {
        $Message = "$(Get-Date): Health check failed - Status: $($Response.StatusCode)"
        Add-Content -Path $LogFile -Value $Message
        pm2 restart aftionix-jobportal
        exit 1
    }
} catch {
    $Message = "$(Get-Date): Health check failed - Error: $($_.Exception.Message)"
    Add-Content -Path $LogFile -Value $Message
    pm2 restart aftionix-jobportal
    exit 1
}
"@ | Out-File -FilePath "C:\Scripts\health-check-aftionix.ps1" -Encoding UTF8

    # Create health check scheduled task
    Write-Log "Setting up health check scheduled task..."
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\health-check-aftionix.ps1"
    $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    $Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -Description "Health check for aftionix.in job portal"
    
    Register-ScheduledTask -TaskName "AftionixHealthCheck" -InputObject $Task -User "SYSTEM" -Force

    # Final status check
    Write-Log "Performing final status check..."
    Start-Sleep -Seconds 5

    try {
        $HealthResponse = Invoke-WebRequest -Uri "https://$Domain/health" -UseBasicParsing -TimeoutSec 30
        if ($HealthResponse.StatusCode -eq 200) {
            Write-Log "✅ Deployment completed successfully!"
            Write-Log "🌐 Your job portal is now live at: https://$Domain"
            Write-Log "📊 PM2 Status:"
            pm2 status
            Write-Log "📝 Logs are available at: $LogFile"
        } else {
            Write-ErrorLog "❌ Deployment failed! Health check returned status: $($HealthResponse.StatusCode)"
        }
    } catch {
        Write-ErrorLog "❌ Deployment failed! Health check failed with error: $($_.Exception.Message)"
    }

    Write-Host ""
    Write-Host "🎉 Deployment Summary:" -ForegroundColor Green
    Write-Host "Domain: https://$Domain" -ForegroundColor Yellow
    Write-Host "Project Directory: $ProjectDir" -ForegroundColor Yellow
    Write-Host "Backup Directory: $BackupDir" -ForegroundColor Yellow
    Write-Host "Log File: $LogFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update your DNS records to point to this server" -ForegroundColor White
    Write-Host "2. Test all job portal features" -ForegroundColor White
    Write-Host "3. Monitor performance and logs" -ForegroundColor White
    Write-Host "4. Set up monitoring and alerts" -ForegroundColor White

} catch {
    Write-ErrorLog "Deployment failed: $($_.Exception.Message)"
    exit 1
}
