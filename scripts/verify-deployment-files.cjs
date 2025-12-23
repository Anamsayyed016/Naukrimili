#!/usr/bin/env node

/**
 * Deployment Files Verification Script
 * CRITICAL: Verifies all required files exist before deployment
 * 
 * This script MUST pass before deployment can proceed
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description, critical = true) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      log(`❌ ${description} exists but is EMPTY: ${filePath}`, 'red');
      return false;
    }
    log(`✅ ${description}: ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`, 'green');
    return true;
  } else {
    if (critical) {
      log(`❌ CRITICAL: ${description} MISSING: ${filePath}`, 'red');
    } else {
      log(`⚠️  ${description} missing (optional): ${filePath}`, 'yellow');
    }
    return !critical;
  }
}

function checkDirectory(dirPath, description, critical = true) {
  const fullPath = path.resolve(process.cwd(), dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  
  if (exists) {
    const files = fs.readdirSync(fullPath);
    log(`✅ ${description}: ${dirPath} (${files.length} items)`, 'green');
    return true;
  } else {
    if (critical) {
      log(`❌ CRITICAL: ${description} MISSING: ${dirPath}`, 'red');
    } else {
      log(`⚠️  ${description} missing (optional): ${dirPath}`, 'yellow');
    }
    return !critical;
  }
}

function main() {
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('🔍 DEPLOYMENT FILES VERIFICATION', 'cyan');
  log('════════════════════════════════════════════════════════════\n', 'cyan');
  
  const results = {
    // CRITICAL FILES (deployment will fail without these)
    ecosystemConfig: checkFile('ecosystem.config.cjs', 'ecosystem.config.cjs (PM2 config)', true),
    standaloneServer: checkFile('.next/standalone/server.js', 'Standalone server.js', true),
    standaloneDir: checkDirectory('.next/standalone', 'Standalone directory', true),
    nextDir: checkDirectory('.next', '.next build directory', true),
    packageJson: checkFile('package.json', 'package.json', true),
    nextConfig: checkFile('next.config.mjs', 'next.config.mjs', true),
    
    // OPTIONAL FILES (fallbacks)
    serverCjs: checkFile('server.cjs', 'server.cjs (fallback)', false),
  };
  
  // Verify next.config.mjs has output: 'standalone'
  log('\n📋 Verifying next.config.mjs configuration...', 'cyan');
  try {
    const nextConfigPath = path.resolve(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8');
      if (content.includes("output: 'standalone'") || content.includes('output: "standalone"')) {
        log('✅ next.config.mjs has output: "standalone"', 'green');
        results.nextConfigStandalone = true;
      } else {
        log('❌ CRITICAL: next.config.mjs does NOT have output: "standalone"', 'red');
        log('💡 Add: output: "standalone" to next.config.mjs', 'yellow');
        results.nextConfigStandalone = false;
      }
    }
  } catch (err) {
    log(`⚠️  Could not verify next.config.mjs: ${err.message}`, 'yellow');
    results.nextConfigStandalone = true; // Don't fail on read error
  }
  
  // Verify standalone structure
  log('\n📋 Verifying standalone build structure...', 'cyan');
  const standalonePath = path.resolve(process.cwd(), '.next/standalone');
  if (fs.existsSync(standalonePath)) {
    const standaloneFiles = fs.readdirSync(standalonePath);
    const hasServerJs = standaloneFiles.includes('server.js');
    const hasNodeModules = fs.existsSync(path.join(standalonePath, 'node_modules'));
    const hasPackageJson = fs.existsSync(path.join(standalonePath, 'package.json'));
    
    if (hasServerJs) {
      log('✅ standalone/server.js exists', 'green');
    } else {
      log('❌ CRITICAL: standalone/server.js missing', 'red');
      results.standaloneServer = false;
    }
    
    if (hasNodeModules) {
      log('✅ standalone/node_modules exists', 'green');
    } else {
      log('⚠️  standalone/node_modules missing (may be normal)', 'yellow');
    }
    
    if (hasPackageJson) {
      log('✅ standalone/package.json exists', 'green');
    } else {
      log('⚠️  standalone/package.json missing (may be normal)', 'yellow');
    }
  }
  
  // Summary
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('📊 VERIFICATION SUMMARY', 'cyan');
  log('════════════════════════════════════════════════════════════\n', 'cyan');
  
  const criticalChecks = [
    results.ecosystemConfig,
    results.standaloneServer,
    results.standaloneDir,
    results.nextDir,
    results.packageJson,
    results.nextConfig,
    results.nextConfigStandalone !== false,
  ];
  
  const allCriticalPassed = criticalChecks.every(check => check === true);
  
  if (allCriticalPassed) {
    log('✅ ALL CRITICAL FILES VERIFIED', 'green');
    log('🚀 Deployment can proceed', 'green');
    process.exit(0);
  } else {
    log('❌ CRITICAL FILES MISSING', 'red');
    log('⚠️  Deployment will FAIL without these files', 'yellow');
    log('\n💡 FIXES:', 'cyan');
    
    if (!results.ecosystemConfig) {
      log('   1. Ensure ecosystem.config.cjs exists in project root', 'yellow');
    }
    if (!results.standaloneServer || !results.standaloneDir) {
      log('   2. Run: npm run build', 'yellow');
      log('   3. Verify next.config.mjs has: output: "standalone"', 'yellow');
    }
    if (!results.nextConfigStandalone) {
      log('   4. Add output: "standalone" to next.config.mjs', 'yellow');
    }
    
    process.exit(1);
  }
}

main();
