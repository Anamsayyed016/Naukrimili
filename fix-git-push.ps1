# Git Push Fix Script
# This script helps diagnose and fix GitHub push issues

Write-Host "=== Git Push Diagnostic Script ===" -ForegroundColor Cyan
Write-Host ""

# Check Git version
Write-Host "1. Checking Git version..." -ForegroundColor Yellow
git --version
Write-Host ""

# Check remote URL
Write-Host "2. Checking remote URL..." -ForegroundColor Yellow
git remote -v
Write-Host ""

# Check current branch and status
Write-Host "3. Checking branch status..." -ForegroundColor Yellow
git status
Write-Host ""

# Check if there are uncommitted changes
Write-Host "4. Checking for uncommitted changes..." -ForegroundColor Yellow
$uncommitted = git diff --name-only
if ($uncommitted) {
    Write-Host "   Warning: You have uncommitted changes!" -ForegroundColor Red
    Write-Host "   Files: $uncommitted" -ForegroundColor Red
} else {
    Write-Host "   ✓ No uncommitted changes" -ForegroundColor Green
}
Write-Host ""

# Check commit size
Write-Host "5. Checking commit size..." -ForegroundColor Yellow
$commitSize = git diff --stat origin/main..HEAD
Write-Host "$commitSize"
Write-Host ""

# Try to fetch first (lighter operation)
Write-Host "6. Testing repository access (fetch)..." -ForegroundColor Yellow
try {
    git fetch origin --dry-run 2>&1 | Out-String
    Write-Host "   ✓ Fetch test completed" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Fetch test failed: $_" -ForegroundColor Red
}
Write-Host ""

# Check for large files
Write-Host "7. Checking for large files (>10MB)..." -ForegroundColor Yellow
$largeFiles = git ls-files | ForEach-Object {
    if (Test-Path $_) {
        $file = Get-Item $_
        if ($file.Length -gt 10MB) {
            [PSCustomObject]@{
                File = $_
                Size = "{0:N2} MB" -f ($file.Length / 1MB)
            }
        }
    }
}
if ($largeFiles) {
    Write-Host "   Warning: Large files detected!" -ForegroundColor Red
    $largeFiles | Format-Table -AutoSize
} else {
    Write-Host "   ✓ No large files detected" -ForegroundColor Green
}
Write-Host ""

# Suggest solutions
Write-Host "=== Suggested Solutions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you're getting 500/503 errors, try:" -ForegroundColor Yellow
Write-Host "1. Wait a few minutes and retry (GitHub may be experiencing issues)"
Write-Host "2. Check GitHub Status: https://www.githubstatus.com/"
Write-Host "3. Refresh your credentials:"
Write-Host "   git credential-manager erase https://github.com"
Write-Host "   git push origin main"
Write-Host ""
Write-Host "4. If using Personal Access Token, ensure it has 'repo' scope"
Write-Host "5. Try pushing in smaller chunks if you have many commits"
Write-Host "6. Check if repository has size limits or restrictions"
Write-Host ""

# Ask if user wants to retry push
$retry = Read-Host "Would you like to retry the push now? (y/n)"
if ($retry -eq "y" -or $retry -eq "Y") {
    Write-Host ""
    Write-Host "Attempting push..." -ForegroundColor Yellow
    git push origin main
}

