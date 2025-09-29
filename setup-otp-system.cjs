/**
 * OTP System Setup Script
 * Helps set up the OTP verification system
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up OTP Verification System...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Database Configuration
DATABASE_URL="postgresql://postgres:job123@localhost:5432/jobportal"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production

# Google OAuth (Required for Gmail Authentication)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# WhatsApp API Configuration
WHATSAPP_API_TOKEN=your_whatsapp_api_token_here
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Development Settings
NODE_ENV=development
DEBUG=true
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created successfully');
  } catch (error) {
    console.error('❌ Failed to create .env.local file:', error.message);
    console.log('📝 Please create .env.local manually with the following content:');
    console.log(envContent);
  }
} else {
  console.log('✅ .env.local file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Update your .env.local file with your actual API keys');
console.log('2. Run: npx prisma db push');
console.log('3. Start the development server: npm run dev');
console.log('4. Test the OTP system at: http://localhost:3000/test-otp');

console.log('\n🎯 OTP System Features:');
console.log('• WhatsApp OTP delivery');
console.log('• Real-time notifications');
console.log('• Secure 6-digit codes');
console.log('• Rate limiting and attempt tracking');
console.log('• Mobile-responsive UI');
console.log('• Integration with existing Gmail OAuth');

console.log('\n🚀 Ready to use!');
