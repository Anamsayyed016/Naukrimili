@echo off
echo 🔑 Generating SSH key for Hostinger deployment...
echo.

REM Create .ssh directory if it doesn't exist
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"

REM Generate new SSH key
ssh-keygen -t rsa -b 4096 -f "%USERPROFILE%\.ssh\hostinger_deploy"

echo.
echo ✅ SSH key generated successfully!
echo.
echo 📋 Copy the PUBLIC key to your Hostinger VPS:
echo.
type "%USERPROFILE%\.ssh\hostinger_deploy.pub"
echo.
echo 🔐 Copy the PRIVATE key to GitHub SSH_KEY secret:
echo.
type "%USERPROFILE%\.ssh\hostinger_deploy"
echo.
echo 🚀 Next steps:
echo 1. Add the public key to your VPS: ~/.ssh/authorized_keys
echo 2. Add the private key to GitHub secrets as SSH_KEY
echo 3. Run the setup script on your VPS
echo.
pause
