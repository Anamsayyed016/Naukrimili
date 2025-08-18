Write-Host "🚀 Quick Start: Setting up automated deployment for your job portal" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit with automated deployment"
    git branch -M main
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check if remote origin exists
try {
    $origin = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub remote already exists" -ForegroundColor Green
    } else {
        throw "No remote"
    }
} catch {
    Write-Host "🌐 Please add your GitHub repository URL:" -ForegroundColor Yellow
    Write-Host "   Example: https://github.com/yourusername/jobportal.git" -ForegroundColor Cyan
    
    $github_url = Read-Host "   Enter GitHub URL"
    
    if ($github_url) {
        git remote add origin $github_url
        Write-Host "✅ GitHub remote added" -ForegroundColor Green
    } else {
        Write-Host "❌ No URL provided. Please add manually:" -ForegroundColor Red
        Write-Host "   git remote add origin https://github.com/yourusername/jobportal.git" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "📋 Next steps to complete setup:" -ForegroundColor Yellow
Write-Host "1. Push your code to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Add GitHub secrets (Settings → Secrets → Actions):" -ForegroundColor White
Write-Host "   - HOST: 69.62.73.84" -ForegroundColor Cyan
Write-Host "   - USERNAME: your-vps-username" -ForegroundColor Cyan
Write-Host "   - SSH_KEY: your-private-ssh-key" -ForegroundColor Cyan
Write-Host "   - PORT: 22" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Set up VPS (SSH into your VPS and run):" -ForegroundColor White
Write-Host "   chmod +x scripts/setup-vps.sh" -ForegroundColor Cyan
Write-Host "   ./scripts/setup-vps.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test deployment by pushing changes to main branch" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your automated deployment system is ready to configure!" -ForegroundColor Green

Read-Host "Press Enter to continue"
