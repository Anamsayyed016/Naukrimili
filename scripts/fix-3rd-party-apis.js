#!/usr/bin/env node

/**
 * 🚀 3RD PARTY API FIX SCRIPT
 * This script fixes the 3rd party job API integration issues
 * and sets up proper API keys for dynamic job fetching
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';

console.log('🚀 Starting 3rd Party API Fix...');

// API Keys (using the ones found in the codebase)
const API_KEYS = {
  ADZUNA_APP_ID: 'bdd02427',
  ADZUNA_APP_KEY: 'abf03277d13e4cb39b24bf236ad29299',
  RAPIDAPI_KEY: '3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc',
  JOOBLE_API_KEY: 'your-jooble-api-key' // This needs to be obtained from Jooble
};

// Create .env file with API keys
function createEnvFile() {
  console.log('📝 Creating .env file with API keys...');
  
  const envContent = `# NextAuth Configuration
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
ADZUNA_APP_ID=${API_KEYS.ADZUNA_APP_ID}
ADZUNA_APP_KEY=${API_KEYS.ADZUNA_APP_KEY}
RAPIDAPI_KEY=${API_KEYS.RAPIDAPI_KEY}
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=${API_KEYS.RAPIDAPI_KEY}
JOOBLE_API_KEY=${API_KEYS.JOOBLE_API_KEY}

# Google APIs (Optional)
GOOGLE_JOBS_API_KEY=your-google-jobs-api-key
GOOGLE_GEOLOCATION_API_KEY=your-google-geolocation-api-key
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created with API keys');
}

// Test API connectivity
async function testAPIs() {
  console.log('🧪 Testing API connectivity...');
  
  // Test Adzuna API
  try {
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${API_KEYS.ADZUNA_APP_ID}&app_key=${API_KEYS.ADZUNA_APP_KEY}&what=software developer&results_per_page=5`;
    const response = await axios.get(adzunaUrl, { timeout: 10000 });
    console.log(`✅ Adzuna API: ${response.data.results?.length || 0} jobs found`);
  } catch (error) {
    console.log(`❌ Adzuna API: ${error.message}`);
  }
  
  // Test JSearch API
  try {
    const jsearchUrl = 'https://jsearch.p.rapidapi.com/search';
    const response = await axios.get(jsearchUrl, {
      params: { query: 'software developer jobs', page: 1, num_pages: 1, country: 'IN' },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': API_KEYS.RAPIDAPI_KEY,
      },
      timeout: 10000
    });
    console.log(`✅ JSearch API: ${response.data.data?.length || 0} jobs found`);
  } catch (error) {
    console.log(`❌ JSearch API: ${error.message}`);
  }
}

// Create API health check endpoint
function createHealthCheckEndpoint() {
  console.log('🏥 Creating API health check endpoint...');
  
  const healthCheckContent = `import { NextRequest, NextResponse } from 'next/server';
import { checkJobProvidersHealth } from '@/lib/jobs/providers';

export async function GET(request: NextRequest) {
  try {
    const health = await checkJobProvidersHealth();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: health,
      summary: {
        totalProviders: 4,
        healthyProviders: Object.values(health).filter(Boolean).length,
        configuredProviders: Object.keys(health.details).filter(key => 
          health.details[key].status !== 'not_configured'
        ).length
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}`;

  const dir = 'app/api/debug/health';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'route.ts'), healthCheckContent);
  console.log('✅ API health check endpoint created at /api/debug/health');
}

// Create job import endpoint
function createJobImportEndpoint() {
  console.log('📥 Creating job import endpoint...');
  
  const importContent = `import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from '@/lib/jobs/providers';

export async function POST(request: NextRequest) {
  try {
    const { query = 'software developer', location = 'India', country = 'IN' } = await request.json();
    
    console.log(\`🚀 Importing jobs for: "\${query}" in "\${location}"\`);
    
    // Fetch from all providers
    const [adzunaJobs, jsearchJobs, googleJobs, joobleJobs] = await Promise.allSettled([
      fetchFromAdzuna(query, country.toLowerCase(), 1, { location }),
      fetchFromJSearch(query, country.toUpperCase(), 1),
      fetchFromGoogleJobs(query, location, 1),
      fetchFromJooble(query, location, 1, { countryCode: country.toLowerCase() })
    ]);
    
    const allJobs = [
      ...(adzunaJobs.status === 'fulfilled' ? adzunaJobs.value : []),
      ...(jsearchJobs.status === 'fulfilled' ? jsearchJobs.value : []),
      ...(googleJobs.status === 'fulfilled' ? googleJobs.value : []),
      ...(joobleJobs.status === 'fulfilled' ? joobleJobs.value : [])
    ];
    
    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.title === job.title && j.company === job.company)
    );
    
    return NextResponse.json({
      success: true,
      totalJobs: allJobs.length,
      uniqueJobs: uniqueJobs.length,
      jobs: uniqueJobs.slice(0, 50), // Return first 50 jobs
      providers: {
        adzuna: adzunaJobs.status === 'fulfilled' ? adzunaJobs.value.length : 0,
        jsearch: jsearchJobs.status === 'fulfilled' ? jsearchJobs.value.length : 0,
        google: googleJobs.status === 'fulfilled' ? googleJobs.value.length : 0,
        jooble: joobleJobs.status === 'fulfilled' ? joobleJobs.value.length : 0
      }
    });
  } catch (error) {
    console.error('❌ Job import error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}`;

  const dir = 'app/api/jobs/import-live';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'route.ts'), importContent);
  console.log('✅ Live job import endpoint created at /api/jobs/import-live');
}

// Fix the unified jobs API to prioritize external jobs
function fixUnifiedJobsAPI() {
  console.log('🔧 Fixing unified jobs API...');
  
  const unifiedPath = 'app/api/jobs/unified/route.ts';
  if (fs.existsSync(unifiedPath)) {
    let content = fs.readFileSync(unifiedPath, 'utf8');
    
    // Ensure includeExternal defaults to true
    content = content.replace(
      /includeExternal = false/g,
      'includeExternal = true'
    );
    
    // Ensure external jobs are prioritized
    content = content.replace(
      /if \(includeExternal\) {/g,
      'if (includeExternal !== false) {'
    );
    
    fs.writeFileSync(unifiedPath, content);
    console.log('✅ Unified jobs API fixed to prioritize external jobs');
  }
}

// Create a simple test script
function createTestScript() {
  console.log('🧪 Creating test script...');
  
  const testContent = `#!/usr/bin/env node

/**
 * Test script for 3rd party job APIs
 */

const axios = require('axios');

async function testJobAPIs() {
  console.log('🧪 Testing Job APIs...');
  
  try {
    // Test health check
    const healthResponse = await axios.get('http://localhost:3000/api/debug/health');
    console.log('🏥 Health Check:', healthResponse.data);
    
    // Test job import
    const importResponse = await axios.post('http://localhost:3000/api/jobs/import-live', {
      query: 'software developer',
      location: 'Bangalore',
      country: 'IN'
    });
    console.log('📥 Job Import:', {
      totalJobs: importResponse.data.totalJobs,
      uniqueJobs: importResponse.data.uniqueJobs,
      providers: importResponse.data.providers
    });
    
    // Test unified search
    const searchResponse = await axios.get('http://localhost:3000/api/jobs/unified?query=software&location=Bangalore&includeExternal=true');
    console.log('🔍 Unified Search:', {
      totalJobs: searchResponse.data.total,
      externalJobs: searchResponse.data.sources?.external || 0,
      databaseJobs: searchResponse.data.sources?.database || 0
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJobAPIs();`;

  fs.writeFileSync('test-job-apis.js', testContent);
  console.log('✅ Test script created: test-job-apis.js');
}

// Main execution
async function main() {
  try {
    createEnvFile();
    await testAPIs();
    createHealthCheckEndpoint();
    createJobImportEndpoint();
    fixUnifiedJobsAPI();
    createTestScript();
    
    console.log('\\n🎉 3rd Party API Fix Complete!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Restart your application: pm2 restart jobportal');
    console.log('2. Test APIs: node test-job-apis.js');
    console.log('3. Check health: curl http://localhost:3000/api/debug/health');
    console.log('4. Import jobs: curl -X POST http://localhost:3000/api/jobs/import-live -H "Content-Type: application/json" -d \'{"query":"software developer","location":"Bangalore"}\'');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

main();
