#!/usr/bin/env pwsh

# Fast Hostinger VPS Testing Script
Write-Host "🚀 Fast Hostinger Testing" -ForegroundColor Green

# Quick status check
$hasNext = Test-Path ".next"
$hasModules = Test-Path "node_modules"

Write-Host "Status: $(if ($hasNext) { '✅ Built' } else { '❌ Need Build' }) | $(if ($hasModules) { '✅ Dependencies' } else { '❌ Install Dependencies' })" -ForegroundColor Cyan

# Fast options
Write-Host "1. Quick Test (dev)" -ForegroundColor White
Write-Host "2. Quick Build" -ForegroundColor White
Write-Host "3. Quick Deploy Check" -ForegroundColor White

$choice = Read-Host "Choose (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting dev server..." -ForegroundColor Green
        $env:PORT = "3001"
        pnpm dev --port 3001
    }
    "2" {
        Write-Host "🏗️ Building..." -ForegroundColor Green
        if (-not $hasModules) { pnpm install }
        pnpm build
        Write-Host "✅ Done! Run: pnpm start" -ForegroundColor Green
    }
    "3" {
        Write-Host "🔍 Quick deploy check..." -ForegroundColor Green
        $envFiles = @(".env.local", "env.template")
        foreach ($file in $envFiles) {
            if (Test-Path $file) { Write-Host "✅ $file" -ForegroundColor Green }
        }
        Write-Host "For Hostinger: Copy env.template to .env.local" -ForegroundColor Yellow
    }
}
