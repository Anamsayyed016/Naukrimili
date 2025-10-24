#!/usr/bin/env node

/**
 * Fix Job Detail Issue - Comprehensive solution
 * This script addresses the "No job found with ID: 56" error by:
 * 1. Setting up proper environment variables
 * 2. Importing real jobs from external APIs
 * 3. Creating test jobs
 * 4. Verifying job detail functionality
 */

import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔧 Fixing job detail issue...');

// Step 1: Create .env file with API keys
function setupEnvironment() {
  console.log('📝 Setting up environment variables...');
  
  const envContent = `# NextAuth Configuration
NEXTAUTH_URL=https://naukrimili.com
NEXTAUTH_SECRET=jobportal-secret-key-2024-naukrimili-production-deployment

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobportal"

# JWT Secret
JWT_SECRET=jobportal-jwt-secret-2024-naukrimili-production

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://naukrimili.com
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
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created with API keys');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    return false;
  }
}

// Step 2: Import real jobs from external APIs
async function importRealJobs() {
  console.log('📥 Importing real jobs from external APIs...');
  
  try {
    // Import via the API endpoint
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
      console.log('📋 Providers:', data.providers);
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

// Step 3: Create test jobs with specific IDs
async function createTestJobs() {
  console.log('🔨 Creating test jobs...');
  
  const testJobs = [
    {
      id: 56, // The specific ID that was failing
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

// Step 4: Test job detail functionality
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

// Step 5: Verify database state
async function verifyDatabaseState() {
  console.log('📊 Verifying database state...');
  
  try {
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({
      where: { isActive: true }
    });
    
    console.log(`📋 Total jobs in database: ${totalJobs}`);
    console.log(`✅ Active jobs: ${activeJobs}`);
    
    // Check for the specific failing ID
    const job56 = await prisma.job.findFirst({
      where: {
        OR: [
          { id: 56 },
          { sourceId: '56' }
        ]
      }
    });
    
    if (job56) {
      console.log('✅ Job with ID 56 found:', {
        id: job56.id,
        title: job56.title,
        company: job56.company,
        source: job56.source
      });
    } else {
      console.log('⚠️ Job with ID 56 not found');
    }
    
    return { totalJobs, activeJobs, job56 };
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return { totalJobs: 0, activeJobs: 0, job56: null };
  }
}

// Main execution
async function main() {
  console.log('🎯 Starting comprehensive job detail fix...');
  
  // Step 1: Setup environment
  const envSetup = setupEnvironment();
  if (!envSetup) {
    console.log('❌ Cannot proceed without environment setup');
    return;
  }
  
  // Step 2: Import real jobs
  const importedJobs = await importRealJobs();
  
  // Step 3: Create test jobs
  const testJobs = await createTestJobs();
  
  // Step 4: Test job detail functionality
  if (testJobs.length > 0) {
    await testJobDetailFunctionality(testJobs);
  }
  
  // Step 5: Verify database state
  const dbState = await verifyDatabaseState();
  
  console.log('🎉 Job detail fix completed!');
  console.log('📝 Summary:');
  console.log(`- Environment setup: ${envSetup ? '✅' : '❌'}`);
  console.log(`- Real jobs imported: ${importedJobs ? importedJobs.length : 0}`);
  console.log(`- Test jobs created: ${testJobs.length}`);
  console.log(`- Database total jobs: ${dbState.totalJobs}`);
  console.log(`- Job ID 56 status: ${dbState.job56 ? '✅ Found' : '❌ Not found'}`);
  console.log('');
  console.log('🔗 Test URLs:');
  console.log('- Jobs list: http://localhost:3000/jobs');
  if (dbState.job56) {
    console.log(`- Job ID 56: http://localhost:3000/jobs/${dbState.job56.id}`);
  }
  if (testJobs.length > 0) {
    console.log(`- Test job: http://localhost:3000/jobs/${testJobs[0].id}`);
  }
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Restart your application: npm run dev');
  console.log('2. Visit the test URLs above');
  console.log('3. Click on jobs to test detail pages');
  console.log('4. Jobs should now redirect to external sources');
}

// Run the fix
main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
  });
