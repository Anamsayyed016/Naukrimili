#!/usr/bin/env pwsh

# Simple server start script
Write-Host "Starting Job Portal Server..." -ForegroundColor Green

# Set environment variables
$env:PORT = "3001"
$env:NODE_ENV = "development"  # Use development for now
$env:HOSTNAME = "localhost"

# Kill any existing processes on target ports
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 3

# Start in development mode first
Write-Host "Starting development server on port 3001..." -ForegroundColor Cyan
try {
    pnpm dev --port 3001
} catch {
    Write-Host "Development server failed, trying production mode..." -ForegroundColor Yellow
    
    # Try building first
    Write-Host "Building project..." -ForegroundColor Yellow
    pnpm build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Starting production server..." -ForegroundColor Green
        pnpm start
    } else {
        Write-Host "Build failed. Starting with node server.js..." -ForegroundColor Red
        node server.js
    }
}
