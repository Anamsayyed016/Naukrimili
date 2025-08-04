# INSTANT DEPLOYMENT FOR HOSTINGER
Write-Host "Creating deployment package..." -ForegroundColor Green

# Create deployment folder
if (Test-Path "deploy") { Remove-Item "deploy" -Recurse -Force }
New-Item -ItemType Directory -Path "deploy"

# Create simple HTML file
$html = @'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NaukriMili - Job Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <header class="bg-blue-600 text-white p-4">
        <div class="container mx-auto">
            <h1 class="text-2xl font-bold">NaukriMili Job Portal</h1>
        </div>
    </header>
    
    <main class="container mx-auto p-8">
        <div class="text-center">
            <h2 class="text-4xl font-bold mb-4">Website Successfully Deployed!</h2>
            <p class="text-xl mb-8">Your job portal is now live on Hostinger</p>
            
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <h3 class="text-lg font-bold mb-4">Quick Job Search</h3>
                <input type="text" placeholder="Search jobs..." class="w-full p-2 border rounded mb-4">
                <button class="w-full bg-blue-600 text-white p-2 rounded">Search Jobs</button>
            </div>
        </div>
    </main>
</body>
</html>
'@

Set-Content "deploy\index.html" $html

# Create htaccess
$htaccess = @'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L]
'@

Set-Content "deploy\.htaccess" $htaccess

# Create zip
$zipName = "naukrimili_deploy.zip"
Compress-Archive -Path "deploy\*" -DestinationPath $zipName -Force

Write-Host "DEPLOYMENT READY!" -ForegroundColor Green
Write-Host "File: $zipName" -ForegroundColor Cyan
Write-Host ""
Write-Host "UPLOAD TO HOSTINGER:" -ForegroundColor Yellow
Write-Host "1. Login to Hostinger" -ForegroundColor White
Write-Host "2. File Manager" -ForegroundColor White  
Write-Host "3. Upload $zipName" -ForegroundColor White
Write-Host "4. Extract to public_html" -ForegroundColor White
Write-Host "5. DONE!" -ForegroundColor White
