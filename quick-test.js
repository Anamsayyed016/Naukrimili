#!/usr/bin/env node

const https = require('https');
const http = require('http');

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

async function quickTest() {
  console.log('🚀 Quick Job Portal Test\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test main jobs API
    console.log('🔍 Testing job search...');
    const result = await makeRequest(`${baseUrl}/api/jobs?q=software%20engineer&location=Mumbai&limit=5`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Job Portal: WORKING!');
      console.log(`📋 Jobs found: ${result.data.total}`);
      console.log(`🎯 Source: ${result.data.meta?.source || 'Unknown'}`);
      
      if (result.data.jobs.length > 0) {
        console.log('\n📝 Sample Jobs:');
        result.data.jobs.slice(0, 3).forEach((job, index) => {
          console.log(`${index + 1}. ${job.title} at ${job.company}`);
          console.log(`   Location: ${job.location}`);
          console.log(`   Source: ${job.id.startsWith('serp_') ? 'SerpApi' : 
                              job.id.startsWith('adzuna_') ? 'Adzuna' : 
                              job.id.startsWith('reed_') ? 'Reed' : 
                              job.id.startsWith('sample_') ? 'Sample Data' : 'Unknown'}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No jobs found (using sample data as fallback)');
      }
      
      console.log('\n🎉 Your job portal is working!');
      console.log('🌐 Visit: http://localhost:3000/jobs');
      console.log('🔍 Try searching for different jobs and locations!');
      
    } else {
      console.log('❌ Job Portal: FAILED');
      console.log('Error:', result.data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure your development server is running: npm run dev');
  }
}

quickTest(); 