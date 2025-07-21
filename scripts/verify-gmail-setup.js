#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Gmail OAuth Setup Verification\n');

// Check environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET'
];

console.log('📋 Environment Variables Check:');
let missingVars = [];

requiredEnvVars.forEach(varName => {
  if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
    console.log(`   ✅ ${varName} is set`);
  } else {
    console.log(`   ❌ ${varName} is missing or not configured`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n🚨 Missing required environment variables. Please check your .env.local file.');
}

console.log('\n📝 Next Steps:');
console.log('1. Ensure Gmail API is enabled in Google Cloud Console');
console.log('2. Add authorized redirect URIs:');
console.log('   - http://localhost:3000/api/auth/callback/google');
console.log('3. Test authentication at: http://localhost:3000/auth/login');

console.log('\n🔗 Useful Links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com');

if (missingVars.length === 0) {
  console.log('\n✅ Configuration looks good! Try testing Gmail authentication.');
} else {
  console.log('\n⚠️  Please fix the missing configurations before testing.');
}
