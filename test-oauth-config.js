/**
 * OAuth Configuration Test Script
 * Tests the dynamic OAuth configuration without relying on the web server
 */

import { oauthConfig } from './lib/oauth-config';

async function testOAuthConfig() {
  console.log('🔐 OAuth Configuration Test\n');

  try {
    // Test environment info
    console.log('📊 Environment Info:');
    const envInfo = oauthConfig.getEnvironmentInfo();
    console.log(`   Environment: ${envInfo.environment}`);
    console.log(`   Node ENV: ${envInfo.nodeEnv}`);
    console.log(`   NextAuth URL: ${envInfo.nextAuthUrl}`);
    console.log(`   Suffix: ${envInfo.suffix}\n`);

    // Test validation
    console.log('✅ Configuration Validation:');
    const validation = oauthConfig.validateConfig();
    console.log(`   Valid: ${validation.valid}`);
    if (validation.errors.length > 0) {
      console.log('   Errors:');
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }
    console.log('');

    // Test OAuth scopes
    console.log('🎯 OAuth Scopes:');
    console.log('   Google:', oauthConfig.getGoogleScopes());
    console.log('   LinkedIn:', oauthConfig.getLinkedInScopes());
    console.log('');

    // Test provider config (without exposing secrets)
    console.log('🔑 Provider Configuration:');
    try {
      const config = oauthConfig.getOAuthConfig();
      console.log('   Google:');
      console.log(`     Client ID: ${config.google.clientId ? '✓ Set' : '✗ Missing'}`);
      console.log(`     Client Secret: ${config.google.clientSecret ? '✓ Set' : '✗ Missing'}`);
      console.log(`     Redirect URI: ${config.google.redirectUri}`);
      
      console.log('   LinkedIn:');
      console.log(`     Client ID: ${config.linkedin.clientId ? '✓ Set' : '✗ Missing'}`);
      console.log(`     Client Secret: ${config.linkedin.clientSecret ? '✓ Set' : '✗ Missing'}`);
      console.log(`     Redirect URI: ${config.linkedin.redirectUri}`);
    } catch (error) {
      console.log(`   ❌ Error loading config: ${error.message}`);
    }

    console.log('\n🎉 OAuth Configuration Test Complete!');
    
    if (validation.valid) {
      console.log('✅ All configurations are valid and ready for use!');
    } else {
      console.log('❌ Please fix the configuration errors above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testOAuthConfig();
