const { NextAuth } = require('next-auth');
const Google = require('next-auth/providers/google').default;

console.log('🔍 Debugging OAuth Configuration...');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Test Google provider configuration
const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

console.log('Google Provider:', googleProvider);
