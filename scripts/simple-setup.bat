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
echo    - USERNAME: root
echo    - SSH_KEY: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDQqdxk0NikVJfwUR84T+CIFO2dMrEmZUoCGiLtreJ4MZww9hg6gqayN+uRdDWXjElcfJg6YT1vSlIGwBIzt6DYMtySV30mmFGefSJm0cKc7vogRw5UYjI5Utsf3jvPdMBBvuqfw48MAK/HrQ/U/wMVaxzKILxtefKGJq8vybavuTxD17pbbQODbQYdaOaDSOEl8qUZsGLTHh06X4waYjSSQmDvSjRpQNVJ5JzmN240Xdqi7n8Owe23thdLYWycfVYvW2n5dYaG0Lhy+tTe++qtVzpXcPgaULNwuo60xPkkxFIfyz4VJF/IiYjDGbzStHr42VoU5SpHcd7ElJAHweMtcPW/Ly1ZKIkeUXCQ7oM3zRMRosMi7xTfc3ad6OpbrnytUezgiQEpJ6trzslcUJSqWd9GUD5aFVV6ZD9wTveaX9gpTRnJcepd6hXYsn/PGzqcQDdwNs155THXsIITNzo0HsVfIYRl7NwuOCmrew9ygHoVp2bbiC357hRt9tdNO2kiUNmlqFoNy1sq+vnjqQkOgNmkGqa8Hp7OVuuZxJdwVPdKSgBt0PqakoKmOAvXK5Xj5orGZiUsKQ3SmI+T1Df5ej/y6GLnpP+glflr/YMqbArdfU+GjzKMjKKwvDbAvTROdvsGAiZP31q6TJ82RTvmVGSP+0jlioRBCIElpr9dMcZw== anams@admin
echo    - PORT: 22
echo.
echo 4. Set up VPS (SSH into your VPS and run):
echo    ssh root@69.62.73.84
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
