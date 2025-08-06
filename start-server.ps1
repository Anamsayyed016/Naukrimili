#!/usr/bin/env pwsh

# Kill any existing processes on port 3000 and 3001
Write-Host "Stopping any processes on ports 3000 and 3001..." -ForegroundColor Yellow

# Kill processes using port 3000
$processes3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes3000) {
    $processes3000 | ForEach-Object {
        $pid = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id
        if ($pid) {
            Write-Host "Killing process $pid on port 3000" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Kill processes using port 3001
$processes3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($processes3001) {
    $processes3001 | ForEach-Object {
        $pid = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id
        if ($pid) {
            Write-Host "Killing process $pid on port 3001" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

# Build the project
Write-Host "Building project..." -ForegroundColor Green
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting server on port 3001..." -ForegroundColor Green
    
    # Set environment variable and start server
    $env:PORT = "3001"
    $env:NODE_ENV = "production"
    
    # Start the server
    pnpm start
} else {
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}
