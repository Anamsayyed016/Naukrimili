#!/usr/bin/env node

/**
 * Setup Real Jobs - Import jobs from external APIs
 * This script will:
 * 1. Check API keys configuration
 * 2. Import real jobs from external APIs
 * 3. Test job detail functionality
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up real jobs for the job portal...');

// API Keys (using the ones found in the codebase)
const API_KEYS = {
  ADZUNA_APP_ID: 'bdd02427',
  ADZUNA_APP_KEY: 'abf03277d13e4cb39b24bf236ad29299',
  RAPIDAPI_KEY: '3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc',
  RAPIDAPI_HOST: 'jsearch.p.rapidapi.com',
  JSEARCH_API_KEY: '3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc'
};

// Create .env file with API keys
function createEnvFile() {
  console.log('📝 Creating .env file with API keys...');
  
  const envContent = `# NextAuth Configuration
NEXTAUTH_URL=https://naukrimili.com
NEXTAUTH_SECRET=jobportal-secret-key-2024-naukrimili-production-deployment

# Google OAuth (Required for Gmail Authentication)
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
ADZUNA_APP_ID=${API_KEYS.ADZUNA_APP_ID}
ADZUNA_APP_KEY=${API_KEYS.ADZUNA_APP_KEY}
RAPIDAPI_KEY=${API_KEYS.RAPIDAPI_KEY}
RAPIDAPI_HOST=${API_KEYS.RAPIDAPI_HOST}
JSEARCH_API_KEY=${API_KEYS.JSEARCH_API_KEY}

# Indeed API (Free)
INDEED_PUBLISHER_ID=your-indeed-publisher-id

# ZipRecruiter API (Free)
ZIPRECRUITER_API_KEY=your-ziprecruiter-api-key

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

  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created with API keys');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    return false;
  }
}

// Test API connectivity
async function testAPIs() {
  console.log('🧪 Testing API connectivity...');
  
  const { fetchFromAdzuna } = await import('../lib/jobs/providers.js');
  
  try {
    console.log('🔍 Testing Adzuna API...');
    const jobs = await fetchFromAdzuna('software developer', 'in', 1, {});
    console.log(`✅ Adzuna API working: Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      console.log('📋 Sample job:', {
        title: jobs[0].title,
        company: jobs[0].company,
        location: jobs[0].location,
        sourceId: jobs[0].sourceId
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Import real jobs
async function importRealJobs() {
  console.log('📥 Importing real jobs from external APIs...');
  
  try {
    const response = await fetch('http://localhost:3000/api/jobs/import-live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'software developer',
        location: 'India',
        country: 'IN'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Jobs imported successfully!');
      console.log(`📊 Total jobs: ${data.totalJobs}`);
      console.log(`🔗 Unique jobs: ${data.uniqueJobs}`);
      console.log('📋 Providers:', data.providers);
      
      return data.jobs;
    } else {
      throw new Error(data.error || 'Import failed');
    }
  } catch (error) {
    console.error('❌ Job import failed:', error.message);
    return null;
  }
}

// Test job detail functionality
async function testJobDetail(jobs) {
  if (!jobs || jobs.length === 0) {
    console.log('⚠️ No jobs to test with');
    return;
  }
  
  console.log('🧪 Testing job detail functionality...');
  
  const testJob = jobs[0];
  const jobId = testJob.sourceId || testJob.id;
  
  try {
    console.log(`🔍 Testing job detail for ID: ${jobId}`);
    
    const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Job detail API working!');
      console.log('📋 Job details:', {
        id: data.data?.id,
        title: data.data?.title,
        company: data.data?.company,
        hasRedirectUrl: !!data.data?.redirectUrl
      });
    } else {
      console.error(`❌ Job detail API failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Job detail test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🎯 Starting real jobs setup...');
  
  // Step 1: Create .env file
  const envCreated = createEnvFile();
  if (!envCreated) {
    console.log('❌ Cannot proceed without .env file');
    return;
  }
  
  // Step 2: Test APIs
  const apisWorking = await testAPIs();
  if (!apisWorking) {
    console.log('❌ APIs not working, check your internet connection and API keys');
    return;
  }
  
  // Step 3: Import real jobs
  const jobs = await importRealJobs();
  if (!jobs) {
    console.log('❌ Failed to import jobs');
    return;
  }
  
  // Step 4: Test job detail functionality
  await testJobDetail(jobs);
  
  console.log('🎉 Real jobs setup completed!');
  console.log('📝 Next steps:');
  console.log('1. Restart your application: npm run dev');
  console.log('2. Visit: http://localhost:3000/jobs');
  console.log('3. Click on any job to test the detail page');
  console.log('4. Jobs should now redirect to external sources');
}

// Run the setup
main().catch(console.error);
