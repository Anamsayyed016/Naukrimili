#!/bin/bash

# Quick Server Fix - Run these commands on your server

echo "🔧 QUICK SERVER FIX"
echo "==================="

cd /var/www/jobportal

# Stop PM2
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Clean and install
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps --engine-strict=false

# Generate Prisma and build
npx prisma generate
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Start application
pm2 start ecosystem.config.cjs
sleep 10
pm2 status

# Test and restart nginx
curl -f http://localhost:3000/health && echo "✅ App working" || echo "❌ App not responding"
systemctl restart nginx

echo "✅ Fix completed! Check https://aftionix.in"
