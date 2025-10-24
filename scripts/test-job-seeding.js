#!/usr/bin/env node

/**
 * TEST JOB SEEDING SCRIPT
 * Tests the job seeding functionality without actually seeding the database
 */

import { JobGenerator, getAllSectors } from '../lib/jobs/sectors.js';

console.log('🧪 Testing Job Seeding System...\n');

// Test 1: Get all sectors
console.log('📊 Test 1: Available Sectors');
try {
  const sectors = getAllSectors();
  console.log(`✅ Found ${sectors.length} sectors:`);
  sectors.forEach(sector => {
    console.log(`   ${sector.icon} ${sector.name} - ${sector.jobTitles.length} job titles`);
  });
} catch (error) {
  console.error('❌ Failed to get sectors:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Generate sample jobs for each sector
console.log('🔧 Test 2: Job Generation');
try {
  sectors.forEach(sector => {
    console.log(`\n${sector.icon} Generating sample jobs for ${sector.name}:`);
    
    // Generate 3 sample jobs
    for (let i = 0; i < 3; i++) {
      try {
        const job = JobGenerator.generateJobForSector(sector.id, i);
        console.log(`   ${i + 1}. ${job.title} at ${job.company}`);
        console.log(`      Location: ${job.location}`);
        console.log(`      Salary: ${job.salary}`);
        console.log(`      Skills: ${job.skills.slice(0, 3).join(', ')}...`);
        console.log(`      Experience: ${job.experienceLevel}`);
        console.log(`      Remote: ${job.isRemote ? 'Yes' : job.isHybrid ? 'Hybrid' : 'No'}`);
      } catch (error) {
        console.error(`      ❌ Failed to generate job ${i + 1}:`, error.message);
      }
    }
  });
} catch (error) {
  console.error('❌ Failed to generate jobs:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Sector statistics
console.log('📈 Test 3: Sector Statistics');
try {
  const stats = JobGenerator.getSectorStats();
  console.log('✅ Sector Statistics:');
  stats.forEach(stat => {
    console.log(`   ${stat.sector}: ${stat.jobCount} jobs, Avg Salary: ₹${(stat.avgSalary / 100000).toFixed(1)} LPA`);
  });
} catch (error) {
  console.error('❌ Failed to get sector stats:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 4: Performance test
console.log('⚡ Test 4: Performance Test');
try {
  const startTime = Date.now();
  const jobs = JobGenerator.generateJobsForAllSectors(5); // 5 jobs per sector
  const endTime = Date.now();
  
  console.log(`✅ Generated ${jobs.length} jobs in ${endTime - startTime}ms`);
  console.log(`   Average: ${((endTime - startTime) / jobs.length).toFixed(2)}ms per job`);
} catch (error) {
  console.error('❌ Performance test failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');
console.log('🎉 Job Seeding System Test Complete!');
console.log('\nTo actually seed the database, visit: /admin/seed-jobs');
console.log('Or use the API endpoint: POST /api/jobs/seed');
