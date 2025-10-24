#!/usr/bin/env node

/**
 * Test Jooble API Integration
 * 
 * Tests Jooble API integration for target countries:
 * - India (IN)
 * - USA (US) 
 * - UK (UK)
 * - UAE (AE)
 */

import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

const countries = [
  { code: 'IN', name: 'India', location: 'Bangalore' },
  { code: 'US', name: 'USA', location: 'New York' },
  { code: 'UK', name: 'UK', location: 'London' },
  { code: 'AE', name: 'UAE', location: 'Dubai' }
];

async function testJoobleIntegration() {
  console.log('🌍 Testing Jooble API Integration...\n');
  
  if (!process.env.JOOBLE_API_KEY) {
    console.log('❌ JOOBLE_API_KEY not found in environment variables');
    console.log('Please add JOOBLE_API_KEY=85e30089-6b57-4a15-ab05-549c766a8fc8 to your .env file');
    return;
  }

  for (const country of countries) {
    console.log(`📍 Testing ${country.name} (${country.code})...`);
    
    try {
      const { fetchFromJooble } = await import('../lib/jobs/providers.ts');
      
      const jobs = await fetchFromJooble('software developer', country.location, 1, {
        radius: 50,
        countryCode: country.code.toLowerCase()
      });
      
      console.log(`   ✅ Found ${jobs.length} jobs`);
      
      if (jobs.length > 0) {
        console.log(`   📋 Sample: ${jobs[0].title} at ${jobs[0].company}`);
        console.log(`   🌐 Source: ${jobs[0].source} (${jobs[0].sourceId})`);
        console.log(`   💰 Salary: ${jobs[0].salary || 'Not specified'}`);
        console.log(`   📍 Location: ${jobs[0].location}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test unified API integration
  console.log('🚀 Testing Unified API Integration...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/jobs/unified?includeExternal=true&limit=5');
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Unified API working - Found ${data.jobs.length} total jobs`);
      
      const joobleJobs = data.jobs.filter(job => job.source === 'jooble');
      console.log(`   🎯 Jooble jobs: ${joobleJobs.length}`);
      
      if (joobleJobs.length > 0) {
        console.log(`   📋 Sample Jooble job: ${joobleJobs[0].title} at ${joobleJobs[0].company}`);
      }
    } else {
      console.log(`❌ Unified API failed: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Unified API test failed: ${error.message}`);
  }
}

testJoobleIntegration().catch(console.error);
