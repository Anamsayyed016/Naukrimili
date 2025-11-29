#!/usr/bin/env node

/**
 * Deployment Files Verification Script
 * Ensures all critical deployment files exist before PM2 start
 */

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

function checkFile(filePath, description, required = true) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    if (required) {
      log(`❌ ${description} MISSING: ${filePath}`, 'red');
      return false;
    } else {
      log(`⚠️ ${description} not found: ${filePath}`, 'yellow');
      return true; // Not required, so don't fail
    }
  }
}

function main() {
  log('\n🔍 Verifying deployment files...', 'blue');
  log('=====================================\n', 'blue');
  
  const cwd = process.cwd();
  let allFilesExist = true;
  
  // Critical deployment files
  const criticalFiles = [
    { path: path.join(cwd, 'ecosystem.config.cjs'), desc: 'PM2 Configuration (ecosystem.config.cjs)', required: true },
    { path: path.join(cwd, 'server.cjs'), desc: 'Server Entry Point (server.cjs)', required: true },
    { path: path.join(cwd, 'package.json'), desc: 'Package Configuration (package.json)', required: true },
  ];
  
  for (const file of criticalFiles) {
    if (!checkFile(file.path, file.desc, file.required)) {
      allFilesExist = false;
    }
  }
  
  // Build artifacts
  log('\n📦 Checking build artifacts...', 'blue');
  const buildArtifacts = [
    { path: path.join(cwd, '.next'), desc: '.next build directory', required: true },
    { path: path.join(cwd, '.next', 'BUILD_ID'), desc: 'BUILD_ID file', required: true },
    { path: path.join(cwd, '.next', 'server'), desc: '.next/server directory', required: true },
    { path: path.join(cwd, '.next', 'static'), desc: '.next/static directory', required: false },
  ];
  
  for (const artifact of buildArtifacts) {
    if (!checkFile(artifact.path, artifact.desc, artifact.required)) {
      if (artifact.required) {
        allFilesExist = false;
      }
    }
  }
  
  // Verify ecosystem.config.cjs structure
  log('\n⚙️ Verifying ecosystem.config.cjs structure...', 'blue');
  try {
    const ecosystemPath = path.join(cwd, 'ecosystem.config.cjs');
    if (fs.existsSync(ecosystemPath)) {
      const content = fs.readFileSync(ecosystemPath, 'utf-8');
      if (!content.includes('module.exports') && !content.includes('export default')) {
        log('⚠️ ecosystem.config.cjs may not export correctly', 'yellow');
      }
      if (!content.includes('server.cjs')) {
        log('⚠️ ecosystem.config.cjs may not reference server.cjs correctly', 'yellow');
      } else {
        log('✅ ecosystem.config.cjs references server.cjs', 'green');
      }
    }
  } catch (err) {
    log(`⚠️ Could not verify ecosystem.config.cjs: ${err.message}`, 'yellow');
  }
  
  // Summary
  log('\n=====================================', 'blue');
  if (allFilesExist) {
    log('✅ All critical deployment files exist!', 'green');
    log('🚀 Ready for PM2 deployment', 'green');
    process.exit(0);
  } else {
    log('❌ Some critical files are missing!', 'red');
    log('\n💡 Solutions:', 'yellow');
    log('   1. Run: npm run build', 'yellow');
    log('   2. Ensure ecosystem.config.cjs and server.cjs are in the root directory', 'yellow');
    log('   3. Check that the build completed successfully', 'yellow');
    process.exit(1);
  }
}

main();

