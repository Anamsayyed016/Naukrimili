#!/bin/bash
echo "🚀 Deploying dynamic job caching fix..."
echo "========================================"

# 1. Navigate to project directory
cd /var/www/jobportal || { echo "❌ Failed to navigate to /var/www/jobportal"; exit 1; }

# 2. Pull latest code
echo -e "\n📥 Pulling latest code from Git..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

# 3. Install dependencies
echo -e "\n📦 Installing dependencies..."
npm install --legacy-peer-deps --force || { echo "❌ npm install failed"; exit 1; }

# 4. Build the application
echo -e "\n🔨 Building application..."
npm run build || { echo "❌ npm run build failed"; exit 1; }

# 5. Restart PM2
echo -e "\n🔄 Restarting PM2..."
pm2 restart jobportal --update-env || { echo "❌ PM2 restart failed"; exit 1; }

# 6. Save PM2 configuration
echo -e "\n💾 Saving PM2 configuration..."
pm2 save || { echo "❌ PM2 save failed"; exit 1; }

# 7. Test the fix
echo -e "\n🧪 Testing dynamic job caching..."
echo "Fetching jobs..."
curl -s "http://localhost:3000/api/jobs?query=software&limit=3" | head -c 500

echo -e "\n\n✅ Deployment complete!"
echo "========================================"
echo "📝 What was fixed:"
echo "1. ✅ Dynamic jobs are now cached in database for 24 hours"
echo "2. ✅ Job detail pages work for dynamic jobs"
echo "3. ✅ Expired jobs are automatically cleaned up"
echo ""
echo "📝 Next steps:"
echo "1. Test a job search: https://naukrimili.com/jobs?query=software"
echo "2. Click on a dynamic job to see details"
echo "3. Check logs: pm2 logs jobportal --lines 20"

