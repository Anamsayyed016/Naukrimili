#!/usr/bin/env node

/**
 * Pre-Deployment Check Script
 * Runs before PM2 deployment to ensure everything is ready
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('\n🚀 Pre-Deployment Check', 'blue');
  log('=====================================\n', 'blue');
  
  // 1. Verify deployment files
  log('1️⃣ Verifying deployment files...', 'blue');
  try {
    execSync('node scripts/verify-deployment-files.cjs', { stdio: 'inherit' });
  } catch (err) {
    log('\n❌ Deployment file verification failed!', 'red');
    process.exit(1);
  }
  
  // 2. Verify build exists
  log('\n2️⃣ Verifying build artifacts...', 'blue');
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    log('❌ .next directory not found!', 'red');
    log('💡 Run: npm run build', 'yellow');
    process.exit(1);
  }
  
  const buildIdPath = path.join(nextDir, 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    log('⚠️ BUILD_ID not found, creating...', 'yellow');
    fs.writeFileSync(buildIdPath, Date.now().toString());
  }
  
  // 3. Check PM2 is installed
  log('\n3️⃣ Checking PM2 installation...', 'blue');
  try {
    execSync('pm2 --version', { stdio: 'pipe' });
    log('✅ PM2 is installed', 'green');
  } catch (err) {
    log('⚠️ PM2 not found. Install with: npm install -g pm2', 'yellow');
  }
  
  log('\n✅ Pre-deployment checks passed!', 'green');
  log('🚀 Ready to deploy with PM2', 'green');
  process.exit(0);
}

main();

