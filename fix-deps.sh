#!/bin/bash
set -e

echo "🔧 Fixing npm dependency sync issues..."

# Remove existing lock file and node_modules
echo "📦 Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Install dependencies with legacy peer deps to avoid conflicts
echo "⬇️ Installing dependencies..."
npm install --legacy-peer-deps

# Verify installation
echo "✅ Verifying installation..."
npm list --depth=0

echo "🎉 Dependencies fixed successfully!"
echo "You can now run: npm run build"
