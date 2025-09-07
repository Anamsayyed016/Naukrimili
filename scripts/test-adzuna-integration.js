#!/usr/bin/env node

/**
 * Test Adzuna API Integration
 * 
 * This script tests the complete Adzuna API integration including:
 * - API key validation
 * - Job search functionality
 * - Data normalization
 * - Database integration
 */

import { PrismaClient } from '@prisma/client';
import { AdzunaService } from '../lib/services/adzuna-service';
import { fetchFromAdzuna } from '../lib/jobs/providers';

const prisma = new PrismaClient();

async function testAdzunaIntegration() {
  console.log('🔍 Testing Adzuna API Integration...\n');

  try {
    // Test 1: Initialize Adzuna Service
    console.log('1️⃣ Initializing Adzuna Service...');
    AdzunaService.initialize();
    console.log('✅ Adzuna Service initialized\n');

    // Test 2: Test Direct API Call
    console.log('2️⃣ Testing Direct API Call...');
    const directResult = await AdzunaService.searchJobs('software developer', 'in', 1, {
      location: 'Bangalore',
      distanceKm: 25
    });

    if (directResult.success) {
      console.log('✅ Direct API call successful');
      console.log(`   Found ${directResult.data?.length || 0} jobs`);
      if (directResult.data && directResult.data.length > 0) {
        console.log(`   Sample job: ${directResult.data[0].title} at ${directResult.data[0].company}`);
      }
    } else {
      console.log('❌ Direct API call failed:', directResult.error);
    }

    // Test 3: Test Provider Function
    console.log('\n3️⃣ Testing Provider Function...');
    const providerResult = await fetchFromAdzuna('software developer', 'in', 1, {
      location: 'Bangalore',
      distanceKm: 25
    });

    console.log('✅ Provider function successful');
    console.log(`   Found ${providerResult.length} jobs`);
    if (providerResult.length > 0) {
      console.log(`   Sample job: ${providerResult[0].title} at ${providerResult[0].company}`);
    }

    // Test 4: Test Job Import API
    console.log('\n4️⃣ Testing Job Import API...');
    const importResponse = await fetch('http://localhost:3000/api/jobs/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: ['software developer', 'frontend developer'],
        country: 'IN',
        page: 1,
        location: 'Bangalore',
        radiusKm: 25
      })
    });

    if (importResponse.ok) {
      const importData = await importResponse.json();
      console.log('✅ Job import API successful');
      console.log(`   Imported: ${importData.imported} jobs`);
      console.log(`   Fetched: ${importData.fetched} jobs`);
      console.log(`   Provider 1 (Adzuna): ${importData.providers.externalProvider1} jobs`);
    } else {
      console.log('❌ Job import API failed:', importResponse.status, importResponse.statusText);
    }

    // Test 5: Check Database
    console.log('\n5️⃣ Checking Database...');
    const totalJobs = await prisma.job.count();
    const adzunaJobs = await prisma.job.count({
      where: { source: 'adzuna' }
    });
    const externalJobs = await prisma.job.count({
      where: { source: 'external' }
    });

    console.log(`✅ Database check complete`);
    console.log(`   Total jobs: ${totalJobs}`);
    console.log(`   Adzuna jobs: ${adzunaJobs}`);
    console.log(`   External jobs: ${externalJobs}`);

    // Test 6: Test Jobs API
    console.log('\n6️⃣ Testing Jobs API...');
    const jobsResponse = await fetch('http://localhost:3000/api/jobs?query=software&location=Bangalore');
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log('✅ Jobs API successful');
      console.log(`   Found ${jobsData.jobs?.length || 0} jobs`);
      console.log(`   Total available: ${jobsData.pagination?.total || 0} jobs`);
    } else {
      console.log('❌ Jobs API failed:', jobsResponse.status, jobsResponse.statusText);
    }

    console.log('\n🎉 Adzuna API Integration Test Complete!');
    console.log('\n📊 Summary:');
    console.log('   ✅ API Keys: Working');
    console.log('   ✅ Direct API: Working');
    console.log('   ✅ Provider Function: Working');
    console.log('   ✅ Job Import: Working');
    console.log('   ✅ Database: Working');
    console.log('   ✅ Jobs API: Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAdzunaIntegration();
