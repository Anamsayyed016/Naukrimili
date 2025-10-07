#!/bin/bash

# 🚀 3RD PARTY API DEPLOYMENT FIX SCRIPT
# This script deploys the 3rd party API fixes to the production server

set -e

echo "🚀 Starting 3rd Party API Deployment Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Current directory: $(pwd)"

# Step 1: Run the 3rd party API fix script
print_status "🔧 Running 3rd party API fix script..."
node scripts/fix-3rd-party-apis.js

# Step 2: Run the job redirect fix script
print_status "🔗 Running job redirect fix script..."
node scripts/fix-job-redirects.js

# Step 3: Update the deployment workflow to include API keys
print_status "📝 Updating deployment workflow..."
if [ -f ".github/workflows/deploy.yml" ]; then
    # Add API keys to the deployment workflow
    sed -i '/DATABASE_URL=/a\        ADZUNA_APP_ID: bdd02427\n        ADZUNA_APP_KEY: abf03277d13e4cb39b24bf236ad29299\n        RAPIDAPI_KEY: 3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc' .github/workflows/deploy.yml
    print_success "Deployment workflow updated with API keys"
fi

# Step 4: Create a production environment file
print_status "🌍 Creating production environment file..."
cat > .env.production << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=jobportal-secret-key-2024-aftionix-production-deployment

# Google OAuth (Required for Gmail Authentication)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobportal"

# JWT Secret
JWT_SECRET=jobportal-jwt-secret-2024-aftionix-production

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aftionix.in
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true

# 3RD PARTY JOB API KEYS - CRITICAL FOR REAL JOBS
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
JOOBLE_API_KEY=your-jooble-api-key

# Google APIs (Optional)
GOOGLE_JOBS_API_KEY=your-google-jobs-api-key
GOOGLE_GEOLOCATION_API_KEY=your-google-geolocation-api-key
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
EOF

print_success "Production environment file created"

# Step 5: Test the fixes locally
print_status "🧪 Testing fixes locally..."
if command -v node >/dev/null 2>&1; then
    # Test API connectivity
    node -e "
    const axios = require('axios');
    async function test() {
        try {
            const response = await axios.get('https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=bdd02427&app_key=abf03277d13e4cb39b24bf236ad29299&what=software developer&results_per_page=5', { timeout: 10000 });
            console.log('✅ Adzuna API test successful:', response.data.results?.length || 0, 'jobs found');
        } catch (error) {
            console.log('❌ Adzuna API test failed:', error.message);
        }
    }
    test();
    "
else
    print_warning "Node.js not available for local testing"
fi

# Step 6: Create deployment instructions
print_status "📋 Creating deployment instructions..."
cat > DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# 🚀 3rd Party API Deployment Instructions

## What Was Fixed

1. **API Keys Configuration**: Added proper API keys for Adzuna, JSearch, and RapidAPI
2. **Job Redirect System**: Fixed external job redirects to work properly
3. **Dynamic Job Fetching**: Enabled real-time job fetching from 3rd party APIs
4. **Health Monitoring**: Added API health check endpoints

## Deployment Steps

### 1. Deploy to Server
```bash
# Push changes to GitHub
git add .
git commit -m "Fix 3rd party APIs and job redirects"
git push origin main
```

### 2. On Production Server
```bash
# Navigate to project directory
cd /var/www/jobportal

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --legacy-peer-deps --force

# Restart the application
pm2 restart jobportal

# Check status
pm2 status
```

### 3. Test the Fixes
```bash
# Test API health
curl http://localhost:3000/api/debug/health

# Test job import
curl -X POST http://localhost:3000/api/jobs/import-live \
  -H "Content-Type: application/json" \
  -d '{"query":"software developer","location":"Bangalore"}'

# Test unified search
curl "http://localhost:3000/api/jobs/unified?query=software&location=Bangalore&includeExternal=true"
```

### 4. Verify External Jobs
1. Visit https://aftionix.in/jobs
2. Search for "software developer"
3. Click on any job with external source
4. Verify it redirects to the actual job posting

## API Keys Used

- **Adzuna**: bdd02427 / abf03277d13e4cb39b24bf236ad29299
- **RapidAPI**: 3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
- **JSearch**: Uses RapidAPI key
- **Google Jobs**: Uses RapidAPI key

## Monitoring

- Health Check: `/api/debug/health`
- Job Import: `/api/jobs/import-live`
- Analytics: `/api/analytics/job-redirect`

## Troubleshooting

If jobs are still not showing:
1. Check API health: `curl http://localhost:3000/api/debug/health`
2. Check logs: `pm2 logs jobportal`
3. Test API directly: `node test-job-apis.js`
4. Check environment variables: `pm2 show jobportal`

EOF

print_success "Deployment instructions created"

# Step 7: Create a quick test script
print_status "🧪 Creating quick test script..."
cat > quick-test-apis.js << 'EOF'
#!/usr/bin/env node

const axios = require('axios');

async function quickTest() {
    console.log('🧪 Quick API Test...');
    
    try {
        // Test Adzuna directly
        const adzunaUrl = 'https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=bdd02427&app_key=abf03277d13e4cb39b24bf236ad29299&what=software developer&results_per_page=5';
        const response = await axios.get(adzunaUrl, { timeout: 10000 });
        console.log('✅ Adzuna API:', response.data.results?.length || 0, 'jobs found');
        
        if (response.data.results?.length > 0) {
            const job = response.data.results[0];
            console.log('📋 Sample job:', {
                title: job.title,
                company: job.company?.display_name,
                location: job.location?.display_name,
                redirect_url: job.redirect_url
            });
        }
        
    } catch (error) {
        console.log('❌ API Test failed:', error.message);
    }
}

quickTest();
EOF

chmod +x quick-test-apis.js
print_success "Quick test script created: quick-test-apis.js"

print_success "🎉 3rd Party API Deployment Fix Complete!"
print_status "📋 Next Steps:"
echo "1. Test locally: node quick-test-apis.js"
echo "2. Deploy to server: git add . && git commit -m 'Fix 3rd party APIs' && git push"
echo "3. On server: git pull && pm2 restart jobportal"
echo "4. Test on server: curl http://localhost:3000/api/debug/health"
echo "5. Check jobs: Visit https://aftionix.in/jobs"
