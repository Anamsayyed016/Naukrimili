#!/bin/bash

echo "🚀 Starting dynamic job search deployment..."
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
echo "🔍 Step 8: Testing dynamic job search..."
sleep 3

echo "Testing BPO jobs search..."
curl -s "http://localhost:3000/api/jobs?query=bpo&limit=5" | head -c 300
echo ""

echo "Testing marketing jobs search..."
curl -s "http://localhost:3000/api/jobs?query=marketing&limit=5" | head -c 300
echo ""

echo "Testing software jobs search..."
curl -s "http://localhost:3000/api/jobs?query=software&limit=5" | head -c 300
echo ""

echo "Testing sales jobs search..."
curl -s "http://localhost:3000/api/jobs?query=sales&limit=5" | head -c 300
echo ""

echo ""
echo "✅ Dynamic job search deployment complete!"
echo "=========================================="
echo "📝 What was implemented:"
echo "1. ✅ Dynamic job search for ANY keyword (bpo, marketing, sales, etc.)"
echo "2. ✅ Real company names and job titles for each sector"
echo "3. ✅ External API integration (JSearch, RapidAPI)"
echo "4. ✅ Fallback to realistic generated jobs when APIs fail"
echo "5. ✅ Removed forced sample job generation"
echo ""
echo "📝 Test URLs:"
echo "1. BPO jobs: https://aftionix.in/jobs?query=bpo"
echo "2. Marketing jobs: https://aftionix.in/jobs?query=marketing"
echo "3. Software jobs: https://aftionix.in/jobs?query=software"
echo "4. Sales jobs: https://aftionix.in/jobs?query=sales"
echo "5. HR jobs: https://aftionix.in/jobs?query=hr"
echo "6. Design jobs: https://aftionix.in/jobs?query=design"
echo ""
echo "🔧 To add real API keys (optional):"
echo "1. Get JSearch API key from RapidAPI"
echo "2. Add JSEARCH_API_KEY to .env file"
echo "3. Restart PM2: pm2 restart jobportal"
echo ""
echo "📊 Monitor logs: pm2 logs jobportal --lines 20"
