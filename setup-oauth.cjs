#!/usr/bin/env node

/**
 * OAuth Setup Script
 * Helps configure Google OAuth for the job portal
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Google OAuth Setup Script');
console.log('============================\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local file already exists');
  
  // Check if Google OAuth is configured
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasGoogleClientId = envContent.includes('GOOGLE_CLIENT_ID=') && 
                           !envContent.includes('GOOGLE_CLIENT_ID=your-');
  const hasGoogleClientSecret = envContent.includes('GOOGLE_CLIENT_SECRET=') && 
                               !envContent.includes('GOOGLE_CLIENT_SECRET=your-');
  
  if (hasGoogleClientId && hasGoogleClientSecret) {
    console.log('✅ Google OAuth credentials are configured');
    console.log('✅ Gmail authentication should be working\n');
  } else {
    console.log('❌ Google OAuth credentials are missing or not properly configured');
    console.log('📝 Please add the following to your .env.local file:\n');
    console.log('# Google OAuth Configuration');
    console.log('GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com');
    console.log('GOOGLE_CLIENT_SECRET=your-google-client-secret\n');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('📝 Creating .env.local template...\n');
  
  const envTemplate = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production

# Google OAuth Configuration (Required for Gmail authentication)
# Get these from Google Cloud Console: https://console.cloud.google.com/
# 1. Go to Google Cloud Console
# 2. Create a new project or select existing one
# 3. Enable Google+ API
# 4. Go to "APIs & Services" > "Credentials"
# 5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
# 6. Choose "Web application"
# 7. Add authorized redirect URIs:
#    http://localhost:3000/api/auth/callback/google
#    https://yourdomain.com/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal?schema=public"

# Development Settings
NODE_ENV=development
DEBUG=true

# External Job APIs (Optional - for enhanced job search)
# ADZUNA_APP_ID=your-adzuna-app-id
# ADZUNA_APP_KEY=your-adzuna-app-key
# RAPIDAPI_KEY=your-rapidapi-key
# JSEARCH_API_KEY=your-jsearch-api-key

# WhatsApp OTP (Already configured)
# WHATSAPP_API_TOKEN=your-whatsapp-token
# WHATSAPP_API_URL=https://graph.facebook.com/v18.0`;

  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env.local template');
    console.log('📝 Please update the Google OAuth credentials in .env.local\n');
  } catch (error) {
    console.log('❌ Failed to create .env.local file:', error.message);
    console.log('📝 Please create .env.local manually with the template above\n');
  }
}

console.log('🚀 Google OAuth Setup Instructions:');
console.log('===================================');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Google+ API:');
console.log('   - Go to "APIs & Services" > "Library"');
console.log('   - Search for "Google+ API" and enable it');
console.log('4. Create OAuth 2.0 credentials:');
console.log('   - Go to "APIs & Services" > "Credentials"');
console.log('   - Click "Create Credentials" > "OAuth 2.0 Client IDs"');
console.log('   - Choose "Web application"');
console.log('   - Add authorized redirect URIs:');
console.log('     * http://localhost:3000/api/auth/callback/google');
console.log('     * https://yourdomain.com/api/auth/callback/google (for production)');
console.log('5. Copy the Client ID and Client Secret to your .env.local file');
console.log('6. Restart your development server: npm run dev');
console.log('7. Test Gmail authentication on your signin page\n');

console.log('✅ OAuth setup complete!');
console.log('📧 Gmail authentication will be available once credentials are configured.');
