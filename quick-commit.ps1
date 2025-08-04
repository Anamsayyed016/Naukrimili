# Quick commit script for dynamic website changes
Write-Host "Committing dynamic website changes..." -ForegroundColor Green

# Add all changes except large files
git add .
git add .gitignore

# Remove any accidentally staged large files
git reset HEAD hostinger-deploy/ 2>$null
git reset HEAD .next/cache/ 2>$null

# Commit changes
git commit -m "✨ Dynamic website implementation complete

- Made homepage dynamic with real API data fetching
- Added server infrastructure with health monitoring
- Created deployment package for Hostinger
- Added diagnostic tools for server monitoring
- Implemented CORS and security middleware
- Optimized for production deployment

Features:
- Dynamic job listings from /api/jobs
- Real company data from /api/companies  
- Health check endpoint at /api/health
- System diagnostics at /diagnostic
- Production-ready server.js
- Deployment automation scripts"

Write-Host "Changes committed successfully!" -ForegroundColor Green
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow

# Push to GitHub
git push origin main

Write-Host "Dynamic website deployed to GitHub!" -ForegroundColor Green