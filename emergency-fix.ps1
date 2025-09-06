# Emergency fix script for Windows
Write-Host "🚨 Emergency server fix starting..." -ForegroundColor Red

$server = "root@69.62.73.84"
$projectPath = "/var/www/jobportal"

try {
    Write-Host "Step 1: Uploading fix scripts..." -ForegroundColor Yellow
    scp fix-504-error.sh, debug-server.sh, nginx-fix.conf, ecosystem.optimized.cjs "${server}:${projectPath}/"

    Write-Host "Step 2: Making scripts executable..." -ForegroundColor Yellow
    ssh $server "cd $projectPath && chmod +x fix-504-error.sh debug-server.sh"

    Write-Host "Step 3: Running emergency fix..." -ForegroundColor Yellow
    ssh $server "cd $projectPath && ./fix-504-error.sh"

    Write-Host "Step 4: Updating nginx config..." -ForegroundColor Yellow
    ssh $server "cp $projectPath/nginx-fix.conf /etc/nginx/sites-available/jobportal && nginx -t && systemctl reload nginx"

    Write-Host "Step 5: Final check..." -ForegroundColor Yellow
    ssh $server "cd $projectPath && pm2 status"

    Write-Host "✅ Emergency fix completed!" -ForegroundColor Green
    Write-Host "🌐 Check your website: http://mum.hostingerps.com" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Fix failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try accessing server through Hostinger control panel" -ForegroundColor Yellow
}
