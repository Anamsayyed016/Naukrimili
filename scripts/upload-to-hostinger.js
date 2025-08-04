#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 NaukriMili - Hostinger Upload Preparation');
console.log('============================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Step 1: Create deployment package
console.log('📦 Step 1: Creating deployment package...');

// Create deployment directory
const deployDir = 'hostinger-deploy';
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

// Copy essential files
const essentialFiles = [
  '.next',
  'public',
  'server.js',
  '.htaccess',
  'package.json',
  'next.config.mjs',
  'prisma',
  'env.hostinger.example'
];

console.log('📁 Copying essential files...');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (fs.lstatSync(file).isDirectory()) {
      fs.cpSync(file, path.join(deployDir, file), { recursive: true });
    } else {
      fs.copyFileSync(file, path.join(deployDir, file));
    }
    console.log(`✅ Copied: ${file}`);
  } else {
    console.log(`⚠️  Missing: ${file}`);
  }
});

// Copy node_modules (optional - can install on server)
if (fs.existsSync('node_modules')) {
  console.log('📦 Copying node_modules (large file, may take time)...');
  try {
    fs.cpSync('node_modules', path.join(deployDir, 'node_modules'), { recursive: true });
    console.log('✅ Copied: node_modules');
  } catch (error) {
    console.log('⚠️  Could not copy node_modules (too large or busy)');
    console.log('💡 You can install dependencies on the server instead');
  }
}

// Create deployment instructions
const instructions = `
🚀 HOSTINGER DEPLOYMENT INSTRUCTIONS
====================================

📁 FILES READY FOR UPLOAD:
Your deployment files are in the '${deployDir}' folder.

📤 UPLOAD METHODS:

METHOD 1: HOSTINGER FILE MANAGER
1. Log into Hostinger control panel
2. Go to "Websites" → "Manage" → "File Manager"
3. Navigate to public_html/
4. Upload all files from '${deployDir}' folder
5. Ensure .next/ folder is included

METHOD 2: FTP (RECOMMENDED)
1. Get FTP credentials from Hostinger:
   - Go to "Files" → "FTP Accounts"
   - Note hostname, username, password
2. Use FileZilla or WinSCP
3. Connect to your Hostinger FTP server
4. Navigate to public_html/
5. Upload all files from '${deployDir}' folder

🔧 AFTER UPLOAD:

1. CONFIGURE NODE.JS:
   - Go to "Advanced" → "Node.js"
   - Enable Node.js (version 18.x+)
   - Set startup file to: server.js
   - Set App URL to your domain

2. SET ENVIRONMENT VARIABLES:
   - Create .env.local in public_html/
   - Copy from env.hostinger.example
   - Replace placeholder values with your actual keys

3. ENABLE SSL:
   - Go to "SSL" → "Manage"
   - Enable SSL for your domain

🧪 TEST YOUR DEPLOYMENT:
- Homepage: https://yourdomain.com
- API Health: https://yourdomain.com/api/health
- Job Search: https://yourdomain.com/jobs
- Admin: https://yourdomain.com/admin/dashboard

📞 NEED HELP?
- Hostinger Support: 24/7 live chat
- Check HOSTINGER_DEPLOYMENT_GUIDE.md for detailed instructions
- Check DEPLOYMENT_SUMMARY.md for quick reference

🎉 Your NaukriMili job portal will be live once uploaded!
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), instructions);
console.log('✅ Created: DEPLOYMENT_INSTRUCTIONS.txt');

// Show file sizes
console.log('\n📊 DEPLOYMENT PACKAGE SIZE:');
const getDirSize = (dir) => {
  let size = 0;
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    });
  }
  return size;
};

const totalSize = getDirSize(deployDir);
const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`📁 Total size: ${sizeInMB} MB`);

// Show next steps
console.log('\n🎯 NEXT STEPS:');
console.log(`1. Upload files from '${deployDir}' folder to Hostinger`);
console.log('2. Configure Node.js in Hostinger control panel');
console.log('3. Set environment variables');
console.log('4. Test your deployment');
console.log('\n📖 For detailed instructions, see:');
console.log(`   - ${deployDir}/DEPLOYMENT_INSTRUCTIONS.txt`);
console.log('   - HOSTINGER_DEPLOYMENT_GUIDE.md');
console.log('   - DEPLOYMENT_SUMMARY.md');

console.log('\n🚀 Ready for Hostinger deployment!');
console.log(`📁 Your deployment files are in: ${deployDir}/`); 