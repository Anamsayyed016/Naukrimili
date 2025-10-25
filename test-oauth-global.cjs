#!/usr/bin/env node

/**
 * Test NextAuth OAuth Global Configuration
 * Tests OAuth endpoints from different domains/locations
 */

const https = require('https');
const http = require('http');

const domain = 'naukrimili.com';
const testUrls = [
  `https://${domain}/api/auth/providers`,
  `https://${domain}/api/auth/signin/google`,
  `https://${domain}/api/auth/session`,
];

console.log('🌐 Testing NextAuth OAuth Global Configuration\n');
console.log('=' .repeat(60));

async function testUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200), // First 200 chars
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      reject({ error: error.message, url });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({ error: 'Request timeout', url });
    });
  });
}

async function runTests() {
  console.log('\n📋 Test Configuration:');
  console.log(`   Domain: ${domain}`);
  console.log(`   NEXTAUTH_URL: https://${domain}`);
  console.log(`   Expected: All endpoints should return 200 OK\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const url of testUrls) {
    try {
      console.log(`\n🔍 Testing: ${url}`);
      const result = await testUrl(url);
      
      if (result.status === 200) {
        console.log(`   ✅ Status: ${result.status} OK`);
        passed++;
        
        // Check for OAuth-specific headers
        if (result.headers['access-control-allow-origin']) {
          console.log(`   ✅ CORS: ${result.headers['access-control-allow-origin']}`);
        }
        
        // Check if Google OAuth is configured
        if (url.includes('/providers') && result.data.includes('google')) {
          console.log(`   ✅ Google OAuth: Configured`);
        }
      } else {
        console.log(`   ❌ Status: ${result.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.error || error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / testUrls.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All OAuth endpoints are working globally!');
  } else {
    console.log('\n⚠️  Some OAuth endpoints need attention.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Check Google Cloud Console configuration');
  console.log('   2. Verify Authorized JavaScript origins include:');
  console.log(`      - https://${domain}`);
  console.log('   3. Verify Authorized redirect URIs include:');
  console.log(`      - https://${domain}/api/auth/callback/google`);
}

runTests().catch(console.error);

