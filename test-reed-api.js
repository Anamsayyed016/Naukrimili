// Using PowerShell-compatible testing since TypeScript needs compilation

// Test script for Reed API
async function testReedAPI() {
  console.log('🧪 Testing Reed API Integration...\n');

  try {
    // Initialize Reed service
    const reed = new ReedService();
    console.log('✅ Reed service initialized successfully');

    // Test 1: Get specific job by ID
    console.log('\n📋 Test 1: Fetching job ID 132...');
    try {
      const job = await reed.getFormattedJob(132);
      console.log('✅ Job fetched successfully:');
      console.log(`   Title: ${job.title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Salary: ${job.salary}`);
      console.log(`   URL: ${job.url}`);
    } catch (error) {
      console.log('❌ Failed to fetch job 132:', error.message);
    }

    // Test 2: Search for jobs
    console.log('\n🔍 Test 2: Searching for JavaScript developer jobs in London...');
    try {
      const searchResults = await reed.searchFormattedJobs({
        keywords: 'JavaScript developer',
        locationName: 'London',
        resultsToTake: 5
      });
      
      console.log(`✅ Found ${searchResults.totalResults} total jobs`);
      console.log(`   Showing first ${searchResults.jobs.length} results:`);
      
      searchResults.jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`      Location: ${job.location}`);
        console.log(`      Salary: ${job.salary}`);
      });
    } catch (error) {
      console.log('❌ Failed to search jobs:', error.message);
    }

    // Test 3: Search for remote jobs
    console.log('\n🏠 Test 3: Searching for remote developer jobs...');
    try {
      const remoteResults = await reed.searchFormattedJobs({
        keywords: 'developer remote',
        resultsToTake: 3
      });
      
      console.log(`✅ Found ${remoteResults.totalResults} total remote jobs`);
      console.log(`   Showing first ${remoteResults.jobs.length} results:`);
      
      remoteResults.jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`      Location: ${job.location}`);
        console.log(`      Remote: ${job.remote ? 'Yes' : 'No'}`);
        console.log(`      Type: ${job.type}`);
      });
    } catch (error) {
      console.log('❌ Failed to search remote jobs:', error.message);
    }

  } catch (error) {
    console.error('❌ Reed API test failed:', error.message);
    
    if (error.message.includes('Reed API key is required')) {
      console.log('\n📝 Setup Instructions:');
      console.log('1. Register for a Reed API key at: https://www.reed.co.uk/developers');
      console.log('2. Update your .env.local file with: REED_API_KEY=your_actual_api_key');
      console.log('3. Run this test again');
    }
  }
}

// PowerShell compatible version
async function testReedAPIPowerShell() {
  const https = require('https');
  const fs = require('fs');
  const path = require('path');

  console.log('🧪 Testing Reed API with PowerShell...\n');

  // Read API key from .env.local
  const envPath = path.join(__dirname, '.env.local');
  let apiKey = '';
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/REED_API_KEY=(.+)/);
    apiKey = match ? match[1].trim() : '';
  } catch (error) {
    console.log('❌ Could not read .env.local file');
    return;
  }

  if (!apiKey || apiKey === 'your_reed_api_key_here') {
    console.log('❌ Reed API key not configured');
    console.log('\n📝 Setup Instructions:');
    console.log('1. Register for a Reed API key at: https://www.reed.co.uk/developers');
    console.log('2. Update your .env.local file with: REED_API_KEY=your_actual_api_key');
    return;
  }

  // Test job fetch
  console.log('📋 Testing job fetch for ID 132...');
  
  const credentials = Buffer.from(`${apiKey}:`).toString('base64');
  
  const options = {
    hostname: 'www.reed.co.uk',
    path: '/api/1.0/jobs/132',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'User-Agent': 'JobPortal/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const job = JSON.parse(data);
            console.log('✅ Reed API is working! Job details:');
            console.log(`   Job ID: ${job.jobId}`);
            console.log(`   Title: ${job.jobTitle}`);
            console.log(`   Company: ${job.employerName}`);
            console.log(`   Location: ${job.locationName}`);
            console.log(`   Posted: ${job.date}`);
            console.log(`   URL: ${job.jobUrl}`);
            resolve(job);
          } catch (error) {
            console.log('❌ Invalid JSON response:', error.message);
            reject(error);
          }
        } else {
          console.log(`❌ API request failed: ${res.statusCode} ${res.statusMessage}`);
          if (res.statusCode === 401) {
            console.log('   Check your Reed API key is correct');
          }
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Network error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Run the appropriate test
if (typeof require !== 'undefined' && require.main === module) {
  testReedAPIPowerShell()
    .then(() => console.log('\n🎉 Reed API test completed successfully!'))
    .catch(() => console.log('\n💥 Reed API test failed!'));
}
