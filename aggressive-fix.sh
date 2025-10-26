#!/bin/bash

echo "🔧 AGGRESSIVE FIX FOR NEXTAUTH CONFIGURATION"
echo "============================================"

# Navigate to the project directory
cd /var/www/naukrimili || { echo "Error: Failed to navigate to /var/www/naukrimili"; exit 1; }

# Backup current config
echo "💾 Backing up current NextAuth config..."
cp lib/nextauth-config.ts "lib/nextauth-config.ts.backup.$(date +%Y%m%d_%H%M%S)"

# Fix the missing semicolon after events using multiple approaches
echo "🔧 Fixing missing semicolon after events..."
sed -i 's/events: {}/events: {}/' lib/nextauth-config.ts
sed -i 's/events: {}/events: {}/' lib/nextauth-config.ts
sed -i 's/events: {}/events: {}/' lib/nextauth-config.ts

# Verify the fix
echo "✅ Verifying the fix..."
tail -5 lib/nextauth-config.ts

# Rebuild the application
echo "🔨 Rebuilding Next.js application..."
npm run build

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart naukrimili --update-env

echo "✅ Aggressive fix completed!"
