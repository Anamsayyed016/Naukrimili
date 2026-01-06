/**
 * Payment Gateway Diagnostic Script
 * Run this to check payment gateway configuration and issues
 */

const checkPaymentGateway = async () => {
  console.log('🔍 Payment Gateway Diagnostic Tool\n');
  console.log('=' .repeat(50));
  
  // Check 1: Environment Variables
  console.log('\n1️⃣ Checking Environment Variables:');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId) {
    console.error('❌ RAZORPAY_KEY_ID is NOT SET');
    console.log('   → Set it in .env.local or ecosystem.config.cjs');
  } else {
    console.log('✅ RAZORPAY_KEY_ID is set');
    console.log(`   → Key: ${keyId.substring(0, 10)}...${keyId.substring(keyId.length - 4)}`);
    
    if (keyId.startsWith('rzp_test_')) {
      console.log('   → Mode: TEST (development)');
    } else if (keyId.startsWith('rzp_live_')) {
      console.log('   → Mode: LIVE (production)');
    } else {
      console.warn('   ⚠️  Unknown key format (should start with rzp_test_ or rzp_live_)');
    }
  }
  
  if (!keySecret) {
    console.error('❌ RAZORPAY_KEY_SECRET is NOT SET');
    console.log('   → Set it in .env.local or ecosystem.config.cjs');
  } else {
    console.log('✅ RAZORPAY_KEY_SECRET is set');
    console.log(`   → Secret: ${'*'.repeat(keySecret.length)}`);
  }
  
  // Check 2: Test API Endpoint
  console.log('\n2️⃣ Testing API Endpoint:');
  try {
    const testResponse = await fetch('http://localhost:3000/api/payments/status', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ Payment status API is accessible');
      console.log('   → Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Payment status API returned ${testResponse.status}`);
      const errorText = await testResponse.text();
      console.log('   → Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Cannot reach payment API:', error.message);
    console.log('   → Make sure the server is running on port 3000');
  }
  
  // Check 3: Razorpay SDK URL
  console.log('\n3️⃣ Checking Razorpay SDK URL:');
  const razorpayUrl = 'https://checkout.razorpay.com/v1/checkout.js';
  try {
    const sdkResponse = await fetch(razorpayUrl, { method: 'HEAD' });
    if (sdkResponse.ok) {
      console.log('✅ Razorpay SDK URL is accessible');
    } else {
      console.error(`❌ Razorpay SDK URL returned ${sdkResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Cannot reach Razorpay SDK URL:', error.message);
    console.log('   → Check your internet connection or firewall settings');
  }
  
  // Check 4: Database Connection
  console.log('\n4️⃣ Checking Database (Payment Table):');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Try to query Payment table
    const paymentCount = await prisma.payment.count();
    console.log('✅ Payment table exists and is accessible');
    console.log(`   → Total payments: ${paymentCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('   → Run: npx prisma migrate dev');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Summary:');
  
  if (!keyId || !keySecret) {
    console.log('\n❌ CRITICAL: Razorpay credentials are missing!');
    console.log('\nTo fix:');
    console.log('1. Get your Razorpay keys from https://dashboard.razorpay.com/');
    console.log('2. Add to .env.local:');
    console.log('   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx');
    console.log('   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx');
    console.log('3. Restart your server');
  } else {
    console.log('\n✅ Configuration looks good!');
    console.log('\nIf payment still fails, check:');
    console.log('- Browser console for JavaScript errors');
    console.log('- Network tab for failed API requests');
    console.log('- Server logs for backend errors');
    console.log('- Ad blockers or VPN blocking Razorpay');
  }
};

// Run diagnostic
checkPaymentGateway().catch(console.error);

