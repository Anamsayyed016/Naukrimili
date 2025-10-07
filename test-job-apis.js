#!/usr/bin/env node

/**
 * Test script for 3rd party job APIs
 */

const axios = require('axios');

async function testJobAPIs() {
  console.log('🧪 Testing Job APIs...');
  
  try {
    // Test health check
    const healthResponse = await axios.get('http://localhost:3000/api/debug/health');
    console.log('🏥 Health Check:', healthResponse.data);
    
    // Test job import
    const importResponse = await axios.post('http://localhost:3000/api/jobs/import-live', {
      query: 'software developer',
      location: 'Bangalore',
      country: 'IN'
    });
    console.log('📥 Job Import:', {
      totalJobs: importResponse.data.totalJobs,
      uniqueJobs: importResponse.data.uniqueJobs,
      providers: importResponse.data.providers
    });
    
    // Test unified search
    const searchResponse = await axios.get('http://localhost:3000/api/jobs/unified?query=software&location=Bangalore&includeExternal=true');
    console.log('🔍 Unified Search:', {
      totalJobs: searchResponse.data.total,
      externalJobs: searchResponse.data.sources?.external || 0,
      databaseJobs: searchResponse.data.sources?.database || 0
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJobAPIs();