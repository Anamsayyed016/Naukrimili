#!/usr/bin/env node

/**
 * Test script for job redirects
 */


async function testJobRedirects() {
  console.log('🧪 Testing Job Redirects...');
  
  try {
    // Test job import to get external jobs
    const importResponse = await axios.post('http://localhost:3000/api/jobs/import-live', {
      query: 'software developer',
      location: 'Bangalore',
      country: 'IN'
    });
    
    const jobs = importResponse.data.jobs;
    console.log(`📥 Imported ${jobs.length} jobs`);
    
    // Test each job's redirect URL
    for (const job of jobs.slice(0, 5)) { // Test first 5 jobs
      console.log(`\n🔍 Testing job: ${job.title} at ${job.company}`);
      console.log(`   Source: ${job.source}`);
      console.log(`   Source URL: ${job.source_url}`);
      console.log(`   Apply URL: ${job.applyUrl}`);
      
      // Test if the job API returns proper redirect info
      try {
        const jobResponse = await axios.get(`http://localhost:3000/api/jobs/${job.sourceId}`);
        const jobData = jobResponse.data.data;
        
        console.log(`   ✅ Job API Response:`);
        console.log(`      ID: ${jobData.id}`);
        console.log(`      Is External: ${jobData.isExternal}`);
        console.log(`      Source URL: ${jobData.source_url}`);
        console.log(`      Apply URL: ${jobData.apply_url}`);
        
        // Test if redirect URL is accessible
        if (jobData.source_url && jobData.source_url !== '#') {
          try {
            const redirectResponse = await axios.head(jobData.source_url, { timeout: 5000 });
            console.log(`      ✅ Redirect URL accessible: ${redirectResponse.status}`);
          } catch (error) {
            console.log(`      ⚠️ Redirect URL not accessible: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Job API Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJobRedirects();