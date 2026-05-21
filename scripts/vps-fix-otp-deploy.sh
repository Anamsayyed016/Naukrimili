#!/bin/bash
# VPS OTP + Prisma fix — run from /var/www/naukrimili after syncing latest code.
set -euo pipefail

APP_DIR="${1:-/var/www/naukrimili}"
cd "$APP_DIR"

echo "==> Working directory: $(pwd)"

# Load .env for Prisma (avoid requiring dotenv package)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  echo "==> Loaded .env"
else
  echo "ERROR: .env not found in $APP_DIR"
  exit 1
fi

PRISMA_VERSION="6.18.0"

echo "==> Generating Prisma client..."
npx --yes "prisma@${PRISMA_VERSION}" generate

if [ ! -d node_modules/.prisma/client ]; then
  echo "ERROR: node_modules/.prisma/client missing after generate"
  exit 1
fi
echo "==> Prisma client OK"

echo "==> Verifying DB connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1\`
  .then(() => { console.log('DB OK'); return p.\$disconnect(); })
  .catch((e) => { console.error('DB FAIL:', e.message); process.exit(1); });
"

echo "==> Building Next.js (linux script, no cross-env)..."
export NODE_ENV=production
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-naukrimili-secret-key-2024-production-deployment}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://naukrimili.com}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://naukrimili.com}"
export NODE_OPTIONS=--max-old-space-size=4096
export NEXT_TELEMETRY_DISABLED=1
export ESLINT_NO_DEV_ERRORS=true
export SKIP_ENV_VALIDATION=1
export SKIP_BUILD_DB_QUERIES=false
export SKIP_DB_QUERIES=false

npx next build --no-lint
node -e "require('fs').writeFileSync('.next/BUILD_ID', Date.now().toString())"

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js missing — build incomplete"
  exit 1
fi

echo "==> Copying Prisma into standalone..."
mkdir -p .next/standalone/node_modules/@prisma
rm -rf .next/standalone/node_modules/.prisma
cp -r node_modules/.prisma .next/standalone/node_modules/.prisma
cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/client
cp -r node_modules/@prisma/engines-version .next/standalone/node_modules/@prisma/engines-version 2>/dev/null || true
if [ -d node_modules/@prisma/engines ]; then
  cp -r node_modules/@prisma/engines .next/standalone/node_modules/@prisma/engines
fi

echo "==> Syncing .env to standalone..."
cp .env .next/standalone/.env
if [ -d prisma ]; then
  rm -rf .next/standalone/prisma
  cp -r prisma .next/standalone/prisma
fi

echo "==> Verifying Prisma in standalone..."
node -e "
process.chdir('.next/standalone');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1\`
  .then(() => { console.log('STANDALONE DB OK'); return p.\$disconnect(); })
  .catch((e) => { console.error('STANDALONE DB FAIL:', e.message); process.exit(1); });
"

echo "==> Restarting PM2 (fix uv_cwd)..."
pm2 delete naukrimili 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "==> Testing send-otp..."
sleep 3
redis-cli DEL "otp:cooldown:918107738186" "otp:send-lock:918107738186" 2>/dev/null || true
curl -s -X POST http://127.0.0.1:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"8107738186","purpose":"login"}' || true

echo ""
echo "Done. Check curl response above and: pm2 logs naukrimili --lines 30 --nostream"
