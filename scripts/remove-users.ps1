# Server User Removal Script - PowerShell Version
# Simple wrapper for the comprehensive user management script

Write-Host "🏢 Job Portal - User Management" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ and try again" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local file not found!" -ForegroundColor Yellow
    Write-Host "   Please ensure your database connection is configured" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

Write-Host "🔧 Available user removal options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. List all users" -ForegroundColor White
Write-Host "2. Remove test users only (SAFE)" -ForegroundColor Green
Write-Host "3. Remove OAuth users only (SAFE)" -ForegroundColor Green
Write-Host "4. Remove users by email" -ForegroundColor Yellow
Write-Host "5. Remove users by role" -ForegroundColor Yellow
Write-Host "6. Remove inactive users" -ForegroundColor Yellow
Write-Host "7. Remove ALL users (DANGEROUS!)" -ForegroundColor Red
Write-Host "8. Show help" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select an option (1-8)"

switch ($choice) {
    "1" {
        Write-Host "📋 Listing all users..." -ForegroundColor Cyan
        node scripts/server-user-management.js --list
    }
    "2" {
        Write-Host "🧹 Removing test users..." -ForegroundColor Green
        node scripts/server-user-management.js --remove-test
    }
    "3" {
        Write-Host "🔐 Removing OAuth users..." -ForegroundColor Green
        node scripts/server-user-management.js --remove-oauth
    }
    "4" {
        $email = Read-Host "Enter email address"
        if ($email) {
            Write-Host "🗑️  Removing user: $email" -ForegroundColor Yellow
            node scripts/server-user-management.js --remove-by-email $email
        } else {
            Write-Host "❌ No email provided" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host "Available roles: jobseeker, employer, admin" -ForegroundColor Cyan
        $role = Read-Host "Enter role"
        if ($role) {
            Write-Host "🗑️  Removing users with role: $role" -ForegroundColor Yellow
            node scripts/server-user-management.js --remove-by-role $role
        } else {
            Write-Host "❌ No role provided" -ForegroundColor Red
        }
    }
    "6" {
        Write-Host "⏰ Removing inactive users..." -ForegroundColor Yellow
        node scripts/server-user-management.js --remove-inactive
    }
    "7" {
        Write-Host "⚠️  WARNING: This will remove ALL users and data!" -ForegroundColor Red
        $confirm = Read-Host "Type 'DELETE ALL' to confirm"
        if ($confirm -eq "DELETE ALL") {
            Write-Host "🗑️  Removing all users..." -ForegroundColor Red
            node scripts/server-user-management.js --remove-all
        } else {
            Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
        }
    }
    "8" {
        node scripts/server-user-management.js --help
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Script completed" -ForegroundColor Green
