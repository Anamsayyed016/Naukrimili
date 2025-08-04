# INSTANT DEPLOYMENT PACKAGE FOR HOSTINGER
Write-Host "🚀 Creating instant deployment..." -ForegroundColor Green

# Create deployment folder
if (Test-Path "hostinger_deploy") { Remove-Item "hostinger_deploy" -Recurse -Force }
New-Item -ItemType Directory -Path "hostinger_deploy"

# Copy public files (static assets)
Write-Host "📁 Copying static files..." -ForegroundColor Yellow
Copy-Item "public\*" "hostinger_deploy\" -Recurse -Force

# Create a simple index.html for immediate deployment
$indexHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NaukriMili - Job Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <header class="bg-blue-600 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">🚀 NaukriMili</h1>
            <nav class="space-x-4">
                <a href="#" class="hover:text-blue-200">Jobs</a>
                <a href="#" class="hover:text-blue-200">Companies</a>
                <a href="#" class="hover:text-blue-200">Login</a>
            </nav>
        </div>
    </header>
    
    <main class="container mx-auto p-8">
        <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">Find Your Dream Job</h2>
            <p class="text-xl text-gray-600 mb-8">AI-Powered Job Portal - Now Live!</p>
            
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div class="flex gap-4">
                    <input type="text" placeholder="Job title, keywords..." class="flex-1 p-3 border rounded-lg">
                    <input type="text" placeholder="Location" class="flex-1 p-3 border rounded-lg">
                    <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
            </div>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 mb-12">
            <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                <i class="fas fa-briefcase text-4xl text-blue-600 mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Latest Jobs</h3>
                <p class="text-gray-600">Browse thousands of job opportunities</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                <i class="fas fa-building text-4xl text-green-600 mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Top Companies</h3>
                <p class="text-gray-600">Connect with leading employers</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                <i class="fas fa-chart-line text-4xl text-purple-600 mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Career Growth</h3>
                <p class="text-gray-600">AI-powered career recommendations</p>
            </div>
        </div>
        
        <div class="bg-blue-600 text-white p-8 rounded-lg text-center">
            <h3 class="text-2xl font-bold mb-4">🎉 Website Successfully Deployed!</h3>
            <p class="text-lg mb-4">Your NaukriMili job portal is now live on Hostinger</p>
            <p class="text-blue-200">Full functionality will be available soon. You can now fix errors dynamically!</p>
        </div>
    </main>
    
    <footer class="bg-gray-800 text-white p-8 mt-12">
        <div class="container mx-auto text-center">
            <p>&copy; 2025 NaukriMili. All rights reserved.</p>
            <p class="text-gray-400 mt-2">Powered by Next.js & Deployed on Hostinger</p>
        </div>
    </footer>
</body>
</html>
"@

Set-Content "hostinger_deploy\index.html" $indexHtml

# Create .htaccess for proper routing
$htaccess = @"
RewriteEngine On
RewriteBase /

# Redirect to index.html for SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L,QSA]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
</IfModule>
"@

Set-Content "hostinger_deploy\.htaccess" $htaccess

# Create deployment zip
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "naukrimili_hostinger_$timestamp.zip"
Compress-Archive -Path "hostinger_deploy\*" -DestinationPath $zipName -Force

Write-Host "✅ DEPLOYMENT PACKAGE READY!" -ForegroundColor Green
Write-Host "📦 File: $zipName" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🚀 HOSTINGER DEPLOYMENT STEPS:" -ForegroundColor Yellow
Write-Host "1. Login to Hostinger Control Panel" -ForegroundColor White
Write-Host "2. Go to File Manager" -ForegroundColor White
Write-Host "3. Upload: $zipName" -ForegroundColor White
Write-Host "4. Extract to public_html/" -ForegroundColor White
Write-Host "5. Done! Your site is LIVE! 🎉" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🌐 Your job portal will be available at your domain immediately!" -ForegroundColor Green
