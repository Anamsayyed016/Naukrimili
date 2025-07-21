console.log('🚀 Final Job Portal API Test & Fix');
console.log('====================================\n');

// Test if our improved API is working
async function testJobPortalAPI() {
    const BASE_URL = 'http://localhost:3000';
    
    try {
        console.log('1️⃣ Testing basic jobs endpoint...');
        const response = await fetch(`${BASE_URL}/api/jobs?q=software%20developer&location=London`);
        
        if (!response.ok) {
            console.log('❌ API endpoint not responding. Server might not be running.');
            return false;
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
        console.log('📊 Response structure:', {
            success: data.success,
            totalJobs: data.jobs?.length || 0,
            totalCount: data.totalCount,
            hasMockData: data.jobs?.[0]?.source === 'Demo Data',
            hasSerpAPIData: data.jobs?.some(j => j.source === 'Google Jobs'),
            sectors: data.sectors?.length || 0
        });
        
        if (data.jobs && data.jobs.length > 0) {
            console.log('\n📋 Sample jobs found:');
            data.jobs.slice(0, 3).forEach((job, i) => {
                console.log(`   ${i+1}. "${job.title}" at ${job.company} (${job.source})`);
                console.log(`      💰 ${job.salary || 'Salary not specified'}`);
                console.log(`      📍 ${job.location}`);
                console.log('');
            });
            
            return true;
        } else {
            console.log('⚠️ No jobs returned in response');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running. Start it with: npm run dev');
        }
        return false;
    }
}

// Test SerpAPI directly
async function testSerpAPIDirect() {
    console.log('\n2️⃣ Testing SerpAPI directly...');
    const SERPAPI_KEY = '4e28d11218306cbed8fce998a79a06c28c0d314029913b0aab19bc3e1dcb1ba6';
    
    try {
        const response = await fetch(
            `https://serpapi.com/search.json?engine=google_jobs&q=software%20developer&location=London,%20UK&api_key=${SERPAPI_KEY}&num=5`
        );
        
        const data = await response.json();
        
        if (data.error) {
            console.log('❌ SerpAPI Error:', data.error);
            return false;
        }
        
        console.log('✅ SerpAPI working! Found', data.jobs_results?.length || 0, 'jobs');
        
        if (data.jobs_results && data.jobs_results.length > 0) {
            console.log('📋 Real job sample:');
            const job = data.jobs_results[0];
            console.log(`   • "${job.title}" at ${job.company_name}`);
            console.log(`   • Location: ${job.location}`);
            console.log(`   • Salary: ${job.salary || 'Not specified'}`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ SerpAPI test failed:', error.message);
        return false;
    }
}

async function runFinalTest() {
    const apiWorking = await testJobPortalAPI();
    const serpApiWorking = await testSerpAPIDirect();
    
    console.log('\n🎯 FINAL STATUS:');
    console.log('================');
    console.log('Job Portal API:', apiWorking ? '✅ WORKING' : '❌ NEEDS FIXING');
    console.log('SerpAPI Integration:', serpApiWorking ? '✅ WORKING' : '❌ NEEDS FIXING');
    
    if (apiWorking) {
        console.log('\n🎉 SUCCESS! Your job portal is working!');
        console.log('🌐 Visit: http://localhost:3000/jobs');
        console.log('📡 API: http://localhost:3000/api/jobs?q=developer');
    } else if (serpApiWorking) {
        console.log('\n⚠️ SerpAPI works but portal needs server restart');
        console.log('🔧 Run: npm run dev');
    } else {
        console.log('\n❌ Both API and SerpAPI have issues');
        console.log('🔧 Check your environment variables and server status');
    }
}

runFinalTest();
