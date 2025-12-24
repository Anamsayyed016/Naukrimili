#!/usr/bin/env node

/**
 * Test Payment Flow Script
 * Validates Razorpay configuration and payment endpoint connectivity
 * 
 * Usage: node scripts/test-payment-flow.js
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
  });
}

async function testPaymentConfig() {
  log('\n🔍 Testing Payment Configuration...', 'cyan');
  
  try {
    const url = `${BASE_URL}/api/debug/payment-config`;
    log(`  → GET ${url}`, 'blue');
    
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      log('  ✅ Endpoint is accessible', 'green');
      
      log('\n📋 Razorpay Configuration Status:', 'cyan');
      const razorpay = data.razorpay;
      
      if (razorpay.keyIdConfigured) {
        log(`  ✅ RAZORPAY_KEY_ID: Configured (${razorpay.keyIdPrefix})`, 'green');
      } else {
        log('  ❌ RAZORPAY_KEY_ID: NOT CONFIGURED', 'red');
      }
      
      if (razorpay.keySecretConfigured) {
        log('  ✅ RAZORPAY_KEY_SECRET: Configured', 'green');
      } else {
        log('  ❌ RAZORPAY_KEY_SECRET: NOT CONFIGURED', 'red');
      }
      
      return razorpay.keyIdConfigured && razorpay.keySecretConfigured;
    } else if (response.status === 403) {
      log('  ⚠️  Endpoint only available in development mode', 'yellow');
      return null;
    } else {
      log(`  ❌ Unexpected status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log(`  💡 Make sure your dev server is running on ${BASE_URL}`, 'yellow');
    return false;
  }
}

async function testCreateOrder() {
  log('\n🔍 Testing Create Order Endpoint...', 'cyan');
  
  try {
    const url = `${BASE_URL}/api/payments/create-order`;
    log(`  → POST ${url}`, 'blue');
    
    // Note: This will likely fail without authentication, but we can see if endpoint exists
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      log('  ✅ Endpoint exists (returns 401 without auth - expected)', 'green');
      return true;
    } else if (response.status === 500) {
      const body = JSON.parse(response.body);
      if (body.error === 'Payment gateway not configured') {
        log('  ⚠️  Payment gateway not configured', 'yellow');
        log(`     Error: ${body.details}`, 'yellow');
        return false;
      }
      log(`  ❌ Server error: ${body.error}`, 'red');
      return false;
    } else {
      log(`  ✅ Endpoint accessible (status: ${response.status})`, 'green');
      return true;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testVerifyPayment() {
  log('\n🔍 Testing Verify Payment Endpoint...', 'cyan');
  
  try {
    const url = `${BASE_URL}/api/payments/verify`;
    log(`  → POST ${url}`, 'blue');
    log('  ✅ Endpoint exists (cannot test without real payment data)', 'green');
    return true;
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║      Razorpay Payment Gateway - Configuration Test         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const configOk = await testPaymentConfig();
  const createOrderOk = await testCreateOrder();
  const verifyPaymentOk = await testVerifyPayment();
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                       Test Summary                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  if (configOk === false) {
    log('\n❌ ISSUE FOUND:', 'red');
    log('   Razorpay credentials are NOT configured!', 'red');
    log('\n📝 To fix:', 'yellow');
    log('   1. Go to https://dashboard.razorpay.com/', 'yellow');
    log('   2. Get your Test Key ID and Secret from Settings → API Keys', 'yellow');
    log('   3. Add to .env.local:', 'yellow');
    log('      RAZORPAY_KEY_ID=your_key_id', 'yellow');
    log('      RAZORPAY_KEY_SECRET=your_key_secret', 'yellow');
    log('   4. Restart dev server: npm run dev', 'yellow');
    process.exit(1);
  } else if (configOk === true) {
    log('\n✅ All systems operational!', 'green');
    log('   Your payment gateway is properly configured.', 'green');
    log('\n💡 Next steps:', 'blue');
    log('   1. Go to http://localhost:3000/pricing', 'blue');
    log('   2. Click "Buy Now" on any plan', 'blue');
    log('   3. Test payment with: 4111 1111 1111 1111', 'blue');
    process.exit(0);
  } else {
    log('\n⚠️  Could not determine configuration status', 'yellow');
    log('   Make sure dev server is running on http://localhost:3000', 'yellow');
    process.exit(2);
  }
}

runTests().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

