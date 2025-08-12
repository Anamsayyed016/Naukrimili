#!/usr/bin/env node

/**
 * Resume Management System Setup Script
 * 
 * This script helps set up the resume management system with database
 * and file system requirements.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Resume Management System Setup');
console.log('=================================\n');

// Step 1: Check if environment file exists
console.log('📋 Step 1: Environment Configuration');
const envExamplePath = path.join(process.cwd(), '.env.example');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('✅ Created .env.local from .env.example');
    console.log('⚠️  Please update the following variables in .env.local:');
    console.log('   - DATABASE_URL (PostgreSQL connection string)');
    console.log('   - OPENAI_API_KEY (for AI features)');
    console.log('   - JWT_SECRET (generate a secure random string)');
  } else {
    console.log('❌ .env.example not found');
  }
} else {
  console.log('✅ .env.local already exists');
}

// Step 2: Install dependencies
console.log('\n📦 Step 2: Installing Dependencies');
try {
  console.log('Installing pg and @types/pg...');
  execSync('npm install pg@^8.13.1', { stdio: 'inherit' });
  execSync('npm install --save-dev @types/pg@^8.11.10', { stdio: 'inherit' });
  console.log('✅ PostgreSQL dependencies installed');
} catch (error) {
  console.log('❌ Failed to install dependencies:', error.message);
}

// Step 3: Create upload directories
console.log('\n📁 Step 3: Creating Upload Directories');
const uploadDirs = [
  'uploads',
  'uploads/resumes',
  'uploads/exports',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✅ Directory already exists: ${dir}`);
  }
});

// Step 4: Create gitignore entries for uploads
console.log('\n🔒 Step 4: Updating .gitignore');
const gitignorePath = path.join(process.cwd(), '.gitignore');
const uploadIgnoreEntries = [
  '# Resume uploads and exports',
  'uploads/*',
  '!uploads/.gitkeep',
  '.env.local',
  '*.env'
];

let gitignoreContent = '';
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

let updated = false;
uploadIgnoreEntries.forEach(entry => {
  if (!gitignoreContent.includes(entry)) {
    gitignoreContent += `\n${entry}`;
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Updated .gitignore with upload directories');
} else {
  console.log('✅ .gitignore already configured');
}

// Step 5: Create .gitkeep files
uploadDirs.forEach(dir => {
  const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

// Step 6: Database setup instructions
console.log('\n🗄️  Step 5: Database Setup Instructions');
console.log('=====================================');
console.log('1. Install PostgreSQL 14+ on your system');
console.log('2. Create a database for the resume system:');
console.log('   createdb jobportal_resumes');
console.log('3. Update DATABASE_URL in .env.local with your connection string');
console.log('4. Run the schema setup:');
console.log('   psql -d jobportal_resumes -f database/schema.sql');

// Step 7: API endpoints information
console.log('\n🔌 Step 6: API Endpoints Available');
console.log('==================================');
console.log('After setup, these endpoints will be available:');
console.log('• POST /api/resumes/analyze - Analyze resume content');
console.log('• POST /api/resumes/generate - Generate new resume');
console.log('• POST /api/resumes/upload - Upload and parse resume files');
console.log('• GET  /api/resumes - List user resumes');
console.log('• GET  /api/resumes/[id] - Get specific resume');
console.log('• PUT  /api/resumes/[id] - Update resume');
console.log('• DELETE /api/resumes/[id] - Delete resume');
console.log('• POST /api/resumes/[id]/export - Export resume to various formats');

// Step 8: Development workflow
console.log('\n⚡ Step 7: Development Workflow');
console.log('===============================');
console.log('1. Start the development server:');
console.log('   npm run dev');
console.log('2. Test API endpoints:');
console.log('   node scripts/test-resume-api.js');
console.log('3. Monitor database with provided queries in database/README.md');

// Step 9: Security reminders
console.log('\n🔐 Step 8: Security Checklist');
console.log('=============================');
console.log('• Set strong JWT_SECRET in production');
console.log('• Configure proper file upload limits');
console.log('• Enable Row Level Security policies');
console.log('• Set up database backups');
console.log('• Configure CORS for API endpoints');
console.log('• Enable rate limiting for API routes');

// Create a quick status check script
const statusCheckScript = `#!/usr/bin/env node

const { resumeDB } = require('./lib/resume-database');

async function checkStatus() {
  console.log('🔍 Resume System Status Check');
  console.log('============================\\n');
  
  try {
    const dbHealth = await resumeDB.healthCheck();
    console.log(\`Database: \${dbHealth ? '✅ Connected' : '❌ Failed'}\`);
    
    if (dbHealth) {
      console.log('✅ Resume system is ready!');
    } else {
      console.log('❌ Database connection failed. Check your DATABASE_URL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkStatus();
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'check-resume-system.js'), statusCheckScript);

console.log('\n🎉 Setup Complete!');
console.log('==================');
console.log('Next steps:');
console.log('1. Configure your .env.local file');
console.log('2. Set up PostgreSQL database');
console.log('3. Run: node scripts/check-resume-system.js');
console.log('4. Start development: npm run dev');
console.log('\nFor detailed documentation, see:');
console.log('• RESUME_API_DOCUMENTATION.md');
console.log('• database/README.md');
