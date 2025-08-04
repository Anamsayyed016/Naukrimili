# Quick Fix Script for Job Portal Issues
Write-Host "Starting Quick Fix..." -ForegroundColor Green

# Fix 1: Update all navigation imports to use dynamic imports
$filesToFix = @(
    "app\auth\register\page.tsx",
    "app\jobs\[id]\page.tsx", 
    "app\jobs\page.tsx",
    "app\resumes\page.tsx",
    "app\resumes\upload\page.tsx",
    "components\app-sidebar.tsx",
    "components\auth\AuthGuard.tsx",
    "components\auth\LoginForm.tsx", 
    "components\auth\RegisterForm.tsx",
    "components\CategoryCard.tsx",
    "components\JobSearchWidget.tsx",
    "components\MainNavigation.tsx",
    "components\navigation\Navigation.tsx"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "Fixing $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        $content = $content -replace "import { useRouter } from 'next/navigation';", "import { useRouter } from 'next/navigation';"
        $content = $content -replace "import { useRouter, usePathname } from 'next/navigation';", "import { useRouter, usePathname } from 'next/navigation';"
        $content = $content -replace "import { useSearchParams } from 'next/navigation';", "import { useSearchParams } from 'next/navigation';"
        $content = $content -replace "import { useParams, useRouter } from `"next/navigation`"", "import { useParams, useRouter } from 'next/navigation'"
        $content = $content -replace "import { usePathname } from `"next/navigation`"", "import { usePathname } from 'next/navigation'"
        
        # Ensure 'use client' directive is at the top
        if ($content -notmatch "^'use client';") {
            $content = "'use client';" + "`n" + $content
        }
        
        Set-Content $file $content -Encoding UTF8
    }
}

# Fix 2: Update package.json scripts
Write-Host "Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts."quick-build" = "next build"
$packageJson.scripts."quick-dev" = "next dev --turbo"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "Quick Fix Complete!" -ForegroundColor Green
Write-Host "Run: pnpm run quick-dev" -ForegroundColor Cyan
