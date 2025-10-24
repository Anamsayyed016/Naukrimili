#!/bin/bash

echo "🔧 CRITICAL FIX: Updating .env file domain mismatch"
echo "===================================================="

# Update the .env file with correct domain
sed -i 's/NEXTAUTH_URL=https:\/\/aftionix.in/NEXTAUTH_URL=https:\/\/naukrimili.com/g' .env
sed -i 's/NEXT_PUBLIC_APP_URL=https:\/\/aftionix.in/NEXT_PUBLIC_APP_URL=https:\/\/naukrimili.com/g' .env

echo "✅ Domain updated in .env file"

# Restart PM2 to apply the correct environment variables
echo "🔄 Restarting PM2 with correct domain..."
pm2 restart naukrimili --update-env

echo "✅ Domain fix complete!"
