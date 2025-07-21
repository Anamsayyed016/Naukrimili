#!/usr/bin/env node

const https = require('https');
const http = require('http');

function makeRequest(url, timeout = 5000) {
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

async function testSerpApi() {
  console.log('🔍 Testing SerpApi...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Debug endpoint
    console.log('1️⃣ Testing debug endpoint...');
    const debugResult = await makeRequest(`${baseUrl}/api/jobs/debug`, 3000);
    
    if (debugResult.status === 200) {
      console.log('✅ Debug endpoint: WORKING');
      console.log('📊 API Status:', debugResult.data.apiStatus);
    } else {
      console.log('❌ Debug endpoint: FAILED');
    }

    // Test 2: Main jobs API
    console.log('\n2️⃣ Testing main jobs API...');
    const jobsResult = await makeRequest(`${baseUrl}/api/jobs?q=software%20engineer&location=Mumbai&limit=3`, 5000);
    
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
    console.log('\n3️⃣ Testing SerpApi directly...');
    const serpResult = await makeRequest(`${baseUrl}/api/jobs/serpapi?q=developer&location=Mumbai&num=3`, 10000);
    
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

    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log(`Debug: ${debugResult.status === 200 ? '✅' : '❌'}`);
    console.log(`Main API: ${jobsResult.status === 200 && jobsResult.data.success ? '✅' : '❌'}`);
    console.log(`SerpApi: ${serpResult.status === 200 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSerpApi(); 