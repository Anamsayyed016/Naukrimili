#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupJobAPIs() {
  console.log('🚀 Job Portal API Setup\n');
  console.log('This script will help you configure your job portal APIs.\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  let envContent = '';
  if (envExists) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📁 Found existing .env.local file');
  } else {
    console.log('📁 Creating new .env.local file');
  }

  // SerpApi setup
  console.log('\n🔍 SerpApi (Google Jobs) Setup');
  console.log('SerpApi provides access to Google Jobs search results.');
  
  const serpApiKey = await question('Enter your SerpApi key (or press Enter to use default): ');
  if (serpApiKey.trim()) {
    envContent = updateEnvVar(envContent, 'SERPAPI_KEY', serpApiKey.trim());
  } else {
    envContent = updateEnvVar(envContent, 'SERPAPI_KEY', '4e28d11218306cbed8fce998a79a06c28c0d314029913b0aab19bc3e1dcb1ba6');
    console.log('✅ Using default SerpApi key');
  }

  // Adzuna setup
  console.log('\n💰 Adzuna API Setup');
  console.log('Adzuna provides job listings from multiple sources.');
  console.log('Get your keys from: https://developer.adzuna.com/');
  
  const adzunaAppId = await question('Enter your Adzuna App ID (or press Enter to skip): ');
  if (adzunaAppId.trim()) {
    envContent = updateEnvVar(envContent, 'ADZUNA_APP_ID', adzunaAppId.trim());
    
    const adzunaApiKey = await question('Enter your Adzuna API Key: ');
    if (adzunaApiKey.trim()) {
      envContent = updateEnvVar(envContent, 'ADZUNA_API_KEY', adzunaApiKey.trim());
      console.log('✅ Adzuna API configured');
    }
  } else {
    console.log('⏭️ Skipping Adzuna API setup');
  }

  // Reed API setup
  console.log('\n🇬🇧 Reed API Setup');
  console.log('Reed provides UK job listings (may have some remote jobs).');
  console.log('Get your key from: https://www.reed.co.uk/developers');
  
  const reedApiKey = await question('Enter your Reed API key (or press Enter to skip): ');
  if (reedApiKey.trim()) {
    envContent = updateEnvVar(envContent, 'REED_API_KEY', reedApiKey.trim());
    console.log('✅ Reed API configured');
  } else {
    console.log('⏭️ Skipping Reed API setup');
  }

  // Other environment variables
  console.log('\n⚙️ Additional Configuration');
  
  const debugMode = await question('Enable debug mode? (y/N): ');
  if (debugMode.toLowerCase() === 'y') {
    envContent = updateEnvVar(envContent, 'DEBUG', 'true');
    console.log('✅ Debug mode enabled');
  }

  // Write the environment file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Environment file saved to .env.local');

  // Test the setup
  console.log('\n🧪 Testing API Configuration...');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    // Test API status
    const { unifiedJobService } = require('./lib/unified-job-service');
    const apiStatus = unifiedJobService.getApiStatus();
    
    console.log('\n📊 API Status:');
    console.log(`  SerpApi: ${apiStatus.serpApi ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Adzuna: ${apiStatus.adzuna ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Reed: ${apiStatus.reed ? '✅ Configured' : '❌ Not configured'}`);

    if (apiStatus.serpApi || apiStatus.adzuna || apiStatus.reed) {
      console.log('\n🎉 At least one API is configured! Your job portal should work.');
    } else {
      console.log('\n⚠️ No APIs are configured. The portal will use sample data only.');
    }

  } catch (error) {
    console.log('\n❌ Error testing configuration:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Visit: http://localhost:3000/jobs');
  console.log('3. Test the debug endpoint: http://localhost:3000/api/jobs/debug');
  console.log('4. If you need API keys, check the documentation in the project root');

  rl.close();
}

function updateEnvVar(content, key, value) {
  const lines = content.split('\n');
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }
  
  if (!found) {
    lines.push(`${key}=${value}`);
  }
  
  return lines.join('\n');
}

// Run the setup
setupJobAPIs().catch(console.error); 