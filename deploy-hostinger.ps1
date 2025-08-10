<#
Hostinger Deployment Script for NaukriMili
Usage (local or on Hostinger SSH PowerShell / Linux pwsh):
  pwsh ./deploy-hostinger.ps1 -Environment production -SkipDbPush:$false
Prerequisites:
  - DATABASE_URL set in .env.local (MongoDB)
  - Node 18+ installed
  - pnpm installed (npm i -g pnpm) or fallback to npm
#>
param(
  [string]$Environment = "production",
  [switch]$SkipDbPush
)

Write-Host "== NaukriMili Hostinger Deploy ==" -ForegroundColor Cyan

if (-Not (Test-Path .env.local)) {
  Write-Host "ERROR: .env.local not found. Create it before deployment." -ForegroundColor Red
  exit 1
}

# Basic sanity check for DATABASE_URL
$envContent = Get-Content .env.local | Where-Object {$_ -match '^DATABASE_URL='}
if (-not $envContent) {
  Write-Host "WARNING: DATABASE_URL not set in .env.local" -ForegroundColor Yellow
}

# Install dependencies (prefers pnpm)
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  Write-Host "Installing deps with pnpm..." -ForegroundColor Green
  pnpm install --frozen-lockfile || exit 1
} else {
  Write-Host "pnpm not found; using npm" -ForegroundColor Yellow
  npm install || exit 1
}

# Prisma generate
Write-Host "Generating Prisma client..." -ForegroundColor Green
if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm prisma generate } else { npx prisma generate }
if (-not $SkipDbPush) {
  Write-Host "Pushing Prisma schema (MongoDB)..." -ForegroundColor Green
  if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm prisma db push } else { npx prisma db push }
}

# Build
Write-Host "Building Next.js app..." -ForegroundColor Green
if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm build } else { npm run build }
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

Write-Host "Deployment build complete. Set Hostinger Node app startup to server.js or run: node server.js" -ForegroundColor Cyan
