#!/usr/bin/env node

/**
 * Safe Bulk Job Import Script
 * Imports 5000-10000 real jobs from external APIs
 * SAFE: Does NOT remove existing jobs, only adds new ones
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  countries: ['IN', 'US', 'GB', 'AE', 'CA', 'AU'], // 6 countries
  queriesPerCountry: 20, // 20 different job types per country
  pagesPerQuery: 5, // 5 pages per query (50 jobs × 5 = 250 jobs per query)
  maxJobsPerCountry: 1500, // Max 1500 jobs per country
  delayBetweenRequests: 500, // 500ms delay to avoid rate limiting
  batchSize: 50 // Insert 50 jobs at a time
};

// Job search queries (diverse to get variety)
const JOB_QUERIES = [
  'software engineer', 'data scientist', 'product manager', 'full stack developer',
  'frontend developer', 'backend developer', 'DevOps engineer', 'cloud engineer',
  'UI/UX designer', 'business analyst', 'project manager', 'QA engineer',
  'marketing manager', 'sales executive', 'HR manager', 'accountant',
  'data analyst', 'machine learning engineer', 'mobile developer', 'web developer'
];

let totalImported = 0;
let totalSkipped = 0;
let totalErrors = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJobsFromAPI(country, query, page) {
  try {
    console.log(`  📡 Fetching: ${country} - "${query}" - Page ${page}`);
    
    const response = await axios.post('http://localhost:3000/api/jobs/import-bulk', {
      countries: [country],
      query: query,
      pages: 1,
      limitPerPage: 50,
      days: 30
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success) {
      const upserted = response.data.metrics?.upserted || 0;
      console.log(`    ✓ Imported ${upserted} jobs`);
      return upserted;
    } else {
      console.log(`    ✗ Failed:`, response.data.error);
      return 0;
    }
  } catch (error) {
    console.log(`    ✗ Error:`, error.message);
    totalErrors++;
    return 0;
  }
}

async function importJobs() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 SAFE BULK JOB IMPORT');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📋 Configuration:');
  console.log(`  • Countries: ${CONFIG.countries.join(', ')}`);
  console.log(`  • Queries per country: ${CONFIG.queriesPerCountry}`);
  console.log(`  • Pages per query: ${CONFIG.pagesPerQuery}`);
  console.log(`  • Max jobs per country: ${CONFIG.maxJobsPerCountry}`);
  console.log(`  • Estimated total jobs: ${CONFIG.countries.length * CONFIG.maxJobsPerCountry}\n`);
  
  // Check current job count
  const currentJobCount = await prisma.job.count();
  console.log(`📊 Current jobs in database: ${currentJobCount}\n`);
  
  const startTime = Date.now();
  
  for (const country of CONFIG.countries) {
    console.log(`\n🌍 Processing ${country}...`);
    let countryJobsImported = 0;
    
    for (let i = 0; i < CONFIG.queriesPerCountry && countryJobsImported < CONFIG.maxJobsPerCountry; i++) {
      const query = JOB_QUERIES[i % JOB_QUERIES.length];
      
      for (let page = 1; page <= CONFIG.pagesPerQuery && countryJobsImported < CONFIG.maxJobsPerCountry; page++) {
        const imported = await fetchJobsFromAPI(country, query, page);
        countryJobsImported += imported;
        totalImported += imported;
        
        // Delay to avoid rate limiting
        await sleep(CONFIG.delayBetweenRequests);
      }
      
      console.log(`  📊 ${country} Progress: ${countryJobsImported} jobs imported`);
      
      // Stop if we hit the limit for this country
      if (countryJobsImported >= CONFIG.maxJobsPerCountry) {
        console.log(`  ✓ ${country} reached limit (${CONFIG.maxJobsPerCountry} jobs)`);
        break;
      }
    }
    
    console.log(`  ✅ ${country} Complete: ${countryJobsImported} jobs imported`);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  const finalJobCount = await prisma.job.count();
  const newJobsAdded = finalJobCount - currentJobCount;
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎉 IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Total jobs imported: ${totalImported}`);
  console.log(`⏭️  Total duplicates skipped: ${totalSkipped}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log(`📊 Jobs before: ${currentJobCount}`);
  console.log(`📊 Jobs after: ${finalJobCount}`);
  console.log(`➕ New jobs added: ${newJobsAdded}`);
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log('═══════════════════════════════════════════════════════\n');
}

async function main() {
  try {
    await importJobs();
    console.log('✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

