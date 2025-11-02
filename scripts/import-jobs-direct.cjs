#!/usr/bin/env node

/**
 * Direct Job Import - Fast & Efficient
 * Bypasses API, directly inserts to database
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Adzuna credentials
const ADZUNA_ID = '5e478efa';
const ADZUNA_KEY = 'f216fb45f9e324783b04fd877fc0f4f7';

// Configuration - Optimized for speed
const CONFIG = {
  countries: [
    { code: 'IN', adzuna: 'in', name: 'India' },
    { code: 'US', adzuna: 'us', name: 'United States' },
    { code: 'GB', adzuna: 'gb', name: 'United Kingdom' },
    { code: 'AE', adzuna: 'ae', name: 'UAE' }
  ],
  queries: [
    'software', 'developer', 'engineer', 'manager', 'analyst',
    'designer', 'marketing', 'sales', 'accountant', 'HR'
  ],
  pagesPerQuery: 10, // 10 pages × 50 jobs = 500 jobs per query
  maxJobsPerCountry: 1500
};

let stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

async function fetchAdzunaJobs(country, query, page) {
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
    const { data } = await axios.get(url, {
      params: {
        app_id: ADZUNA_ID,
        app_key: ADZUNA_KEY,
        what: query,
        results_per_page: 50
      },
      timeout: 10000
    });
    
    return data.results || [];
  } catch (error) {
    console.log(`    ⚠️ Fetch error: ${error.message}`);
    return [];
  }
}

async function saveJob(job, countryCode) {
  try {
    const sourceId = `adzuna-${job.id}`;
    
    await prisma.job.upsert({
      where: {
        source_sourceId: {
          source: 'external',
          sourceId: sourceId
        }
      },
      update: {
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        sourceId: sourceId,
        source: 'external',
        title: job.title || 'Job',
        company: job.company?.display_name || 'Company',
        location: job.location?.display_name || '',
        country: countryCode,
        description: job.description || '',
        requirements: '',
        applyUrl: job.redirect_url,
        source_url: job.redirect_url,
        postedAt: job.created ? new Date(job.created) : new Date(),
        salary: job.salary_min || job.salary_max ? `${job.salary_min || ''}-${job.salary_max || ''}` : null,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: countryCode === 'US' ? 'USD' : countryCode === 'GB' ? 'GBP' : countryCode === 'AE' ? 'AED' : 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: '[]',
        isRemote: false,
        isHybrid: false,
        isActive: true,
        sector: 'General'
      }
    });
    
    stats.created++;
    return true;
  } catch (error) {
    if (error.code === 'P2002') {
      stats.skipped++;
    } else {
      stats.errors++;
      console.log(`    ✗ Save error: ${error.message}`);
    }
    return false;
  }
}

async function importCountry(country) {
  console.log(`\n🌍 ${country.name} (${country.code})...`);
  let countryTotal = 0;
  
  for (const query of CONFIG.queries) {
    if (countryTotal >= CONFIG.maxJobsPerCountry) break;
    
    console.log(`  🔍 "${query}"...`);
    let queryTotal = 0;
    
    for (let page = 1; page <= CONFIG.pagesPerQuery; page++) {
      if (countryTotal >= CONFIG.maxJobsPerCountry) break;
      
      const jobs = await fetchAdzunaJobs(country.adzuna, query, page);
      
      if (jobs.length === 0) break; // No more results
      
      for (const job of jobs) {
        await saveJob(job, country.code);
        countryTotal++;
        stats.total++;
        
        if (countryTotal >= CONFIG.maxJobsPerCountry) break;
      }
      
      queryTotal += jobs.length;
      console.log(`    📄 Page ${page}: ${jobs.length} jobs (${queryTotal} total)`);
      
      await new Promise(r => setTimeout(r, 300)); // Rate limit delay
    }
  }
  
  console.log(`  ✅ ${country.name}: ${countryTotal} jobs processed`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 DIRECT JOB IMPORT (FAST)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const before = await prisma.job.count();
  console.log(`📊 Jobs before: ${before}\n`);
  
  const start = Date.now();
  
  for (const country of CONFIG.countries) {
    await importCountry(country);
  }
  
  const after = await prisma.job.count();
  const duration = ((Date.now() - start) / 1000 / 60).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎉 IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Total processed: ${stats.total}`);
  console.log(`➕ New jobs created: ${stats.created}`);
  console.log(`♻️  Duplicates skipped: ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`📊 Jobs before: ${before}`);
  console.log(`📊 Jobs after: ${after}`);
  console.log(`📈 Jobs added: ${after - before}`);
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

