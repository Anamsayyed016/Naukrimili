@echo off
echo ========================================
echo   Domain Health Check for naukrimili.com
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found! Running domain health check...
echo.

cd /d "%~dp0.."
node scripts/domain-health-check.js

echo.
echo Domain health check completed!
pause
