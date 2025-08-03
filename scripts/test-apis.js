#!/usr/bin/env node

/**
 * API Testing Script for NaukriMili Job Portal
 * 
 * This script tests all API endpoints to ensure they're working correctly
 * after the code cleanup and consolidation.
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// API endpoints to test
const API_ENDPOINTS = [
  // Health and System
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/admin/system/health', method: 'GET', name: 'Admin System Health' },
  
  // Authentication
  { path: '/api/auth/register', method: 'POST', name: 'User Registration', body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'jobseeker'
  }) },
  
  // Jobs
  { path: '/api/jobs', method: 'GET', name: 'Jobs List' },
  { path: '/api/jobs?query=developer&location=Mumbai', method: 'GET', name: 'Jobs Search' },
  { path: '/api/jobs/categories', method: 'GET', name: 'Job Categories' },
  { path: '/api/jobs/sectors', method: 'GET', name: 'Job Sectors' },
  { path: '/api/jobs/salary-stats', method: 'GET', name: 'Salary Statistics' },
  { path: '/api/jobs/real', method: 'GET', name: 'Real Jobs API' },
  { path: '/api/jobs/debug', method: 'GET', name: 'Jobs Debug' },
  
  // Companies
  { path: '/api/companies', method: 'GET', name: 'Companies List' },
  { path: '/api/companies/1', method: 'GET', name: 'Company Details' },
  { path: '/api/company/jobs', method: 'GET', name: 'Company Jobs' },
  
  // Candidates
  { path: '/api/candidates', method: 'GET', name: 'Candidates List' },
  { path: '/api/candidates/1', method: 'GET', name: 'Candidate Details' },
  
  // Resumes
  { path: '/api/resumes', method: 'GET', name: 'Resumes List' },
  { path: '/api/resumes/1', method: 'GET', name: 'Resume Details' },
  
  // Employer
  { path: '/api/employer/analytics', method: 'GET', name: 'Employer Analytics' },
  
  // Seeker
  { path: '/api/seeker/jobs', method: 'GET', name: 'Seeker Jobs' },
  
  // Admin
  { path: '/api/admin', method: 'GET', name: 'Admin Dashboard' },
  { path: '/api/admin/fraud-reports', method: 'GET', name: 'Fraud Reports' },
  { path: '/api/admin/notifications', method: 'GET', name: 'Admin Notifications' },
  
  // Other
  { path: '/api/locations', method: 'GET', name: 'Locations' },
  { path: '/api/ads', method: 'GET', name: 'Ads' },
  { path: '/api/subscribe', method: 'POST', name: 'Subscribe', body: JSON.stringify({
    email: 'test@example.com'
  }) },
  { path: '/api/clear-cache', method: 'POST', name: 'Clear Cache' },
  { path: '/api/test', method: 'GET', name: 'Test Endpoint' },
  { path: '/api/test-reed', method: 'GET', name: 'Test Reed API' },
  { path: '/api/debug-jobs', method: 'GET', name: 'Debug Jobs' },
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make HTTP requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NaukriMili-API-Tester/1.0'
      },
      timeout: TIMEOUT
    };

    if (endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(endpoint.body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            endpoint: endpoint.name
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            endpoint: endpoint.name,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        endpoint: endpoint.name
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        endpoint: endpoint.name
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    
    req.end();
  });
}

// Test individual endpoint
async function testEndpoint(endpoint) {
  try {
    console.log(`🔍 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    
    const response = await makeRequest(endpoint);
    
    // Check if response is successful (2xx status codes)
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ PASS: ${endpoint.name} - Status: ${response.status}`);
      results.passed++;
      
      // Log response structure for debugging
      if (response.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        console.log(`   📊 Response keys: ${keys.join(', ')}`);
      }
    } else {
      console.log(`❌ FAIL: ${endpoint.name} - Status: ${response.status}`);
      console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
      results.failed++;
      results.errors.push({
        endpoint: endpoint.name,
        status: response.status,
        error: response.data?.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.log(`💥 ERROR: ${endpoint.name} - ${error.error || error.message}`);
    results.failed++;
    results.errors.push({
      endpoint: endpoint.name,
      error: error.error || error.message
    });
  }
  
  console.log(''); // Empty line for readability
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Tests for NaukriMili Job Portal\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
  console.log(`📊 Total endpoints to test: ${API_ENDPOINTS.length}\n`);
  
  const startTime = Date.now();
  
  // Test each endpoint
  for (const endpoint of API_ENDPOINTS) {
    await testEndpoint(endpoint);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${((results.passed / API_ENDPOINTS.length) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS DETAILS:');
    console.log('==================');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.endpoint}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('==================');
  
  if (results.failed === 0) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log('🔧 Some APIs need attention:');
    console.log('   - Check server logs for detailed error messages');
    console.log('   - Verify environment variables are set correctly');
    console.log('   - Ensure all dependencies are installed');
    console.log('   - Check database connections if applicable');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   - Review failed endpoints and fix issues');
  console.log('   - Add proper error handling where needed');
  console.log('   - Implement authentication for protected endpoints');
  console.log('   - Add rate limiting for production use');
  
  // Exit with appropriate code
  process.exit(results.failed === 0 ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  testEndpoint,
  runTests,
  API_ENDPOINTS
}; 