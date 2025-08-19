#!/usr/bin/env node

/**
 * Test Job Import System
 * 
 * This script tests the multi-country job import system to ensure it's working properly.
 * Run this script to verify your job import APIs are functioning.
 */

const API_BASE = 'http://localhost:3000';

async function testJobImport() {
  console.log('🧪 Testing Job Import System...\n');

  try {
    // Test 1: Check supported countries
    console.log('1️⃣ Testing GET /api/jobs/import-multi-country...');
    const countriesResponse = await fetch(`${API_BASE}/api/jobs/import-multi-country`);
    if (countriesResponse.ok) {
      const countriesData = await countriesResponse.json();
      console.log('✅ Supported countries:', Object.keys(countriesData.supportedCountries).length);
      console.log('   Countries:', Object.keys(countriesData.supportedCountries).join(', '));
    } else {
      console.log('❌ Failed to get supported countries');
    }

    // Test 2: Test unified jobs API
    console.log('\n2️⃣ Testing GET /api/jobs/unified...');
    const unifiedResponse = await fetch(`${API_BASE}/api/jobs/unified?country=IN&limit=5`);
    if (unifiedResponse.ok) {
      const unifiedData = await unifiedResponse.json();
      console.log('✅ Unified API working');
      console.log(`   Found ${unifiedData.jobs.length} jobs`);
      console.log(`   Sources: Database=${unifiedData.sources.database}, External=${unifiedData.sources.external}`);
    } else {
      console.log('❌ Unified API failed');
    }

    // Test 3: Test job import for India
    console.log('\n3️⃣ Testing job import for India...');
    const importResponse = await fetch(`${API_BASE}/api/jobs/import-multi-country`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countries: ['IN'],
        maxJobsPerCountry: 10
      })
    });

    if (importResponse.ok) {
      const importData = await importResponse.json();
      console.log('✅ Job import successful');
      console.log(`   Total jobs found: ${importData.summary.totalJobs}`);
      console.log(`   Total jobs persisted: ${importData.summary.totalPersisted}`);
      console.log(`   Countries processed: ${importData.summary.countriesProcessed}`);
      
      if (importData.summary.countries.IN) {
        const indiaStats = importData.summary.countries.IN;
        console.log(`   India: ${indiaStats.totalJobs} jobs (Adzuna: ${indiaStats.providers.adzuna}, JSearch: ${indiaStats.providers.jsearch}, Google: ${indiaStats.providers.googleJobs})`);
      }
    } else {
      const errorData = await importResponse.json().catch(() => ({}));
      console.log('❌ Job import failed:', errorData.error || 'Unknown error');
    }

    // Test 4: Verify jobs are now available
    console.log('\n4️⃣ Verifying imported jobs...');
    const verifyResponse = await fetch(`${API_BASE}/api/jobs/unified?country=IN&limit=20&includeExternal=true`);
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Jobs verification successful');
      console.log(`   Total jobs available: ${verifyData.pagination.total}`);
      console.log(`   Jobs on this page: ${verifyData.jobs.length}`);
      
      // Show sample jobs
      if (verifyData.jobs.length > 0) {
        console.log('\n📋 Sample jobs:');
        verifyData.jobs.slice(0, 3).forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} at ${job.company} (${job.location}) - Source: ${job.source}`);
        });
      }
    } else {
      console.log('❌ Jobs verification failed');
    }

    console.log('\n🎉 Job import system test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('⚠️  This script requires Node.js 18+ with fetch support');
  console.log('   Run: node --version');
  console.log('   If version < 18, install: npm install node-fetch');
  process.exit(1);
}

// Run the test
testJobImport();
