#!/usr/bin/env node

/**
 * Domain Health Check Script
 * Tests if naukrimili.com is activated and working properly
 */

import https from 'https';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify as utilPromisify } from 'util';

// Promisify DNS functions
const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const execAsync = utilPromisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

const DOMAIN = 'naukrimili.com';
const VPS_IP = '69.62.73.84';

async function checkDNSResolution() {
  logHeader('DNS Resolution Check');
  
  try {
    // Check A record
    logInfo(`Checking A record for ${DOMAIN}...`);
    const aRecords = await resolve4(DOMAIN);
    logSuccess(`A record found: ${aRecords.join(', ')}`);
    
    // Check if A record points to your VPS
    if (aRecords.includes(VPS_IP)) {
      logSuccess(`✅ A record correctly points to your VPS IP: ${VPS_IP}`);
    } else {
      logWarning(`⚠️  A record points to: ${aRecords.join(', ')}`);
      logWarning(`Expected: ${VPS_IP}`);
    }
    
    // Check www subdomain
    logInfo(`Checking www.${DOMAIN}...`);
    try {
      const wwwRecords = await resolve4(`www.${DOMAIN}`);
      logSuccess(`www A record: ${wwwRecords.join(', ')}`);
      
      if (wwwRecords.includes(VPS_IP)) {
        logSuccess(`✅ www subdomain correctly points to your VPS IP`);
      } else {
        logWarning(`⚠️  www subdomain points to: ${wwwRecords.join(', ')}`);
      }
    } catch (error) {
      logWarning(`www subdomain not configured: ${error.message}`);
    }
    
    // Check CNAME records
    try {
      const cnameRecords = await resolveCname(DOMAIN);
      logInfo(`CNAME records: ${cnameRecords.join(', ')}`);
    } catch (error) {
      logInfo('No CNAME records found');
    }
    
    // Check MX records
    try {
      const mxRecords = await resolveMx(DOMAIN);
      logInfo(`MX records: ${mxRecords.map(mx => `${mx.priority} ${mx.exchange}`).join(', ')}`);
    } catch (error) {
      logInfo('No MX records found');
    }
    
    // Check TXT records
    try {
      const txtRecords = await resolveTxt(DOMAIN);
      logInfo(`TXT records: ${txtRecords.flat().join(', ')}`);
    } catch (error) {
      logInfo('No TXT records found');
    }
    
    return true;
  } catch (error) {
    logError(`DNS resolution failed: ${error.message}`);
    return false;
  }
}

async function checkHTTPResponse(url, protocol = 'http') {
  return new Promise((resolve) => {
    const client = protocol === 'https' ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Request timeout' });
    });
  });
}

async function checkWebsiteAccessibility() {
  logHeader('Website Accessibility Check');
  
  const urls = [
    `http://${DOMAIN}`,
    `https://${DOMAIN}`,
    `http://www.${DOMAIN}`,
    `https://www.${DOMAIN}`,
    `http://${VPS_IP}`,
    `http://${VPS_IP}:3000`
  ];
  
  for (const url of urls) {
    logInfo(`Testing: ${url}`);
    
    try {
      const result = await checkHTTPResponse(url);
      
      if (result.error) {
        logError(`Failed: ${result.error}`);
      } else {
        logSuccess(`Status: ${result.statusCode}`);
        
        if (result.statusCode === 200) {
          logSuccess(`✅ ${url} is accessible!`);
          
          // Check if it's your Next.js app
          if (result.data.includes('Next.js') || result.data.includes('job') || result.data.includes('portal')) {
            logSuccess(`✅ Content appears to be your job portal application`);
          } else {
            logWarning(`⚠️  Content doesn't appear to be your job portal`);
          }
        } else if (result.statusCode === 301 || result.statusCode === 302) {
          logInfo(`Redirect to: ${result.headers.location}`);
        } else {
          logWarning(`Unexpected status: ${result.statusCode}`);
        }
      }
    } catch (error) {
      logError(`Error testing ${url}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function checkVPSConnectivity() {
  logHeader('VPS Connectivity Check');
  
  try {
    // Test direct VPS connection
    logInfo(`Testing direct connection to VPS IP: ${VPS_IP}`);
    
    const result = await checkHTTPResponse(`http://${VPS_IP}:3000`);
    
    if (result.error) {
      logError(`VPS not accessible: ${result.error}`);
      return false;
    }
    
    if (result.statusCode === 200) {
      logSuccess(`✅ VPS is running and accessible on port 3000`);
      
      // Check if it's your app
      if (result.data.includes('Next.js') || result.data.includes('job') || result.data.includes('portal')) {
        logSuccess(`✅ VPS is serving your job portal application`);
      } else {
        logWarning(`⚠️  VPS is running but content doesn't match expected`);
      }
    } else {
      logWarning(`VPS responded with status: ${result.statusCode}`);
    }
    
    return true;
  } catch (error) {
    logError(`VPS connectivity test failed: ${error.message}`);
    return false;
  }
}

async function checkDomainPropagation() {
  logHeader('Domain Propagation Check');
  
  const dnsServers = [
    '8.8.8.8',      // Google DNS
    '1.1.1.1',      // Cloudflare DNS
    '208.67.222.222', // OpenDNS
    '9.9.9.9'       // Quad9 DNS
  ];
  
  logInfo('Checking domain propagation across different DNS servers...');
  
  for (const dnsServer of dnsServers) {
    try {
      logInfo(`Testing with DNS server: ${dnsServer}`);
      
      try {
        const { stdout } = await execAsync(`nslookup ${DOMAIN} ${dnsServer}`);
        
        if (stdout.includes(VPS_IP)) {
          logSuccess(`✅ ${dnsServer}: Domain resolves to your VPS IP`);
        } else if (stdout.includes('NXDOMAIN')) {
          logError(`❌ ${dnsServer}: Domain not found`);
        } else {
          logWarning(`⚠️  ${dnsServer}: Domain resolves but not to expected IP`);
        }
      } catch (error) {
        logWarning(`⚠️  ${dnsServer}: Could not test (${error.message})`);
      }
      
    } catch (error) {
      logWarning(`DNS server ${dnsServer} test failed: ${error.message}`);
    }
    
    // Small delay between DNS server tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function checkSSLStatus() {
  logHeader('SSL/HTTPS Status Check');
  
  try {
    logInfo(`Checking SSL certificate for ${DOMAIN}...`);
    
    const result = await checkHTTPResponse(`https://${DOMAIN}`);
    
    if (result.error) {
      logWarning(`HTTPS not accessible: ${result.error}`);
      logInfo('This is normal if you haven\'t set up SSL yet');
    } else {
      logSuccess(`✅ HTTPS is accessible with status: ${result.statusCode}`);
      
      // Check SSL certificate details
      if (result.headers['strict-transport-security']) {
        logSuccess(`✅ HSTS is enabled`);
      }
      
      if (result.headers['x-frame-options']) {
        logSuccess(`✅ X-Frame-Options security header present`);
      }
    }
    
  } catch (error) {
    logWarning(`SSL check failed: ${error.message}`);
  }
}

async function checkDomainHealth() {
  logHeader(`Domain Health Check for ${DOMAIN}`);
  
  try {
    // Step 1: DNS Resolution
    const dnsOk = await checkDNSResolution();
    
    // Step 2: VPS Connectivity
    const vpsOk = await checkVPSConnectivity();
    
    // Step 3: Website Accessibility
    await checkWebsiteAccessibility();
    
    // Step 4: Domain Propagation
    await checkDomainPropagation();
    
    // Step 5: SSL Status
    await checkSSLStatus();
    
    // Summary
    logHeader('Domain Health Summary');
    
    if (dnsOk && vpsOk) {
      logSuccess(`🎉 ${DOMAIN} is activated and working!`);
      logSuccess(`✅ DNS is properly configured`);
      logSuccess(`✅ VPS is accessible`);
      logSuccess(`✅ Your job portal should be live at: https://${DOMAIN}`);
    } else {
      logWarning(`⚠️  ${DOMAIN} has some issues:`);
      if (!dnsOk) logWarning('  - DNS configuration needs attention');
      if (!vpsOk) logWarning('  - VPS connectivity issues');
    }
    
    // Additional recommendations
    logHeader('Recommendations');
    logInfo('1. If DNS is not working, check your GoDaddy DNS settings');
    logInfo('2. If VPS is not accessible, check your Hostinger VPS status');
    logInfo('3. For SSL, consider setting up Let\'s Encrypt certificate');
    logInfo('4. Wait 24-48 hours for DNS propagation if recently changed');
    
  } catch (error) {
    logError(`Domain health check failed: ${error.message}`);
  }
}

// Run the health check
checkDomainHealth()
  .then(() => {
    log('\n🏁 Domain health check completed!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    logError(`\n💥 Health check crashed: ${error.message}`);
    process.exit(1);
  });
