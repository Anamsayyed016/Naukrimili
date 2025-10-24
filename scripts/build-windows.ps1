# Windows PowerShell Build Script with Cache Busting
# Forces new JavaScript chunk hashes and clears all caches

param(
    [switch]$FreshDeps
)

Write-Host "🚀 Starting Windows build with cache busting..." -ForegroundColor Blue

# Set environment variables
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NEXT_PUBLIC_BUILD_TIME = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  NODE_ENV: $env:NODE_ENV"
Write-Host "  NODE_OPTIONS: $env:NODE_OPTIONS"
Write-Host "  NEXT_PUBLIC_BUILD_TIME: $env:NEXT_PUBLIC_BUILD_TIME"

# Clean build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Blue
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
if (Test-Path ".vercel") { Remove-Item -Recurse -Force ".vercel" }
Write-Host "Build artifacts cleaned" -ForegroundColor Green

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force
Write-Host "NPM cache cleared" -ForegroundColor Green

# Install dependencies if fresh deps requested
if ($FreshDeps) {
    Write-Host "Fresh dependencies mode - removing node_modules" -ForegroundColor Yellow
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Blue
npm ci --legacy-peer-deps --ignore-engines
Write-Host "Dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Blue
npx prisma generate
Write-Host "Prisma client generated" -ForegroundColor Green

# Build the application
Write-Host "Building application with cache busting..." -ForegroundColor Blue
npm run build
Write-Host "Application built successfully" -ForegroundColor Green

# Check for old problematic files
Write-Host "Checking for old problematic chunks..." -ForegroundColor Blue
if (Test-Path ".next\static\chunks") {
    $oldChunks = Get-ChildItem -Path ".next\static\chunks" -Recurse -Filter "*4bd1b696-100b9d70ed4e49c1*" -ErrorAction SilentlyContinue
    if ($oldChunks) {
        Write-Host "Found old problematic chunks:" -ForegroundColor Yellow
        $oldChunks | ForEach-Object { Write-Host "  $($_.FullName)" }
        Write-Host "Removing old chunks..." -ForegroundColor Blue
        $oldChunks | Remove-Item -Force
        Write-Host "Old chunks removed" -ForegroundColor Green
    } else {
        Write-Host "No old problematic chunks found" -ForegroundColor Green
    }
}

# Create deployment info file
Write-Host "Creating deployment info..." -ForegroundColor Blue
$gitCommit = try { git rev-parse HEAD } catch { "unknown" }
$gitBranch = try { git branch --show-current } catch { "unknown" }

$deploymentInfo = @{
    deployment_time = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    build_timestamp = $env:NEXT_PUBLIC_BUILD_TIME
    node_version = (node --version)
    npm_version = (npm --version)
    git_commit = $gitCommit
    git_branch = $gitBranch
} | ConvertTo-Json -Depth 10

$deploymentInfo | Out-File -FilePath "deployment-info.json" -Encoding UTF8
Write-Host "Deployment info created" -ForegroundColor Green

# Final verification
Write-Host "Performing final verification..." -ForegroundColor Blue
if (Test-Path ".next") {
    $chunkCount = (Get-ChildItem -Path ".next\static\chunks" -Filter "*.js" -Recurse -ErrorAction SilentlyContinue).Count
    Write-Host "Build verification complete. Found $chunkCount JavaScript chunks." -ForegroundColor Green
} else {
    Write-Host "Build directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Windows build with cache busting completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Test your website in an incognito browser window"
Write-Host "  2. Check browser DevTools → Network tab for fresh JS files"
Write-Host "  3. Verify no 'Cannot read properties of undefined (reading 'length')' errors"
Write-Host "  4. Clear CDN cache if using a CDN service"
