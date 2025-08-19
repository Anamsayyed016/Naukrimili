@echo off
echo 🚀 Job Portal Quick Setup
echo =========================

echo.
echo 📝 Step 1: Creating .env.local file...
(
echo # Adzuna API
echo ADZUNA_APP_ID=bdd02427
echo ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
echo.
echo # RapidAPI
echo RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
) > .env.local

echo ✅ .env.local file created!

echo.
echo 🔑 Step 2: Testing API keys...
node scripts/test-api-keys.js

echo.
echo 🧪 Step 3: Testing job import system...
node scripts/test-job-import.js

echo.
echo 🎉 Setup complete! Your job portal is ready to fetch real jobs.
echo.
echo 📋 Next steps:
echo    1. Start your development server: npm run dev
echo    2. Visit: http://localhost:3000/jobs
echo    3. Use the "Quick Job Import" buttons to fetch real jobs
echo    4. Enjoy your multi-country job portal!
echo.
pause
