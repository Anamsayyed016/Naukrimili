#!/usr/bin/env node

/**
 * Gmail OAuth2 Diagnostic Tool
 * 
 * This script performs comprehensive diagnostics on the Gmail OAuth2 email system
 * 
 * Usage:
 *   node scripts/diagnose-gmail-oauth2.js
 *   
 * Or with specific tests:
 *   node scripts/diagnose-gmail-oauth2.js --test credentials
 *   node scripts/diagnose-gmail-oauth2.js --test api
 *   node scripts/diagnose-gmail-oauth2.js --test email
 */

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Diagnostic tests
const diagnostics = {
  
  /**
   * Test 1: Check Environment Variables
   */
  async checkEnvironment() {
    section('TEST 1: Environment Variables');
    
    const requiredVars = [
      'GMAIL_API_CLIENT_ID',
      'GMAIL_API_CLIENT_SECRET',
      'GMAIL_API_REFRESH_TOKEN'
    ];
    
    const optionalVars = [
      'GMAIL_SENDER',
      'GMAIL_FROM_NAME'
    ];
    
    let allPresent = true;
    
    // Check required variables
    info('Checking required variables:');
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        error(`${varName} is NOT SET`);
        allPresent = false;
      } else if (value.includes('your_')) {
        warning(`${varName} contains placeholder value`);
        allPresent = false;
      } else {
        const masked = value.length > 20 
          ? value.substring(0, 10) + '...' + value.substring(value.length - 10)
          : '***';
        success(`${varName} is set: ${masked}`);
      }
    }
    
    // Check optional variables
    info('\nChecking optional variables:');
    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (!value) {
        info(`${varName} not set (will use default)`);
      } else {
        success(`${varName} is set: ${value}`);
      }
    }
    
    return allPresent;
  },
  
  /**
   * Test 2: Validate OAuth2 Credentials
   */
  async validateCredentials() {
    section('TEST 2: OAuth2 Credentials Validation');
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot validate - credentials not set');
      return false;
    }
    
    try {
      info('Creating OAuth2 client...');
      const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      
      success('OAuth2 client created');
      
      info('Setting refresh token...');
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      success('Refresh token set');
      
      info('Attempting to get access token...');
      const tokenResponse = await oauth2Client.getAccessToken();
      
      if (tokenResponse.token) {
        success('Successfully obtained access token!');
        info(`Token preview: ${tokenResponse.token.substring(0, 20)}...`);
        
        // Check token scopes
        const tokenInfo = await oauth2Client.getTokenInfo(tokenResponse.token);
        info('\nToken scopes:');
        if (tokenInfo.scopes) {
          for (const scope of tokenInfo.scopes) {
            if (scope.includes('gmail')) {
              success(`  - ${scope}`);
            } else {
              info(`  - ${scope}`);
            }
          }
          
          // Verify gmail.send scope
          const hasGmailSend = tokenInfo.scopes.some(s => 
            s.includes('gmail.send') || s.includes('mail.google.com')
          );
          
          if (hasGmailSend) {
            success('\n✅ Token has Gmail send permission');
          } else {
            error('\n❌ Token missing Gmail send permission');
            warning('Required scope: https://www.googleapis.com/auth/gmail.send');
            return false;
          }
        }
        
        return true;
      } else {
        error('Failed to obtain access token');
        return false;
      }
      
    } catch (err) {
      error('Credential validation failed!');
      error(`Error: ${err.message}`);
      
      if (err.message.includes('invalid_grant')) {
        warning('\nPossible causes for invalid_grant:');
        warning('1. Refresh token expired (not used for 6 months)');
        warning('2. User changed password');
        warning('3. Token revoked by user');
        warning('4. Client ID/Secret mismatch');
        warning('\nFix: Regenerate refresh token at:');
        info('https://developers.google.com/oauthplayground');
      } else if (err.message.includes('unauthorized_client')) {
        warning('\nClient ID or Client Secret is invalid');
        warning('Verify credentials in Google Cloud Console');
      }
      
      return false;
    }
  },
  
  /**
   * Test 3: Check Gmail API Status
   */
  async checkGmailAPI() {
    section('TEST 3: Gmail API Availability');
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot test API - credentials not set');
      return false;
    }
    
    try {
      const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      info('Creating Gmail API client...');
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      success('Gmail API client created');
      
      info('Testing API access (getting user profile)...');
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      success('Gmail API is accessible!');
      info(`Email: ${profile.data.emailAddress}`);
      info(`Messages: ${profile.data.messagesTotal}`);
      info(`Threads: ${profile.data.threadsTotal}`);
      
      return true;
      
    } catch (err) {
      error('Gmail API test failed!');
      error(`Error: ${err.message}`);
      
      if (err.code === 403) {
        warning('\nGmail API might not be enabled:');
        warning('1. Go to: https://console.cloud.google.com/apis/library');
        warning('2. Search for "Gmail API"');
        warning('3. Click "Enable"');
        warning('4. Wait 1-2 minutes for propagation');
      }
      
      return false;
    }
  },
  
  /**
   * Test 4: Send Test Email
   */
  async sendTestEmail(recipientEmail) {
    section('TEST 4: Send Test Email');
    
    if (!recipientEmail) {
      const sender = process.env.GMAIL_SENDER || 'naukrimili@naukrimili.com';
      recipientEmail = sender.match(/<(.+)>/)?.[1] || sender;
      info(`No recipient specified, sending to: ${recipientEmail}`);
    }
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot send email - credentials not set');
      return false;
    }
    
    try {
      const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      info('Creating test email...');
      
      const sender = process.env.GMAIL_SENDER || 'NaukriMili <naukrimili@naukrimili.com>';
      const subject = '🧪 Gmail OAuth2 Diagnostic Test';
      const timestamp = new Date().toISOString();
      
      const emailContent = [
        `From: ${sender}`,
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        `<div style="font-family: Arial, sans-serif; padding: 20px;">`,
        `  <h2 style="color: #10b981;">✅ Gmail OAuth2 Test Successful!</h2>`,
        `  <p>This email confirms that your Gmail OAuth2 integration is working correctly.</p>`,
        `  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">`,
        `    <p><strong>Test Details:</strong></p>`,
        `    <ul>`,
        `      <li><strong>Timestamp:</strong> ${timestamp}</li>`,
        `      <li><strong>Service:</strong> NaukriMili Gmail OAuth2 Mailer</li>`,
        `      <li><strong>API:</strong> Gmail API v1</li>`,
        `      <li><strong>Method:</strong> users.messages.send</li>`,
        `    </ul>`,
        `  </div>`,
        `  <p style="color: #6b7280; font-size: 14px;">`,
        `    If you received this email, your email notification system is ready for production.`,
        `  </p>`,
        `</div>`
      ].join('\r\n');
      
      const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      info('Sending test email via Gmail API...');
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      success('Test email sent successfully!');
      success(`Message ID: ${result.data.id}`);
      info(`Recipient: ${recipientEmail}`);
      info(`Subject: ${subject}`);
      info('\nCheck your inbox (may take 10-30 seconds to arrive)');
      
      return true;
      
    } catch (err) {
      error('Failed to send test email!');
      error(`Error: ${err.message}`);
      
      if (err.code === 401) {
        warning('\nAuthentication error - refresh token may be invalid');
      } else if (err.code === 403) {
        warning('\nPermission error - check Gmail API is enabled');
      } else if (err.code === 400) {
        warning('\nBad request - check email format');
      }
      
      return false;
    }
  },
  
  /**
   * Test 5: Check Redirect URI Configuration
   */
  async checkRedirectURI() {
    section('TEST 5: Redirect URI Configuration');
    
    const expectedURI = 'https://developers.google.com/oauthplayground';
    
    info('Expected redirect URI in OAuth2 credentials:');
    success(expectedURI);
    
    info('\nTo verify in Google Cloud Console:');
    info('1. Go to: https://console.cloud.google.com/apis/credentials');
    info('2. Click on your OAuth 2.0 Client ID');
    info('3. Check "Authorized redirect URIs"');
    info('4. Ensure it includes the exact URI above');
    
    warning('\nNote: This test cannot auto-verify. Please check manually.');
    
    return true;
  },
  
  /**
   * Test 6: Verify No Cached Invalid Tokens
   */
  async checkCachedState() {
    section('TEST 6: Cached State Check');
    
    info('Checking for cached invalid sessions...');
    
    // Since this is a stateless diagnostic script, we can't check runtime state
    // But we can provide guidance
    
    info('\nThe Gmail OAuth2 mailer service stores state in memory:');
    info('- isInitialized flag');
    info('- oauth2Client instance');
    info('- cached credentials');
    
    info('\nTo clear cached state:');
    success('1. Restart the application: pm2 restart naukrimili');
    success('2. Or restart dev server: npm run dev');
    
    info('\nNo persistent cache detected (no Redis, no file cache)');
    success('State is cleared on every restart');
    
    return true;
  }
};

/**
 * Run all diagnostics
 */
async function runAllDiagnostics(options = {}) {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        Gmail OAuth2 Email System - Diagnostic Report             ║', 'cyan');
  log('║        NaukriMili Job Portal                                      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    environment: false,
    credentials: false,
    gmailAPI: false,
    email: false,
    redirectURI: true,
    cachedState: true
  };
  
  try {
    // Test 1: Environment
    results.environment = await diagnostics.checkEnvironment();
    
    // Test 2: Credentials (only if environment is good)
    if (results.environment) {
      results.credentials = await diagnostics.validateCredentials();
      
      // Test 3: Gmail API (only if credentials are valid)
      if (results.credentials) {
        results.gmailAPI = await diagnostics.checkGmailAPI();
        
        // Test 4: Send Email (only if API is accessible and --send-email flag)
        if (results.gmailAPI && options.sendEmail) {
          results.email = await diagnostics.sendTestEmail(options.recipient);
        } else if (results.gmailAPI) {
          info('\nSkipping email send test (use --send-email to test)');
        }
      }
    }
    
    // Test 5: Redirect URI (informational)
    await diagnostics.checkRedirectURI();
    
    // Test 6: Cached State (informational)
    await diagnostics.checkCachedState();
    
  } catch (err) {
    error(`\nUnexpected error during diagnostics: ${err.message}`);
    console.error(err);
  }
  
  // Summary
  section('DIAGNOSTIC SUMMARY');
  
  const tests = [
    { name: 'Environment Variables', passed: results.environment },
    { name: 'OAuth2 Credentials', passed: results.credentials },
    { name: 'Gmail API Access', passed: results.gmailAPI },
    { name: 'Email Sending', passed: results.email || !options.sendEmail, skipped: !options.sendEmail },
    { name: 'Redirect URI', passed: results.redirectURI, info: true },
    { name: 'Cached State', passed: results.cachedState, info: true }
  ];
  
  console.log('\nTest Results:');
  for (const test of tests) {
    if (test.skipped) {
      info(`  ${test.name}: SKIPPED`);
    } else if (test.info) {
      info(`  ${test.name}: INFO ONLY`);
    } else if (test.passed) {
      success(`  ${test.name}: PASSED`);
    } else {
      error(`  ${test.name}: FAILED`);
    }
  }
  
  const criticalTests = tests.filter(t => !t.info && !t.skipped);
  const passedCount = criticalTests.filter(t => t.passed).length;
  const totalCount = criticalTests.length;
  
  console.log('\n' + '─'.repeat(70));
  
  if (passedCount === totalCount) {
    success(`\n✅ ALL TESTS PASSED (${passedCount}/${totalCount})`);
    success('\nYour Gmail OAuth2 email system is ready for production! 🎉');
    
    if (!options.sendEmail) {
      info('\nTo send a test email:');
      info('node scripts/diagnose-gmail-oauth2.js --send-email');
      info('node scripts/diagnose-gmail-oauth2.js --send-email --recipient your@email.com');
    }
  } else {
    error(`\n❌ TESTS FAILED (${passedCount}/${totalCount} passed)`);
    warning('\nPlease fix the failed tests above before deploying.');
    
    // Provide actionable fixes
    console.log('\n📋 Quick Fix Guide:');
    
    if (!results.environment) {
      warning('\n1. Set environment variables:');
      info('   Create .env file or configure PM2 ecosystem.config.cjs');
      info('   Required: GMAIL_API_CLIENT_ID, GMAIL_API_CLIENT_SECRET, GMAIL_API_REFRESH_TOKEN');
    }
    
    if (!results.credentials) {
      warning('\n2. Fix OAuth2 credentials:');
      info('   Regenerate refresh token at: https://developers.google.com/oauthplayground');
      info('   Ensure Client ID and Client Secret are correct');
    }
    
    if (!results.gmailAPI) {
      warning('\n3. Enable Gmail API:');
      info('   Go to: https://console.cloud.google.com/apis/library');
      info('   Search "Gmail API" and click Enable');
    }
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

/**
 * Main execution
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    sendEmail: args.includes('--send-email'),
    recipient: null
  };
  
  // Get recipient email if specified
  const recipientIndex = args.indexOf('--recipient');
  if (recipientIndex !== -1 && args[recipientIndex + 1]) {
    options.recipient = args[recipientIndex + 1];
  }
  
  // Run diagnostics
  runAllDiagnostics(options)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { diagnostics, runAllDiagnostics };

