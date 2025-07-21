// Test OAuth Configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking OAuth Configuration...\n');

// Check .env file
const envPath = path.join(__dirname, '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });
} else {
    console.log('❌ .env file not found!');
}

// Check required variables
const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
];

console.log('Environment Variables Check:');
requiredVars.forEach(varName => {
    if (envVars[varName]) {
        console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***hidden***' : envVars[varName]}`);
    } else {
        console.log(`❌ ${varName}: Missing!`);
    }
});

// Check NextAuth configuration
const nextAuthPath = path.join(__dirname, 'pages', 'api', 'auth', '[...nextauth].ts');
if (fs.existsSync(nextAuthPath)) {
    console.log('✅ NextAuth configuration file exists');
} else {
    console.log('❌ NextAuth configuration file missing');
}

// Display the redirect URI that will be used
const nextAuthUrl = envVars['NEXTAUTH_URL'] || 'http://localhost:3000';
console.log(`\n🔗 Your OAuth redirect URI should be:`);
console.log(`   ${nextAuthUrl}/api/auth/callback/google`);

console.log(`\n📋 Add this to Google Cloud Console:`);
console.log(`   Authorized redirect URIs:`);
console.log(`   - ${nextAuthUrl}/api/auth/callback/google`);
console.log(`   - ${nextAuthUrl.replace('localhost', '127.0.0.1')}/api/auth/callback/google`);

console.log(`\n   Authorized JavaScript origins:`);
console.log(`   - ${nextAuthUrl}`);
console.log(`   - ${nextAuthUrl.replace('localhost', '127.0.0.1')}`);

console.log(`\n🌐 Direct link to your OAuth client:`);
console.log(`   https://console.cloud.google.com/apis/credentials/oauthclient/${envVars['GOOGLE_CLIENT_ID']?.split('-')[0] || 'YOUR_CLIENT_ID'}`);

console.log(`\n🚀 After updating Google Cloud Console:`);
console.log(`   1. Wait 2-3 minutes for changes to propagate`);
console.log(`   2. Run: npm run dev`);
console.log(`   3. Test at: ${nextAuthUrl}/auth/login`);
