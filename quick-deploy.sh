#!/bin/bash

# One-command deployment for server
echo "🚀 Quick deployment starting..."

# Stop, pull, build, start
pm2 stop jobportal 2>/dev/null || true
git pull origin main
npm ci --only=production --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint
pm2 start ecosystem.optimized.cjs --env production

echo "✅ Quick deployment completed!"
pm2 status
