const https = require('https');
const http = require('http');

function makeRequest(url, timeout = 10000) {
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

async function checkStatus() {
  console.log('🔍 Quick Status Check\n');
  
  try {
    const result = await makeRequest('http://localhost:3000/api/jobs/debug', 5000);
    
    if (result.status === 200) {
      console.log('✅ Server is running');
      console.log('📊 API Status:', result.data.apiStatus);
      console.log('🔧 Environment:', result.data.environment);
      
      if (result.data.environment.SERPAPI_KEY) {
        console.log('✅ SerpApi key is configured');
      } else {
        console.log('❌ SerpApi key is missing');
      }
      
      console.log('\n🚀 To get real job data, run:');
      console.log('   node get-real-job-data.js');
      
    } else {
      console.log('❌ Server responded with status:', result.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('   Make sure to run: npm run dev');
  }
}

checkStatus(); 