# Server Database Cleanup Script for Windows/PowerShell
# This script clears all users and related data from the production database

Write-Host "🗑️  Starting server database cleanup..." -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not available. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Clearing all users and related data..." -ForegroundColor Cyan

# Run the database cleanup using Node.js
try {
    node scripts/server-reset-database.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Server database cleanup completed successfully!" -ForegroundColor Green
        Write-Host "🎉 Database is now clean and ready for fresh users!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database cleanup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running cleanup script: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✨ Server cleanup completed!" -ForegroundColor Green
