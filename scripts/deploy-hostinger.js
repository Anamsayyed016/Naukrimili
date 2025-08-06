#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Step 1: Clean previous buildstry {
  execSync('npm run clean', { stdio: 'inherit' });} catch (error) {}

// Step 2: Install dependenciestry {
  execSync('npm install', { stdio: 'inherit' });} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 3: Build for productiontry {
  execSync('npm run hostinger-build', { stdio: 'inherit' });} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 4: Check if .next directory existsif (!fs.existsSync('.next')) {
  console.error('❌ .next directory not found. Build may have failed.');
  process.exit(1);
}// Step 5: Create deployment checklistconst checklist = `
🎯 HOSTINGER DEPLOYMENT CHECKLIST
================================

✅ LOCAL PREPARATION:
- [x] Dependencies installed
- [x] Production build completed
- [x] .next directory created

📤 UPLOAD TO HOSTINGER:
- [ ] Upload entire project folder to public_html/
- [ ] Ensure .next/ folder is included
- [ ] Upload server.js file
- [ ] Upload .htaccess file

🔧 HOSTINGER CONFIGURATION:
- [ ] Enable Node.js in Hostinger control panel
- [ ] Set Node.js version to 18.x or higher
- [ ] Set startup file to: server.js
- [ ] Configure domain to point to project directory
- [ ] Enable HTTPS (SSL certificate)

🌍 ENVIRONMENT VARIABLES:
- [ ] Create .env.local file in root directory
- [ ] Add all required environment variables
- [ ] Set NODE_ENV=production
- [ ] Configure database connection string
- [ ] Add authentication keys

🧪 TESTING:
- [ ] Test homepage loads correctly
- [ ] Test job search functionality
- [ ] Test user registration/login
- [ ] Test API endpoints
- [ ] Test file uploads (if configured)

📊 MONITORING:
- [ ] Check server logs in Hostinger control panel
- [ ] Monitor application performance
- [ ] Set up error tracking
- [ ] Configure analytics

🔒 SECURITY:
- [ ] Verify HTTPS is working
- [ ] Check security headers
- [ ] Ensure environment variables are secure
- [ ] Test authentication flow

📱 OPTIMIZATION:
- [ ] Verify images are optimized
- [ ] Check CSS/JS minification
- [ ] Test mobile responsiveness
- [ ] Monitor page load times

Need help? Check the HOSTINGER_DEPLOYMENT.md file for detailed instructions.
`;

fs.writeFileSync('HOSTINGER_CHECKLIST.md', checklist);// Step 6: Show next steps