/**
 * Test API to debug connection issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    const jobCount = await prisma.job.count();
    console.log(`✅ Database connected. Job count: ${jobCount}`);
    
    // Test external providers
    const { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } = await import('@/lib/jobs/providers');
    
    console.log('🔍 Testing external providers...');
    
    // Test each provider
    const providerTests = {
      adzuna: false,
      jsearch: false,
      google: false,
      jooble: false
    };
    
    try {
      const adzunaJobs = await fetchFromAdzuna('software engineer', 'IN', 1);
      providerTests.adzuna = Array.isArray(adzunaJobs);
      console.log(`✅ Adzuna: ${adzunaJobs.length} jobs`);
    } catch (_error) {
      console.error('❌ Adzuna failed:', error);
    }
    
    try {
      const jsearchJobs = await fetchFromJSearch('software engineer', 'IN', 1);
      providerTests.jsearch = Array.isArray(jsearchJobs);
      console.log(`✅ JSearch: ${jsearchJobs.length} jobs`);
    } catch (_error) {
      console.error('❌ JSearch failed:', error);
    }
    
    try {
      const googleJobs = await fetchFromGoogleJobs('software engineer', 'IN', 1);
      providerTests.google = Array.isArray(googleJobs);
      console.log(`✅ Google Jobs: ${googleJobs.length} jobs`);
    } catch (_error) {
      console.error('❌ Google Jobs failed:', error);
    }
    
    try {
      const joobleJobs = await fetchFromJooble('software engineer', 'IN', 1);
      providerTests.jooble = Array.isArray(joobleJobs);
      console.log(`✅ Jooble: ${joobleJobs.length} jobs`);
    } catch (_error) {
      console.error('❌ Jooble failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection test completed',
      database: {
        connected: true,
        jobCount
      },
      providers: providerTests,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAdzunaKey: !!process.env.ADZUNA_APP_ID,
        hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
        hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
        hasJoobleApiKey: !!process.env.JOOBLE_API_KEY
      }
    });
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
