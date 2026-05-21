#!/usr/bin/env bash
# Stage a production deploy bundle and create release.tar.gz (archive written OUTSIDE bundle dir).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUTPUT="${1:-$ROOT/release.tar.gz}"
BUNDLE_DIR="$(mktemp -d /tmp/naukrimili-bundle-XXXXXX)"
ARCHIVE="$(mktemp /tmp/naukrimili-release-XXXXXX.tar.gz)"

cleanup() {
  rm -rf "$BUNDLE_DIR"
}
trap cleanup EXIT

echo "📦 Preparing deploy bundle in $BUNDLE_DIR"

[ -d .next ] || { echo "❌ .next missing — run npm run build first"; exit 1; }

echo "📋 Copying artifacts (excluding .next/cache)..."
mkdir -p "$BUNDLE_DIR/.next"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='cache' --exclude='*.map' .next/ "$BUNDLE_DIR/.next/"
else
  cp -a .next "$BUNDLE_DIR/"
  rm -rf "$BUNDLE_DIR/.next/cache" 2>/dev/null || true
  find "$BUNDLE_DIR/.next" -name "*.map" -delete 2>/dev/null || true
fi

for f in package.json package-lock.json ecosystem.config.cjs next.config.mjs server.cjs .npmrc; do
  [ -f "$f" ] && cp "$f" "$BUNDLE_DIR/"
done
[ -d public ] && cp -a public "$BUNDLE_DIR/"
[ -d prisma ] && cp -a prisma "$BUNDLE_DIR/"
[ -f .env.example ] && cp .env.example "$BUNDLE_DIR/"
mkdir -p "$BUNDLE_DIR/scripts"
[ -f scripts/sync-env-to-standalone.cjs ] && cp scripts/sync-env-to-standalone.cjs "$BUNDLE_DIR/scripts/"
[ -f scripts/ensure-production-database-env.sh ] && cp scripts/ensure-production-database-env.sh "$BUNDLE_DIR/scripts/"

# Prepare standalone inside bundle only (do not mutate CI workspace after build verify)
if [ -d "$BUNDLE_DIR/.next/standalone" ]; then
  echo "🔧 Preparing standalone assets in bundle..."
  mkdir -p "$BUNDLE_DIR/.next/standalone/.next"
  if [ -d "$BUNDLE_DIR/.next/static" ] && [ ! -d "$BUNDLE_DIR/.next/standalone/.next/static" ]; then
    cp -a "$BUNDLE_DIR/.next/static" "$BUNDLE_DIR/.next/standalone/.next/static"
  fi
  if [ -d "$BUNDLE_DIR/public" ]; then
    rm -rf "$BUNDLE_DIR/.next/standalone/public"
    cp -a "$BUNDLE_DIR/public" "$BUNDLE_DIR/.next/standalone/public"
  fi
  [ -f "$BUNDLE_DIR/.next/standalone/server.js" ] || { echo "❌ standalone/server.js missing"; exit 1; }
  if [ -d "$ROOT/node_modules/.prisma" ]; then
    mkdir -p "$BUNDLE_DIR/.next/standalone/node_modules/@prisma"
    cp -r "$ROOT/node_modules/.prisma" "$BUNDLE_DIR/.next/standalone/node_modules/.prisma"
    cp -r "$ROOT/node_modules/@prisma/client" "$BUNDLE_DIR/.next/standalone/node_modules/@prisma/client" 2>/dev/null || true
    echo "✅ Bundled Prisma client into standalone"
  fi
fi

FILE_COUNT=$(find "$BUNDLE_DIR" -type f 2>/dev/null | wc -l)
[ "$FILE_COUNT" -gt 50 ] || { echo "❌ Bundle too small ($FILE_COUNT files)"; exit 1; }

# Brief pause so any async FS flush from cp/rsync completes (avoids tar race on slow runners)
sync 2>/dev/null || true
sleep 1

echo "🗜️  Creating archive..."
tar -czf "$ARCHIVE" \
  --exclude='./release.tar.gz' \
  --exclude='./.git' \
  -C "$BUNDLE_DIR" \
  . || { echo "❌ tar failed"; exit 1; }

mv -f "$ARCHIVE" "$OUTPUT"
trap - EXIT
rm -rf "$BUNDLE_DIR"

[ -f "$OUTPUT" ] || { echo "❌ $OUTPUT not created"; exit 1; }
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "✅ Bundle created: $OUTPUT ($SIZE)"
