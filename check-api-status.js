#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function loadEnvFile() {
  try {
    const envPath = '.env.local';
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const env = {};
      content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      });
      return env;
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.local file');
  }
  return {};
}

async function checkAPIStatus() {
  console.log('🔍 Checking Job Portal API Status...\n');

  const baseUrl = 'http://localhost:3000';
  const env = loadEnvFile();

  try {
    // Test 1: Debug endpoint
    console.log('1️⃣ Testing Debug Endpoint...');
    const debugResult = await makeRequest(`${baseUrl}/api/jobs/debug`);
    
    if (debugResult.status === 200) {
      console.log('✅ Debug endpoint: WORKING');
      console.log('📊 API Status:', debugResult.data.apiStatus);
      console.log('🔧 Environment:', debugResult.data.environment);
    } else {
      console.log('❌ Debug endpoint: FAILED (Status:', debugResult.status, ')');
    }

    // Test 2: Main Jobs API
    console.log('\n2️⃣ Testing Main Jobs API...');
    const jobsResult = await makeRequest(`${baseUrl}/api/jobs?q=software%20engineer&location=Mumbai&limit=3`);
    
    if (jobsResult.status === 200 && jobsResult.data.success) {
      console.log('✅ Main Jobs API: WORKING');
      console.log(`📋 Jobs found: ${jobsResult.data.total}`);
      console.log(`🎯 Source: ${jobsResult.data.meta?.source || 'Unknown'}`);
      
      if (jobsResult.data.jobs.length > 0) {
        console.log('📝 Sample job:', jobsResult.data.jobs[0].title, 'at', jobsResult.data.jobs[0].company);
      }
    } else {
      console.log('❌ Main Jobs API: FAILED');
      if (jobsResult.data.error) {
        console.log('   Error:', jobsResult.data.error);
      }
    }

    // Test 3: SerpApi directly
    console.log('\n3️⃣ Testing SerpApi...');
    const serpResult = await makeRequest(`${baseUrl}/api/jobs/serpapi?q=developer&location=Mumbai&num=3`);
    
    if (serpResult.status === 200) {
      console.log('✅ SerpApi: WORKING');
      if (serpResult.data.jobs && serpResult.data.jobs.length > 0) {
        console.log(`📋 SerpApi jobs: ${serpResult.data.jobs.length}`);
      } else {
        console.log('⚠️ SerpApi: No jobs returned (might be rate limited)');
      }
    } else {
      console.log('❌ SerpApi: FAILED (Status:', serpResult.status, ')');
    }

    // Test 4: Adzuna directly
    console.log('\n4️⃣ Testing Adzuna...');
    const adzunaResult = await makeRequest(`${baseUrl}/api/jobs/search?what=developer&where=Mumbai&results_per_page=3`);
    
    if (adzunaResult.status === 200) {
      console.log('✅ Adzuna: WORKING');
      if (adzunaResult.data.results && adzunaResult.data.results.length > 0) {
        console.log(`📋 Adzuna jobs: ${adzunaResult.data.results.length}`);
      } else {
        console.log('⚠️ Adzuna: No jobs returned (might need API keys)');
      }
    } else {
      console.log('❌ Adzuna: FAILED (Status:', adzunaResult.status, ')');
      if (adzunaResult.data.error) {
        console.log('   Error:', adzunaResult.data.error);
      }
    }

    // Test 5: Reed API directly
    console.log('\n5️⃣ Testing Reed API...');
    const reedResult = await makeRequest(`${baseUrl}/api/jobs/reed?keywords=developer&locationName=London&resultsToTake=3`);
    
    if (reedResult.status === 200) {
      console.log('✅ Reed API: WORKING');
      if (reedResult.data.jobs && reedResult.data.jobs.length > 0) {
        console.log(`📋 Reed jobs: ${reedResult.data.jobs.length}`);
      } else {
        console.log('⚠️ Reed API: No jobs returned (might need API key)');
      }
    } else {
      console.log('❌ Reed API: FAILED (Status:', reedResult.status, ')');
      if (reedResult.data.error) {
        console.log('   Error:', reedResult.data.error);
      }
    }

    // Summary
    console.log('\n🎯 API Status Summary:');
    console.log('=====================');
    console.log(`✅ Debug Endpoint: ${debugResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Main Jobs API: ${jobsResult.status === 200 && jobsResult.data.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ SerpApi: ${serpResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Adzuna: ${adzunaResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Reed API: ${reedResult.status === 200 ? 'WORKING' : 'FAILED'}`);

    // Check environment variables
    console.log('\n🔧 Environment Check:');
    console.log('===================');
    console.log('SERPAPI_KEY:', env.SERPAPI_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('ADZUNA_APP_ID:', env.ADZUNA_APP_ID ? '✅ SET' : '❌ NOT SET');
    console.log('ADZUNA_API_KEY:', env.ADZUNA_API_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('REED_API_KEY:', env.REED_API_KEY ? '✅ SET' : '❌ NOT SET');

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('==================');
    
    if (!env.SERPAPI_KEY) {
      console.log('🔑 Get SerpApi key: https://serpapi.com/');
    }
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_API_KEY) {
      console.log('💰 Get Adzuna keys: https://developer.adzuna.com/');
    }
    if (!env.REED_API_KEY) {
      console.log('🇬🇧 Get Reed key: https://www.reed.co.uk/developers');
    }

    if (jobsResult.status === 200 && jobsResult.data.success) {
      console.log('\n🎉 Your job portal is working! Visit: http://localhost:3000/jobs');
    } else {
      console.log('\n⚠️ Job portal needs configuration. Run: node get-free-api-keys.js');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure development server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify environment variables in .env.local');
  }
}

// Run the check
checkAPIStatus(); 