/**
 * Performance Testing Script
 * Tests the optimized job search performance
 */

const fetch = require('node-fetch');

async function testPerformance() {
  console.log('🚀 Testing Job Search Performance...\n');

  const baseUrl = 'http://localhost:3000';
  const testCases = [
    { query: 'software engineer', location: 'Mumbai', limit: 20 },
    { query: 'developer', location: 'Bangalore', limit: 20 },
    { query: 'data scientist', location: 'Delhi', limit: 20 },
    { query: 'product manager', location: 'Hyderabad', limit: 20 },
    { query: 'ui designer', location: 'Pune', limit: 20 }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.query} in ${testCase.location}`);
    
    const startTime = Date.now();
    
    try {
      const params = new URLSearchParams({
        query: testCase.query,
        location: testCase.location,
        limit: testCase.limit.toString(),
        includeExternal: 'true',
        includeDatabase: 'true',
        includeSample: 'true'
      });

      const response = await fetch(`${baseUrl}/api/jobs/optimized?${params}`);
      const data = await response.json();
      
      const responseTime = Date.now() - startTime;
      
      results.push({
        query: testCase.query,
        location: testCase.location,
        responseTime,
        success: data.success,
        jobsCount: data.jobs?.length || 0,
        cached: data.metadata?.cached || false,
        sources: data.sources
      });

      console.log(`   ✅ ${responseTime}ms - ${data.jobs?.length || 0} jobs - ${data.metadata?.cached ? 'Cached' : 'Fresh'}`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`   ❌ ${responseTime}ms - Error: ${error.message}`);
      
      results.push({
        query: testCase.query,
        location: testCase.location,
        responseTime,
        success: false,
        error: error.message
      });
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const successfulTests = results.filter(r => r.success);
  const averageResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
  const cachedRequests = results.filter(r => r.cached).length;
  const totalJobs = successfulTests.reduce((sum, r) => sum + r.jobsCount, 0);

  console.log('\n📈 Performance Summary:');
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Successful: ${successfulTests.length}`);
  console.log(`   Average Response Time: ${averageResponseTime.toFixed(0)}ms`);
  console.log(`   Cached Requests: ${cachedRequests}/${results.length} (${((cachedRequests/results.length)*100).toFixed(1)}%)`);
  console.log(`   Total Jobs Found: ${totalJobs}`);
  console.log(`   Average Jobs per Request: ${(totalJobs/successfulTests.length).toFixed(1)}`);

  // Performance rating
  let rating = 'Poor';
  if (averageResponseTime < 500) rating = 'Good';
  if (averageResponseTime < 300) rating = 'Excellent';
  if (averageResponseTime < 200) rating = 'Outstanding';

  console.log(`\n🎯 Performance Rating: ${rating}`);
  
  if (averageResponseTime > 1000) {
    console.log('⚠️  Warning: Response times are still slow. Check server logs for issues.');
  } else if (averageResponseTime < 300) {
    console.log('🎉 Excellent! Your job search is now highly optimized!');
  }

  return results;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPerformance().catch(console.error);
}

export { testPerformance };
