/**
 * Test Coresignal Integration
 * Run this to verify the Coresignal API integration is working
 */

const { fetchFromCoresignal, checkCoresignalHealth } = require('./lib/jobs/coresignal-service');

async function testCoresignalIntegration() {
  console.log('🧪 Testing Coresignal Integration...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing API Health Check...');
  try {
    const health = await checkCoresignalHealth();
    console.log(`   Status: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Message: ${health.message}\n`);
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}\n`);
  }

  // Test 2: Fetch Jobs
  console.log('2️⃣ Testing Job Fetch...');
  try {
    const jobs = await fetchFromCoresignal('software engineer', 'IN', 1, {
      limit: 5
    });
    console.log(`   ✅ Fetched ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      console.log('   📋 Sample job:');
      const sample = jobs[0];
      console.log(`      Title: ${sample.title}`);
      console.log(`      Company: ${sample.company}`);
      console.log(`      Location: ${sample.location}`);
      console.log(`      Country: ${sample.country}`);
      console.log(`      Salary: ${sample.salary || 'Not specified'}`);
      console.log(`      Remote: ${sample.isRemote ? 'Yes' : 'No'}`);
      console.log(`      Apply URL: ${sample.applyUrl ? 'Available' : 'Not available'}`);
    }
  } catch (error) {
    console.log(`   ❌ Job fetch failed: ${error.message}`);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testCoresignalIntegration().catch(console.error);
