'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedJobCard from '@/components/EnhancedJobCard';
import { Job } from '@/types/job';
import EnhancedPagination from '@/components/ui/enhanced-pagination';
import { getCountriesToFetch } from '@/lib/utils/country-detection';
import { formatJobSalary } from '@/lib/currency-utils';

// Using Job interface from types/job.d.ts

interface OptimizedJobsClientProps {
  initialJobs: any[];
}

export default function OptimizedJobsClient({ initialJobs }: OptimizedJobsClientProps) {
  // Targeted countries for fresh, real jobs
  const TARGET_COUNTRIES = ['US', 'IN', 'GB', 'AE'];
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Optional performance metrics (removed to satisfy linter when unused)

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());


  const searchParams = useSearchParams();

  // Fetch jobs from DB-first API (fast, complete), with unified as optional fallback
  const fetchJobs = React.useCallback(async (
    query: string = '', 
    location: string = '', 
    page: number = 1, 
    filters: {
      jobType?: string;
      experienceLevel?: string;
      isRemote?: boolean;
      salaryMin?: string;
      salaryMax?: string;
      sector?: string;
      country?: string;
      limit?: string; // Add limit to filters
    } = {}
  ) => {
    // Smart country detection using the country detection utility
    const countriesToFetch = getCountriesToFetch({ location, country: filters.country || null });
    const inferredCountry = (location ? countriesToFetch[0]?.code : undefined);
    const explicitCountry = (filters.country || '').toUpperCase() || undefined;
    const countryToUse = explicitCountry || inferredCountry; // only set when explicitly chosen or inferred from a provided location
    console.log('🌍 Country detection:', { location, countriesToFetch, explicitCountry, inferredCountry, countryToUse });

    try {
      setLoading(true);
      setError(null);

      console.log('⚡ Fetching optimized jobs with query:', query, 'location:', location, 'page:', page);

      // DB-first parameters (do not over-restrict by country; widen recency)
      const dbParams = new URLSearchParams({
        ...(query && { query }),
        ...(location && { location }),
        ...(countryToUse ? { country: countryToUse } : {}),
        page: page.toString(),
        limit: filters.limit || '200', // Use limit from filters or default to 200
        view: 'list', // ask API for lightweight list payload
        // Do not constrain by recency unless user specifies via URL; align with admin totals
        // Add all filter parameters from home page search
        ...(filters.jobType && { jobType: filters.jobType }),
        ...(filters.experienceLevel && { experienceLevel: filters.experienceLevel }),
        ...(filters.isRemote && { isRemote: 'true' }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax }),
        ...(filters.sector && { sector: filters.sector })
      });

      const startTime = Date.now();
      let response;
      let apiUsed = 'db';

      // 1) Prefer database API for complete, paginated results, with external jobs included
      // Add includeExternal and includeDatabase to get total count including external sources
      const enhancedParams = new URLSearchParams(dbParams);
      enhancedParams.set('includeExternal', 'true');
      enhancedParams.set('includeDatabase', 'true');
      
      response = await fetch(`/api/jobs/unlimited?${enhancedParams.toString()}`);
      if (!response.ok) {
        // Fallback to regular API if unlimited fails
        response = await fetch(`/api/jobs?${dbParams.toString()}`);
        if (!response.ok) {
          throw new Error(`DB API failed: ${response.status} ${response.statusText}`);
        }
      }

      const responseTime = Date.now() - startTime;

      const data = await response.json();

      // CRITICAL DEBUG: Log the exact API response
      console.log('🔍 RAW API RESPONSE:', {
        success: data.success,
        jobsCount: (data.jobs || data.data?.jobs || []).length,
        pagination: data.pagination || data.data?.pagination,
        firstJob: (data.jobs || data.data?.jobs || [])[0]
      });

      // Unlimited API shape: { success, jobs, pagination: { totalJobs, totalPages } }
      // DB API shape: { success, data: { jobs, pagination } }
      if (data.success) {
        const jobsData = data.jobs || data.data?.jobs || [];
        
        // CRITICAL DEBUG: Check sourceId preservation
        console.log('🔍 FIRST 3 JOBS BEFORE CONVERSION:', jobsData.slice(0, 3).map((j: any) => ({
          id: j.id,
          sourceId: j.sourceId,
          source: j.source,
          title: j.title?.substring(0, 30)
        })));
        
        const jobs = jobsData.map(convertToSimpleJob).filter(Boolean); // Filter out null entries from jobs without IDs
        
        // CRITICAL DEBUG: Check after conversion
        console.log('🔍 FIRST 3 JOBS AFTER CONVERSION:', jobs.slice(0, 3).map((j: any) => ({
          id: j.id,
          sourceId: j.sourceId,
          source: j.source,
          title: j.title?.substring(0, 30)
        })));
        
        // Get total from pagination - unlimited API uses totalJobs, DB API uses total
        const totalCount = data.pagination?.totalJobs || data.data?.pagination?.total || jobs.length;
        const totalPagesCount = data.pagination?.totalPages || data.data?.pagination?.totalPages || 1;
        
        console.log('🔍 PAGINATION DEBUG:', {
          totalCount,
          totalPagesCount,
          paginationObject: data.pagination || data.data?.pagination
        });
        
        setJobs(jobs as any);
        setTotalJobs(totalCount);
        setTotalPages(totalPagesCount);
        setHasNextPage(page < totalPagesCount);
        setHasPrevPage(page > 1);

        // Optionally track performance via analytics (not stored in state to avoid lint)

        // Update last refresh time
        setLastRefresh(new Date());

        console.log('✅ Main API jobs loaded successfully:', {
          jobsCount: (jobs || []).length,
          totalJobs: totalCount,
          currentPage: page,
          totalPages: totalPagesCount,
          hasMore: page < totalPagesCount,
          sources: data.sources || data.data?.sources,
          realJobsPercentage: data.metadata?.realJobsPercentage || data.data?.metadata?.realJobsPercentage || 0,
          performance: data.metadata?.performance || data.data?.metadata?.performance
        });
        
        console.log('🔍 Pagination Debug:', {
          totalJobs: totalCount,
          totalPages: totalPagesCount,
          hasMore: page < totalPagesCount,
          currentPage: page,
          limit: 200,
          shouldShowPagination: totalPagesCount > 1 || page < totalPagesCount || totalCount > 200
        });

      } else if (data.success && Array.isArray(data.jobs)) {
        // Some APIs may still return jobs directly
        const jobs = (data.jobs || []).map(convertToSimpleJob).filter(Boolean); // Filter out null entries
        setJobs(jobs as any);
        setTotalJobs(data.pagination?.total || jobs.length);
        setTotalPages(data.pagination?.totalPages || 1);
        setHasNextPage(page < (data.pagination?.totalPages || 1));
        setHasPrevPage(page > 1);
        // Optionally track performance via analytics (not stored in state to avoid lint)
        setLastRefresh(new Date());

      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

    } catch (_error) {
      console.error('❌ Error fetching jobs from API:', _error);
      
      // Primary DB call failed: try unified aggregator fallback (fresh + external)
      setJobs([]);
      setTotalJobs(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPrevPage(false);
      setError('Failed to load jobs. Please check your connection and try again.');
      
      // Fallback to unified API (multi-country + external)
      try {
        console.log('🔄 Trying fallback to unified API...');
        const fallbackParams = new URLSearchParams({
          ...(query && { query }),
          ...(location && { location }),
          ...(countryToUse ? { countries: countryToUse } : { countries: TARGET_COUNTRIES.join(',') }),
          page: page.toString(),
          limit: '200',
          view: 'list',
          // do not force recency here either
          includeExternal: 'true',
          includeSamples: 'false'
        });
        const fallbackResponse = await fetch(`/api/jobs/unified?${fallbackParams.toString()}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackJobs = ((fallbackData.data?.jobs ?? fallbackData.jobs) || []).map(convertToSimpleJob).filter(Boolean); // Filter out null entries
          
          setJobs(fallbackJobs as any);
          const fp = fallbackData.data?.pagination || fallbackData.pagination;
          setTotalJobs(fp?.total || (fallbackJobs || []).length);
          setTotalPages(fp?.totalPages || 1);
          setHasNextPage(page < (fp?.totalPages || 1));
          setHasPrevPage(page > 1);
          
          console.log('✅ Fallback successful:', fallbackJobs.length, 'jobs loaded');
          return;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      setError('Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since fetchJobs doesn't depend on any external values

  // Initialize with search params and load jobs
  useEffect(() => {
    const query = searchParams.get('query') || searchParams.get('q') || ''; // Support both parameter names
    const loc = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true' || searchParams.get('remote') === 'true'; // Support both
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const sector = searchParams.get('sector') || '';
    const countryParam = (searchParams.get('country') || '').toUpperCase();
    const limitParam = searchParams.get('limit') || '200'; // Read limit from URL, default 200

    console.log('⚡ OptimizedJobsClient initializing with params:', { 
      query, loc, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector, countryParam, limitParam,
      allParams: Object.fromEntries(searchParams.entries()) // Debug: show all params
    });

    // Reset pagination when search params change
    setCurrentPage(1);
    
    // Always fetch jobs using unlimited API with all filters (pass limit to fetchJobs)
    fetchJobs(query, loc, 1, {
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector,
      country: countryParam || undefined,
      limit: limitParam // Pass limit to fetch function
    });
  }, [searchParams]); // Removed fetchJobs from dependencies to prevent infinite loop

  // Periodic refresh disabled to prevent constant loading and improve performance
  // Users can manually refresh using the refresh button if needed
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const query = searchParams.get('q') || searchParams.get('query') || '';
  //     const loc = searchParams.get('location') || '';
  //     const jobType = searchParams.get('jobType') || '';
  //     const experienceLevel = searchParams.get('experienceLevel') || '';
  //     const isRemote = searchParams.get('isRemote') === 'true';
  //     const salaryMin = searchParams.get('salaryMin') || '';
  //     const salaryMax = searchParams.get('salaryMax') || '';
  //     const sector = searchParams.get('sector') || '';
  //     
  //     console.log('🔄 Refreshing jobs to show newly posted jobs...');
  //     fetchJobs(query, loc, currentPage, {
  //       jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
  //     });
  //   }, 30000); // Refresh every 30 seconds
  //
  //   return () => clearInterval(interval);
  // }, [searchParams]);

  // Convert any job format to simple Job format
  function convertToSimpleJob(job: any): Job {
    // CRITICAL: Validate job has an ID (either id or sourceId)
    const jobId = job.id || job.sourceId;
    if (!jobId) {
      console.error('❌ Job missing ID and sourceId, skipping:', { title: job.title, company: job.company, source: job.source });
      return null as any; // Will be filtered out
    }
    
    // CRITICAL DEBUG: Log what we're converting
    if (Math.random() < 0.05) { // Log 5% of jobs to avoid spam
      console.log('🔄 Converting job:', {
        originalId: job.id,
        originalSourceId: job.sourceId,
        finalId: jobId,
        source: job.source,
        title: job.title?.substring(0, 30)
      });
    }

    // Format salary consistently using country-aware currency
    const salaryFormatted = formatJobSalary({
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      country: job.country
    });

    return {
      id: jobId,
      sourceId: job.sourceId, // CRITICAL: Preserve sourceId for external jobs
      title: job.title || 'Job Title',
      company: job.company || job.companyRelation?.name || 'Company',
      location: job.location || 'Location',
      description: job.description || 'Job description not available',
      salary: salaryFormatted,
      salary_formatted: salaryFormatted, // Add this for consistency
      postedAt: job.postedAt || job.createdAt || job.created_at,
      source_url: job.source_url || job.redirect_url || job.applyUrl,
      source: job.source || (job.isExternal ? 'external' : 'database'), // CRITICAL for URL generation
      is_remote: job.is_remote || job.isRemote,
      is_featured: job.is_featured || job.isFeatured,
      // Add missing fields for better job display
      jobType: job.jobType || 'Full-time',
      experienceLevel: job.experienceLevel || 'Mid Level',
      sector: job.sector, // CRITICAL for SEO URL
      country: job.country, // CRITICAL for region validation
      skills: job.skills || [],
      isExternal: job.isExternal || job.source !== 'manual',
      applyUrl: job.applyUrl || job.source_url || job.redirect_url,
      // Required fields for JobResult
      time_ago: 'Recently',
      redirect_url: job.source_url || job.redirect_url || job.applyUrl || '#'
    } as any;
  }


  // Handle pagination
  const handlePageChange = (page: number) => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const sector = searchParams.get('sector') || '';
    const countryParam = (searchParams.get('country') || '').toUpperCase();
    
    // Scroll to top smoothly when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setCurrentPage(page);
    fetchJobs(query, location, page, {
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector,
      country: countryParam || undefined
    });
  };

  // Handle bookmark toggle
  const toggleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">

      {/* Loading State */}
      {loading && (jobs || []).length === 0 && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Loading optimized jobs...</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Searching across all sectors and countries</p>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={() => {
              const query = searchParams.get('q') || searchParams.get('query') || '';
              const location = searchParams.get('location') || '';
              fetchJobs(query, location, currentPage);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search Results Header with Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {totalJobs > 0 ? `${totalJobs} Jobs Found` : 'No Jobs Found'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {searchParams.get('q') && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.get('q')}
                </span>
              )}
              {searchParams.get('location') && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {searchParams.get('location')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            ← Back to Search
          </button>
        </div>

        {/* Quick Filters */}
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('jobType', url.searchParams.get('jobType') === 'full-time' ? '' : 'full-time');
                window.location.href = url.toString();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                searchParams.get('jobType') === 'full-time' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Full-time
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('isRemote', url.searchParams.get('isRemote') === 'true' ? '' : 'true');
                window.location.href = url.toString();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                searchParams.get('isRemote') === 'true' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Remote
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('experienceLevel', url.searchParams.get('experienceLevel') === 'senior' ? '' : 'senior');
                window.location.href = url.toString();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                searchParams.get('experienceLevel') === 'senior' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Senior Level
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('jobType');
                url.searchParams.delete('isRemote');
                url.searchParams.delete('experienceLevel');
                url.searchParams.delete('salaryMin');
                url.searchParams.delete('salaryMax');
                window.location.href = url.toString();
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {!loading && !error && (jobs || []).length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle and Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 whitespace-nowrap">View:</span>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                  viewMode === 'compact' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Compact
              </button>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => {
                  const query = searchParams.get('q') || searchParams.get('query') || '';
                  const location = searchParams.get('location') || '';
                  const jobType = searchParams.get('jobType') || '';
                  const experienceLevel = searchParams.get('experienceLevel') || '';
                  const isRemote = searchParams.get('isRemote') === 'true';
                  const salaryMin = searchParams.get('salaryMin') || '';
                  const salaryMax = searchParams.get('salaryMax') || '';
                  const sector = searchParams.get('sector') || '';
                  
                  fetchJobs(query, location, currentPage, {
                    jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
                  });
                }}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              {lastRefresh && (
                <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  <span className="text-gray-400">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Jobs Grid/List */}
          <div className={`w-full max-w-full ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : viewMode === 'compact'
              ? 'space-y-2'
              : 'space-y-4'
          }`}>
            {jobs.map((job) => (
              <EnhancedJobCard
                key={job.id}
                job={job as any}
                isBookmarked={bookmarkedJobs.includes(job.id)}
                onBookmark={() => toggleBookmark(job.id)}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 w-full max-w-full" style={{ minHeight: '80px' }}>
              <EnhancedPagination
                config={{
                  page: currentPage,
                  limit: 200,
                  total: totalJobs,
                  maxVisiblePages: 5,
                  showFirstLast: true,
                  showPrevNext: true,
                  showPageNumbers: true
                }}
                onPageChange={handlePageChange}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* No Jobs State */}
      {!loading && !error && (jobs || []).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-600">No jobs found</p>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        </div>
      )}
    </div>
  );
}

