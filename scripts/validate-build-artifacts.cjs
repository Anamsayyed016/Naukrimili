#!/usr/bin/env node

/**
 * Build Artifacts Validation Script
 * Validates Next.js build artifacts for deployment readiness
 * Specifically checks for Next.js 15.x routing requirements
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
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

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function validateRoutesManifest() {
  log('\n📋 Validating routes-manifest.json for Next.js 15.x...', 'cyan');
  
  const manifestPath = path.join(process.cwd(), '.next', 'routes-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    log('❌ routes-manifest.json not found', 'red');
    return false;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    let isValid = true;
    
    // Check version
    if (manifest.version !== 3) {
      log(`⚠️ Unexpected version: ${manifest.version} (expected 3)`, 'yellow');
    }
    
    // Check rewrites object
    if (!manifest.rewrites || typeof manifest.rewrites !== 'object') {
      log('❌ Missing or invalid rewrites object', 'red');
      isValid = false;
    } else {
      // Check beforeFiles
      if (!Array.isArray(manifest.rewrites.beforeFiles)) {
        log('❌ Missing or invalid beforeFiles array', 'red');
        isValid = false;
      } else {
        log(`✅ beforeFiles array present (${manifest.rewrites.beforeFiles.length} items)`, 'green');
      }
      
      // Check afterFiles
      if (!Array.isArray(manifest.rewrites.afterFiles)) {
        log('❌ Missing or invalid afterFiles array', 'red');
        isValid = false;
      } else {
        log(`✅ afterFiles array present (${manifest.rewrites.afterFiles.length} items)`, 'green');
      }
      
      // Check fallback
      if (!Array.isArray(manifest.rewrites.fallback)) {
        log('❌ Missing or invalid fallback array', 'red');
        isValid = false;
      } else {
        log(`✅ fallback array present (${manifest.rewrites.fallback.length} items)`, 'green');
      }
    }
    
    // Check other required arrays
    const requiredArrays = ['redirects', 'headers', 'dynamicRoutes', 'dataRoutes'];
    for (const key of requiredArrays) {
      if (!Array.isArray(manifest[key])) {
        log(`⚠️ Missing or invalid ${key} array`, 'yellow');
      } else {
        log(`✅ ${key} array present (${manifest[key].length} items)`, 'green');
      }
    }
    
    return isValid;
  } catch (err) {
    log(`❌ Error parsing routes-manifest.json: ${err.message}`, 'red');
    return false;
  }
}

function validatePrerenderManifest() {
  log('\n📋 Validating prerender-manifest.json...', 'cyan');
  
  const manifestPath = path.join(process.cwd(), '.next', 'prerender-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    log('❌ prerender-manifest.json not found', 'red');
    return false;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    if (manifest.version !== 4) {
      log(`⚠️ Unexpected version: ${manifest.version} (expected 4)`, 'yellow');
    }
    
    if (typeof manifest.routes !== 'object') {
      log('❌ Missing or invalid routes object', 'red');
      return false;
    }
    
    log(`✅ prerender-manifest.json is valid`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error parsing prerender-manifest.json: ${err.message}`, 'red');
    return false;
  }
}

function validateStaticDirectory() {
  log('\n📋 Validating .next/static directory...', 'cyan');
  
  const staticDir = path.join(process.cwd(), '.next', 'static');
  
  if (!fs.existsSync(staticDir)) {
    log('❌ .next/static directory not found', 'red');
    return false;
  }
  
  // Count files in static directory
  const countFiles = (dir) => {
    let count = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        count += countFiles(filePath);
      } else {
        count++;
      }
    }
    return count;
  };
  
  const fileCount = countFiles(staticDir);
  
  if (fileCount === 0) {
    log('⚠️ .next/static directory is empty', 'yellow');
    return false;
  }
  
  log(`✅ .next/static directory contains ${fileCount} files`, 'green');
  return true;
}

function validateNextVersion() {
  log('\n📋 Checking Next.js version...', 'cyan');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const nextVersion = packageJson.dependencies.next;
    
    log(`✅ Next.js version in package.json: ${nextVersion}`, 'green');
    
    // Try to get installed version
    const nextPackageJson = path.join(process.cwd(), 'node_modules', 'next', 'package.json');
    if (fs.existsSync(nextPackageJson)) {
      const installedVersion = JSON.parse(fs.readFileSync(nextPackageJson, 'utf-8')).version;
      log(`✅ Installed Next.js version: ${installedVersion}`, 'green');
      
      // Check if it's version 15.x
      if (installedVersion.startsWith('15.')) {
        log(`✅ Using Next.js 15.x (routing manifest validation is critical)`, 'green');
      }
    }
    
    return true;
  } catch (err) {
    log(`⚠️ Could not determine Next.js version: ${err.message}`, 'yellow');
    return true; // Don't fail on this
  }
}

function main() {
  log('🔍 Starting build artifacts validation...', 'blue');
  log('=====================================\n', 'blue');
  
  const results = {
    nextDir: checkFileExists(path.join(process.cwd(), '.next'), '.next directory'),
    buildId: checkFileExists(path.join(process.cwd(), '.next', 'BUILD_ID'), 'BUILD_ID'),
    serverDir: checkFileExists(path.join(process.cwd(), '.next', 'server'), 'server directory'),
    routesManifest: validateRoutesManifest(),
    prerenderManifest: validatePrerenderManifest(),
    staticDir: validateStaticDirectory(),
    nextVersion: validateNextVersion(),
  };
  
  log('\n=====================================', 'blue');
  log('📊 Validation Summary:', 'blue');
  log('=====================================\n', 'blue');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    log('✅ All validation checks passed!', 'green');
    log('🚀 Build artifacts are ready for deployment', 'green');
    process.exit(0);
  } else {
    log('❌ Some validation checks failed', 'red');
    log('⚠️ Build artifacts may not be ready for deployment', 'yellow');
    log('\n💡 Run this to fix common issues:', 'cyan');
    log('   node server.cjs', 'cyan');
    log('   (server.cjs will auto-fix manifest issues on startup)', 'cyan');
    process.exit(1);
  }
}

// Run validation
main();

