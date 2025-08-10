#!/usr/bin/env bash
set -euo pipefail

# Migration recovery helper for Prisma P3009 / failed initial migration
# Usage: bash scripts/migration-recover.sh
# Requires: psql, npx (node), DATABASE_URL exported or .env present

echo "[INFO] Checking Prisma migrations table..."
TABLE_EXISTS=$(psql -tAc "SELECT to_regclass('_prisma_migrations') IS NOT NULL" 2>/dev/null || echo false)
if [ "$TABLE_EXISTS" != "t" ]; then
  echo "[WARN] _prisma_migrations table does not exist. Proceeding to migrate deploy.";
  npx prisma migrate deploy
  exit $?
fi

FAILED_ROWS=$(psql -tAc "SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL")
if [ "$FAILED_ROWS" != "0" ]; then
  echo "[WARN] Found $FAILED_ROWS failed migration row(s):"
  psql -P pager=off -c "SELECT migration_name, started_at, finished_at, rolled_back_at FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL" 
  read -p "Delete these failed rows to allow a clean deploy? (y/N) " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    psql -c "DELETE FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL" 
    echo "[INFO] Deleted failed rows."
  else
    echo "[ABORT] User declined to delete failed rows."; exit 1;
  fi
fi

echo "[INFO] Running migrate deploy..."
npx prisma migrate deploy

echo "[INFO] Checking applied migrations..."
psql -P pager=off -c "SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at" || true

echo "[DONE] Migration recovery complete."
