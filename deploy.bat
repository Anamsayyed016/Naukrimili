@echo off
setlocal enabledelayedexpansion

REM Job Portal Deployment Script for Windows
REM This script provides various deployment options for the job portal application

REM Configuration
set PROJECT_NAME=jobportal
set PROJECT_PATH=%CD%
set LOG_FILE=.\logs\deploy.log
set BACKUP_PATH=.\backups

REM Colors for output (Windows 10+ supports ANSI colors)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set PURPLE=[95m
set CYAN=[96m
set NC=[0m

REM Create necessary directories
:setup_directories
if "%1"=="setup" (
    echo %GREEN%Setting up deployment environment...%NC%
    if not exist "logs" mkdir logs
    if not exist "backups" mkdir backups
    if not exist "logs\deploy.log" type nul > logs\deploy.log
    echo %GREEN%Directories created successfully%NC%
    goto :eof
)

REM Check prerequisites
:check_prerequisites
if "%1"=="check" (
    echo %BLUE%Checking prerequisites...%NC%
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if errorlevel 1 (
        echo %RED%Node.js is not installed. Please install Node.js first.%NC%
        exit /b 1
    )
    
    REM Check if npm is installed
    npm --version >nul 2>&1
    if errorlevel 1 (
        echo %RED%npm is not installed. Please install npm first.%NC%
        exit /b 1
    )
    
    REM Check if PM2 is installed
    pm2 --version >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%PM2 is not installed. Installing PM2 globally...%NC%
        npm install -g pm2
    )
    
    echo %GREEN%All prerequisites are satisfied%NC%
    goto :eof
)

REM Create backup of current deployment
:backup_deployment
if "%1"=="backup" (
    echo %BLUE%Creating backup of current deployment...%NC%
    set BACKUP_NAME=backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
    set BACKUP_NAME=!BACKUP_NAME: =0!
    
    if exist ".next" (
        if not exist "backups\!BACKUP_NAME!" mkdir "backups\!BACKUP_NAME!"
        xcopy ".next" "backups\!BACKUP_NAME!\.next\" /E /I /Y >nul
    )
    
    if exist "node_modules" (
        if not exist "backups\!BACKUP_NAME!" mkdir "backups\!BACKUP_NAME!"
        xcopy "node_modules" "backups\!BACKUP_NAME!\node_modules\" /E /I /Y >nul
    )
    
    echo %GREEN%Backup created: backups\!BACKUP_NAME!%NC%
    goto :eof
)

REM Clean up old backups
:cleanup_backups
if "%1"=="cleanup" (
    echo %BLUE%Cleaning up old backups...%NC%
    cd backups
    for /f "skip=5 delims=" %%i in ('dir /b /o-d') do rmdir /s /q "%%i"
    cd ..
    echo %GREEN%Old backups cleaned up%NC%
    goto :eof
)

REM Install dependencies
:install_dependencies
if "%1"=="install" (
    echo %BLUE%Installing dependencies...%NC%
    if "%2"=="production" (
        npm ci --only=production --legacy-peer-deps
        echo %BLUE%Production dependencies installed%NC%
    ) else (
        npm install
        echo %BLUE%All dependencies installed%NC%
    )
    goto :eof
)

REM Build application
:build_application
if "%1"=="build" (
    echo %BLUE%Building application...%NC%
    if "%2"=="production" (
        npm run build:production
    ) else if "%2"=="fast" (
        npm run build:fast
    ) else (
        npm run build
    )
    echo %GREEN%Application built successfully%NC%
    goto :eof
)

REM Start application
:start_application
if "%1"=="start" (
    echo %BLUE%Starting application...%NC%
    if "%2"=="pm2" (
        pm2 start ecosystem.pm2.js --env production
        echo %GREEN%Application started with PM2%NC%
    ) else if "%2"=="production" (
        npm run start:production
    ) else (
        npm start
    )
    goto :eof
)

REM Stop application
:stop_application
if "%1"=="stop" (
    echo %BLUE%Stopping application...%NC%
    if "%2"=="pm2" (
        pm2 stop %PROJECT_NAME%
        echo %GREEN%Application stopped with PM2%NC%
    ) else (
        taskkill /f /im node.exe >nul 2>&1
        echo %GREEN%Application stopped%NC%
    )
    goto :eof
)

REM Restart application
:restart_application
if "%1"=="restart" (
    echo %BLUE%Restarting application...%NC%
    if "%2"=="pm2" (
        pm2 reload ecosystem.pm2.js --env production
        echo %GREEN%Application restarted with PM2%NC%
    ) else (
        call :stop_application
        timeout /t 2 >nul
        call :start_application
    )
    goto :eof
)

REM Show application status
:show_status
if "%1"=="status" (
    echo %BLUE%Showing application status...%NC%
    if "%2"=="pm2" (
        pm2 status
        pm2 logs %PROJECT_NAME% --lines 20
    ) else (
        echo Application process:
        tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul && echo Node.js processes found || echo No Node.js processes found
    )
    goto :eof
)

REM Monitor application
:monitor_application
if "%1"=="monitor" (
    echo %BLUE%Starting application monitoring...%NC%
    if "%2"=="pm2" (
        pm2 monit
    ) else (
        echo Use Task Manager or Resource Monitor for system monitoring
        echo Use 'npm run deploy:pm2:logs' for PM2 logs
    )
    goto :eof
)

REM Deploy to production
:deploy_production
if "%1"=="deploy:prod" (
    echo %BLUE%Starting production deployment...%NC%
    
    REM Backup current deployment
    call :backup_deployment
    
    REM Install production dependencies
    call :install_dependencies production
    
    REM Build for production
    call :build_application production
    
    REM Start with PM2
    call :start_application pm2
    
    echo %GREEN%Production deployment completed successfully%NC%
    goto :eof
)

REM Deploy with hot reload
:deploy_hot_reload
if "%1"=="deploy:hot" (
    echo %BLUE%Starting hot reload deployment...%NC%
    
    REM Stop current application
    call :stop_application pm2
    
    REM Install dependencies
    call :install_dependencies
    
    REM Build application
    call :build_application
    
    REM Start with PM2
    call :start_application pm2
    
    echo %GREEN%Hot reload deployment completed successfully%NC%
    goto :eof
)

REM Show logs
:show_logs
if "%1"=="logs" (
    echo %BLUE%Showing application logs...%NC%
    if "%2"=="pm2" (
        pm2 logs %PROJECT_NAME% --lines 50
    ) else (
        if exist "logs\combined.log" (
            type logs\combined.log
        ) else (
            echo No log files found
        )
    )
    goto :eof
)

REM Clean build artifacts
:clean_build
if "%1"=="clean" (
    echo %BLUE%Cleaning build artifacts...%NC%
    if exist ".next" rmdir /s /q ".next"
    if exist "out" rmdir /s /q "out"
    if exist "production" rmdir /s /q "production"
    if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
    echo %GREEN%Build artifacts cleaned%NC%
    goto :eof
)

REM Show help
:show_help
if "%1"=="help" (
    echo %CYAN%Job Portal Deployment Script for Windows%NC%
    echo.
    echo Usage: deploy.bat [COMMAND] [OPTIONS]
    echo.
    echo Commands:
    echo   setup              - Setup deployment environment
    echo   check              - Check prerequisites
    echo   backup             - Create backup of current deployment
    echo   cleanup            - Clean up old backups
    echo   install            - Install dependencies [dev^|production]
    echo   build              - Build application [dev^|production^|fast]
    echo   start              - Start application [dev^|pm2^|production]
    echo   stop               - Stop application [dev^|pm2]
    echo   restart            - Restart application [dev^|pm2]
    echo   status             - Show application status [dev^|pm2]
    echo   monitor            - Monitor application [dev^|pm2]
    echo   deploy:prod        - Deploy to production
    echo   deploy:hot         - Deploy with hot reload
    echo   logs               - Show application logs [dev^|pm2]
    echo   clean              - Clean build artifacts
    echo   help               - Show this help message
    echo.
    echo Examples:
    echo   deploy.bat setup
    echo   deploy.bat deploy:prod
    echo   deploy.bat start pm2
    echo   deploy.bat status pm2
    echo   deploy.bat logs pm2
    echo.
    goto :eof
)

REM Main script logic
if "%1"=="" goto :show_help

REM Call appropriate function based on first argument
call :%1 %2 %3 %4 %5 %6 %7 %8 %9
goto :eof
