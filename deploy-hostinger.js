#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Hostinger Deployment Process...\n');

// Step 1: Environment Check
console.log('1️⃣ Checking environment...');
if (!fs.existsSync('.env.production')) {
  console.error('❌ .env.production file not found!');
  console.log('Please create .env.production with your production settings.');
  process.exit(1);
}

// Step 2: Install dependencies
console.log('2️⃣ Installing dependencies...');
try {
  execSync('npm install --production=false', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Build the application
console.log('3️⃣ Building application...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Application built successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Create deployment package
console.log('4️⃣ Creating deployment package...');
const deploymentFiles = [
  '.next',
  'public',
  'package.json',
  'package-lock.json',
  'server.js',
  '.env.production'
];

// Create deployment directory
const deployDir = 'hostinger-deploy';
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy files
deploymentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    if (stats.isDirectory()) {
      fs.cpSync(file, path.join(deployDir, file), { recursive: true });
    } else {
      fs.copyFileSync(file, path.join(deployDir, file));
    }
    console.log(`📁 Copied ${file}`);
  }
});

// Create start script for Hostinger
const startScript = `#!/bin/bash
# Hostinger Start Script
echo "Starting NaukriMili Job Portal..."
cd "$(dirname "$0")"
npm install --production
node server.js
`;

fs.writeFileSync(path.join(deployDir, 'start.sh'), startScript);
fs.chmodSync(path.join(deployDir, 'start.sh'), '755');

// Create .htaccess for Apache
const htaccess = `RewriteEngine On
RewriteRule ^_next/static/(.*)$ /_next/static/$1 [L]
RewriteRule ^static/(.*)$ /static/$1 [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
`;

fs.writeFileSync(path.join(deployDir, '.htaccess'), htaccess);

console.log('✅ Deployment package created in hostinger-deploy/');

// Step 5: Create deployment instructions
const instructions = `
🎉 DEPLOYMENT READY!

Next steps for Hostinger deployment:

1. Upload the contents of 'hostinger-deploy/' to your Hostinger public_html folder
2. SSH into your Hostinger server
3. Navigate to your domain folder
4. Run: chmod +x start.sh
5. Run: ./start.sh

Or use cPanel File Manager:
1. Upload and extract the files
2. Set up Node.js app in cPanel
3. Point to server.js as the startup file

Health check URL: https://your-domain.com/api/health

📝 Don't forget to:
- Update .env.production with your actual API keys
- Configure your domain DNS
- Set up SSL certificate
`;

console.log(instructions);

// Create README for deployment
fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_README.md'), instructions);

console.log('\n🚀 Deployment preparation complete!');
console.log('📁 Check the hostinger-deploy/ folder for your deployment files.');