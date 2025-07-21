#!/usr/bin/env node

const fetch = require('node-fetch');

async function testJobPortal() {
  console.log('🧪 Testing Job Portal APIs...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Debug endpoint
    console.log('1️⃣ Testing debug endpoint...');
    const debugResponse = await fetch(`${baseUrl}/api/jobs/debug`);
    const debugData = await debugResponse.json();
    
    console.log('✅ Debug endpoint working');
    console.log('📊 API Status:', debugData.apiStatus);
    console.log('🔧 Environment:', debugData.environment);

    // Test 2: Main jobs API
    console.log('\n2️⃣ Testing main jobs API...');
    const jobsResponse = await fetch(`${baseUrl}/api/jobs?q=software%20engineer&location=Mumbai&limit=5`);
    const jobsData = await jobsResponse.json();
    
    if (jobsData.success) {
      console.log('✅ Main jobs API working');
      console.log(`📋 Found ${jobsData.total} jobs`);
      console.log(`🎯 Source: ${jobsData.meta?.source || 'Unknown'}`);
      
      if (jobsData.jobs.length > 0) {
        console.log('📝 Sample job:', jobsData.jobs[0].title, 'at', jobsData.jobs[0].company);
      }
    } else {
      console.log('❌ Main jobs API failed:', jobsData.error);
    }

    // Test 3: Location-based search
    console.log('\n3️⃣ Testing location-based search...');
    const locationResponse = await fetch(`${baseUrl}/api/jobs?q=developer&location=Delhi&limit=3`);
    const locationData = await locationResponse.json();
    
    if (locationData.success) {
      console.log('✅ Location search working');
      console.log(`📍 Delhi search: ${locationData.total} jobs found`);
    } else {
      console.log('❌ Location search failed:', locationData.error);
    }

    // Test 4: Different job types
    console.log('\n4️⃣ Testing different job types...');
    const typeResponse = await fetch(`${baseUrl}/api/jobs?q=data%20scientist&location=India&limit=3`);
    const typeData = await typeResponse.json();
    
    if (typeData.success) {
      console.log('✅ Job type search working');
      console.log(`🔬 Data scientist search: ${typeData.total} jobs found`);
    } else {
      console.log('❌ Job type search failed:', typeData.error);
    }

    // Test 5: POST request
    console.log('\n5️⃣ Testing POST request...');
    const postResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'React developer',
        location: 'Bangalore',
        limit: 3
      })
    });
    const postData = await postResponse.json();
    
    if (postData.success) {
      console.log('✅ POST request working');
      console.log(`⚛️ React developer search: ${postData.total} jobs found`);
    } else {
      console.log('❌ POST request failed:', postData.error);
    }

    // Summary
    console.log('\n🎉 Test Summary:');
    console.log('================');
    console.log(`✅ Debug endpoint: Working`);
    console.log(`✅ Main jobs API: ${jobsData.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Location search: ${locationData.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Job type search: ${typeData.success ? 'Working' : 'Failed'}`);
    console.log(`✅ POST requests: ${postData.success ? 'Working' : 'Failed'}`);

    const workingAPIs = [jobsData.success, locationData.success, typeData.success, postData.success].filter(Boolean).length;
    console.log(`\n🚀 ${workingAPIs}/4 core features working!`);

    if (workingAPIs === 4) {
      console.log('\n🎊 Your job portal is fully functional!');
      console.log('🌐 Visit: http://localhost:3000/jobs');
      console.log('🔍 Try searching for different jobs and locations!');
    } else {
      console.log('\n⚠️ Some features need attention. Check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the development server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify environment variables are set correctly');
  }
}

// Run the test
testJobPortal(); 