#!/bin/bash

echo "🔧 Fixing OAuth configuration - Disabling PKCE for Google Workspace compatibility..."
echo "⏹️ Stopping PM2 process..."

pm2 stop naukrimili

echo "🧹 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔧 Updating OAuth configuration to disable PKCE..."

# Update the OAuth configuration to remove PKCE but keep other secure parameters
sed -i 's/code_challenge_method: "S256",//g' lib/nextauth-config.ts
sed -i 's/include_granted_scopes: "true"//g' lib/nextauth-config.ts

echo "✅ OAuth configuration updated - PKCE disabled"
echo "🔨 Rebuilding application..."

NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build

echo "🚀 Starting PM2 process..."
pm2 start ecosystem.config.cjs --env production

echo "✅ OAuth configuration fix applied successfully!"
echo "🔍 Check the logs with: pm2 logs naukrimili --lines 10"
