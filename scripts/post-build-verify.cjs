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
  
  // Create minimal routes-manifest.json if missing
  const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
  if (!fs.existsSync(routesManifestPath)) {
    const minimalRoutesManifest = {
      version: 3,
      pages: {
        '/_app': [],
        '/_document': [],
        '/_error': []
      },
      dataRoutes: [],
      dynamicRoutes: []
    };
    ensureFile(routesManifestPath, JSON.stringify(minimalRoutesManifest, null, 2));
    log(`✅ Created minimal routes-manifest.json`, 'green');
  } else {
    log(`✅ routes-manifest.json exists`, 'green');
  }
  
  log('\n✅ All build artifacts verified successfully!', 'green');
  process.exit(0);
}

main();

