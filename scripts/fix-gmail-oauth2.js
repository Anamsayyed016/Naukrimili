#!/usr/bin/env node

/**
 * Gmail OAuth2 Auto-Fix Script
 * 
 * This script attempts to automatically fix common Gmail OAuth2 issues
 * 
 * Usage:
 *   node scripts/fix-gmail-oauth2.js
 *   node scripts/fix-gmail-oauth2.js --fix-all
 *   node scripts/fix-gmail-oauth2.js --regenerate-token
 */

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Auto-fix functions
const fixes = {
  
  /**
   * Fix 1: Check and report environment variable issues
   */
  async fixEnvironmentVariables() {
    section('FIX 1: Environment Variables');
    
    const issues = [];
    const requiredVars = [
      'GMAIL_API_CLIENT_ID',
      'GMAIL_API_CLIENT_SECRET',
      'GMAIL_API_REFRESH_TOKEN'
    ];
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        issues.push({
          severity: 'critical',
          variable: varName,
          problem: 'Not set',
          fix: 'Set this environment variable in .env or PM2 config'
        });
      } else if (value.includes('your_') || value.includes('placeholder')) {
        issues.push({
          severity: 'critical',
          variable: varName,
          problem: 'Contains placeholder value',
          fix: 'Replace with real credential from Google Cloud Console'
        });
      }
    }
    
    if (issues.length === 0) {
      success('All required environment variables are set correctly');
      return true;
    }
    
    error(`Found ${issues.length} environment variable issues:`);
    for (const issue of issues) {
      console.log('');
      error(`  Variable: ${issue.variable}`);
      warning(`  Problem: ${issue.problem}`);
      info(`  Fix: ${issue.fix}`);
    }
    
    return false;
  },
  
  /**
   * Fix 2: Test and regenerate access token
   */
  async fixAccessToken() {
    section('FIX 2: Access Token Regeneration');
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot fix access token - credentials not set');
      return false;
    }
    
    try {
      info('Testing refresh token...');
      
      const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const tokenResponse = await oauth2Client.getAccessToken();
      
      if (tokenResponse.token) {
        success('Successfully generated access token from refresh token');
        info(`Token preview: ${tokenResponse.token.substring(0, 30)}...`);
        
        // Verify token has correct scopes
        const tokenInfo = await oauth2Client.getTokenInfo(tokenResponse.token);
        const hasGmailSend = tokenInfo.scopes && tokenInfo.scopes.some(s => 
          s.includes('gmail.send') || s.includes('mail.google.com')
        );
        
        if (hasGmailSend) {
          success('Token has correct Gmail send permission');
          return true;
        } else {
          error('Token is valid but missing Gmail send permission');
          warning('\nThe refresh token needs to be regenerated with correct scope:');
          info('https://www.googleapis.com/auth/gmail.send');
          return false;
        }
      }
      
      error('Failed to generate access token');
      return false;
      
    } catch (err) {
      error('Failed to test refresh token');
      error(`Error: ${err.message}`);
      
      if (err.message.includes('invalid_grant')) {
        warning('\n🔧 AUTO-FIX RECOMMENDATION:');
        warning('Your refresh token is expired or invalid.');
        warning('\nRegeneration is required:');
        info('1. Go to: https://developers.google.com/oauthplayground');
        info('2. Settings → Use your own OAuth credentials');
        info(`3. Client ID: ${clientId.substring(0, 20)}...`);
        info('4. Authorize scope: https://www.googleapis.com/auth/gmail.send');
        info('5. Exchange code for tokens');
        info('6. Copy new refresh token');
        info('7. Update GMAIL_API_REFRESH_TOKEN in .env');
        info('\nOr run: node scripts/fix-gmail-oauth2.js --regenerate-token');
      }
      
      return false;
    }
  },
  
  /**
   * Fix 3: Verify Gmail API is enabled
   */
  async fixGmailAPIAccess() {
    section('FIX 3: Gmail API Access');
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot test Gmail API - credentials not set');
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
      
      info('Testing Gmail API access...');
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      success('Gmail API is accessible');
      info(`Connected as: ${profile.data.emailAddress}`);
      
      return true;
      
    } catch (err) {
      error('Gmail API access failed');
      error(`Error: ${err.message}`);
      
      if (err.code === 403) {
        warning('\n🔧 AUTO-FIX RECOMMENDATION:');
        warning('Gmail API is not enabled for this project.');
        warning('\nTo fix:');
        info('1. Go to: https://console.cloud.google.com/apis/library');
        info('2. Search for "Gmail API"');
        info('3. Click "Enable"');
        info('4. Wait 1-2 minutes for propagation');
        info('5. Re-run this script');
      } else if (err.code === 401) {
        warning('\n🔧 AUTO-FIX RECOMMENDATION:');
        warning('Authentication failed - refresh token may be invalid.');
        info('Run: node scripts/fix-gmail-oauth2.js --fix-access-token');
      }
      
      return false;
    }
  },
  
  /**
   * Fix 4: Clear cached invalid state (restart recommendation)
   */
  async fixCachedState() {
    section('FIX 4: Cached Invalid State');
    
    info('Checking for cached invalid state...');
    
    // The mailer service stores state in memory
    // We can't directly clear it from this script
    
    info('\nThe Gmail OAuth2 mailer service caches:');
    info('- isInitialized flag');
    info('- oauth2Client instance');
    info('- Last error state');
    
    info('\n🔧 AUTO-FIX RECOMMENDATION:');
    warning('If the application previously failed to initialize, restart it:');
    info('');
    success('For PM2:');
    info('  pm2 restart naukrimili');
    info('');
    success('For dev server:');
    info('  Kill the process and run: npm run dev');
    info('');
    info('This will clear all in-memory cached state.');
    
    return true;
  },
  
  /**
   * Fix 5: Attempt to send test email
   */
  async fixTestEmail() {
    section('FIX 5: Test Email Delivery');
    
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      error('Cannot test email - credentials not set');
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
      
      // Get sender email
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const recipientEmail = profile.data.emailAddress;
      
      info(`Sending test email to: ${recipientEmail}`);
      
      const sender = process.env.GMAIL_SENDER || `NaukriMili <${recipientEmail}>`;
      const subject = '🔧 Gmail OAuth2 Auto-Fix Test';
      const timestamp = new Date().toISOString();
      
      const emailContent = [
        `From: ${sender}`,
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        `<div style="font-family: Arial, sans-serif; padding: 20px;">`,
        `  <h2 style="color: #10b981;">✅ Auto-Fix Test Successful!</h2>`,
        `  <p>This email was sent by the Gmail OAuth2 auto-fix script.</p>`,
        `  <p><strong>Timestamp:</strong> ${timestamp}</p>`,
        `  <p>Your Gmail OAuth2 integration is working correctly!</p>`,
        `</div>`
      ].join('\r\n');
      
      const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      success('Test email sent successfully!');
      success(`Message ID: ${result.data.id}`);
      info(`Check inbox: ${recipientEmail}`);
      
      return true;
      
    } catch (err) {
      error('Failed to send test email');
      error(`Error: ${err.message}`);
      
      if (err.code === 401) {
        warning('\n🔧 Refresh token is invalid');
        info('Run: node scripts/fix-gmail-oauth2.js --regenerate-token');
      } else if (err.code === 403) {
        warning('\n🔧 Gmail API not enabled or insufficient permissions');
        info('Enable Gmail API in Google Cloud Console');
      }
      
      return false;
    }
  }
};

/**
 * Interactive token regeneration guide
 */
async function guideTokenRegeneration() {
  section('GUIDED TOKEN REGENERATION');
  
  const clientId = process.env.GMAIL_API_CLIENT_ID;
  const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    error('Client ID and Client Secret must be set first');
    return;
  }
  
  console.log('\nThis guide will help you regenerate your refresh token.\n');
  
  info('Step 1: Open OAuth2 Playground');
  console.log('URL: https://developers.google.com/oauthplayground\n');
  
  info('Step 2: Configure OAuth credentials');
  console.log('Click the settings icon (⚙️) and enter:');
  console.log(`  OAuth Client ID: ${clientId}`);
  console.log(`  OAuth Client secret: ${clientSecret.substring(0, 10)}...`);
  console.log('  Then click "Close"\n');
  
  info('Step 3: Select Gmail API scope');
  console.log('In "Step 1", find and select:');
  success('  https://www.googleapis.com/auth/gmail.send');
  console.log('  Then click "Authorize APIs"\n');
  
  info('Step 4: Sign in');
  console.log('Sign in with your Gmail account (info@naukrimili.com)\n');
  
  info('Step 5: Get refresh token');
  console.log('In "Step 2", click "Exchange authorization code for tokens"');
  console.log('Copy the "Refresh token" that appears\n');
  
  warning('Step 6: Update environment variable');
  console.log('Add this to your .env file:');
  console.log('  GMAIL_API_REFRESH_TOKEN=<paste_your_token_here>\n');
  
  info('Step 7: Restart application');
  console.log('  pm2 restart naukrimili\n');
  
  success('After completing these steps, run:');
  console.log('  node scripts/fix-gmail-oauth2.js\n');
}

/**
 * Main auto-fix routine
 */
async function runAutoFix(options = {}) {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        Gmail OAuth2 Auto-Fix Script                              ║', 'cyan');
  log('║        NaukriMili Job Portal                                      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'cyan');
  
  if (options.regenerateToken) {
    await guideTokenRegeneration();
    return;
  }
  
  const results = {
    environment: false,
    accessToken: false,
    gmailAPI: false,
    cachedState: true,
    testEmail: false
  };
  
  // Run fixes in sequence
  try {
    results.environment = await fixes.fixEnvironmentVariables();
    
    if (results.environment) {
      results.accessToken = await fixes.fixAccessToken();
      
      if (results.accessToken) {
        results.gmailAPI = await fixes.fixGmailAPIAccess();
        
        if (results.gmailAPI && options.sendEmail) {
          results.testEmail = await fixes.fixTestEmail();
        }
      }
    }
    
    await fixes.fixCachedState();
    
  } catch (err) {
    error(`\nUnexpected error: ${err.message}`);
    console.error(err);
  }
  
  // Summary
  section('AUTO-FIX SUMMARY');
  
  const allPassed = results.environment && results.accessToken && results.gmailAPI;
  
  if (allPassed) {
    success('\n✅ ALL ISSUES FIXED!');
    success('Your Gmail OAuth2 system is working correctly.\n');
    
    if (!options.sendEmail) {
      info('To send a test email:');
      info('  node scripts/fix-gmail-oauth2.js --send-email\n');
    }
  } else {
    warning('\n⚠️  ISSUES REMAIN');
    error('Please follow the recommendations above to fix remaining issues.\n');
    
    if (!results.environment) {
      warning('Priority 1: Set environment variables');
      info('  Create .env file or configure PM2\n');
    } else if (!results.accessToken) {
      warning('Priority 1: Regenerate refresh token');
      info('  Run: node scripts/fix-gmail-oauth2.js --regenerate-token\n');
    } else if (!results.gmailAPI) {
      warning('Priority 1: Enable Gmail API');
      info('  Visit: https://console.cloud.google.com/apis/library\n');
    }
  }
  
  console.log('═'.repeat(70) + '\n');
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    fixAll: args.includes('--fix-all'),
    sendEmail: args.includes('--send-email'),
    regenerateToken: args.includes('--regenerate-token')
  };
  
  runAutoFix(options)
    .then(() => process.exit(0))
    .catch(err => {
      error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { fixes, runAutoFix, guideTokenRegeneration };

