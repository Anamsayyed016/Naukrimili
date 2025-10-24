/**
 * Job Scraping API Endpoint
 * Triggers enhanced job scraping from multiple sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { jobScraper } from '@/lib/jobs/enhanced-scraper';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const {
      query = 'software developer',
      countries = ['IN', 'US', 'GB', 'AE'],
      maxJobsPerSource = 200,
      enableDeduplication = true,
      sources = ['adzuna', 'jsearch', 'reed']
    } = body;

    console.log(`🚀 Starting job scraping with query: "${query}"`);
    console.log(`🌍 Countries: ${countries.join(', ')}`);
    console.log(`📊 Max jobs per source: ${maxJobsPerSource}`);

    // Configure scraper
    const scraper = jobScraper;
    scraper['config'] = {
      ...scraper['config'],
      maxJobsPerSource,
      enableDeduplication,
      sources: scraper['config'].sources.map(source => ({
        ...source,
        enabled: sources.includes(source.name)
      }))
    };

    // Start scraping
    const results = await scraper.scrapeAllSources(query, countries);

    // Calculate totals
    const totalJobs = results.reduce((sum, r) => sum + r.jobsAdded, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicatesSkipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    // Get updated statistics
    const stats = await scraper.getScrapingStats();

    console.log(`✅ Scraping completed: ${totalJobs} jobs added, ${totalDuplicates} duplicates skipped`);

    return NextResponse.json({
      success: true,
      message: 'Job scraping completed successfully',
      results: {
        totalJobs,
        totalDuplicates,
        totalErrors,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        sources: results
      },
      stats,
      config: {
        query,
        countries,
        maxJobsPerSource,
        enableDeduplication,
        sources
      }
    });

  } catch (error) {
    console.error('❌ Job scraping failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Job scraping failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get scraping statistics
    const stats = await jobScraper.getScrapingStats();

    return NextResponse.json({
      success: true,
      stats,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get scraping stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scraping statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
