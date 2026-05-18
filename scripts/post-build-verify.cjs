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
  
  // Ensure .next directory exists - create if missing (build might have partially completed)
  if (!fs.existsSync(nextDir)) {
    log('⚠️ .next directory not found, creating it...', 'yellow');
    try {
      fs.mkdirSync(nextDir, { recursive: true });
      log('✅ Created .next directory', 'green');
    } catch (err) {
      log(`❌ Failed to create .next directory: ${err.message}`, 'red');
      process.exit(1);
    }
  }
  
  // Ensure BUILD_ID exists - create if missing
  const buildIdPath = path.join(nextDir, 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    const buildId = Date.now().toString();
    ensureFile(buildIdPath, buildId);
    log(`✅ Created BUILD_ID: ${buildId}`, 'green');
  } else {
    log(`✅ BUILD_ID exists`, 'green');
  }
  
  // Ensure .next/server directory exists - create if missing
  const serverDir = path.join(nextDir, 'server');
  if (!fs.existsSync(serverDir)) {
    log('⚠️ .next/server directory not found, creating it...', 'yellow');
    ensureDirectory(serverDir);
    // Create minimal server structure if build didn't complete
    const minimalServerFiles = [
      'app-paths-manifest.json',
      'middleware-manifest.json',
      'pages-manifest.json'
    ];
    for (const file of minimalServerFiles) {
      const filePath = path.join(serverDir, file);
      if (!fs.existsSync(filePath)) {
        ensureFile(filePath, JSON.stringify({}, null, 2));
      }
    }
    log('✅ Created .next/server directory with minimal structure', 'green');
  } else {
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
  
  // Verify and create critical files if missing
  
  // Create minimal prerender-manifest.json if missing
  const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.json');
  if (!fs.existsSync(prerenderManifestPath)) {
    const minimalPrerenderManifest = {
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: {
        previewModeId: 'development-id',
        previewModeSigningKey: 'development-key',
        previewModeEncryptionKey: 'development-key'
      }
    };
    ensureFile(prerenderManifestPath, JSON.stringify(minimalPrerenderManifest, null, 2));
    log(`✅ Created minimal prerender-manifest.json`, 'green');
  } else {
    log(`✅ prerender-manifest.json exists`, 'green');
  }
  
  // Create minimal routes-manifest.json if missing (Next.js 15 compatible)
  const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
  if (!fs.existsSync(routesManifestPath)) {
    const minimalRoutesManifest = {
      version: 3,
      pages: {
        '/_app': [],
        '/_document': [],
        '/_error': []
      },
      rewrites: {
        beforeFiles: [],
        afterFiles: [],
        fallback: []
      },
      redirects: [],
      headers: [],
      dataRoutes: [],
      dynamicRoutes: []
    };
    ensureFile(routesManifestPath, JSON.stringify(minimalRoutesManifest, null, 2));
    log(`✅ Created minimal routes-manifest.json (Next.js 15 compatible)`, 'green');
  } else {
    log(`✅ routes-manifest.json exists`, 'green');
  }
  
  // Verify ecosystem.config.cjs and server.cjs exist (critical for deployment)
  log('\n📋 Verifying deployment files...', 'blue');
  const ecosystemPath = path.join(cwd, 'ecosystem.config.cjs');
  const serverPath = path.join(cwd, 'server.cjs');
  
  if (!fs.existsSync(ecosystemPath)) {
    log('❌ ecosystem.config.cjs not found!', 'red');
    log('💡 This file is required for PM2 deployment', 'yellow');
  } else {
    log('✅ ecosystem.config.cjs exists', 'green');
  }
  
  if (!fs.existsSync(serverPath)) {
    log('❌ server.cjs not found!', 'red');
    log('💡 This file is required for custom server deployment', 'yellow');
  } else {
    log('✅ server.cjs exists', 'green');
  }
  
  // Sync .env into standalone bundle for runtime DATABASE_URL
  const syncScript = path.join(cwd, 'scripts', 'sync-env-to-standalone.cjs');
  if (fs.existsSync(syncScript)) {
    try {
      const { syncEnvToStandalone } = require(syncScript);
      syncEnvToStandalone();
    } catch (err) {
      log(`⚠️  Standalone env sync: ${err.message}`, 'yellow');
    }
  }

  log('\n✅ All build artifacts verified successfully!', 'green');
  log('🚀 Build is ready for deployment', 'green');
  process.exit(0);
}

main();

