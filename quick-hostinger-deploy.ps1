#!/usr/bin/env pwsh

# Quick Hostinger Deploy Script
Write-Host "🚀 Quick Hostinger Deploy" -ForegroundColor Green

# Fast build and deploy
Write-Host "1. Quick Build & Test" -ForegroundColor White
Write-Host "2. Production Build" -ForegroundColor White
Write-Host "3. Deploy to Hostinger" -ForegroundColor White

$choice = Read-Host "Choose (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🏗️ Quick build..." -ForegroundColor Green
        pnpm build
        Write-Host "✅ Testing on port 3000..." -ForegroundColor Green
        pnpm start
    }
    "2" {
        Write-Host "🏗️ Production build..." -ForegroundColor Green
        $env:NODE_ENV = "production"
        pnpm build
        Write-Host "✅ Production ready!" -ForegroundColor Green
    }
    "3" {
        Write-Host "🌐 Deploy to Hostinger..." -ForegroundColor Green
        Write-Host "Upload these folders to public_html:" -ForegroundColor Yellow
        Write-Host "   - .next/" -ForegroundColor White
        Write-Host "   - public/" -ForegroundColor White
        Write-Host "   - package.json" -ForegroundColor White
        Write-Host "   - .env.local" -ForegroundColor White
        Write-Host "   - server.js (if exists)" -ForegroundColor White
    }
}
