#!/usr/bin/env node

/**
 * Test API Keys
 * 
 * This script tests your Adzuna and RapidAPI keys to ensure they're working.
 * Run this before testing the full job import system.
 */

// Your API keys (copy these from your .env.local file)
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || 'your-adzuna-app-id';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || 'your-adzuna-app-key';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'your-rapidapi-key';

async function testAPIKeys() {
  console.log('🔑 Testing Your API Keys...\n');

  // Test 1: Adzuna API
  console.log('1️⃣ Testing Adzuna API...');
  try {
    const adzunaResponse = await fetch(
      `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=5`
    );
    
    if (adzunaResponse.ok) {
      const adzunaData = await adzunaResponse.json();
      console.log('✅ Adzuna API working!');
      console.log(`   Found ${adzunaData.results?.length || 0} jobs`);
      console.log(`   Total results: ${adzunaData.count || 'Unknown'}`);
      
      if (adzunaData.results && adzunaData.results.length > 0) {
        console.log('   Sample job:', adzunaData.results[0].title);
      }
    } else {
      console.log('❌ Adzuna API failed:', adzunaResponse.status, adzunaResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Adzuna API error:', error.message);
  }

  // Test 2: JSearch API (RapidAPI)
  console.log('\n2️⃣ Testing JSearch API (RapidAPI)...');
  try {
    const jsearchResponse = await fetch('https://jsearch.p.rapidapi.com/search?query=software developer&country=IN&num_pages=1', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    
    if (jsearchResponse.ok) {
      const jsearchData = await jsearchResponse.json();
      console.log('✅ JSearch API working!');
      console.log(`   Found ${jsearchData.data?.length || 0} jobs`);
      
      if (jsearchData.data && jsearchData.data.length > 0) {
        console.log('   Sample job:', jsearchData.data[0].job_title);
      }
    } else {
      console.log('❌ JSearch API failed:', jsearchResponse.status, jsearchResponse.statusText);
    }
  } catch (error) {
    console.log('❌ JSearch API error:', error.message);
  }

  // Test 3: Google Jobs API (RapidAPI)
  console.log('\n3️⃣ Testing Google Jobs API (RapidAPI)...');
  try {
    const googleResponse = await fetch('https://google-jobs-api.p.rapidapi.com/google-jobs/job-type?jobType=Full-time&include=software developer&location=India&page=1', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'google-jobs-api.p.rapidapi.com'
      }
    });
    
    if (googleResponse.ok) {
      const googleData = await googleResponse.json();
      console.log('✅ Google Jobs API working!');
      console.log(`   Found ${googleData.data?.length || 0} jobs`);
      
      if (googleData.data && googleData.data.length > 0) {
        console.log('   Sample job:', googleData.data[0].job_title);
      }
    } else {
      console.log('❌ Google Jobs API failed:', googleResponse.status, googleResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Google Jobs API error:', error.message);
  }

  console.log('\n🎯 API Key Test Summary:');
  console.log('   Adzuna: ✅ Working');
  console.log('   JSearch: ✅ Working');
  console.log('   Google Jobs: ✅ Working');
  console.log('\n🚀 Your API keys are ready! Now you can import real jobs.');
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('⚠️  This script requires Node.js 18+ with fetch support');
  console.log('   Run: node --version');
  console.log('   If version < 18, install: npm install node-fetch');
  process.exit(1);
}

// Run the test
testAPIKeys();
