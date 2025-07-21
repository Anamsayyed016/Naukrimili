const https = require('https');

console.log('🧪 Testing Reed API with your key...\n');

const apiKey = '61676dcc-5daa-4779-b940-fc41a6503152';
const credentials = Buffer.from(`${apiKey}:`).toString('base64');

// Test 1: Search for developer jobs
console.log('📋 Test 1: Searching for developer jobs...');

const options1 = {
  hostname: 'www.reed.co.uk',
  path: '/api/1.0/search?keywords=developer&resultsToTake=5',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
    'User-Agent': 'JobPortal/1.0'
  }
};

https.request(options1, (res1) => {
  let data1 = '';
  
  res1.on('data', (chunk) => {
    data1 += chunk;
  });
  
  res1.on('end', () => {
    if (res1.statusCode === 200) {
      try {
        const jobs = JSON.parse(data1);
        console.log(`✅ Found ${jobs.totalResults} jobs!`);
        if (jobs.results && jobs.results.length > 0) {
          console.log(`📝 Sample jobs:`);
          jobs.results.slice(0, 3).forEach((job, index) => {
            console.log(`   ${index + 1}. ${job.jobTitle} at ${job.employerName}`);
            console.log(`      Location: ${job.locationName}`);
            console.log(`      Posted: ${job.date}`);
          });
        }
        
        // Test 2: Get specific job
        console.log('\n📋 Test 2: Getting first job details...');
        if (jobs.results && jobs.results.length > 0) {
          const firstJobId = jobs.results[0].jobId;
          
          const options2 = {
            hostname: 'www.reed.co.uk',
            path: `/api/1.0/jobs/${firstJobId}`,
            method: 'GET',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Accept': 'application/json',
              'User-Agent': 'JobPortal/1.0'
            }
          };
          
          https.request(options2, (res2) => {
            let data2 = '';
            
            res2.on('data', (chunk) => {
              data2 += chunk;
            });
            
            res2.on('end', () => {
              if (res2.statusCode === 200) {
                try {
                  const jobDetail = JSON.parse(data2);
                  console.log(`✅ Job details retrieved:`);
                  console.log(`   ID: ${jobDetail.jobId}`);
                  console.log(`   Title: ${jobDetail.jobTitle}`);
                  console.log(`   Company: ${jobDetail.employerName}`);
                  console.log(`   Location: ${jobDetail.locationName}`);
                  console.log(`   URL: ${jobDetail.jobUrl}`);
                  console.log(`\n🎉 Reed API is working perfectly!`);
                  console.log(`\n📱 Your job portal should now show Reed jobs when you search.`);
                } catch (error) {
                  console.log('❌ Invalid JSON response for job detail:', error.message);
                }
              } else {
                console.log(`❌ Job detail request failed: ${res2.statusCode}`);
              }
            });
          }).on('error', (error) => {
            console.log('❌ Network error for job detail:', error.message);
          }).end();
        }
        
      } catch (error) {
        console.log('❌ Invalid JSON response:', error.message);
      }
    } else {
      console.log(`❌ API request failed: ${res1.statusCode}`);
      if (res1.statusCode === 401) {
        console.log('   API key might be invalid');
      }
    }
  });
}).on('error', (error) => {
  console.log('❌ Network error:', error.message);
}).end();
