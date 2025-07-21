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

async function getFreeAPIKeys() {
  console.log('🔑 Getting Free API Keys for Job Portal\n');
  
  // Read existing .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  console.log('📋 Step-by-step guide to get FREE API keys:\n');

  // Adzuna Setup
  console.log('💰 ADZUNA API (FREE - 1000 calls/month)');
  console.log('1. Go to: https://developer.adzuna.com/');
  console.log('2. Click "Sign Up" and create a free account');
  console.log('3. Create a new application');
  console.log('4. Copy your App ID and API Key\n');

  const adzunaAppId = await question('Enter your Adzuna App ID (or press Enter to skip): ');
  if (adzunaAppId.trim()) {
    envContent = updateEnvVar(envContent, 'ADZUNA_APP_ID', adzunaAppId.trim());
    
    const adzunaApiKey = await question('Enter your Adzuna API Key: ');
    if (adzunaApiKey.trim()) {
      envContent = updateEnvVar(envContent, 'ADZUNA_API_KEY', adzunaApiKey.trim());
      console.log('✅ Adzuna API configured!');
    }
  } else {
    console.log('⏭️ Skipping Adzuna API');
  }

  // Reed Setup
  console.log('\n🇬🇧 REED API (FREE - UK jobs)');
  console.log('1. Go to: https://www.reed.co.uk/developers');
  console.log('2. Click "Sign Up" and create a free account');
  console.log('3. Create a new application');
  console.log('4. Copy your API Key\n');

  const reedApiKey = await question('Enter your Reed API key (or press Enter to skip): ');
  if (reedApiKey.trim()) {
    envContent = updateEnvVar(envContent, 'REED_API_KEY', reedApiKey.trim());
    console.log('✅ Reed API configured!');
  } else {
    console.log('⏭️ Skipping Reed API');
  }

  // Add debug mode
  envContent = updateEnvVar(envContent, 'DEBUG', 'true');

  // Write the environment file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Environment file updated!');

  // Test the configuration
  console.log('\n🧪 Testing configuration...');
  
  try {
    require('dotenv').config({ path: envPath });
    
    const { unifiedJobService } = require('./lib/unified-job-service');
    const apiStatus = unifiedJobService.getApiStatus();
    
    console.log('\n📊 API Status:');
    console.log(`  SerpApi: ${apiStatus.serpApi ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Adzuna: ${apiStatus.adzuna ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Reed: ${apiStatus.reed ? '✅ Configured' : '❌ Not configured'}`);

    const configuredAPIs = [apiStatus.serpApi, apiStatus.adzuna, apiStatus.reed].filter(Boolean).length;
    console.log(`\n🎉 ${configuredAPIs} out of 3 APIs configured!`);

    if (configuredAPIs > 0) {
      console.log('🚀 Your job portal is ready to use!');
    } else {
      console.log('⚠️ No APIs configured. Will use sample data only.');
    }

  } catch (error) {
    console.log('\n❌ Error testing configuration:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Visit: http://localhost:3000/jobs');
  console.log('3. Test: http://localhost:3000/api/jobs/debug');
  console.log('4. Try searching for jobs in different locations!');

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

// Run the script
getFreeAPIKeys().catch(console.error); 