# Quick fix for common ESLint errors

$basePath = "E:\myprojects\jobportal"

Write-Host "🔧 Fixing ESLint errors..."

# Files with unused request parameters
$files = @(
    "app/api/automation/start/route.ts",
    "app/api/automation/status/route.ts",
    "app/api/automation/sync/route.ts",
    "app/api/candidates/[id]/route.ts",
    "app/api/clear-cache/route.ts",
    "app/api/company/profile/route.ts",
    "app/api/csrf/route.ts",
    "app/api/debug/clear-conflicts/route.ts",
    "app/api/debug/clear-oauth-conflicts/route.ts",
    "app/api/debug/database/route.ts",
    "app/api/debug/database-test/route.ts",
    "app/api/debug/employer-auth/route.ts",
    "app/api/debug/env/route.ts",
    "app/api/debug/health/route.ts",
    "app/api/debug/oauth-status/route.ts",
    "app/api/debug/oauth-test/route.ts",
    "app/api/debug/providers/route.ts",
    "app/api/debug/seed-jobs/route.ts",
    "app/api/debug/session/route.ts",
    "app/api/debug/simple/route.ts",
    "app/api/debug/simple-test/route.ts",
    "app/api/debug/test-db/route.ts",
    "app/api/debug/user-status/route.ts",
    "app/api/debug-jobs/route.ts",
    "app/api/jobs/advanced/route.ts",
    "app/api/jobs/categories/route.ts",
    "app/api/jobs/constants/route.ts",
    "app/api/jobs/create-sample/route.ts",
    "app/api/jobs/debug/route.ts",
    "app/api/jobs/debug-counts/route.ts",
    "app/api/jobs/enhanced/route.ts",
    "app/api/jobs/performance/route.ts",
    "app/api/jobs/scrape/route.ts",
    "app/api/jobs/seed-real/route.ts",
    "app/api/jobs/seed-unlimited/route.ts",
    "app/api/jobs/sync/route.ts",
    "app/api/jobs/test/route.ts",
    "app/api/jobs/test-connection/route.ts",
    "app/api/auth/send-otp/route.ts",
    "app/api/auth/set-role/route.ts",
    "app/api/auth/verify-phone/route.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $original = $content
        
        # Fix unused request parameters
        $content = $content -replace 'export async function (GET|POST|PUT|DELETE|PATCH)\(request: (Request|NextRequest)', 'export async function $1(_request: NextRequest'
        
        # Fix unused error in catch blocks
        $content = $content -replace '} catch \(error\) \{', '} catch {'
        
        if ($content -ne $original) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "✓ Fixed: $file"
        }
    }
}

Write-Host "✅ Done!"

