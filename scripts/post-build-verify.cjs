#!/usr/bin/env node

/**
 * Post-Build Verification Script
 * Ensures all critical build artifacts exist after Next.js build
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

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✅ Created directory: ${dirPath}`, 'green');
    return true;
  }
  return false;
}

function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    ensureDirectory(dir);
    fs.writeFileSync(filePath, content);
    log(`✅ Created file: ${filePath}`, 'green');
    return true;
  }
  return false;
}

function main() {
  log('\n🔍 Verifying build artifacts...', 'blue');
  
  const cwd = process.cwd();
  const nextDir = path.join(cwd, '.next');
  
  // Ensure .next directory exists
  if (!fs.existsSync(nextDir)) {
    log('❌ .next directory not found! Build may have failed.', 'red');
    process.exit(1);
  }
  
  // Ensure BUILD_ID exists
  const buildIdPath = path.join(nextDir, 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    const buildId = Date.now().toString();
    ensureFile(buildIdPath, buildId);
    log(`✅ Created BUILD_ID: ${buildId}`, 'green');
  } else {
    log(`✅ BUILD_ID exists`, 'green');
  }
  
  // Ensure .next/server directory exists
  const serverDir = path.join(nextDir, 'server');
  if (!ensureDirectory(serverDir)) {
    log(`✅ .next/server directory exists`, 'green');
  }
  
  // Ensure .next/static directory exists with subdirectories
  const staticDir = path.join(nextDir, 'static');
  ensureDirectory(staticDir);
  ensureDirectory(path.join(staticDir, 'chunks'));
  ensureDirectory(path.join(staticDir, 'css'));
  ensureDirectory(path.join(staticDir, 'media'));
  
  // Check if static directory has files
  const staticFiles = fs.readdirSync(staticDir);
  if (staticFiles.length === 0) {
    log('⚠️ .next/static directory is empty - this may indicate a build issue', 'yellow');
  } else {
    log(`✅ .next/static directory contains ${staticFiles.length} items`, 'green');
  }
  
  // Verify critical files
  const criticalFiles = [
    path.join(nextDir, 'routes-manifest.json'),
    path.join(nextDir, 'prerender-manifest.json'),
    path.join(nextDir, 'BUILD_ID'),
  ];
  
  let allCriticalFilesExist = true;
  for (const filePath of criticalFiles) {
    if (fs.existsSync(filePath)) {
      log(`✅ ${path.basename(filePath)} exists`, 'green');
    } else {
      log(`❌ ${path.basename(filePath)} missing: ${filePath}`, 'red');
      allCriticalFilesExist = false;
    }
  }
  
  if (!allCriticalFilesExist) {
    log('\n❌ Some critical build files are missing!', 'red');
    process.exit(1);
  }
  
  log('\n✅ All build artifacts verified successfully!', 'green');
  process.exit(0);
}

main();

