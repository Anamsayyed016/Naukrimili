#!/usr/bin/env node

/**
 * Fix Adzuna API Integration
 * 
 * This script fixes the Adzuna API integration by:
 * 1. Testing API keys directly
 * 2. Importing jobs manually
 * 3. Verifying database storage
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const ADZUNA_APP_ID = 'bdd02427';
const ADZUNA_APP_KEY = 'abf03277d13e4cb39b24bf236ad29299';

const countries = [
  { code: 'in', name: 'India', location: 'Bangalore' },
  { code: 'us', name: 'USA', location: 'New York' },
  { code: 'gb', name: 'UK', location: 'London' }
];

async function fixAdzunaIntegration() {
  console.log('🔧 Fixing Adzuna API Integration...\n');

  try {
    // Step 1: Test API keys directly
    console.log('1️⃣ Testing API Keys...');
    for (const country of countries) {
      const apiUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=5&where=${country.location}`;
      
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${country.name}: ${data.results?.length || 0} jobs available`);
        } else {
          console.log(`   ❌ ${country.name}: API failed (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ ${country.name}: ${error.message}`);
      }
    }

    // Step 2: Import jobs directly to database
    console.log('\n2️⃣ Importing Jobs Directly...');
    let totalImported = 0;

    for (const country of countries) {
      console.log(`   📥 Importing from ${country.name}...`);
      
      try {
        const apiUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=10&where=${country.location}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          const jobs = data.results || [];
          
          let countryImported = 0;
          for (const job of jobs) {
            try {
              // Create job in database
              const newJob = await prisma.job.create({
                data: {
                  source: 'adzuna',
                  sourceId: `adzuna_${job.id}`,
                  title: job.title || 'Untitled Position',
                  company: job.company?.display_name || 'Unknown Company',
                  companyLogo: job.company?.logo,
                  location: job.location?.display_name || country.location,
                  country: country.code.toUpperCase(),
                  description: job.description || '',
                  requirements: extractRequirements(job.description),
                  applyUrl: job.redirect_url,
                  apply_url: job.redirect_url,
                  source_url: job.redirect_url,
                  postedAt: job.created ? new Date(job.created) : new Date(),
                  salary: formatSalary(job.salary_min, job.salary_max),
                  salaryMin: job.salary_min,
                  salaryMax: job.salary_max,
                  salaryCurrency: getCurrency(country.code),
                  jobType: mapJobType(job.contract_type, job.contract_time),
                  experienceLevel: extractExperienceLevel(job.title, job.description),
                  skills: extractSkills(job.title, job.description),
                  isRemote: isRemoteJob(job.title, job.description, job.location),
                  isHybrid: isHybridJob(job.title, job.description),
                  isUrgent: false,
                  isFeatured: false,
                  isActive: true,
                  sector: job.category?.label || 'Technology',
                  views: 0,
                  applicationsCount: 0,
                  rawJson: JSON.stringify(job)
                }
              });
              
              countryImported++;
              totalImported++;
            } catch (error) {
              // Job might already exist, skip
              if (!error.message.includes('Unique constraint')) {
                console.log(`     ⚠️ Error creating job: ${error.message}`);
              }
            }
          }
          
          console.log(`     ✅ Imported ${countryImported} jobs from ${country.name}`);
        } else {
          console.log(`     ❌ Failed to fetch from ${country.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Error importing from ${country.name}: ${error.message}`);
      }
    }

    // Step 3: Verify database
    console.log('\n3️⃣ Verifying Database...');
    const totalJobs = await prisma.job.count();
    const adzunaJobs = await prisma.job.count({ where: { source: 'adzuna' } });
    const jobsByCountry = await prisma.job.groupBy({
      by: ['country'],
      _count: { country: true }
    });

    console.log(`   📊 Total jobs: ${totalJobs}`);
    console.log(`   🔗 Adzuna jobs: ${adzunaJobs}`);
    console.log(`   🌍 Jobs by country:`);
    jobsByCountry.forEach(group => {
      console.log(`      ${group.country}: ${group._count.country} jobs`);
    });

    // Step 4: Test jobs API
    console.log('\n4️⃣ Testing Jobs API...');
    try {
      const jobsResponse = await fetch('http://localhost:3000/api/jobs?query=software');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        console.log(`   ✅ Jobs API working: ${jobsData.jobs?.length || 0} jobs returned`);
        console.log(`   📈 Total available: ${jobsData.pagination?.total || 0} jobs`);
      } else {
        console.log(`   ❌ Jobs API failed: ${jobsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Jobs API error: ${error.message}`);
    }

    console.log('\n🎉 Adzuna Integration Fix Complete!');
    console.log(`   📥 Total jobs imported: ${totalImported}`);
    console.log(`   🗄️ Total jobs in database: ${totalJobs}`);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function extractRequirements(description) {
  if (!description) return '';
  const reqMatch = description.match(/(?:requirements?|qualifications?|skills?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/i);
  return reqMatch ? reqMatch[1].substring(0, 500) : '';
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  if (min && max) return `${min} - ${max}`;
  if (min) return `From ${min}`;
  if (max) return `Up to ${max}`;
  return null;
}

function getCurrency(countryCode) {
  const currencies = {
    'in': 'INR',
    'us': 'USD',
    'gb': 'GBP',
    'ae': 'AED'
  };
  return currencies[countryCode] || 'USD';
}

function mapJobType(contractType, contractTime) {
  if (contractType === 'full_time' || contractTime === 'full_time') return 'full-time';
  if (contractType === 'part_time' || contractTime === 'part_time') return 'part-time';
  if (contractType === 'contract') return 'contract';
  return 'full-time';
}

function extractExperienceLevel(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('senior') || text.includes('lead') || text.includes('principal')) return 'senior';
  if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) return 'entry';
  if (text.includes('mid') || text.includes('intermediate')) return 'mid';
  return 'mid';
}

function extractSkills(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const skills = [];
  const skillKeywords = ['javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript', 'php', 'ruby', 'go', 'rust', 'c++', 'c#', 'swift', 'kotlin', 'dart', 'flutter', 'react native', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'git', 'jenkins', 'ci/cd'];
  
  skillKeywords.forEach(skill => {
    if (text.includes(skill)) {
      skills.push(skill);
    }
  });
  
  return skills.join(',');
}

function isRemoteJob(title, description, location) {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('remote') || text.includes('work from home') || text.includes('wfh');
}

function isHybridJob(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('hybrid') || text.includes('flexible');
}

// Run the fix
fixAdzunaIntegration();
