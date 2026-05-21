#!/bin/bash
# Run on the production VPS after deploy: ensure .env uses localhost PostgreSQL.
# Usage: ./scripts/ensure-production-database-env.sh [/var/www/naukrimili]

set -euo pipefail

APP_DIR="${1:-/var/www/naukrimili}"
# Prisma-compatible URL only (no connection_limit / pool_timeout / socket_timeout)
CANONICAL_URL='postgresql://jobportal_user:Naukrimili%40123@localhost:5432/naukrimili'

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env 2>/dev/null || touch .env
fi

# Remove deprecated remote hosts
sed -i.bak \
  -e 's|@srv1054971\.hstgr\.cloud:|@localhost:|g' \
  -e 's|@34\.44\.45\.172:|@localhost:|g' \
  .env

if grep -q '^DATABASE_URL=' .env; then
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"${CANONICAL_URL}\"|" .env
else
  echo "DATABASE_URL=\"${CANONICAL_URL}\"" >> .env
fi

if [ -d .next/standalone ]; then
  cp .env .next/standalone/.env
  echo "✅ Synced .env → .next/standalone/.env"
fi

echo "✅ DATABASE_URL updated in $APP_DIR/.env"
grep '^DATABASE_URL=' .env | sed 's/:.*@/:***@/'
