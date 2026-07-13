@echo off
REM Windows build script with environment variables
echo 🔨 Building application for Windows...

REM Set required environment variables
set NEXTAUTH_SECRET=naukrimili-secret-key-2024-production-deployment
set NEXTAUTH_URL=https://naukrimili.com
set NEXT_PUBLIC_APP_URL=https://naukrimili.com
set NODE_ENV=production
set NEXT_TELEMETRY_DISABLED=1

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM Generate Prisma client
echo 🗄️ Generating Prisma client...
call npx prisma generate

REM Build the application directly with next
echo 📋 Running Next.js build...
call npx next build

REM Verify build artifacts
echo 🔍 Verifying build artifacts...
call node scripts/post-build-verify.cjs
if errorlevel 1 (
    echo ❌ Build verification failed!
    exit /b 1
)

echo ✅ Build completed successfully

