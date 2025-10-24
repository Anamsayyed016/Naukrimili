/**
 * Test Unlimited Job Search Functionality
 * Tests the unlimited job search system across all sectors
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testUnlimitedSearch() {
  console.log('🚀 Testing Unlimited Job Search System...\n');

  const tests = [
    {
      name: 'Basic Search - Technology',
      params: {
        query: 'software engineer',
        location: 'Bangalore',
        country: 'IN',
        limit: 50
      }
    },
    {
      name: 'Sector Search - Healthcare',
      params: {
        query: 'doctor',
        sector: 'Healthcare',
        country: 'IN',
        limit: 30
      }
    },
    {
      name: 'Remote Jobs Only',
      params: {
        query: 'developer',
        isRemote: true,
        country: 'IN',
        limit: 25
      }
    },
    {
      name: 'Salary Range Filter',
      params: {
        query: 'manager',
        salaryMin: 500000,
        salaryMax: 1500000,
        country: 'IN',
        limit: 40
      }
    },
    {
      name: 'Experience Level Filter',
      params: {
        query: 'engineer',
        experienceLevel: 'senior',
        country: 'IN',
        limit: 35
      }
    },
    {
      name: 'Job Type Filter',
      params: {
        query: 'consultant',
        jobType: 'full-time',
        country: 'IN',
        limit: 30
      }
    },
    {
      name: 'All Sectors Search',
      params: {
        query: '',
        country: 'IN',
        limit: 100
      }
    },
    {
      name: 'Location-based Search',
      params: {
        query: 'teacher',
        location: 'Delhi',
        country: 'IN',
        limit: 20
      }
    },
    {
      name: 'Multiple Countries',
      params: {
        query: 'analyst',
        country: 'US',
        limit: 50
      }
    },
    {
      name: 'High Limit Test',
      params: {
        query: 'manager',
        country: 'IN',
        limit: 200
      }
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let totalJobs = 0;
  let totalSectors = 0;
  let totalCountries = 0;

  for (const test of tests) {
    totalTests++;
    console.log(`\n🧪 Test ${totalTests}: ${test.name}`);
    console.log(`📋 Parameters:`, test.params);

    try {
      const searchParams = new URLSearchParams({
        ...test.params,
        includeExternal: 'true',
        includeDatabase: 'true',
        includeSample: 'true'
      });

      const response = await fetch(`${BASE_URL}/api/jobs/unlimited?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        const jobCount = data.jobs?.length || 0;
        const totalAvailable = data.pagination?.totalJobs || 0;
        const hasMore = data.pagination?.hasMore || false;
        const sources = data.sources || {};
        const sectors = data.metadata?.sectors || [];
        const countries = data.metadata?.countries || [];

        console.log(`✅ PASSED`);
        console.log(`   📊 Jobs returned: ${jobCount}`);
        console.log(`   📈 Total available: ${totalAvailable}`);
        console.log(`   🔄 Has more pages: ${hasMore}`);
        console.log(`   📊 Sources: Database=${sources.database || 0}, External=${sources.external || 0}, Sample=${sources.sample || 0}`);
        console.log(`   🏢 Sectors: ${sectors.length} (${sectors.slice(0, 3).join(', ')}${sectors.length > 3 ? '...' : ''})`);
        console.log(`   🌍 Countries: ${countries.length} (${countries.slice(0, 3).join(', ')}${countries.length > 3 ? '...' : ''})`);

        totalJobs += jobCount;
        totalSectors += sectors.length;
        totalCountries += countries.length;
        passedTests++;

        // Test job diversity
        if (jobCount > 0) {
          const uniqueSectors = [...new Set(data.jobs.map(job => job.sector).filter(Boolean))];
          const uniqueCompanies = [...new Set(data.jobs.map(job => job.company).filter(Boolean))];
          const uniqueLocations = [...new Set(data.jobs.map(job => job.location).filter(Boolean))];

          console.log(`   🎯 Diversity: ${uniqueSectors.length} sectors, ${uniqueCompanies.length} companies, ${uniqueLocations.length} locations`);
        }

      } else {
        console.log(`❌ FAILED: ${data.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  // Summary
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`   📈 Total jobs found: ${totalJobs}`);
  console.log(`   🏢 Average sectors per test: ${Math.round(totalSectors / totalTests)}`);
  console.log(`   🌍 Average countries per test: ${Math.round(totalCountries / totalTests)}`);
  console.log(`   📊 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  // Test API limits
  console.log(`\n🔍 Testing API Limits:`);
  await testAPILimits();

  console.log(`\n🎉 Unlimited Job Search Testing Completed!`);
}

async function testAPILimits() {
  const limitTests = [10, 50, 100, 200, 500];

  for (const limit of limitTests) {
    try {
      const searchParams = new URLSearchParams({
        query: 'engineer',
        country: 'IN',
        limit: limit.toString(),
        includeExternal: 'true',
        includeDatabase: 'true',
        includeSample: 'true'
      });

      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/jobs/unlimited?${searchParams.toString()}`);
      const data = await response.json();
      const endTime = Date.now();

      if (data.success) {
        const jobCount = data.jobs?.length || 0;
        const responseTime = endTime - startTime;
        console.log(`   📊 Limit ${limit}: ${jobCount} jobs returned in ${responseTime}ms`);
      } else {
        console.log(`   ❌ Limit ${limit}: Failed - ${data.error}`);
      }

    } catch (error) {
      console.log(`   ❌ Limit ${limit}: Error - ${error.message}`);
    }
  }
}

// Run the tests
testUnlimitedSearch().catch(console.error);
