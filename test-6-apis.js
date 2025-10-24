#!/usr/bin/env node

/**
 * 🧪 Test All 6 Job APIs Integration
 * This script verifies that all 6 APIs are properly integrated
 */

import axios from 'axios';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testAPIHealth() {
  log('cyan', '\n🏥 Testing API Health Check...');
  
  try {
    const response = await axios.get('http://localhost:3000/api/debug/health');
    const health = response.data;
    
    log('blue', '\n📊 API Health Status:');
    console.log(JSON.stringify(health, null, 2));
    
    const healthyCount = Object.values(health).filter(v => v === true).length;
    log('green', `\n✅ ${healthyCount} out of 6 APIs are healthy!`);
    
    return health;
  } catch (error) {
    log('red', `❌ Health check failed: ${error.message}`);
    return null;
  }
}

async function testJobImport() {
  log('cyan', '\n📥 Testing Job Import (All 6 APIs)...');
  
  try {
    const response = await axios.post('http://localhost:3000/api/jobs/import-live', {
      query: 'software developer',
      location: 'Bangalore',
      country: 'IN'
    });
    
    const data = response.data;
    
    log('blue', '\n📊 Import Results:');
    log('green', `Total Jobs: ${data.totalJobs}`);
    log('green', `Unique Jobs: ${data.uniqueJobs}`);
    
    log('blue', '\n📈 Jobs per Provider:');
    Object.entries(data.providers).forEach(([provider, count]) => {
      const status = count > 0 ? '✅' : '⚠️';
      const color = count > 0 ? 'green' : 'yellow';
      log(color, `${status} ${provider}: ${count} jobs`);
    });
    
    if (data.jobs && data.jobs.length > 0) {
      log('blue', '\n📋 Sample Jobs:');
      data.jobs.slice(0, 3).forEach((job, i) => {
        log('green', `\n${i + 1}. ${job.title}`);
        log('cyan', `   Company: ${job.company}`);
        log('cyan', `   Location: ${job.location}`);
        log('cyan', `   Source: ${job.source}`);
        log('cyan', `   Apply URL: ${job.source_url || job.applyUrl || 'N/A'}`);
      });
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Job import failed: ${error.message}`);
    return null;
  }
}

async function testUnifiedSearch() {
  log('cyan', '\n🔍 Testing Unified Search...');
  
  try {
    const response = await axios.get('http://localhost:3000/api/jobs/unified', {
      params: {
        query: 'developer',
        location: 'Bangalore',
        includeExternal: true
      }
    });
    
    const data = response.data;
    
    log('blue', '\n📊 Search Results:');
    log('green', `Total Jobs: ${data.total || 0}`);
    
    if (data.sources) {
      log('blue', '\n📈 Jobs by Source:');
      Object.entries(data.sources).forEach(([source, count]) => {
        log('green', `- ${source}: ${count} jobs`);
      });
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Unified search failed: ${error.message}`);
    return null;
  }
}

async function main() {
  log('cyan', '🚀 Starting 6 API Integration Test...\n');
  
  // Test 1: API Health
  const health = await testAPIHealth();
  
  // Test 2: Job Import
  const importResult = await testJobImport();
  
  // Test 3: Unified Search
  const searchResult = await testUnifiedSearch();
  
  // Summary
  log('cyan', '\n\n📊 TEST SUMMARY');
  log('blue', '='.repeat(50));
  
  if (health) {
    const healthyAPIs = Object.entries(health.details || {}).filter(([_, v]) => v.status === 'healthy').length;
    log('green', `✅ API Health: ${healthyAPIs}/6 APIs responding`);
  }
  
  if (importResult) {
    const workingAPIs = Object.values(importResult.providers).filter(v => v > 0).length;
    log('green', `✅ Job Import: ${workingAPIs}/6 APIs returning jobs`);
    log('green', `✅ Total Jobs Fetched: ${importResult.totalJobs}`);
    log('green', `✅ Unique Jobs: ${importResult.uniqueJobs}`);
  }
  
  if (searchResult) {
    log('green', `✅ Unified Search: ${searchResult.total || 0} jobs found`);
  }
  
  log('blue', '='.repeat(50));
  
  log('cyan', '\n🎉 6 API Integration Test Complete!\n');
  log('yellow', '💡 Tip: If some APIs show 0 jobs, they may need API keys or subscription upgrades.\n');
}

// Run tests
main().catch(error => {
  log('red', `\n❌ Test suite failed: ${error.message}\n`);
  process.exit(1);
});
