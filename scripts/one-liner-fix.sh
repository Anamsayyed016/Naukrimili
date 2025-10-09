#!/bin/bash
# One-liner fix for server
cd /var/www/jobportal && pm2 stop all && pm2 delete all && rm -rf .next node_modules package-lock.json && npm install --legacy-peer-deps --engine-strict=false --force && npx prisma generate && NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build && pm2 start ecosystem.config.cjs && sleep 10 && pm2 status && systemctl restart nginx && echo "✅ Fix completed! Check https://naukrimili.com"
