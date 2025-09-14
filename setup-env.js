#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates .env.local with proper Google OAuth configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production

# Google OAuth (Required for Gmail Authentication)
# Get these from Google Cloud Console: https://console.cloud.google.com/
# 1. Go to Google Cloud Console
# 2. Create a new project or select existing one
# 3. Enable Google+ API
# 4. Go to "APIs & Services" > "Credentials"
# 5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
# 6. Add authorized redirect URIs:
#    - http://localhost:3000/api/auth/callback/google
#    - https://aftionix.in/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Development Settings
NODE_ENV=development
DEBUG=true
`;

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('⚠️  Please update the Google OAuth credentials in .env.local');
  console.log('📖 Follow the instructions in the file to get your Google OAuth credentials');
} else {
  console.log('⚠️  .env.local already exists');
  console.log('📖 Please check if Google OAuth credentials are properly configured');
}

console.log('\n🔧 Next steps:');
console.log('1. Get Google OAuth credentials from Google Cloud Console');
console.log('2. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
console.log('3. Restart your development server');
console.log('4. Test Gmail authentication');
