#!/usr/bin/env node

/**
 * Simple Adzuna API Test
 * 
 * This script tests the Adzuna API integration step by step.
 */

import fetch from 'node-fetch';

async function testAdzunaAPI() {
  console.log('🔍 Testing Adzuna API Integration...\n');

  const ADZUNA_APP_ID = 'bdd02427';
  const ADZUNA_APP_KEY = 'abf03277d13e4cb39b24bf236ad29299';

  try {
    // Test 1: Direct API Call
    console.log('1️⃣ Testing Direct Adzuna API Call...');
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=5&where=Bangalore`;
    
    const response = await fetch(adzunaUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Adzuna API working!');
      console.log(`   Found ${data.results?.length || 0} jobs`);
      console.log(`   Total results: ${data.count || 'Unknown'}`);
      
      if (data.results && data.results.length > 0) {
        console.log(`   Sample job: ${data.results[0].title} at ${data.results[0].company?.display_name}`);
      }
    } else {
      console.log('❌ Adzuna API failed:', response.status, response.statusText);
    }

    // Test 2: Test Job Import API
    console.log('\n2️⃣ Testing Job Import API...');
    const importResponse = await fetch('http://localhost:3000/api/jobs/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: ['software developer'],
        country: 'IN',
        page: 1,
        location: 'Bangalore',
        radiusKm: 25
      })
    });

    if (importResponse.ok) {
      const importData = await importResponse.json();
      console.log('✅ Job import API successful');
      console.log(`   Imported: ${importData.imported} jobs`);
      console.log(`   Fetched: ${importData.fetched} jobs`);
      console.log(`   Provider 1 (Adzuna): ${importData.providers?.externalProvider1 || 0} jobs`);
    } else {
      console.log('❌ Job import API failed:', importResponse.status, importResponse.statusText);
      const errorText = await importResponse.text();
      console.log('   Error details:', errorText);
    }

    // Test 3: Test Jobs API
    console.log('\n3️⃣ Testing Jobs API...');
    const jobsResponse = await fetch('http://localhost:3000/api/jobs?query=software&location=Bangalore');
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log('✅ Jobs API successful');
      console.log(`   Found ${jobsData.jobs?.length || 0} jobs`);
      console.log(`   Total available: ${jobsData.pagination?.total || 0} jobs`);
      
      if (jobsData.jobs && jobsData.jobs.length > 0) {
        console.log(`   Sample job: ${jobsData.jobs[0].title} at ${jobsData.jobs[0].company}`);
      }
    } else {
      console.log('❌ Jobs API failed:', jobsResponse.status, jobsResponse.statusText);
    }

    console.log('\n🎉 Adzuna API Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdzunaAPI();
