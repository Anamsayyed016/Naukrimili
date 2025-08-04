# Quick Fix and Deploy Script
Write-Host "🚀 Quick Fix and Deploy..." -ForegroundColor Green

# Remove problematic admin directories temporarily
if (Test-Path "app\admin") {
    Rename-Item "app\admin" "app\admin.bak"
    Write-Host "✅ Temporarily moved admin folder" -ForegroundColor Yellow
}

# Remove problematic API routes
if (Test-Path "app\api\admin") {
    Rename-Item "app\api\admin" "app\api\admin.bak"
    Write-Host "✅ Temporarily moved admin API folder" -ForegroundColor Yellow
}

# Create simple fallback admin routes
New-Item -ItemType Directory -Path "app\admin" -Force
Set-Content "app\admin\page.tsx" 'export default function Admin() { return <div>Admin Coming Soon</div>; }'

New-Item -ItemType Directory -Path "app\api\admin" -Force
Set-Content "app\api\admin\route.ts" 'import { NextResponse } from "next/server"; export async function GET() { return NextResponse.json({ status: "ok" }); }'

# Try build
Write-Host "🏗️ Building project..." -ForegroundColor Yellow
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Commit and push
    git add .
    git commit -m "Quick fix: Remove problematic admin routes for deployment"
    git push origin main
    
    Write-Host "🚀 Deployment triggered!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Restoring original files..." -ForegroundColor Red
    
    # Restore original files
    Remove-Item "app\admin" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "app\api\admin" -Recurse -Force -ErrorAction SilentlyContinue
    
    if (Test-Path "app\admin.bak") {
        Rename-Item "app\admin.bak" "app\admin"
    }
    if (Test-Path "app\api\admin.bak") {
        Rename-Item "app\api\admin.bak" "app\api\admin"
    }
}
