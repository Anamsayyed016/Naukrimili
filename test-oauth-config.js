/**
 * OAuth Configuration Test Script
 * Tests OAuth setup and provides detailed diagnostics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 OAuth Configuration Test\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

console.log('📋 Environment Variables Check:');
console.log('================================');

// Check NextAuth variables
const nextAuthUrl = envVars.NEXTAUTH_URL;
const nextAuthSecret = envVars.NEXTAUTH_SECRET;

console.log(`NEXTAUTH_URL: ${nextAuthUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXTAUTH_SECRET: ${nextAuthSecret ? '✅ Set' : '❌ Missing'}`);

// Check Google OAuth variables
const googleClientId = envVars.GOOGLE_CLIENT_ID;
const googleClientSecret = envVars.GOOGLE_CLIENT_SECRET;

console.log(`GOOGLE_CLIENT_ID: ${googleClientId ? '✅ Set' : '❌ Missing'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret ? '✅ Set' : '❌ Missing'}`);

// Check database
const databaseUrl = envVars.DATABASE_URL;
console.log(`DATABASE_URL: ${databaseUrl ? '✅ Set' : '❌ Missing'}`);

// Check WhatsApp OTP
const whatsappToken = envVars.WHATSAPP_API_TOKEN;
const whatsappUrl = envVars.WHATSAPP_API_URL;
console.log(`WHATSAPP_API_TOKEN: ${whatsappToken ? '✅ Set' : '❌ Missing'}`);
console.log(`WHATSAPP_API_URL: ${whatsappUrl ? '✅ Set' : '❌ Missing'}`);

console.log('\n🔍 OAuth Status Analysis:');
console.log('========================');

if (googleClientId && googleClientSecret && 
    !googleClientId.includes('your-') && !googleClientSecret.includes('your-') &&
    googleClientId !== '' && googleClientSecret !== '') {
  console.log('✅ Google OAuth is properly configured');
  console.log('   - Users can sign in with Google');
  console.log('   - OAuth buttons will work');
} else {
  console.log('⚠️  Google OAuth is NOT configured');
  console.log('   - OAuth buttons will show error message');
  console.log('   - Users should use OTP or Email/Password');
}

if (whatsappToken && whatsappUrl) {
  console.log('✅ WhatsApp OTP is configured');
  console.log('   - Users can authenticate via OTP');
} else {
  console.log('❌ WhatsApp OTP is NOT configured');
  console.log('   - OTP authentication will not work');
}

if (nextAuthUrl && nextAuthSecret) {
  console.log('✅ NextAuth is configured');
  console.log('   - Session management will work');
} else {
  console.log('❌ NextAuth is NOT configured');
  console.log('   - Authentication will fail');
}

console.log('\n🚀 Recommendations:');
console.log('===================');

if (!googleClientId || !googleClientSecret) {
  console.log('1. Add Google OAuth credentials to .env.local:');
  console.log('   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com');
  console.log('   GOOGLE_CLIENT_SECRET=your-google-client-secret');
  console.log('   Get these from: https://console.cloud.google.com/');
}

if (!whatsappToken || !whatsappUrl) {
  console.log('2. Add WhatsApp API credentials to .env.local:');
  console.log('   WHATSAPP_API_TOKEN=your-whatsapp-token');
  console.log('   WHATSAPP_API_URL=https://graph.facebook.com/v18.0');
}

console.log('\n3. Restart your development server after adding credentials:');
console.log('   npm run dev');

console.log('\n✅ Test completed!');
