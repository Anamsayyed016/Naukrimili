#!/usr/bin/env node

/**
 * Test Adzuna API with Multiple Countries
 * 
 * Tests Adzuna API integration for:
 * - India (IN)
 * - USA (US) 
 * - UK (GB)
 * - UAE (AE)
 */

import fetch from 'node-fetch';

const countries = [
  { code: 'in', name: 'India', location: 'Bangalore' },
  { code: 'us', name: 'USA', location: 'New York' },
  { code: 'gb', name: 'UK', location: 'London' },
  { code: 'ae', name: 'UAE', location: 'Dubai' }
];

const ADZUNA_APP_ID = 'bdd02427';
const ADZUNA_APP_KEY = 'abf03277d13e4cb39b24bf236ad29299';

async function testAdzunaCountries() {
  console.log('🌍 Testing Adzuna API with Multiple Countries...\n');

  for (const country of countries) {
    console.log(`📍 Testing ${country.name} (${country.code.toUpperCase()})...`);
    
    try {
      // Test direct API call
      const apiUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=5&where=${country.location}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API working - Found ${data.results?.length || 0} jobs (Total: ${data.count || 'Unknown'})`);
        
        if (data.results && data.results.length > 0) {
          console.log(`   📋 Sample: ${data.results[0].title} at ${data.results[0].company?.display_name}`);
        }
      } else {
        console.log(`   ❌ API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test job import for all countries
  console.log('🚀 Testing Job Import for All Countries...\n');
  
  for (const country of countries) {
    console.log(`📥 Importing jobs for ${country.name}...`);
    
    try {
      const importResponse = await fetch('http://localhost:3001/api/jobs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: ['software developer', 'frontend developer', 'backend developer'],
          country: country.code.toUpperCase(),
          page: 1,
          location: country.location,
          radiusKm: 50
        })
      });

      if (importResponse.ok) {
        const importData = await importResponse.json();
        console.log(`   ✅ Imported: ${importData.imported} jobs`);
        console.log(`   📊 Fetched: ${importData.fetched} jobs`);
        console.log(`   🔗 Adzuna: ${importData.providers?.externalProvider1 || 0} jobs`);
        console.log(`   💚 Health: ${importData.health?.externalProvider1 ? 'OK' : 'FAIL'}`);
      } else {
        console.log(`   ❌ Import failed: ${importResponse.status} ${importResponse.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Import error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test final jobs count
  console.log('📊 Final Jobs Count...');
  try {
    const jobsResponse = await fetch('http://localhost:3001/api/jobs');
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log(`   📈 Total jobs in database: ${jobsData.pagination?.total || 0}`);
      console.log(`   🌍 Jobs by country:`);
      
      // Count jobs by country
      const countryCounts = {};
      jobsData.jobs?.forEach(job => {
        const country = job.country || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      
      Object.entries(countryCounts).forEach(([country, count]) => {
        console.log(`      ${country}: ${count} jobs`);
      });
    } else {
      console.log(`   ❌ Jobs API failed: ${jobsResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Jobs API error: ${error.message}`);
  }

  console.log('\n🎉 Multi-Country Adzuna Test Complete!');
}

// Run the test
testAdzunaCountries();
