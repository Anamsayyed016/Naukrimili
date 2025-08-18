@echo off
echo ========================================
echo 🚀 Job Portal Automated Deployment Setup
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit with automated deployment"
    git branch -M main
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

echo.
echo 📋 Next steps to complete setup:
echo.
echo 1. Add GitHub repository (if not already done):
echo    git remote add origin https://github.com/yourusername/jobportal.git
echo.
echo 2. Push to GitHub:
echo    git push -u origin main
echo.
echo 3. Add GitHub secrets (Settings → Secrets → Actions):
echo    - HOST: 69.62.73.84
echo    - USERNAME: your-vps-username
echo    - SSH_KEY: your-private-ssh-key
echo    - PORT: 22
echo.
echo 4. Set up VPS (SSH into your VPS and run):
echo    chmod +x scripts/setup-vps.sh
echo    ./scripts/setup-vps.sh
echo.
echo 5. Test deployment by pushing changes to main branch
echo.
echo 📖 See DEPLOYMENT_SETUP.md for detailed instructions
echo.
echo 🎉 Your automated deployment system is ready!
echo.
pause
