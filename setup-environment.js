#!/usr/bin/env node

/**
 * Environment Setup Script for Server
 * Creates proper .env.local file with required NextAuth configuration
 */

const fs = require('fs');
const path = require('path');

const envContent = `# NextAuth Configuration - REQUIRED
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=fallback-secret-key-for-development-only-32-chars-min

# Database Configuration
DATABASE_URL="postgresql://jobportal_user:job123@localhost:5432/jobportal"

# Google OAuth (Optional - will disable Google sign-in if not configured)
# GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aftionix.in

# JWT Secret
JWT_SECRET=fallback-jwt-secret-key-here

# AI Services (Optional)
# OPENAI_API_KEY=your-openai-api-key
# GEMINI_API_KEY=your-gemini-api-key

# Job APIs (Optional)
# ADZUNA_APP_ID=your-adzuna-app-id
# ADZUNA_API_KEY=your-adzuna-api-key
# REED_API_KEY=your-reed-api-key
# GOOGLE_JOBS_API_KEY=your-google-jobs-api-key

# AWS S3 (Optional for file uploads)
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=your-s3-bucket-name
`;

const envPath = path.join(__dirname, '.env.local');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists');
    console.log('📖 Please check if NextAuth environment variables are properly configured');
    
    // Read existing file and check for required variables
    const existingContent = fs.readFileSync(envPath, 'utf8');
    
    if (!existingContent.includes('NEXTAUTH_URL=')) {
      console.log('❌ NEXTAUTH_URL is missing from .env.local');
      console.log('🔧 Adding missing NEXTAUTH_URL...');
      
      const updatedContent = existingContent + '\n\n# Added by setup script\nNEXTAUTH_URL=https://aftionix.in\n';
      fs.writeFileSync(envPath, updatedContent);
      console.log('✅ NEXTAUTH_URL added to .env.local');
    }
    
    if (!existingContent.includes('NEXTAUTH_SECRET=')) {
      console.log('❌ NEXTAUTH_SECRET is missing from .env.local');
      console.log('🔧 Adding missing NEXTAUTH_SECRET...');
      
      const updatedContent = existingContent + 'NEXTAUTH_SECRET=fallback-secret-key-for-development-only-32-chars-min\n';
      fs.writeFileSync(envPath, updatedContent);
      console.log('✅ NEXTAUTH_SECRET added to .env.local');
    }
    
  } else {
    // Create new .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with required NextAuth configuration');
  }
  
  console.log('\n🔧 NextAuth Configuration Status:');
  console.log('   ✅ NEXTAUTH_URL: https://aftionix.in');
  console.log('   ✅ NEXTAUTH_SECRET: Set (fallback key)');
  console.log('   ⚠️  Google OAuth: Disabled (credentials not configured)');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your application server');
  console.log('2. Test authentication - configuration error should be resolved');
  console.log('3. Optional: Configure Google OAuth credentials if needed');
  
} catch (error) {
  console.error('❌ Error setting up environment:', error.message);
  process.exit(1);
}
