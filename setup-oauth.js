#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Google OAuth Setup Helper\n');

// Generate a secure NextAuth secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Create .env.local file
const createEnvFile = (googleClientId, googleClientSecret) => {
  const nextAuthSecret = generateSecret();
  const jwtSecret = generateSecret();
  
  const envContent = `# Google OAuth Configuration
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextAuthSecret}

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/jobportal

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL
FRONTEND_URL=http://localhost:3000
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file with your credentials');
  console.log('🔐 Generated secure secrets for NextAuth and JWT');
};

// Main setup flow
const setup = () => {
  console.log('📋 Follow these steps to set up Google OAuth:\n');
  
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create a new project or select an existing one');
  console.log('3. Enable the Gmail API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Add these redirect URIs:');
  console.log('   - http://localhost:3000/api/auth/callback/google');
  console.log('   - http://localhost:3002/api/auth/callback/google');
  console.log('6. Copy your Client ID and Client Secret\n');

  rl.question('Enter your Google Client ID: ', (clientId) => {
    rl.question('Enter your Google Client Secret: ', (clientSecret) => {
      if (clientId && clientSecret) {
        createEnvFile(clientId, clientSecret);
        console.log('\n🎉 Setup complete! Now restart your development server:');
        console.log('npm run dev');
        console.log('\nThen test Google OAuth at: http://localhost:3000/auth/login');
      } else {
        console.log('❌ Please provide both Client ID and Client Secret');
      }
      rl.close();
    });
  });
};

setup(); 