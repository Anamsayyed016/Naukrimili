#!/usr/bin/env node
/**
 * Comprehensive test script to identify project issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');const issues = [];
const warnings = [];

// Check 1: Package.json validationtry {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for required scripts
  const requiredScripts = ['dev', 'build', 'start'];
  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      issues.push(`Missing required script: ${script}`);
    }
  });
  
  // Check for Next.js version
  if (!packageJson.dependencies.next) {
    issues.push('Next.js is not listed as a dependency');
  } else {}} catch (error) {
  issues.push(`Package.json error: ${error.message}`);
}

// Check 2: TypeScript configurationtry {
  if (fs.existsSync('tsconfig.json')) {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));// Check for strict mode
    if (!tsconfig.compilerOptions?.strict) {
      warnings.push('TypeScript strict mode is not enabled');
    }
  } else {
    issues.push('tsconfig.json not found');
  }
} catch (error) {
  issues.push(`TypeScript config error: ${error.message}`);
}

// Check 3: Next.js configurationconst nextConfigFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
const nextConfigExists = nextConfigFiles.some(file => fs.existsSync(file));

if (nextConfigExists) {} else {
  warnings.push('No Next.js configuration file found');
}

// Check 4: Environment filesconst envFiles = ['.env.local', '.env', '.env.example'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {}
});

if (!fs.existsSync('.env.local') && !fs.existsSync('.env')) {
  warnings.push('No environment file found (.env or .env.local)');
}

// Check 5: Critical directoriesconst criticalDirs = ['app', 'components', 'hooks', 'types'];
criticalDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);} else {
    issues.push(`Critical directory missing: ${dir}/`);
  }
});

// Check 6: Backend directoryif (fs.existsSync('backend')) {
  const backendFiles = fs.readdirSync('backend');// Check for Python files
  const pythonFiles = ['main.py', 'requirements.txt'];
  pythonFiles.forEach(file => {
    const filePath = path.join('backend', file);
    if (fs.existsSync(filePath)) {} else {
      warnings.push(`Backend file missing: ${file}`);
    }
  });
} else {
  warnings.push('Backend directory not found');
}

// Check 7: Node modulesif (fs.existsSync('node_modules')) {} else {
  issues.push('node_modules not found - run npm install');
}

// Check 8: Lock filesconst lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
const foundLockFiles = lockFiles.filter(file => fs.existsSync(file));

if (foundLockFiles.length === 0) {
  warnings.push('No lock file found');
} else if (foundLockFiles.length > 1) {
  warnings.push(`Multiple lock files found: ${foundLockFiles.join(', ')}`);
} else {}

// Check 9: Import/Export issuestry {
  const checkFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common issues
    if (content.includes('import React from "react"') && content.includes('import { useState }')) {
      warnings.push(`${filePath}: Consider using import React, { useState } instead`);
    }
    
    // Check for missing file extensions in imports
    const importMatches = content.match(/import.*from ['"]\.\/.*[^\.tsx?]['"]/g);
    if (importMatches) {
      warnings.push(`${filePath}: Missing file extensions in imports`);
    }
  };
  
  // Check key files
  if (fs.existsSync('app/page.tsx')) checkFile('app/page.tsx');
  if (fs.existsSync('app/layout.tsx')) checkFile('app/layout.tsx');} catch (error) {
  warnings.push(`Import check failed: ${error.message}`);
}

// Check 10: Build testtry {// Note: --dry-run doesn't exist, but we can check the config
  execSync('npx next info', { stdio: 'pipe' });} catch (error) {
  warnings.push('Build configuration may have issues');
}

// Summaryif (issues.length === 0 && warnings.length === 0) {} else {
  if (issues.length > 0) {issues.forEach((issue, index) => {});
  }
  
  if (warnings.length > 0) {warnings.forEach((warning, index) => {});
  }
}

// Recommendationsif (fs.existsSync('backend')) {}process.exit(issues.length > 0 ? 1 : 0);
