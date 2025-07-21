#!/usr/bin/env node

const https = require('https');
const http = require('http');

function makeRequest(url, timeout = 15000) {
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
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testAllAPIs() {
  console.log('🚀 Comprehensive Job Portal API Test\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Debug endpoint
    console.log('1️⃣ Testing Debug Endpoint...');
    const debugResult = await makeRequest(`${baseUrl}/api/jobs/debug`, 10000);
    
    if (debugResult.status === 200) {
      console.log('✅ Debug endpoint: WORKING');
      console.log('📊 API Status:', debugResult.data.apiStatus);
      console.log('🔧 Environment:', debugResult.data.environment);
    } else {
      console.log('❌ Debug endpoint: FAILED');
    }

    // Test 2: Main jobs API
    console.log('\n2️⃣ Testing Main Jobs API...');
    const jobsResult = await makeRequest(`${baseUrl}/api/jobs?q=software%20engineer&location=Mumbai&limit=5`, 15000);
    
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
    const serpResult = await makeRequest(`${baseUrl}/api/jobs/serpapi?q=developer&location=Mumbai&num=3`, 20000);
    
    if (serpResult.status === 200) {
      console.log('✅ SerpApi: WORKING');
      if (serpResult.data.results && serpResult.data.results.length > 0) {
        console.log(`📋 SerpApi jobs: ${serpResult.data.results.length}`);
        console.log('📝 Sample:', serpResult.data.results[0].title);
      } else {
        console.log('⚠️ SerpApi: No jobs returned (might be rate limited)');
      }
    } else {
      console.log('❌ SerpApi: FAILED (Status:', serpResult.status, ')');
      if (serpResult.data.error) {
        console.log('   Error:', serpResult.data.error);
      }
    }

    // Test 4: Location-based search
    console.log('\n4️⃣ Testing Location Search...');
    const locationResult = await makeRequest(`${baseUrl}/api/jobs?q=developer&location=Delhi&limit=3`, 15000);
    
    if (locationResult.status === 200 && locationResult.data.success) {
      console.log('✅ Location Search: WORKING');
      console.log(`📍 Delhi search: ${locationResult.data.total} jobs found`);
    } else {
      console.log('❌ Location Search: FAILED');
    }

    // Summary
    console.log('\n🎯 Final API Status:');
    console.log('===================');
    console.log(`Debug Endpoint: ${debugResult.status === 200 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Main Jobs API: ${jobsResult.status === 200 && jobsResult.data.success ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`SerpApi: ${serpResult.status === 200 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Location Search: ${locationResult.status === 200 && locationResult.data.success ? '✅ WORKING' : '❌ FAILED'}`);

    const workingAPIs = [
      debugResult.status === 200,
      jobsResult.status === 200 && jobsResult.data.success,
      serpResult.status === 200,
      locationResult.status === 200 && locationResult.data.success
    ].filter(Boolean).length;

    console.log(`\n🚀 ${workingAPIs}/4 APIs working!`);

    if (workingAPIs >= 2) {
      console.log('\n🎉 Your job portal is working!');
      console.log('🌐 Visit: http://localhost:3000/jobs');
      console.log('🔍 Try searching for different jobs and locations!');
      
      if (workingAPIs === 4) {
        console.log('\n🏆 All APIs are working perfectly!');
      } else {
        console.log('\n💡 Some APIs need configuration but the system is functional.');
      }
    } else {
      console.log('\n⚠️ Job portal needs more configuration.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure development server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify environment variables in .env.local');
    console.log('4. Check server logs for errors');
  }
}

testAllAPIs(); 