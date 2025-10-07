#!/usr/bin/env node

/**
 * Quick Database Fix - Fix database credentials and import jobs
 * This script will:
 * 1. Test different database credentials
 * 2. Import real jobs from external APIs
 * 3. Create test jobs with correct credentials
 */

import { PrismaClient } from '@prisma/client';

console.log('🔧 Quick database fix...');

// Test different database credentials
const databaseConfigs = [
  'postgresql://postgres:password@localhost:5432/jobportal',
  'postgresql://postgres@localhost:5432/jobportal',
  'postgresql://postgres:postgres@localhost:5432/jobportal',
  'postgresql://postgres:root@localhost:5432/jobportal',
  'postgresql://postgres:admin@localhost:5432/jobportal',
  'postgresql://postgres:123456@localhost:5432/jobportal',
  'postgresql://postgres:postgres123@localhost:5432/jobportal',
  'postgresql://postgres:password123@localhost:5432/jobportal'
];

let workingConfig = null;
let prisma = null;

// Test database connections
async function testDatabaseConnections() {
  console.log('🧪 Testing database connections...');
  
  for (const config of databaseConfigs) {
    try {
      console.log(`🔍 Testing: ${config.replace(/\/\/.*@/, '//***:***@')}`);
      
      // Set environment variable
      process.env.DATABASE_URL = config;
      
      // Create new Prisma client
      const testPrisma = new PrismaClient();
      
      // Test connection
      await testPrisma.$connect();
      await testPrisma.$queryRaw`SELECT 1`;
      
      console.log(`✅ Working config found!`);
      workingConfig = config;
      prisma = testPrisma;
      
      await testPrisma.$disconnect();
      break;
    } catch (error) {
      console.log(`❌ Failed: ${error.message.split('\n')[0]}`);
      try {
        await testPrisma?.$disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
  
  return workingConfig;
}

// Import real jobs from external APIs
async function importRealJobs() {
  console.log('📥 Importing real jobs from external APIs...');
  
  try {
    const response = await fetch('http://localhost:3000/api/jobs/import-live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'software developer',
        location: 'India',
        country: 'IN'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Jobs imported successfully!');
      console.log(`📊 Total jobs: ${data.totalJobs}`);
      console.log(`🔗 Unique jobs: ${data.uniqueJobs}`);
      return data.jobs;
    } else {
      console.error('❌ Import failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Import error:', error.message);
    return null;
  }
}

// Create test jobs with working database
async function createTestJobs() {
  if (!prisma) {
    console.log('❌ No working database connection');
    return [];
  }
  
  console.log('🔨 Creating test jobs...');
  
  const testJobs = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc',
      location: 'Bangalore, India',
      country: 'IN',
      description: 'We are looking for a senior software engineer to join our growing team. You will work on cutting-edge projects and collaborate with talented developers.',
      requirements: JSON.stringify(['5+ years experience', 'JavaScript', 'React', 'Node.js', 'PostgreSQL']),
      applyUrl: 'https://techsolutions.com/careers/senior-engineer',
      source_url: 'https://techsolutions.com/jobs/senior-engineer-56',
      salary: '₹10,00,000 - ₹15,00,000',
      salaryMin: 1000000,
      salaryMax: 1500000,
      salaryCurrency: 'INR',
      jobType: 'Full-time',
      experienceLevel: 'Senior',
      skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'AWS']),
      isRemote: false,
      isHybrid: true,
      isUrgent: false,
      isFeatured: true,
      sector: 'Technology',
      source: 'manual',
      sourceId: 'test-56',
      isActive: true,
      rawJson: {
        title: 'Senior Software Engineer',
        company: 'Tech Solutions Inc',
        location: 'Bangalore, India',
        id: 56
      }
    },
    {
      title: 'Frontend Developer',
      company: 'Digital Agency',
      location: 'Mumbai, India',
      country: 'IN',
      description: 'Join our creative team as a frontend developer. Work on exciting projects for top brands.',
      requirements: JSON.stringify(['3+ years experience', 'React', 'TypeScript', 'CSS']),
      applyUrl: 'https://digitalagency.com/careers/frontend',
      source_url: 'https://digitalagency.com/jobs/frontend-dev',
      salary: '₹6,00,000 - ₹9,00,000',
      salaryMin: 600000,
      salaryMax: 900000,
      salaryCurrency: 'INR',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      skills: JSON.stringify(['React', 'TypeScript', 'CSS', 'HTML']),
      isRemote: true,
      isHybrid: false,
      isUrgent: true,
      isFeatured: false,
      sector: 'Design',
      source: 'manual',
      sourceId: 'test-frontend-001',
      isActive: true,
      rawJson: {
        title: 'Frontend Developer',
        company: 'Digital Agency',
        location: 'Mumbai, India'
      }
    }
  ];
  
  const createdJobs = [];
  
  for (const jobData of testJobs) {
    try {
      const job = await prisma.job.create({
        data: jobData
      });
      
      console.log(`✅ Created job: ID ${job.id}, Title: ${job.title}`);
      createdJobs.push(job);
    } catch (error) {
      console.error(`❌ Failed to create job "${jobData.title}":`, error.message);
    }
  }
  
  return createdJobs;
}

// Test job detail functionality
async function testJobDetailFunctionality(jobs) {
  console.log('🧪 Testing job detail functionality...');
  
  for (const job of jobs) {
    console.log(`🔍 Testing job ID: ${job.id}`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/jobs/${job.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Job ${job.id} detail working!`);
        console.log(`   Title: ${data.data?.title}`);
        console.log(`   Company: ${data.data?.company}`);
        console.log(`   Has redirect URL: ${!!data.data?.redirectUrl}`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Job ${job.id} detail failed:`, errorData.error || errorData.details);
      }
    } catch (error) {
      console.error(`❌ Job ${job.id} test failed:`, error.message);
    }
  }
}

// Update .env file with working config
async function updateEnvFile() {
  if (!workingConfig) {
    console.log('❌ No working database config found');
    return false;
  }
  
  console.log('📝 Updating .env file with working database config...');
  
  const envContent = `# NextAuth Configuration
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=jobportal-secret-key-2024-aftionix-production-deployment

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database - WORKING CONFIG
DATABASE_URL="${workingConfig}"

# JWT Secret
JWT_SECRET=jobportal-jwt-secret-2024-aftionix-production

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aftionix.in
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true

# 3RD PARTY JOB API KEYS - CRITICAL FOR REAL JOBS
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc

# Indeed API
INDEED_PUBLISHER_ID=your-indeed-publisher-id

# ZipRecruiter API
ZIPRECRUITER_API_KEY=your-ziprecruiter-api-key

# Google APIs
GOOGLE_JOBS_API_KEY=your-google-jobs-api-key
GOOGLE_GEOLOCATION_API_KEY=your-google-geolocation-api-key
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
`;

  try {
    const fs = await import('fs');
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file updated with working database config');
    return true;
  } catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎯 Starting quick database fix...');
  
  // Step 1: Test database connections
  const dbConfig = await testDatabaseConnections();
  if (!dbConfig) {
    console.log('❌ No working database configuration found');
    console.log('📝 Please check your PostgreSQL setup and credentials');
    return;
  }
  
  console.log(`✅ Working database config: ${dbConfig.replace(/\/\/.*@/, '//***:***@')}`);
  
  // Step 2: Update .env file
  await updateEnvFile();
  
  // Step 3: Import real jobs
  const importedJobs = await importRealJobs();
  
  // Step 4: Create test jobs
  const testJobs = await createTestJobs();
  
  // Step 5: Test job detail functionality
  if (testJobs.length > 0) {
    await testJobDetailFunctionality(testJobs);
  }
  
  console.log('🎉 Quick database fix completed!');
  console.log('📝 Summary:');
  console.log(`- Database config: ${dbConfig ? '✅ Found' : '❌ Not found'}`);
  console.log(`- Real jobs imported: ${importedJobs ? importedJobs.length : 0}`);
  console.log(`- Test jobs created: ${testJobs.length}`);
  console.log('');
  console.log('🔗 Test URLs:');
  if (testJobs.length > 0) {
    console.log(`- Test job: http://localhost:3000/jobs/${testJobs[0].id}`);
    console.log(`- Job ID 56: http://localhost:3000/jobs/56`);
  }
  console.log('- Jobs list: http://localhost:3000/jobs');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Restart your application: pm2 restart jobportal');
  console.log('2. Visit the test URLs above');
  console.log('3. Click on jobs to test detail pages');
}

// Run the fix
main()
  .catch(console.error)
  .finally(() => {
    if (prisma) {
      prisma.$disconnect();
    }
  });
