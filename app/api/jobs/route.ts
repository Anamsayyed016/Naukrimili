import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';
import GoogleSearchService from '@/lib/google-search-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const result = await databaseService.getJobs(query, location, company, jobType, experienceLevel, isRemote, sector, page, limit);
    
    const total = (result as any).total ?? 0;
    const currentPage = (result as any).page ?? page;
    const currentLimit = (result as any).limit ?? limit;
    const totalPages = Math.ceil(total / currentLimit) || 0;

    // Prepare optional Google fallback when no results
    let fallback: any = undefined;
    if (!result.jobs || result.jobs.length === 0) {
      try {
        const googleSearch = new GoogleSearchService();
        const queryTerm = query || company || jobType || 'jobs';
        const locationTerm = location || country || 'India';
        const fallbackResult = await googleSearch.searchGoogleJobs({
          query: queryTerm,
          location: locationTerm,
          jobType: jobType || undefined,
          experienceLevel: experienceLevel || undefined,
          remote: isRemote || false,
        });
        if (fallbackResult.success) {
          fallback = {
            redirect_url: fallbackResult.searchUrl,
            platform: 'google',
            alternative_platforms: fallbackResult.alternativePlatforms,
            metadata: {
              searchQuery: queryTerm,
              location: locationTerm,
              timestamp: new Date().toISOString(),
            },
          };
        }
      } catch (e) {
        // Silently ignore fallback errors to avoid breaking primary response
      }
    }

    const res = NextResponse.json({
      success: true,
      jobs: result.jobs,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1
      },
      ...(fallback ? { fallback } : {})
    });
    // Cache list for 1 minute to improve responsiveness
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    return res;

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
