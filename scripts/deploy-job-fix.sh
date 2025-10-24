#!/bin/bash

# Deploy Job Fix - Fix job detail issues on production server
# This script will:
# 1. Set up environment variables
# 2. Import real jobs
# 3. Create test jobs
# 4. Verify functionality

echo "🚀 Starting job detail fix deployment..."

# Set environment variables
echo "📝 Setting up environment variables..."
cat > .env << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=https://naukrimili.com
NEXTAUTH_SECRET=jobportal-secret-key-2024-naukrimili-production-deployment

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobportal"

# JWT Secret
JWT_SECRET=jobportal-jwt-secret-2024-naukrimili-production

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://naukrimili.com
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true

# 3RD PARTY JOB API KEYS - CRITICAL FOR REAL JOBS
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc

# Indeed API
INDEED_PUBLISHER_ID=your-indeed-publisher-id

# ZipRecruiter API
ZIPRECRUITER_API_KEY=your-ziprecruiter-api-key

# Google APIs
GOOGLE_JOBS_API_KEY=your-google-jobs-api-key
GOOGLE_GEOLOCATION_API_KEY=your-google-geolocation-api-key
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

echo "✅ Environment variables set up"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --force

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run the job fix script
echo "🔧 Running job fix script..."
node scripts/fix-job-detail-issue.js

# Test the application
echo "🧪 Testing application..."
curl -f http://localhost:3000/api/debug/health || echo "⚠️ Health check failed"

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart jobportal

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "🎉 Job detail fix deployment completed!"
echo "📝 Test URLs:"
echo "- Health: https://naukrimili.com/api/debug/health"
echo "- Jobs: https://naukrimili.com/jobs"
echo "- Job ID 56: https://naukrimili.com/jobs/56"
