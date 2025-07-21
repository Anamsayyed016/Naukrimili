// Debug OAuth Configuration
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔍 OAuth Configuration Debug\n');

// Check environment variables
const envVars = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '[HIDDEN]' : 'MISSING',
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? '[HIDDEN]' : 'MISSING'
};

console.log('📋 Environment Variables:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value && value !== 'MISSING' ? '✅' : '❌';
  console.log(`   ${status} ${key}: ${value || 'NOT SET'}`);
});

console.log('\n🔗 Expected Redirect URI:');
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const redirectUri = `${baseUrl}/api/auth/callback/google`;
console.log(`   ${redirectUri}`);

console.log('\n📝 Google Cloud Console Setup:');
console.log('   1. Go to: https://console.cloud.google.com/');
console.log('   2. Navigate to: APIs & Services > Credentials');
console.log(`   3. Find OAuth Client ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log('   4. Add this EXACT redirect URI:');
console.log(`      ${redirectUri}`);

console.log('\n⚠️  Common Issues:');
console.log('   - URI case sensitivity (must match exactly)');
console.log('   - Trailing slashes (should NOT have them)');
console.log('   - Protocol mismatch (http vs https)');
console.log('   - Port mismatch');
console.log('   - Google Cloud Console propagation delay (5-10 minutes)');

// Additional debugging info
console.log('\n🌐 Network Information:');
console.log(`   - Current working directory: ${process.cwd()}`);
console.log(`   - Node.js version: ${process.version}`);
console.log(`   - Platform: ${process.platform}`);

console.log('\n🧪 Test URLs:');
console.log(`   - OAuth test page: ${baseUrl}/test-oauth`);
console.log(`   - Auth login page: ${baseUrl}/auth/login`);
console.log(`   - NextAuth callback: ${baseUrl}/api/auth/callback/google`);
