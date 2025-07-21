#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function makeRequest(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getFreeAPIKeys() {
  console.log('🚀 Getting Real Job Data - Free API Keys Setup\n');
  
  console.log('📋 Available Free APIs:');
  console.log('1. SerpApi (Google Jobs) - 100 free searches/month');
  console.log('2. Adzuna - 1000 free calls/month');
  console.log('3. Reed - Free UK jobs');
  console.log('');

  const choice = await question('Which API would you like to set up? (1/2/3): ');
  
  switch(choice.trim()) {
    case '1':
      await setupSerpApi();
      break;
    case '2':
      await setupAdzuna();
      break;
    case '3':
      await setupReed();
      break;
    default:
      console.log('❌ Invalid choice. Please run the script again.');
  }
  
  rl.close();
}

async function setupSerpApi() {
  console.log('\n🔍 Setting up SerpApi (Google Jobs)...');
  console.log('\n📝 Steps to get your free API key:');
  console.log('1. Go to: https://serpapi.com/');
  console.log('2. Click "Sign Up" or "Get Started"');
  console.log('3. Create a free account');
  console.log('4. Go to your dashboard');
  console.log('5. Copy your API key');
  console.log('');
  
  const apiKey = await question('Enter your SerpApi key: ');
  
  if (apiKey.trim()) {
    // Update .env.local file
    let envContent = '';
    try {
      envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
      // File doesn't exist, create new content
    }
    
    // Remove existing SERPAPI_KEY if present
    const lines = envContent.split('\n').filter(line => !line.startsWith('SERPAPI_KEY='));
    lines.push(`SERPAPI_KEY=${apiKey.trim()}`);
    
    fs.writeFileSync('.env.local', lines.join('\n'));
    console.log('✅ SerpApi key saved to .env.local');
    
    // Test the API
    await testSerpApi(apiKey.trim());
  } else {
    console.log('❌ No API key provided');
  }
}

async function setupAdzuna() {
  console.log('\n🔍 Setting up Adzuna...');
  console.log('\n📝 Steps to get your free API keys:');
  console.log('1. Go to: https://developer.adzuna.com/');
  console.log('2. Click "Sign Up"');
  console.log('3. Create a free account');
  console.log('4. Go to "My Apps"');
  console.log('5. Create a new application');
  console.log('6. Copy your App ID and API Key');
  console.log('');
  
  const appId = await question('Enter your Adzuna App ID: ');
  const apiKey = await question('Enter your Adzuna API Key: ');
  
  if (appId.trim() && apiKey.trim()) {
    // Update .env.local file
    let envContent = '';
    try {
      envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
      // File doesn't exist, create new content
    }
    
    // Remove existing Adzuna keys if present
    const lines = envContent.split('\n').filter(line => 
      !line.startsWith('ADZUNA_APP_ID=') && !line.startsWith('ADZUNA_API_KEY=')
    );
    lines.push(`ADZUNA_APP_ID=${appId.trim()}`);
    lines.push(`ADZUNA_API_KEY=${apiKey.trim()}`);
    
    fs.writeFileSync('.env.local', lines.join('\n'));
    console.log('✅ Adzuna keys saved to .env.local');
    
    // Test the API
    await testAdzuna(appId.trim(), apiKey.trim());
  } else {
    console.log('❌ Missing App ID or API Key');
  }
}

async function setupReed() {
  console.log('\n🔍 Setting up Reed API...');
  console.log('\n📝 Steps to get your free API key:');
  console.log('1. Go to: https://www.reed.co.uk/developers');
  console.log('2. Click "Get Started"');
  console.log('3. Create a free account');
  console.log('4. Go to your dashboard');
  console.log('5. Copy your API key');
  console.log('');
  
  const apiKey = await question('Enter your Reed API key: ');
  
  if (apiKey.trim()) {
    // Update .env.local file
    let envContent = '';
    try {
      envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
      // File doesn't exist, create new content
    }
    
    // Remove existing REED_API_KEY if present
    const lines = envContent.split('\n').filter(line => !line.startsWith('REED_API_KEY='));
    lines.push(`REED_API_KEY=${apiKey.trim()}`);
    
    fs.writeFileSync('.env.local', lines.join('\n'));
    console.log('✅ Reed API key saved to .env.local');
    
    // Test the API
    await testReed(apiKey.trim());
  } else {
    console.log('❌ No API key provided');
  }
}

async function testSerpApi(apiKey) {
  console.log('\n🧪 Testing SerpApi...');
  
  try {
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=software+engineer&location=India&api_key=${apiKey}&num=3`;
    const result = await makeRequest(url, 20000);
    
    if (result.status === 200 && result.data.jobs) {
      console.log('✅ SerpApi is working!');
      console.log(`📋 Found ${result.data.jobs.length} jobs`);
      if (result.data.jobs.length > 0) {
        console.log('📝 Sample job:', result.data.jobs[0].title);
      }
    } else {
      console.log('❌ SerpApi test failed');
      if (result.data.error) {
        console.log('   Error:', result.data.error);
      }
    }
  } catch (error) {
    console.log('❌ SerpApi test failed:', error.message);
  }
}

async function testAdzuna(appId, apiKey) {
  console.log('\n🧪 Testing Adzuna...');
  
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=3&what=software+engineer`;
    const result = await makeRequest(url, 15000);
    
    if (result.status === 200 && result.data.results) {
      console.log('✅ Adzuna is working!');
      console.log(`📋 Found ${result.data.results.length} jobs`);
      if (result.data.results.length > 0) {
        console.log('📝 Sample job:', result.data.results[0].title);
      }
    } else {
      console.log('❌ Adzuna test failed');
      if (result.data.error) {
        console.log('   Error:', result.data.error);
      }
    }
  } catch (error) {
    console.log('❌ Adzuna test failed:', error.message);
  }
}

async function testReed(apiKey) {
  console.log('\n🧪 Testing Reed API...');
  
  try {
    const url = `https://www.reed.co.uk/api/1.0/search?keywords=software+engineer&locationName=London&distanceFromLocation=10&resultsToTake=3`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    
    const result = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'JobPortal/1.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    if (result.status === 200 && result.data.results) {
      console.log('✅ Reed API is working!');
      console.log(`📋 Found ${result.data.results.length} jobs`);
      if (result.data.results.length > 0) {
        console.log('📝 Sample job:', result.data.results[0].jobTitle);
      }
    } else {
      console.log('❌ Reed API test failed');
      if (result.data.error) {
        console.log('   Error:', result.data.error);
      }
    }
  } catch (error) {
    console.log('❌ Reed API test failed:', error.message);
  }
}

async function testJobPortal() {
  console.log('\n🌐 Testing your job portal...');
  
  try {
    const result = await makeRequest('http://localhost:3000/api/jobs?q=software+engineer&location=Mumbai&limit=5', 15000);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Job portal is working!');
      console.log(`📋 Jobs found: ${result.data.total}`);
      console.log(`🎯 Source: ${result.data.meta?.source || 'Unknown'}`);
      
      if (result.data.jobs.length > 0) {
        console.log('📝 Sample job:', result.data.jobs[0].title, 'at', result.data.jobs[0].company);
      }
      
      console.log('\n🎉 Your job portal is ready!');
      console.log('🌐 Visit: http://localhost:3000/jobs');
    } else {
      console.log('❌ Job portal test failed');
      if (result.data.error) {
        console.log('   Error:', result.data.error);
      }
    }
  } catch (error) {
    console.log('❌ Job portal test failed:', error.message);
    console.log('   Make sure your development server is running: npm run dev');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testJobPortal();
  } else {
    await getFreeAPIKeys();
  }
}

main().catch(console.error); 