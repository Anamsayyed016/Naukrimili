#!/usr/bin/env node

/**
 * GCS Connection Test Script
 * 
 * Quick test script to verify Google Cloud Storage connection
 * Run with: node scripts/test-gcs-connection.js
 */

const https = require('https');

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/storage/test-gcs';

console.log('🔍 Testing Google Cloud Storage Connection...\n');
console.log(`📡 Endpoint: ${API_URL}\n`);

const protocol = API_URL.startsWith('https') ? https : require('http');

protocol.get(API_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('═'.repeat(60));
      console.log('  GCS CONNECTION TEST RESULTS');
      console.log('═'.repeat(60));
      console.log();
      
      if (result.success) {
        console.log('✅ Status: SUCCESS');
        console.log(`✅ Message: ${result.message}`);
        console.log();
        console.log('📊 Configuration:');
        console.log(`   Project ID: ${result.config?.projectId || 'N/A'}`);
        console.log(`   Bucket Name: ${result.config?.bucketName || 'N/A'}`);
        console.log(`   Identity Pool: ${result.config?.identityPool || 'N/A'}`);
        console.log(`   Environment: ${result.config?.environment || 'N/A'}`);
        console.log(`   Enabled: ${result.config?.enabled ? 'Yes' : 'No'}`);
        console.log();
        console.log('🎉 Google Cloud Storage is configured correctly!');
      } else {
        console.log('❌ Status: FAILED');
        console.log(`❌ Error: ${result.error || 'Unknown error'}`);
        console.log(`❌ Message: ${result.message || 'Connection test failed'}`);
        console.log();
        console.log('💡 Troubleshooting:');
        console.log('   1. Check environment variables (GCP_PROJECT_ID, GCS_BUCKET_NAME)');
        console.log('   2. Verify Workload Identity Federation is configured');
        console.log('   3. Ensure bucket exists and is accessible');
        console.log('   4. Check IAM permissions');
        console.log('   5. Review server logs for detailed errors');
      }
      
      console.log();
      console.log('═'.repeat(60));
      console.log(`⏰ Timestamp: ${result.timestamp || new Date().toISOString()}`);
      console.log('═'.repeat(60));
      console.log();
      
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('📄 Raw response:', data);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ Connection Error:', error.message);
  console.error();
  console.error('💡 Possible causes:');
  console.error('   - Server is not running');
  console.error('   - Wrong API URL');
  console.error('   - Network issues');
  console.error();
  console.error(`   Try: npm run dev`);
  console.error(`   Then: node scripts/test-gcs-connection.js`);
  process.exit(1);
});

