@echo off
echo 🏢 Job Portal Database Setup
echo ================================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local file not found!
    echo.
    echo Please create .env.local with your database credentials first:
    echo 1. Copy env.template to .env.local
    echo 2. Update DATABASE_URL with your actual database credentials
    echo 3. Make sure your database is running
    echo.
    pause
    exit /b 1
)

echo 🔍 Checking database connection...
echo.

REM Generate Prisma client
echo 📦 Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

REM Push schema to database
echo.
echo 🗄️ Pushing schema to database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to push schema to database
    echo.
    echo Common issues:
    echo - Check if PostgreSQL is running
    echo - Verify DATABASE_URL in .env.local
    echo - Ensure database user has proper permissions
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Database setup completed successfully!
echo.
echo 🧪 Running integrity check...
call node scripts/check-database-integrity.js

echo.
echo 🎉 Setup complete! Your database is ready to use.
pause
