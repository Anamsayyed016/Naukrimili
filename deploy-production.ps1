# Production Deployment Script for NaukriMili Job Portal (Windows)
Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Set production environment
$env:NODE_ENV = "production"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "out") { Remove-Item -Recurse -Force "out" }

# Install dependencies (production only)
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm ci --only=production --legacy-peer-deps

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Create production directory
Write-Host "📁 Creating production directory..." -ForegroundColor Yellow
if (Test-Path "production") { Remove-Item -Recurse -Force "production" }
New-Item -ItemType Directory -Path "production"

# Copy necessary files
Write-Host "📋 Copying production files..." -ForegroundColor Yellow
Copy-Item -Recurse ".next" "production/"
Copy-Item -Recurse "public" "production/"
Copy-Item -Recurse "app" "production/"
Copy-Item -Recurse "components" "production/"
Copy-Item -Recurse "lib" "production/"
Copy-Item -Recurse "types" "production/"
Copy-Item -Recurse "prisma" "production/"
Copy-Item "package.json" "production/"
Copy-Item "next.config.js" "production/"
Copy-Item "ecosystem.config.js" "production/"

# Create production start script
$startScript = @"
# Production Start Script
`$env:NODE_ENV = "production"
`$env:PORT = "3000"
`$env:HOSTNAME = "0.0.0.0"

# Start the application
Write-Host "🚀 Starting NaukriMili Job Portal..." -ForegroundColor Green
npm start
"@

$startScript | Out-File -FilePath "production/start.ps1" -Encoding UTF8

Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host "📁 Production files are in: ./production/" -ForegroundColor Cyan
Write-Host "🚀 Run: cd production && .\start.ps1" -ForegroundColor Cyan
