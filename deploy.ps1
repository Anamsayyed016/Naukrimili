# Job Portal Deployment Script for Windows
# Usage: .\deploy.ps1 [start|stop|restart|deploy|status|logs|update]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "deploy", "update", "status", "logs", "health", "cleanup")]
    [string]$Action = "help"
)

# Configuration
$APP_NAME = "jobportal"
$APP_DIR = "E:\myprojects\jobportal"
$REPO_URL = "https://github.com/Anamsayyed016/Naukrimili.git"
$BRANCH = "main"
$PM2_CONFIG = "ecosystem.config.cjs"
$LOG_DIR = "E:\logs\jobportal"
$NODE_VERSION = "18"

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Check if PM2 is installed
function Test-PM2 {
    try {
        pm2 --version | Out-Null
        return $true
    }
    catch {
        Write-Log "Installing PM2 globally..."
        npm install -g pm2
        return $true
    }
}

# Check if Node.js is installed
function Test-Node {
    try {
        $nodeVersion = node --version
        Write-Info "Node.js version: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js $NODE_VERSION or later"
        exit 1
    }
}

# Create necessary directories
function New-Directories {
    Write-Log "Creating necessary directories..."
    if (!(Test-Path $LOG_DIR)) {
        New-Item -ItemType Directory -Path $LOG_DIR -Force
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Log "Installing dependencies..."
    Set-Location $APP_DIR
    npm ci --production
}

# Build the application
function Build-App {
    Write-Log "Building the application..."
    Set-Location $APP_DIR
    npm run build
}

# Start the application
function Start-App {
    Write-Log "Starting $APP_NAME..."
    Test-PM2
    Set-Location $APP_DIR
    
    if (Test-Path $PM2_CONFIG) {
        pm2 start $PM2_CONFIG --env production
    }
    else {
        pm2 start server.js --name $APP_NAME --env production
    }
    
    pm2 save
    Write-Log "Application started successfully"
}

# Stop the application
function Stop-App {
    Write-Log "Stopping $APP_NAME..."
    pm2 stop $APP_NAME -ErrorAction SilentlyContinue
    pm2 delete $APP_NAME -ErrorAction SilentlyContinue
    Write-Log "Application stopped"
}

# Restart the application
function Restart-App {
    Write-Log "Restarting $APP_NAME..."
    pm2 restart $APP_NAME -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Start-App
    }
    Write-Log "Application restarted"
}

# Deploy the application
function Deploy-App {
    Write-Log "Starting deployment process..."
    
    # Backup current version
    if (Test-Path $APP_DIR) {
        Write-Log "Creating backup..."
        $backupDir = "${APP_DIR}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $APP_DIR -Destination $backupDir -Recurse -ErrorAction SilentlyContinue
    }
    
    # Install dependencies and build
    Install-Dependencies
    Build-App
    
    # Restart application
    Restart-App
    
    Write-Log "Deployment completed successfully"
}

# Show application status
function Show-Status {
    Write-Log "Application Status:"
    pm2 status $APP_NAME -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Log "System Resources:"
    Write-Host "Memory Usage:"
    Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*pm2*"} | Select-Object ProcessName, WorkingSet, CPU | Format-Table
}

# Show logs
function Show-Logs {
    Write-Log "Showing application logs (Press Ctrl+C to exit):"
    pm2 logs $APP_NAME --lines 100
}

# Update application
function Update-App {
    Write-Log "Updating application..."
    Stop-App
    Deploy-App
}

# Health check
function Test-Health {
    Write-Log "Performing health check..."
    
    # Check if PM2 process is running
    $pm2Status = pm2 list | Select-String $APP_NAME
    if ($pm2Status -match "online") {
        Write-Log "✓ PM2 process is running"
    }
    else {
        Write-Error "✗ PM2 process is not running"
        return $false
    }
    
    # Check if port is listening
    $portCheck = netstat -an | Select-String ":3000"
    if ($portCheck) {
        Write-Log "✓ Application is listening on port 3000"
    }
    else {
        Write-Error "✗ Application is not listening on port 3000"
        return $false
    }
    
    Write-Log "Health check completed successfully"
    return $true
}

# Clean up old logs
function Clear-Logs {
    Write-Log "Cleaning up old logs..."
    Get-ChildItem -Path $LOG_DIR -Filter "*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force
    Write-Log "Log cleanup completed"
}

# Main script logic
switch ($Action) {
    "start" {
        Test-Node
        New-Directories
        Start-App
    }
    "stop" {
        Stop-App
    }
    "restart" {
        Restart-App
    }
    "deploy" {
        Test-Node
        New-Directories
        Deploy-App
        Test-Health
    }
    "update" {
        Update-App
        Test-Health
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "health" {
        Test-Health
    }
    "cleanup" {
        Clear-Logs
    }
    default {
        Write-Host "Usage: .\deploy.ps1 [start|stop|restart|deploy|update|status|logs|health|cleanup]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start    - Start the application"
        Write-Host "  stop     - Stop the application"
        Write-Host "  restart  - Restart the application"
        Write-Host "  deploy   - Deploy/update the application"
        Write-Host "  update   - Update and restart the application"
        Write-Host "  status   - Show application status"
        Write-Host "  logs     - Show application logs"
        Write-Host "  health   - Perform health check"
        Write-Host "  cleanup  - Clean up old logs"
    }
}
