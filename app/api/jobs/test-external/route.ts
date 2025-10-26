import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, checkJobProvidersHealth } from '@/lib/jobs/providers';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing external job providers...');
    
    // Check environment variables
    const envCheck = {
      ADZUNA_APP_ID: !!process.env.ADZUNA_APP_ID,
      ADZUNA_APP_KEY: !!process.env.ADZUNA_APP_KEY,
      RAPIDAPI_KEY: !!process.env.RAPIDAPI_KEY,
      GOOGLE_SEARCH_API_KEY: !!process.env.GOOGLE_SEARCH_API_KEY,
    };

    console.log('🔑 Environment variables check:', envCheck);

    // Test each provider individually
    const results: any = {
      environment: envCheck,
      providers: {}
    };

    // Test Adzuna
    try {
      console.log('🔍 Testing Adzuna API...');
      const adzunaJobs = await fetchFromAdzuna('software engineer', 'in', 1);
      results.providers.adzuna = {
        status: 'success',
        jobsCount: adzunaJobs.length,
        sampleJob: adzunaJobs[0] || null,
        error: null
      };
      console.log(`✅ Adzuna: Found ${adzunaJobs.length} jobs`);
    } catch (error: any) {
      results.providers.adzuna = {
        status: 'error',
        jobsCount: 0,
        sampleJob: null,
        error: error.message
      };
      console.error('❌ Adzuna error:', error.message);
    }

    // Test JSearch
    try {
      console.log('🔍 Testing JSearch API...');
      const jsearchJobs = await fetchFromJSearch('software engineer', 'IN', 1);
      results.providers.jsearch = {
        status: 'success',
        jobsCount: jsearchJobs.length,
        sampleJob: jsearchJobs[0] || null,
        error: null
      };
      console.log(`✅ JSearch: Found ${jsearchJobs.length} jobs`);
    } catch (error: any) {
      results.providers.jsearch = {
        status: 'error',
        jobsCount: 0,
        sampleJob: null,
        error: error.message
      };
      console.error('❌ JSearch error:', error.message);
    }

    // Test Google Jobs
    try {
      console.log('🔍 Testing Google Jobs API...');
      const googleJobs = await fetchFromGoogleJobs('software engineer', 'India', 1);
      results.providers.googleJobs = {
        status: 'success',
        jobsCount: googleJobs.length,
        sampleJob: googleJobs[0] || null,
        error: null
      };
      console.log(`✅ Google Jobs: Found ${googleJobs.length} jobs`);
    } catch (error: any) {
      results.providers.googleJobs = {
        status: 'error',
        jobsCount: 0,
        sampleJob: null,
        error: error.message
      };
      console.error('❌ Google Jobs error:', error.message);
    }

    // Health check
    try {
      console.log('🔍 Running health check...');
      const health = await checkJobProvidersHealth();
      results.health = health;
    } catch (error: any) {
      results.health = { error: error.message };
    }

    return NextResponse.json({
      success: true,
      message: 'External providers test completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 External providers test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}







