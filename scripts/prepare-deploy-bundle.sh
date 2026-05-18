#!/usr/bin/env bash
# Stage a production deploy bundle and create release.tar.gz (safe tar — archive written outside source dir).
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

# Next.js standalone: static + public must live under standalone/
if [ -d .next/standalone ]; then
  echo "🔧 Preparing standalone assets..."
  mkdir -p .next/standalone/.next
  if [ -d .next/static ] && [ ! -d .next/standalone/.next/static ]; then
    cp -a .next/static .next/standalone/.next/static
    echo "   ✅ .next/static → standalone"
  fi
  if [ -d public ]; then
    rm -rf .next/standalone/public
    cp -a public .next/standalone/public
    echo "   ✅ public → standalone"
  fi
  [ -f .next/standalone/server.js ] || { echo "❌ .next/standalone/server.js missing"; exit 1; }
else
  echo "⚠️  No .next/standalone — PM2 will fall back to server.cjs / next start"
fi

echo "📋 Copying artifacts..."
cp -a .next "$BUNDLE_DIR/"
find "$BUNDLE_DIR/.next" -name "*.map" -delete 2>/dev/null || true

for f in package.json package-lock.json ecosystem.config.cjs next.config.mjs server.cjs .npmrc; do
  [ -f "$f" ] && cp "$f" "$BUNDLE_DIR/"
done
[ -d public ] && cp -a public "$BUNDLE_DIR/"
[ -d prisma ] && cp -a prisma "$BUNDLE_DIR/"
[ -f .env.example ] && cp .env.example "$BUNDLE_DIR/"
mkdir -p "$BUNDLE_DIR/scripts"
[ -f scripts/sync-env-to-standalone.cjs ] && cp scripts/sync-env-to-standalone.cjs "$BUNDLE_DIR/scripts/"
[ -f scripts/ensure-production-database-env.sh ] && cp scripts/ensure-production-database-env.sh "$BUNDLE_DIR/scripts/"

FILE_COUNT=$(find "$BUNDLE_DIR" -type f 2>/dev/null | wc -l)
[ "$FILE_COUNT" -gt 50 ] || { echo "❌ Bundle too small ($FILE_COUNT files)"; exit 1; }

echo "🗜️  Creating archive (tar -C, output outside bundle dir)..."
tar -czf "$ARCHIVE" -C "$BUNDLE_DIR" .

mv -f "$ARCHIVE" "$OUTPUT"
trap - EXIT
rm -rf "$BUNDLE_DIR"

[ -f "$OUTPUT" ] || { echo "❌ $OUTPUT not created"; exit 1; }
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "✅ Bundle created: $OUTPUT ($SIZE)"
