/**
 * OAuth Configuration Test Script
 * Tests Google and LinkedIn OAuth setup
 */

const { oauthConfig } = require('./lib/oauth-config.ts');

console.log('🔧 Testing OAuth Configuration...\n');

try {
  // Test environment info
  const envInfo = oauthConfig.getEnvironmentInfo();
  console.log('📊 Environment Info:');
  console.log(`  Environment: ${envInfo.environment}`);
  console.log(`  Node ENV: ${envInfo.nodeEnv}`);
  console.log(`  NextAuth URL: ${envInfo.nextAuthUrl}`);
  console.log(`  Suffix: ${envInfo.suffix}\n`);

  // Test OAuth configuration
  const config = oauthConfig.getOAuthConfig();
  console.log('🔐 OAuth Configuration:');
  console.log('  Google:');
  console.log(`    Client ID: ${config.google.clientId ? '✅ Set' : '❌ Missing'}`);
  console.log(`    Client Secret: ${config.google.clientSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`    Redirect URI: ${config.google.redirectUri || '❌ Missing'}`);
  
  console.log('  LinkedIn:');
  console.log(`    Client ID: ${config.linkedin.clientId ? '✅ Set' : '❌ Missing'}`);
  console.log(`    Client Secret: ${config.linkedin.clientSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`    Redirect URI: ${config.linkedin.redirectUri || '❌ Missing'}\n`);

  // Validate configuration
  const validation = oauthConfig.validateConfig();
  console.log('✅ Validation Results:');
  console.log(`  Valid: ${validation.valid ? '✅ Yes' : '❌ No'}`);
  
  if (validation.errors.length > 0) {
    console.log('  Errors:');
    validation.errors.forEach(error => {
      console.log(`    ❌ ${error}`);
    });
  } else {
    console.log('  ✅ All OAuth configurations are valid!');
  }

  // Test scopes
  console.log('\n🔍 OAuth Scopes:');
  console.log('  Google:', oauthConfig.getGoogleScopes());
  console.log('  LinkedIn:', oauthConfig.getLinkedInScopes());

} catch (error) {
  console.error('❌ OAuth Configuration Test Failed:');
  console.error(error.message);
  
  console.log('\n💡 Quick Fix:');
  console.log('1. Check your .env.local file');
  console.log('2. Ensure all required environment variables are set');
  console.log('3. Refer to OAUTH_SETUP_GUIDE.md for setup instructions');
}