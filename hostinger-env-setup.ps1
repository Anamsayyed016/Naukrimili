#!/usr/bin/env pwsh

# Quick Hostinger Environment Setup
Write-Host "🔐 Hostinger Environment Setup" -ForegroundColor Green

# Check if env.template exists
if (Test-Path "env.template") {
    Write-Host "✅ Found env.template" -ForegroundColor Green
    
    # Copy to .env.local
    Copy-Item "env.template" ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
    
    # Show what needs to be updated
    Write-Host "📝 Update .env.local with your Hostinger values:" -ForegroundColor Yellow
    Write-Host "   - NEXTAUTH_URL=https://yourdomain.com" -ForegroundColor White
    Write-Host "   - NEXTAUTH_SECRET=your-secret-key" -ForegroundColor White
    Write-Host "   - Database connection strings" -ForegroundColor White
    
    # Open the file for editing
    Write-Host "Opening .env.local for editing..." -ForegroundColor Cyan
    notepad ".env.local"
} else {
    Write-Host "❌ env.template not found" -ForegroundColor Red
    Write-Host "Create it with your environment variables first" -ForegroundColor Yellow
}
