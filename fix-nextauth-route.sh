#!/bin/bash

echo "🔧 Fixing NextAuth Route Handler Syntax Error"
echo "=============================================="

# Fix the NextAuth route handler
cat > app/api/auth/\[...nextauth\]/route.ts << 'EOF'
import { handlers } from "@/lib/nextauth-config"

export const { GET, POST } = handlers
EOF

echo "✅ NextAuth route handler fixed"

# Restart PM2 to apply changes
echo "🔄 Restarting PM2..."
pm2 restart naukrimili

echo "✅ NextAuth route handler fix complete!"
