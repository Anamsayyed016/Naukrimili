/**
 * Simple OAuth Test
 * Tests if Google OAuth is properly configured
 */

import fs from 'fs';

console.log('🔐 Simple OAuth Test\n');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};

console.log('Raw .env.local content:');
console.log(envContent);
console.log('\nParsing lines:');

envContent.split('\n').forEach((line, index) => {
  console.log(`Line ${index}: "${line}"`);
  if (line.includes('=')) {
    const equalIndex = line.indexOf('=');
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
    console.log(`  Key: "${key}", Value: "${value}"`);
    if (key && value) {
      envVars[key] = value;
    }
  }
});

console.log('\nParsed environment variables:');
console.log(envVars);

console.log('📋 Google OAuth Configuration:');
console.log('==============================');

const googleClientId = envVars.GOOGLE_CLIENT_ID;
const googleClientSecret = envVars.GOOGLE_CLIENT_SECRET;

console.log(`GOOGLE_CLIENT_ID: ${googleClientId ? '✅ Found' : '❌ Missing'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret ? '✅ Found' : '❌ Missing'}`);

if (googleClientId && googleClientSecret) {
  console.log('\n✅ Google OAuth credentials are configured!');
  console.log('   - OAuth buttons should work');
  console.log('   - Users can sign in with Google');
  
  // Check if credentials look valid
  if (googleClientId.includes('.apps.googleusercontent.com') && 
      googleClientSecret.startsWith('GOCSPX-')) {
    console.log('   - Credentials format looks correct');
  } else {
    console.log('   - ⚠️  Credentials format may be incorrect');
  }
} else {
  console.log('\n❌ Google OAuth credentials are missing!');
  console.log('   - OAuth buttons will show error message');
}

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Visit: http://localhost:3000/auth/signin');
console.log('2. Look for "Continue with Google" button');
console.log('3. Click it to test OAuth flow');
console.log('4. Should redirect to Google OAuth page');

console.log('\n✅ Test completed!');
