#!/bin/bash

echo "🚀 Starting complete deployment fix..."
echo "================================"

# Navigate to project directory
cd /var/www/jobportal || { echo "❌ Failed to navigate to /var/www/jobportal"; exit 1; }

echo ""
echo "📦 Step 1: Stopping PM2..."
pm2 delete jobportal 2>/dev/null || echo "No existing PM2 process to delete"

echo ""
echo "🧹 Step 2: Clearing PM2 cache..."
rm -rf /root/.pm2/dump.pm2* 2>/dev/null || true
pm2 cleardump

echo ""
echo "📥 Step 3: Installing dependencies..."
npm install --legacy-peer-deps --force || { echo "❌ npm install failed"; exit 1; }

echo ""
echo "🔨 Step 4: Building application..."
npm run build || { echo "❌ npm run build failed"; exit 1; }

echo ""
echo "🔄 Step 5: Starting PM2 with fresh config..."
pm2 start ecosystem.config.cjs --env production || { echo "❌ PM2 start failed"; exit 1; }

echo ""
echo "💾 Step 6: Saving PM2 configuration..."
pm2 save || { echo "❌ PM2 save failed"; exit 1; }

echo ""
echo "📊 Step 7: PM2 Status..."
pm2 list

echo ""
echo "🔍 Step 8: Testing database connection..."
PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT COUNT(*) FROM \"Job\";" || echo "⚠️ Database test query failed"

echo ""
echo "🌐 Step 9: Testing API endpoints..."
sleep 3
curl -s "http://localhost:3000/api/jobs/56" | head -c 200
echo ""

echo ""
echo "✅ Deployment complete!"
echo "================================"
echo "📝 Next steps:"
echo "1. Check logs: pm2 logs jobportal --lines 20"
echo "2. Monitor: pm2 monit"
echo "3. Test URL: https://aftionix.in/jobs/56"

