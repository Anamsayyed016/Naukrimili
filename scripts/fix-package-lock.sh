#!/bin/bash

# Fix package-lock.json version mismatches
# This script regenerates package-lock.json to match package.json

set -e

echo "🔧 Fixing package-lock.json version mismatches..."
echo ""

# Check if package.json exists
if [ ! -f package.json ]; then
  echo "❌ package.json not found!"
  exit 1
fi

# Backup existing lock file
if [ -f package-lock.json ]; then
  echo "📦 Backing up existing package-lock.json..."
  cp package-lock.json package-lock.json.backup
  echo "✅ Backup created: package-lock.json.backup"
fi

# Remove old lock file
echo "🧹 Removing old package-lock.json..."
rm -f package-lock.json

# Regenerate lock file
echo "📝 Regenerating package-lock.json to match package.json..."
npm install --package-lock-only --legacy-peer-deps || {
  echo "❌ Failed to regenerate package-lock.json"
  if [ -f package-lock.json.backup ]; then
    echo "📦 Restoring backup..."
    mv package-lock.json.backup package-lock.json
  fi
  exit 1
}

# Verify Prisma versions match
echo ""
echo "🔍 Verifying Prisma versions..."
PACKAGE_JSON_PRISMA=$(grep -o '"@prisma/client": "[^"]*"' package.json | cut -d'"' -f4)
PACKAGE_JSON_PRISMA_CLI=$(grep -o '"prisma": "[^"]*"' package.json | cut -d'"' -f4)
LOCK_PRISMA=$(grep -o '"@prisma/client": "[^"]*"' package-lock.json | head -1 | cut -d'"' -f4)
LOCK_PRISMA_CLI=$(grep -o '"prisma": "[^"]*"' package-lock.json | head -1 | cut -d'"' -f4)

echo "   package.json: @prisma/client=$PACKAGE_JSON_PRISMA, prisma=$PACKAGE_JSON_PRISMA_CLI"
echo "   package-lock.json: @prisma/client=$LOCK_PRISMA, prisma=$LOCK_PRISMA_CLI"

# Check versions match
PKG_VERSION=$(echo "$PACKAGE_JSON_PRISMA" | sed 's/^[^0-9]*//')
LOCK_VERSION=$(echo "$LOCK_PRISMA" | sed 's/^[^0-9]*//')

if [ "$PKG_VERSION" = "$LOCK_VERSION" ]; then
  echo "✅ @prisma/client versions match: $PKG_VERSION"
else
  echo "❌ @prisma/client versions still don't match!"
  exit 1
fi

PKG_CLI_VERSION=$(echo "$PACKAGE_JSON_PRISMA_CLI" | sed 's/^[^0-9]*//')
LOCK_CLI_VERSION=$(echo "$LOCK_PRISMA_CLI" | sed 's/^[^0-9]*//')

if [ "$PKG_CLI_VERSION" = "$LOCK_CLI_VERSION" ]; then
  echo "✅ prisma CLI versions match: $PKG_CLI_VERSION"
else
  echo "❌ prisma CLI versions still don't match!"
  exit 1
fi

echo ""
echo "✅ package-lock.json fixed successfully!"
echo "📝 Next steps:"
echo "   1. Review the changes: git diff package-lock.json"
echo "   2. Commit the fix: git add package-lock.json && git commit -m 'fix: regenerate package-lock.json to match package.json'"
echo "   3. Push to trigger workflow: git push"

