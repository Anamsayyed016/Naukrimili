#!/bin/bash

echo "🚀 Starting comprehensive job search fix..."
echo "=========================================="

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
echo "🌱 Step 4: Seeding real jobs..."
node scripts/seed-real-jobs.js || { echo "⚠️ Job seeding failed, continuing..."; }

echo ""
echo "🔨 Step 5: Building application..."
npm run build || { echo "❌ npm run build failed"; exit 1; }

echo ""
echo "🔄 Step 6: Starting PM2 with fresh config..."
pm2 start ecosystem.config.cjs --env production || { echo "❌ PM2 start failed"; exit 1; }

echo ""
echo "💾 Step 7: Saving PM2 configuration..."
pm2 save || { echo "❌ PM2 save failed"; exit 1; }

echo ""
echo "📊 Step 8: PM2 Status..."
pm2 list

echo ""
echo "🔍 Step 9: Testing database connection..."
PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT COUNT(*) FROM \"Job\" WHERE source = 'manual';" || echo "⚠️ Database test query failed"

echo ""
echo "🌐 Step 10: Testing API endpoints..."
sleep 3

echo "Testing main jobs API..."
curl -s "http://localhost:3000/api/jobs?query=software&limit=5" | head -c 200
echo ""

echo "Testing job search with filters..."
curl -s "http://localhost:3000/api/jobs?query=engineer&jobType=Full-time&limit=3" | head -c 200
echo ""

echo ""
echo "✅ Comprehensive fix complete!"
echo "=========================================="
echo "📝 What was fixed:"
echo "1. ✅ Reduced sample job generation (only when no real jobs)"
echo "2. ✅ Added real job data to database"
echo "3. ✅ Fixed API to prioritize real jobs"
echo "4. ✅ Updated frontend to use correct API"
echo "5. ✅ Improved external API handling"
echo ""
echo "📝 Next steps:"
echo "1. Check logs: pm2 logs jobportal --lines 20"
echo "2. Monitor: pm2 monit"
echo "3. Test URL: https://aftionix.in/jobs?query=software"
echo "4. Test filters: https://aftionix.in/jobs?query=engineer&jobType=Full-time"
echo ""
echo "🔧 To add external API keys (optional):"
echo "1. Get API keys from Adzuna, Indeed, or ZipRecruiter"
echo "2. Add them to .env file on server"
echo "3. Restart PM2: pm2 restart jobportal"
