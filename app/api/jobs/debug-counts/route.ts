/**
 * Debug API to check job counts and limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optimizedJobSearch } from '@/lib/jobs/optimized-search';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debug job counts API called');
    
    // Get database statistics
    const [
      totalJobs,
      activeJobs,
      externalJobs,
      sampleJobs,
      manualJobs
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { source: { not: 'manual' } } }),
      prisma.job.count({ where: { source: 'sample' } }),
      prisma.job.count({ where: { source: 'manual' } })
    ]);

    // Test optimized search with different limits
    const testLimits = [20, 50, 100, 200];
    const searchResults = [];

    for (const limit of testLimits) {
      try {
        const result = await optimizedJobSearch.search({
          query: '',
          location: '',
          country: 'IN',
          limit,
          includeExternal: true,
          includeDatabase: true,
          includeSample: true
        });

        searchResults.push({
          limit,
          totalJobs: result.totalJobs,
          jobsReturned: result.jobs.length,
          hasMore: result.hasMore,
          sources: result.sources
        });
      } catch (_error) {
        searchResults.push({
          limit,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const debugInfo = {
      database: {
        totalJobs,
        activeJobs,
        externalJobs,
        sampleJobs,
        manualJobs,
        inactiveJobs: totalJobs - activeJobs
      },
      searchResults,
      limits: {
        currentClientLimit: 100,
        currentApiLimit: 200,
        currentDbLimit: 500,
        currentExternalLimit: 100,
        currentSampleLimit: 50
      },
      recommendations: [
        totalJobs < 100 ? '⚠️ Low job count in database - consider seeding more jobs' : '✅ Good job count in database',
        activeJobs < 50 ? '⚠️ Low active jobs - check isActive field' : '✅ Good active job count',
        externalJobs < 20 ? '⚠️ Low external jobs - check API keys' : '✅ Good external job count',
        '✅ All limits increased for unlimited search'
      ]
    };

    return NextResponse.json({
      success: true,
      message: 'Job counts debug completed',
      data: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Debug job counts failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Debug job counts failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}
