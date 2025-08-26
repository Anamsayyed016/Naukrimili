const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🧪 Testing Job Portal API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Health Check:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health Check Failed:', error.message);
    }

    // Test 2: Jobs API
    console.log('\n2️⃣ Testing Jobs API...');
    try {
      const jobsResponse = await axios.get(`${BASE_URL}/api/jobs/unified?limit=5`);
      console.log('✅ Jobs API:', {
        success: jobsResponse.data.success,
        totalJobs: jobsResponse.data.pagination?.total || 0,
        jobsReturned: jobsResponse.data.jobs?.length || 0,
        sources: jobsResponse.data.sources
      });
    } catch (error) {
      console.log('❌ Jobs API Failed:', error.message);
    }

    // Test 3: Resume Autofill API
    console.log('\n3️⃣ Testing Resume Autofill API...');
    try {
      const autofillResponse = await axios.get(`${BASE_URL}/api/resumes/autofill`);
      console.log('✅ Resume Autofill API:', autofillResponse.data);
    } catch (error) {
      console.log('❌ Resume Autofill API Failed:', error.message);
    }

    // Test 4: Resume Upload API
    console.log('\n4️⃣ Testing Resume Upload API...');
    try {
      const uploadResponse = await axios.get(`${BASE_URL}/api/resumes/upload`);
      console.log('✅ Resume Upload API:', uploadResponse.data);
    } catch (error) {
      console.log('❌ Resume Upload API Failed:', error.message);
    }

    // Test 5: Companies API
    console.log('\n5️⃣ Testing Companies API...');
    try {
      const companiesResponse = await axios.get(`${BASE_URL}/api/companies?limit=5`);
      console.log('✅ Companies API:', {
        success: companiesResponse.data.success,
        totalCompanies: companiesResponse.data.companies?.length || 0
      });
    } catch (error) {
      console.log('❌ Companies API Failed:', error.message);
    }

    // Test 6: Search Suggestions API
    console.log('\n6️⃣ Testing Search Suggestions API...');
    try {
      const suggestionsResponse = await axios.get(`${BASE_URL}/api/search-suggestions?q=software`);
      console.log('✅ Search Suggestions API:', suggestionsResponse.data);
    } catch (error) {
      console.log('❌ Search Suggestions API Failed:', error.message);
    }

    console.log('\n🎯 API Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test script failed:', error.message);
  }
}

// Run tests
testEndpoints();
