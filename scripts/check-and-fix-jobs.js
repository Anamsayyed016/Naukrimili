#!/usr/bin/env node

/**
 * Check and Fix Jobs - Debug job system issues
 * This script will:
 * 1. Check database for existing jobs
 * 2. Test API endpoints
 * 3. Import jobs if needed
 * 4. Fix job detail issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔍 Checking job system status...');

// Check database for jobs
async function checkDatabaseJobs() {
  console.log('📊 Checking database for existing jobs...');
  
  try {
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({
      where: { isActive: true }
    });
    
    console.log(`📋 Total jobs in database: ${totalJobs}`);
    console.log(`✅ Active jobs: ${activeJobs}`);
    
    if (totalJobs > 0) {
      const sampleJobs = await prisma.job.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
          source: true,
          sourceId: true,
          isActive: true
        }
      });
      
      console.log('📋 Sample jobs:');
      sampleJobs.forEach(job => {
        console.log(`  - ID: ${job.id}, Title: ${job.title}, Company: ${job.company}, Source: ${job.source}`);
      });
    }
    
    return { totalJobs, activeJobs };
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return { totalJobs: 0, activeJobs: 0 };
  }
}

// Test job API endpoints
async function testJobAPIs() {
  console.log('🧪 Testing job API endpoints...');
  
  const endpoints = [
    '/api/jobs/unified?query=software&location=Bangalore',
    '/api/jobs/import-live',
    '/api/debug/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: endpoint.includes('import-live') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.includes('import-live') ? JSON.stringify({
          query: 'software developer',
          location: 'India'
        }) : undefined
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: Working`);
        if (data.jobs) {
          console.log(`   Found ${data.jobs.length} jobs`);
        }
      } else {
        console.log(`❌ ${endpoint}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Import jobs from external APIs
async function importJobsFromAPIs() {
  console.log('📥 Importing jobs from external APIs...');
  
  try {
    // Test Adzuna API directly
    const { fetchFromAdzuna } = await import('../lib/jobs/providers.js');
    
    console.log('🔍 Testing Adzuna API...');
    const adzunaJobs = await fetchFromAdzuna('software developer', 'in', 1, {});
    console.log(`✅ Adzuna: Found ${adzunaJobs.length} jobs`);
    
    if (adzunaJobs.length > 0) {
      console.log('📋 Sample Adzuna job:', {
        title: adzunaJobs[0].title,
        company: adzunaJobs[0].company,
        sourceId: adzunaJobs[0].sourceId,
        source_url: adzunaJobs[0].source_url
      });
    }
    
    // Import via API endpoint
    console.log('📥 Importing via API endpoint...');
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
      console.log('✅ Import successful!');
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

// Test specific job detail
async function testJobDetail(jobId) {
  console.log(`🧪 Testing job detail for ID: ${jobId}`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Job detail API working!');
      console.log('📋 Job details:', {
        id: data.data?.id,
        title: data.data?.title,
        company: data.data?.company,
        source: data.data?.source,
        hasRedirectUrl: !!data.data?.redirectUrl,
        redirectUrl: data.data?.redirectUrl
      });
      return data.data;
    } else {
      const errorData = await response.json();
      console.error(`❌ Job detail failed: HTTP ${response.status}`);
      console.error('Error:', errorData.error || errorData.details);
      return null;
    }
  } catch (error) {
    console.error('❌ Job detail test failed:', error.message);
    return null;
  }
}

// Create sample job for testing
async function createSampleJob() {
  console.log('🔨 Creating sample job for testing...');
  
  try {
    const sampleJob = await prisma.job.create({
      data: {
        title: 'Senior Software Developer',
        company: 'Tech Corp',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'We are looking for a senior software developer to join our team.',
        requirements: JSON.stringify(['5+ years experience', 'JavaScript', 'React']),
        applyUrl: 'https://example.com/apply',
        source_url: 'https://example.com/job/123',
        salary: '₹8,00,000 - ₹12,00,000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        skills: JSON.stringify(['JavaScript', 'React', 'Node.js']),
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'sample-123',
        isActive: true,
        rawJson: {
          title: 'Senior Software Developer',
          company: 'Tech Corp',
          location: 'Bangalore, India'
        }
      }
    });
    
    console.log('✅ Sample job created:', {
      id: sampleJob.id,
      title: sampleJob.title,
      sourceId: sampleJob.sourceId
    });
    
    return sampleJob;
  } catch (error) {
    console.error('❌ Failed to create sample job:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🎯 Starting job system check and fix...');
  
  // Step 1: Check database
  const { totalJobs, activeJobs } = await checkDatabaseJobs();
  
  // Step 2: Test APIs
  await testJobAPIs();
  
  // Step 3: Import jobs if database is empty
  let jobs = [];
  if (totalJobs === 0) {
    console.log('📥 No jobs found, importing from external APIs...');
    jobs = await importJobsFromAPIs();
  } else {
    console.log('✅ Jobs found in database, skipping import');
  }
  
  // Step 4: Create sample job for testing
  const sampleJob = await createSampleJob();
  
  // Step 5: Test job detail functionality
  if (sampleJob) {
    await testJobDetail(sampleJob.id);
    await testJobDetail(sampleJob.sourceId);
  }
  
  // Step 6: Test with external job if available
  if (jobs && jobs.length > 0) {
    const externalJob = jobs[0];
    console.log('🧪 Testing external job detail...');
    await testJobDetail(externalJob.sourceId);
  }
  
  console.log('🎉 Job system check completed!');
  console.log('📝 Summary:');
  console.log(`- Database jobs: ${totalJobs} total, ${activeJobs} active`);
  console.log(`- Sample job created: ${sampleJob ? 'Yes' : 'No'}`);
  console.log(`- External jobs imported: ${jobs ? jobs.length : 0}`);
  console.log('');
  console.log('🔗 Test URLs:');
  if (sampleJob) {
    console.log(`- Sample job: http://localhost:3000/jobs/${sampleJob.id}`);
    console.log(`- Sample job by sourceId: http://localhost:3000/jobs/${sampleJob.sourceId}`);
  }
  console.log('- Jobs list: http://localhost:3000/jobs');
}

// Run the check
main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
  });
