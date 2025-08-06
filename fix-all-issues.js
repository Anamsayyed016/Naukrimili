#!/usr/bin/env node
/**
 * Comprehensive fix script for the job portal project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');// Fix 1: Ensure all required directories existconst requiredDirs = [
  'backend/models',
  'backend/services', 
  'backend/utils',
  'backend/config',
  'backend/middleware',
  'backend/logs',
  'components/ui',
  'types',
  'hooks'
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })}
});

// Fix 2: Create missing __init__.py files for Python packagesconst pythonPackages = [
  'backend',
  'backend/models',
  'backend/services',
  'backend/utils', 
  'backend/config',
  'backend/middleware'
];

pythonPackages.forEach(pkg => {
  const initFile = path.join(pkg, '__init__.py');
  if (!fs.existsSync(initFile)) {
    fs.writeFileSync(initFile, '# Package initialization\n')}
});

// Fix 3: Update Next.js configuration for better error handlingconst nextConfigPath = 'next.config.mjs';
if (fs.existsSync(nextConfigPath)) {
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Add error handling improvements
  if (!nextConfig.includes('experimental: {')) {}
}

// Fix 4: Ensure TypeScript configuration is optimalif (fs.existsSync('tsconfig.json')) {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  // Ensure we have good defaults
  const requiredOptions = {
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  };
  
  let updated = false;
  Object.entries(requiredOptions).forEach(([key, value]) => {
    if (tsconfig.compilerOptions[key] !== value) {
      tsconfig.compilerOptions[key] = value;
      updated = true}
  });
  
  if (updated) {
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2))} else {}
}

// Fix 5: Create a comprehensive .gitignore if missingconst gitignoreContent = `# Dependencies
node_modules/
backend/venv/
backend/__pycache__/
*.pyc

# Next.js
.next/
out/

# Environment variables
.env
.env.local
.env.production.local

# Logs
*.log
backend/logs/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Cache
.cache/
.turbo/

# Database
*.db
*.sqlite

# Temporary files
*.tmp
*.temp
`;

if (!fs.existsSync('.gitignore')) {
  fs.writeFileSync('.gitignore', gitignoreContent)} else {}

// Fix 6: Ensure environment example files existif (!fs.existsSync('.env.example') && fs.existsSync('.env.local')) {
  // Create .env.example from .env.local (masking sensitive data)
  let envContent = fs.readFileSync('.env.local', 'utf8');
  envContent = envContent.replace(/=.+$/gm, '=your-value-here');
  fs.writeFileSync('.env.example', envContent)}

// Fix 7: Create a startup scriptconst startupScript = `#!/bin/bash
# Quick start script for the job portal

echo "🚀 Starting Job Portal..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start backend if available
if [ -d "backend" ]; then
    echo "🐍 Starting backend in background..."
    cd backend
    if [ ! -d "venv" ]; then
        python -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    python main.py &
    cd ..
fi

# Start frontend
echo "🌐 Starting frontend..."
npm run dev
`;

fs.writeFileSync('start.sh', startupScript);
fs.chmodSync('start.sh', '755');

const startupScriptWindows = `@echo off
echo 🚀 Starting Job Portal...

if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

if exist backend (
    echo 🐍 Starting backend...
    cd backend
    if not exist venv (
        python -m venv venv
        call venv\\Scripts\\activate.bat
        pip install -r requirements.txt
    ) else (
        call venv\\Scripts\\activate.bat
    )
    start python main.py
    cd ..
)

echo 🌐 Starting frontend...
npm run dev
`;

fs.writeFileSync('start.bat', startupScriptWindows);// Fix 8: Create debugging scriptsconst debugScript = `#!/usr/bin/env node
/**
 * Debug utility for common issues
 */

const { execSync } = require('child_process');// Check Next.jstry {
  const nextInfo = execSync('npx next info', { encoding: 'utf8' })} catch (error) {}

// Check TypeScripttry {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' })} catch (error) {}

// Check portstry {
  const netstat = execSync('netstat -an | findstr "3000\\|8000"', { encoding: 'utf8' }).trim();
  if (netstat) {} else {}
} catch (error) {}`;

fs.writeFileSync('debug.js', debugScript);// Fix 9: Ensure backend has proper error handlingif (fs.existsSync('backend/main.py')) {
  let mainPy = fs.readFileSync('backend/main.py', 'utf8');
  
  // Check if it has proper error handling in startup
  if (!mainPy.includes('try:') || !mainPy.includes('except')) {} else {}
}

// Fix 10: Summary and recommendations`;

fs.writeFileSync('fix-all.js', `${fs.readFileSync('health-check.js', 'utf8').replace('const issues = [];', 'const issues = []; let fixCount = 0;')}
`);// Run the actual fixes// Ensure backend __init__.py files exist
const backendInits = [
  'backend/__init__.py',
  'backend/models/__init__.py', 
  'backend/services/__init__.py',
  'backend/utils/__init__.py',
  'backend/config/__init__.py',
  'backend/middleware/__init__.py'
];

backendInits.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '# Package initialization\n')}
});