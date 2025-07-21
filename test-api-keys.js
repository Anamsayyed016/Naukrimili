console.log('🔧 Testing Job API Keys...');

// Test SerpAPI
async function testSerpAPI() {
    const SERPAPI_KEY = '4e28d11218306cbed8fce998a79a06c28c0d314029913b0aab19bc3e1dcb1ba6';
    
    try {
        const response = await fetch(`https://serpapi.com/search.json?engine=google_jobs&q=software%20developer&location=United%20Kingdom&api_key=${SERPAPI_KEY}&num=5`);
        const data = await response.json();
        
        if (data.error) {
            console.log('❌ SerpAPI Error:', data.error);
            return false;
        }
        
        console.log('✅ SerpAPI Working! Found', data.jobs_results?.length || 0, 'jobs');
        if (data.jobs_results && data.jobs_results.length > 0) {
            console.log('   Sample job:', data.jobs_results[0].title, 'at', data.jobs_results[0].company_name);
        }
        return true;
    } catch (error) {
        console.log('❌ SerpAPI Failed:', error.message);
        return false;
    }
}

// Test Adzuna API
async function testAdzunaAPI() {
    const ADZUNA_APP_ID = 'abf03277';
    const ADZUNA_API_KEY = 'd13e4cb39b24bf236ad29299';
    
    try {
        const response = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=software%20developer&results_per_page=5`);
        const data = await response.json();
        
        if (data.exception || data.error) {
            console.log('❌ Adzuna Error:', data.exception || data.error);
            return false;
        }
        
        console.log('✅ Adzuna Working! Found', data.results?.length || 0, 'jobs');
        if (data.results && data.results.length > 0) {
            console.log('   Sample job:', data.results[0].title, 'at', data.results[0].company.display_name);
        }
        return true;
    } catch (error) {
        console.log('❌ Adzuna Failed:', error.message);
        return false;
    }
}

// Test Reed API (Free tier might not work)
async function testReedAPI() {
    const REED_API_KEY = 'a8b9c0d1-e2f3-4567-8901-23456789abcd'; // This is a dummy key
    
    try {
        const auth = Buffer.from(REED_API_KEY + ':').toString('base64');
        const response = await fetch('https://www.reed.co.uk/api/1.0/search?keywords=software%20developer&resultsToTake=5', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'JobPortal/1.0'
            }
        });
        
        if (!response.ok) {
            console.log('❌ Reed API Error: HTTP', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('✅ Reed Working! Found', data.results?.length || 0, 'jobs');
        if (data.results && data.results.length > 0) {
            console.log('   Sample job:', data.results[0].jobTitle, 'at', data.results[0].employerName);
        }
        return true;
    } catch (error) {
        console.log('❌ Reed Failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('\n🧪 Running API Tests...\n');
    
    const results = await Promise.allSettled([
        testSerpAPI(),
        testAdzunaAPI(),
        testReedAPI()
    ]);
    
    const workingAPIs = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    
    console.log(`\n📊 Results: ${workingAPIs}/3 APIs working`);
    
    if (workingAPIs > 0) {
        console.log('✅ Job portal should work with available APIs!');
    } else {
        console.log('❌ No APIs working. Check your API keys.');
    }
}

runTests();
