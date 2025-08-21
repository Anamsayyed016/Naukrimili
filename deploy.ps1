#!/usr/bin/env pwsh

# Job Portal Deployment Script for PowerShell
# This script provides various deployment options for the job portal application

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Option = ""
)

# Configuration
$PROJECT_NAME = "jobportal"
$PROJECT_PATH = Get-Location
$LOG_FILE = ".\logs\deploy.log"
$BACKUP_PATH = ".\backups"

# Colors for output
$RED = "`e[91m"
$GREEN = "`e[92m"
$YELLOW = "`e[93m"
$BLUE = "`e[94m"
$PURPLE = "`e[95m"
$CYAN = "`e[96m"
$NC = "`e[0m"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host "$RED$logMessage$NC" }
        "WARNING" { Write-Host "$YELLOW$logMessage$NC" }
        "SUCCESS" { Write-Host "$GREEN$logMessage$NC" }
        "INFO" { Write-Host "$BLUE$logMessage$NC" }
        default { Write-Host "$GREEN$logMessage$NC" }
    }
    
    # Ensure log directory exists
    $logDir = Split-Path $LOG_FILE -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    Add-Content -Path $LOG_FILE -Value $logMessage
}

# Function to setup directories
function Setup-Directories {
    Write-Log "Setting up deployment environment..."
    
    $directories = @("logs", "backups")
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    if (!(Test-Path $LOG_FILE)) {
        New-Item -ItemType File -Path $LOG_FILE -Force | Out-Null
    }
    
    Write-Log "Directories created successfully" "SUCCESS"
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Node.js is not installed. Please install Node.js first." "ERROR"
            exit 1
        }
        Write-Log "Node.js version: $nodeVersion"
    } catch {
        Write-Log "Node.js is not installed. Please install Node.js first." "ERROR"
        exit 1
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "npm is not installed. Please install npm first." "ERROR"
            exit 1
        }
        Write-Log "npm version: $npmVersion"
    } catch {
        Write-Log "npm is not installed. Please install npm first." "ERROR"
        exit 1
    }
    
    # Check if PM2 is installed
    try {
        $pm2Version = pm2 --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "PM2 is not installed. Installing PM2 globally..." "WARNING"
            npm install -g pm2
        } else {
            Write-Log "PM2 version: $pm2Version"
        }
    } catch {
        Write-Log "PM2 is not installed. Installing PM2 globally..." "WARNING"
        npm install -g pm2
    }
    
    Write-Log "All prerequisites are satisfied" "SUCCESS"
}

# Function to backup current deployment
function Backup-Deployment {
    Write-Log "Creating backup of current deployment..."
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "backup-$timestamp"
    $backupPath = Join-Path $BACKUP_PATH $backupName
    
    if (!(Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    }
    
    if (Test-Path ".next") {
        Copy-Item -Path ".next" -Destination $backupPath -Recurse -Force
    }
    
    if (Test-Path "node_modules") {
        Copy-Item -Path "node_modules" -Destination $backupPath -Recurse -Force
    }
    
    Write-Log "Backup created: $backupPath" "SUCCESS"
}

# Function to clean old backups
function Cleanup-Backups {
    Write-Log "Cleaning up old backups..."
    
    if (Test-Path $BACKUP_PATH) {
        $backups = Get-ChildItem -Path $BACKUP_PATH -Directory | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5
        foreach ($backup in $backups) {
            Remove-Item -Path $backup.FullName -Recurse -Force
        }
    }
    
    Write-Log "Old backups cleaned up" "SUCCESS"
}

# Function to install dependencies
function Install-Dependencies {
    param([string]$Type = "dev")
    
    Write-Log "Installing dependencies..."
    
    if ($Type -eq "production") {
        npm ci --only=production --legacy-peer-deps
        Write-Log "Production dependencies installed" "INFO"
    } else {
        npm install
        Write-Log "All dependencies installed" "INFO"
    }
}

# Function to build application
function Build-Application {
    param([string]$Type = "dev")
    
    Write-Log "Building application..."
    
    switch ($Type) {
        "production" { npm run build:production }
        "fast" { npm run build:fast }
        default { npm run build }
    }
    
    Write-Log "Application built successfully" "SUCCESS"
}

# Function to start application
function Start-Application {
    param([string]$Type = "dev")
    
    Write-Log "Starting application..."
    
    switch ($Type) {
        "pm2" { 
            pm2 start ecosystem.pm2.js --env production
            Write-Log "Application started with PM2" "SUCCESS"
        }
        "production" { npm run start:production }
        default { npm start }
    }
}

# Function to stop application
function Stop-Application {
    param([string]$Type = "dev")
    
    Write-Log "Stopping application..."
    
    switch ($Type) {
        "pm2" { 
            pm2 stop $PROJECT_NAME
            Write-Log "Application stopped with PM2" "SUCCESS"
        }
        default { 
            Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Log "Application stopped" "SUCCESS"
        }
    }
}

# Function to restart application
function Restart-Application {
    param([string]$Type = "dev")
    
    Write-Log "Restarting application..."
    
    if ($Type -eq "pm2") {
        pm2 reload ecosystem.pm2.js --env production
        Write-Log "Application restarted with PM2" "SUCCESS"
    } else {
        Stop-Application $Type
        Start-Sleep -Seconds 2
        Start-Application $Type
    }
}

# Function to show application status
function Show-Status {
    param([string]$Type = "dev")
    
    Write-Log "Showing application status..."
    
    if ($Type -eq "pm2") {
        pm2 status
        pm2 logs $PROJECT_NAME --lines 20
    } else {
        Write-Host "Application process:"
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize
        } else {
            Write-Host "No Node.js processes found"
        }
    }
}

# Function to monitor application
function Monitor-Application {
    param([string]$Type = "dev")
    
    Write-Log "Starting application monitoring..."
    
    if ($Type -eq "pm2") {
        pm2 monit
    } else {
        Write-Host "Use Task Manager or Resource Monitor for system monitoring"
        Write-Host "Use 'npm run deploy:pm2:logs' for PM2 logs"
    }
}

# Function to deploy to production
function Deploy-Production {
    Write-Log "Starting production deployment..."
    
    Backup-Deployment
    Install-Dependencies "production"
    Build-Application "production"
    Start-Application "pm2"
    
    Write-Log "Production deployment completed successfully" "SUCCESS"
}

# Function to deploy with hot reload
function Deploy-HotReload {
    Write-Log "Starting hot reload deployment..."
    
    Stop-Application "pm2"
    Install-Dependencies
    Build-Application
    Start-Application "pm2"
    
    Write-Log "Hot reload deployment completed successfully" "SUCCESS"
}

# Function to show logs
function Show-Logs {
    param([string]$Type = "dev")
    
    Write-Log "Showing application logs..."
    
    if ($Type -eq "pm2") {
        pm2 logs $PROJECT_NAME --lines 50
    } else {
        if (Test-Path "logs\combined.log") {
            Get-Content "logs\combined.log" -Tail 50 -Wait
        } else {
            Write-Host "No log files found"
        }
    }
}

# Function to clean build artifacts
function Clean-Build {
    Write-Log "Cleaning build artifacts..."
    
    $artifacts = @(".next", "out", "production", "node_modules\.cache")
    foreach ($artifact in $artifacts) {
        if (Test-Path $artifact) {
            Remove-Item -Path $artifact -Recurse -Force
        }
    }
    
    Write-Log "Build artifacts cleaned" "SUCCESS"
}

# Function to show help
function Show-Help {
    Write-Host "$CYAN Job Portal Deployment Script for PowerShell$NC" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [OPTIONS]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup              - Setup deployment environment"
    Write-Host "  check              - Check prerequisites"
    Write-Host "  backup             - Create backup of current deployment"
    Write-Host "  cleanup            - Clean up old backups"
    Write-Host "  install            - Install dependencies [dev|production]"
    Write-Host "  build              - Build application [dev|production|fast]"
    Write-Host "  start              - Start application [dev|pm2|production]"
    Write-Host "  stop               - Stop application [dev|pm2]"
    Write-Host "  restart            - Restart application [dev|pm2]"
    Write-Host "  status             - Show application status [dev|pm2]"
    Write-Host "  monitor            - Monitor application [dev|pm2]"
    Write-Host "  deploy:prod        - Deploy to production"
    Write-Host "  deploy:hot         - Deploy with hot reload"
    Write-Host "  logs               - Show application logs [dev|pm2]"
    Write-Host "  clean              - Clean build artifacts"
    Write-Host "  help               - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 setup"
    Write-Host "  .\deploy.ps1 deploy:prod"
    Write-Host "  .\deploy.ps1 start pm2"
    Write-Host "  .\deploy.ps1 status pm2"
    Write-Host "  .\deploy.ps1 logs pm2"
    Write-Host ""
}

# Main script logic
try {
    switch ($Command) {
        "setup" { Setup-Directories }
        "check" { Test-Prerequisites }
        "backup" { Backup-Deployment }
        "cleanup" { Cleanup-Backups }
        "install" { Install-Dependencies $Option }
        "build" { Build-Application $Option }
        "start" { Start-Application $Option }
        "stop" { Stop-Application $Option }
        "restart" { Restart-Application $Option }
        "status" { Show-Status $Option }
        "monitor" { Monitor-Application $Option }
        "deploy:prod" { Deploy-Production }
        "deploy:hot" { Deploy-HotReload }
        "logs" { Show-Logs $Option }
        "clean" { Clean-Build }
        "help" { Show-Help }
        default { Show-Help }
    }
} catch {
    Write-Log "An error occurred: $($_.Exception.Message)" "ERROR"
    exit 1
}
