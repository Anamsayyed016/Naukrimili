#!/usr/bin/env bash
# First-time setup on a new Ubuntu VPS (e.g. 76.13.155.103). Run as root on the server.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/naukrimili}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "🚀 Bootstrapping Naukrimili on $(uname -a)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib rsync build-essential

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi

npm install -g pm2
mkdir -p "$APP_DIR" /var/www/naukrimili-staging /var/www/naukrimili-backup
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /var/www/naukrimili* 2>/dev/null || true

if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.example" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

echo "✅ Node $(node -v), npm $(npm -v), PM2 $(pm2 -v 2>/dev/null | head -1)"
echo "📁 App directory: $APP_DIR"
echo ""
echo "Next steps:"
echo "  1. Set GitHub secret HOST to this server IP (e.g. 76.13.155.103)"
echo "  2. Configure $APP_DIR/.env (DATABASE_URL with localhost PostgreSQL)"
echo "  3. Push to main — GitHub Actions deploys the bundle"
echo "  4. Or extract release.tar.gz into $APP_DIR and: pm2 start ecosystem.config.cjs --env production"
