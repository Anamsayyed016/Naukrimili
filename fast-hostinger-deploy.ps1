# Fast Hostinger Deployment Script
Write-Host "🚀 Starting Fast Hostinger Deployment..." -ForegroundColor Green

# Step 1: Build for production
Write-Host "Building for production..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
pnpm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 2: Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Create out directory if it doesn't exist
if (!(Test-Path "out")) {
    New-Item -ItemType Directory -Path "out"
}

# Copy essential files
Copy-Item ".next/static" "out/" -Recurse -Force
Copy-Item "public/*" "out/" -Recurse -Force
Copy-Item "package.json" "out/"

# Create deployment archive
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$deploymentFile = "hostinger_deploy_$timestamp.zip"

Compress-Archive -Path "out/*" -DestinationPath $deploymentFile -Force

Write-Host "✅ Deployment package created: $deploymentFile" -ForegroundColor Green

# Step 3: Instructions for Hostinger upload
Write-Host "`n📋 HOSTINGER DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "1. Log into your Hostinger control panel" -ForegroundColor White
Write-Host "2. Go to File Manager" -ForegroundColor White
Write-Host "3. Upload the file: $deploymentFile" -ForegroundColor White
Write-Host "4. Extract it to public_html/" -ForegroundColor White
Write-Host "5. Your site will be live!" -ForegroundColor White
Write-Host "`n🌐 Your job portal will be available at your domain!" -ForegroundColor Green

# Step 4: Create .htaccess for SPA routing
$htaccessContent = @"
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
"@

Set-Content "out\.htaccess" $htaccessContent

Write-Host "✅ .htaccess created for proper routing" -ForegroundColor Green
Write-Host "`n🎉 Fast deployment package ready!" -ForegroundColor Green
