// Set environment variable
process.env.REED_API_KEY = '61676dcc-5daa-4779-b940-fc41a6503152';

const { getReedService } = require('./lib/reed-service.ts');

console.log('🧪 Testing Unified Job Service with Reed API...\n');

async function testReedIntegration() {
  try {
    console.log('📋 Testing Reed Service directly...');
    
    const reed = getReedService();
    const reedResults = await reed.searchFormattedJobs({
      keywords: 'developer',
      resultsToTake: 3
    });
    
    console.log(`✅ Reed API returned ${reedResults.jobs.length} jobs`);
    console.log(`📝 Sample Reed jobs:`);
    reedResults.jobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
      console.log(`      Location: ${job.location}`);
      console.log(`      Salary: ${job.salary}`);
      console.log(`      Remote: ${job.remote ? 'Yes' : 'No'}`);
    });
    
    console.log('\n🎉 Reed API integration is working!');
    console.log('\n📱 Your job portal should now show Reed jobs when you search for "developer"');
    
  } catch (error) {
    console.error('❌ Error testing Reed integration:', error.message);
  }
}

// Run the test if this is directly called
if (require.main === module) {
  testReedIntegration();
}
