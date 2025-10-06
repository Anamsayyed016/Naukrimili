/**
 * Test script to verify job data flow
 * Run with: node test-job-flow.js
 */

const testJobFlow = async () => {
  console.log('🧪 Testing Job Data Flow...\n');

  // Test 1: Check if API returns proper error for non-existent job
  console.log('1️⃣ Testing API with non-existent job ID...');
  try {
    const response = await fetch('http://localhost:3000/api/jobs/99999');
    const data = await response.json();
    
    if (data.success === false && data.error === 'Job not found') {
      console.log('✅ API correctly returns 404 for non-existent job');
    } else {
      console.log('❌ API should return 404 for non-existent job');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }

  // Test 2: Check if API returns proper error for sample job
  console.log('\n2️⃣ Testing API with sample job ID...');
  try {
    const response = await fetch('http://localhost:3000/api/jobs/sample-test');
    const data = await response.json();
    
    if (data.success === false && data.isSample === true) {
      console.log('✅ API correctly handles sample job IDs');
    } else {
      console.log('❌ API should return sample job error');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }

  // Test 3: Check URL generation
  console.log('\n3️⃣ Testing URL generation...');
  try {
    const { generateSEOJobUrl, cleanJobDataForSEO } = require('./lib/seo-url-utils');
    
    const testJob = {
      id: '123',
      title: 'Software Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      experienceLevel: 'Mid-level',
      salary: '$80,000 - $120,000'
    };
    
    const cleanJob = cleanJobDataForSEO(testJob);
    const seoUrl = generateSEOJobUrl(cleanJob);
    
    console.log('✅ URL generation works:', seoUrl);
  } catch (error) {
    console.log('❌ URL generation failed:', error.message);
  }

  console.log('\n🎉 Job flow test completed!');
};

// Run the test
testJobFlow().catch(console.error);
