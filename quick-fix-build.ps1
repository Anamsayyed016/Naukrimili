#!/usr/bin/env pwsh

Write-Host "=== Job Portal Quick Fix Script ===" -ForegroundColor Cyan

# Step 1: Clean any processes
Write-Host "1. Cleaning existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clean build directories
Write-Host "2. Cleaning build directories..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Install dependencies if needed
Write-Host "3. Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    pnpm install
}

# Step 4: Build with timeout
Write-Host "4. Building project..." -ForegroundColor Green
$buildJob = Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    pnpm build 2>&1
}

$timeout = 120 # 2 minutes
if (Wait-Job $buildJob -Timeout $timeout) {
    $buildOutput = Receive-Job $buildJob
    Write-Host $buildOutput
    
    if ($buildJob.State -eq "Completed") {
        Write-Host "✅ Build completed successfully!" -ForegroundColor Green
        
        # Step 5: Start server
        Write-Host "5. Starting server on port 3001..." -ForegroundColor Green
        $env:PORT = "3001"
        $env:NODE_ENV = "production"
        
        if (Test-Path "server.js") {
            node server.js
        } else {
            pnpm start
        }
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        $buildOutput = Receive-Job $buildJob
        Write-Host $buildOutput -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Build timed out after $timeout seconds" -ForegroundColor Yellow
    Stop-Job $buildJob
    Remove-Job $buildJob
}

Remove-Job $buildJob -Force -ErrorAction SilentlyContinue
