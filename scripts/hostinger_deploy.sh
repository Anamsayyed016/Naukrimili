#!/usr/bin/env bash
# Hostinger KVM Deployment Script for NaukriMili (Next.js + Postgres + Prisma)
# Idempotent: safe to re-run for updates.

set -euo pipefail
IFS=$'\n\t'

APP_NAME="jobportal"
APP_DIR="${APP_DIR:-/var/www/jobportal}"
REPO_URL="${REPO_URL:-https://github.com/Anamsayyed016/Naukrimili.git}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-jobportal}"
NODE_MIN="18"
USE_PNPM=1

COLOR_GREEN='\033[0;32m'; COLOR_YELLOW='\033[1;33m'; COLOR_RED='\033[0;31m'; COLOR_RESET='\033[0m'
log() { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $*"; }
warn() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $*"; }
err() { echo -e "${COLOR_RED}[ERR]${COLOR_RESET} $*" >&2; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }; }

echo "---- Hostinger Deploy Script ----"

# 1. Node version check
require_cmd node
NODE_V=$(node -v | sed 's/v//')
NODE_MAJOR=${NODE_V%%.*}
if [ "$NODE_MAJOR" -lt "$NODE_MIN" ]; then
  err "Node $NODE_MIN+ required (found $NODE_V)"
  exit 1
fi
log "Node version $NODE_V OK"

# 2. Clone or update repo
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR" 2>/dev/null || true
  sudo chown "$(id -u)":"$(id -g)" "$APP_DIR" 2>/dev/null || true
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
  log "Cloned repository"
else
  cd "$APP_DIR"
  CURRENT_URL=$(git remote get-url origin || echo '')
  if [ "$CURRENT_URL" != "$REPO_URL" ]; then
    warn "Origin URL differs ($CURRENT_URL) != ($REPO_URL)"
  fi
  git fetch origin "$BRANCH" --prune
  git reset --hard "origin/$BRANCH"
  git clean -fd
  log "Updated repository to origin/$BRANCH"
fi

cd "$APP_DIR"

# 3. Environment file
if [ ! -f .env.production ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.production
    warn "Created .env.production from example. EDIT secrets before first production run."
  else
    err "No .env.production or .env.example present. Aborting."
    exit 1
  fi
fi

# 4. Validate required env keys (presence only)
REQUIRED_KEYS=(NODE_ENV NEXTAUTH_SECRET NEXTAUTH_URL DATABASE_URL JWT_SECRET)
MISSING=()
for k in "${REQUIRED_KEYS[@]}"; do
  if ! grep -q "^${k}=" .env.production; then
    MISSING+=("$k")
  fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Missing keys in .env.production: ${MISSING[*]}"
  warn "Edit .env.production and re-run."
  exit 1
fi
log "Env keys present"

# 5. Package manager detection
if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm not found; falling back to npm (slower). Install pnpm globally for faster deploys."
  USE_PNPM=0
fi

# 6. Install dependencies
if [ "$USE_PNPM" -eq 1 ]; then
  PNPM_FLAGS="--frozen-lockfile"
  pnpm install $PNPM_FLAGS
else
  npm install --no-audit --no-fund
fi
log "Dependencies installed"

# 7. Prisma generate & migrations (if migrations folder exists & not empty)
if [ -d prisma/migrations ] && [ "$(ls -A prisma/migrations 2>/dev/null | wc -l)" -gt 0 ]; then
  npx prisma generate
  npx prisma migrate deploy
  log "Prisma migrations deployed"
else
  log "No Prisma migrations to deploy"
  npx prisma generate || warn "Prisma generate skipped/failed"
fi

# 8. Build application
if [ "$USE_PNPM" -eq 1 ]; then
  pnpm build
else
  npm run build
fi
log "Application build complete"

# 9. PM2 setup
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
  log "Installed pm2 globally"
fi

# 10. Start / reload process via pm2
START_CMD="pnpm start"
if [ "$USE_PNPM" -eq 0 ]; then START_CMD="npm start"; fi

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env || pm2 restart "$PM2_NAME"
  log "Reloaded existing PM2 process $PM2_NAME"
else
  pm2 start bash --name "$PM2_NAME" -- -c "$START_CMD"
  log "Started PM2 process $PM2_NAME"
fi

pm2 save >/dev/null 2>&1 || warn "pm2 save failed (maybe no startup yet)"

# 11. Health check
sleep 3
if curl -fsS http://localhost:3000/api/health >/dev/null 2>&1; then
  log "Health check passed"
else
  warn "Health check failed. Check logs: pm2 logs $PM2_NAME"
fi

echo -e "${COLOR_GREEN}Deployment complete.${COLOR_RESET}"
echo "Next: configure a reverse proxy (Nginx) if not already and ensure domain points to server IP."

exit 0
