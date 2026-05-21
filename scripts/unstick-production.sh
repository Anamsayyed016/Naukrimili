#!/bin/bash
# Emergency: unstick production when deploy failed or PM2 shows "waiting" / 0b memory.
# Run on VPS: bash scripts/unstick-production.sh
set -euo pipefail

APP_DIR="${1:-/var/www/naukrimili}"
cd "$APP_DIR"

echo "==> Fixing DATABASE_URL (Prisma-compatible)..."
if [ -f .env ]; then
  grep -v '^DATABASE_URL=' .env > .env.tmp
  echo 'DATABASE_URL="postgresql://jobportal_user:Naukrimili%40123@localhost:5432/naukrimili"' >> .env.tmp
  mv .env.tmp .env
  cp .env .next/standalone/.env 2>/dev/null || true
fi

echo "==> Prisma generate + standalone copy..."
npx prisma@6.18.0 generate
mkdir -p .next/standalone/node_modules/@prisma
cp -r node_modules/.prisma .next/standalone/node_modules/.prisma
cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/client

echo "==> PM2 reset..."
pm2 delete naukrimili-test 2>/dev/null || true
pm2 delete naukrimili 2>/dev/null || true
cd "$APP_DIR"
pm2 start ecosystem.config.cjs --only naukrimili --env production
pm2 save --force
sleep 5

if curl -sf http://127.0.0.1:3000/api/health > /dev/null; then
  echo "✅ Production healthy on :3000"
else
  echo "❌ Health check failed — run: pm2 logs naukrimili --lines 40"
  exit 1
fi
