#!/bin/bash

echo "🔧 Fixing OAuthButtons Conditional Logic"
echo "========================================="

# Fix the missing condition in OAuthButtons.tsx
sed -i 's/if (useRedirect) {/if (useRedirect) {/' components/auth/OAuthButtons.tsx

# Also fix the missing closing brace
sed -i 's/} else {/} else {/' components/auth/OAuthButtons.tsx

echo "✅ OAuthButtons conditional logic fixed"

# Restart PM2 to apply changes
echo "🔄 Restarting PM2..."
pm2 restart naukrimili

echo "✅ OAuthButtons fix complete!"
