'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { BREAKPOINTS } from '@/components/ui/use-mobile';
import { useSearchParams, useRouter } from 'next/navigation';
import EnhancedJobCard from '@/components/EnhancedJobCard';
import { Job } from '@/types/job';
import EnhancedPagination from '@/components/ui/enhanced-pagination';
import { getCountriesToFetch } from '@/lib/utils/country-detection';
import { formatJobSalary } from '@/lib/currency-utils';
import { JOB_NAV_KEYS, saveJobNavigationSource, saveJobSearchContext } from '@/lib/job-navigation-state';
import { JobResult } from '@/types/jobs';

// Using Job interface from types/job.d.ts

interface OptimizedJobsClientProps {
  initialJobs: any[];
}

export default function OptimizedJobsClient({ initialJobs }: OptimizedJobsClientProps) {
  // Targeted countries for fresh, real jobs
  const TARGET_COUNTRIES = ['US', 'IN', 'GB', 'AE'];

  /** Quick filter pill styles (UI only) */
  const filterPillInactive =
    'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 bg-white/75 backdrop-blur-sm text-slate-600 border border-slate-200/80 shadow-sm hover:bg-gradient-to-r hover:from-blue-50/90 hover:to-violet-50/50 hover:border-blue-200/60 hover:text-slate-800 hover:shadow-md active:scale-[0.98]';
  const filterPillActive =
    'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white border border-transparent shadow-[0_4px_14px_-4px_rgba(37,99,235,0.45)]';
  const filterPillClear =
    'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 bg-rose-50/80 backdrop-blur-sm text-rose-600 border border-rose-200/70 shadow-sm hover:bg-rose-100/90 hover:border-rose-300/70 hover:shadow-md active:scale-[0.98]';
  const viewPillInactive =
    'px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 bg-white/75 backdrop-blur-sm text-slate-600 border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:border-slate-300/70';
  const viewPillActive =
    'px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white border border-transparent shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('grid');
  const userPickedView = useRef(false);

  /** Initial load only: list on mobile, grid on desktop (matches BREAKPOINTS.md). */
  useLayoutEffect(() => {
    if (userPickedView.current) return;
    setViewMode(window.innerWidth < BREAKPOINTS.md ? 'list' : 'grid');
  }, []);

  const handleViewModeChange = (mode: 'list' | 'grid' | 'compact') => {
    userPickedView.current = true;
    setViewMode(mode);
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Optional performance metrics (removed to satisfy linter when unused)

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const filtersSectionRef = React.useRef<HTMLDivElement>(null);
  const viewBarRef = React.useRef<HTMLDivElement>(null);
  const hasRestoredSearchParams = React.useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // RESTORE SEARCH STATE: Restore saved search params from sessionStorage on mount if URL has no params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasUrlParams = searchParams.toString().length > 0;
      const savedParams = sessionStorage.getItem(JOB_NAV_KEYS.searchParams);
      
      // If no URL params but we have saved params, restore them once (prevents redirect loops)
      if (!hasUrlParams && savedParams && !hasRestoredSearchParams.current) {
        hasRestoredSearchParams.current = true;
        console.log('🔄 Restoring saved search params from sessionStorage:', savedParams);
        router.replace(`/jobs?${savedParams}`);
        return;
      }
      
      if (hasUrlParams) {
        sessionStorage.setItem(JOB_NAV_KEYS.searchParams, searchParams.toString());
        console.log('💾 Saved current search params to sessionStorage:', searchParams.toString());
      }
    }
  }, [searchParams, router]);

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
      refreshExternal?: boolean;
    } = {}
  ) => {
    // Smart country detection using the country detection utility
    const explicitCountry = (filters.country || '').toUpperCase() || undefined;
    const countryToUse = explicitCountry;
    console.log('🌍 Country filter:', { location, explicitCountry: explicitCountry || '(none)' });

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
        limit: filters.limit || '25',
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

      // DB-first listing (like Naukri/Indeed): paginate from PostgreSQL; external sync only on page 1
      const enhancedParams = new URLSearchParams(dbParams);
      const pageSize = filters.limit || '25';
      if (page === 1) {
        enhancedParams.set('includeExternal', 'true');
      } else {
        enhancedParams.set('includeExternal', 'false');
      }
      enhancedParams.set('includeDatabase', 'true');
      // Only force external sync on explicit Refresh — avoids slow/hung page-1 loads
      if (filters.refreshExternal) {
        enhancedParams.set('refreshExternal', 'true');
      }

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 25000);
      try {
        response = await fetch(`/api/jobs/unlimited?${enhancedParams.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(fetchTimeout);
      }
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

        console.log('[jobs-debug] client after convert', {
          raw: jobsData.length,
          converted: jobs.length,
          jobType: filters.jobType || '(none)',
        });
        
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
          limit: 25,
          shouldShowPagination: totalPagesCount > 1 || page < totalPagesCount || totalCount > 200
        });

        // Empty success response: try real-jobs API (known-good listing path on production)
        const hasActiveFilters = !!(
          query || location || filters.jobType || filters.experienceLevel ||
          filters.isRemote || filters.salaryMin || filters.salaryMax || filters.sector || filters.country
        );
        if (page === 1 && jobs.length === 0 && !hasActiveFilters) {
          const realParams = new URLSearchParams({
            page: page.toString(),
            limit: filters.limit || '25',
            ...(countryToUse ? { country: countryToUse } : { country: 'IN' }),
          });
          const realResponse = await fetch(`/api/jobs/real?${realParams.toString()}`, {
            cache: 'no-store',
          });
          if (realResponse.ok) {
            const realData = await realResponse.json();
            const realJobs = (realData.jobs || []).map(convertToSimpleJob).filter(Boolean);
            if (realJobs.length > 0) {
              const rp = realData.pagination || {};
              setJobs(realJobs as any);
              setTotalJobs(rp.totalJobs || realJobs.length);
              setTotalPages(rp.totalPages || 1);
              setHasNextPage(page < (rp.totalPages || 1));
              setHasPrevPage(false);
              setLastRefresh(new Date());
              return;
            }
          }
        }

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
          limit: '25',
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
          setError(null);
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
    const limitParam = searchParams.get('limit') || '25';
    const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);
    const savedListPage = parseInt(sessionStorage.getItem(JOB_NAV_KEYS.listPage) || '1', 10);
    const pageToLoad =
      pageFromUrl > 0 ? pageFromUrl : savedListPage > 0 ? savedListPage : 1;

    console.log('⚡ OptimizedJobsClient initializing with params:', { 
      query, loc, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector, countryParam, limitParam, pageToLoad,
      allParams: Object.fromEntries(searchParams.entries())
    });

    setCurrentPage(pageToLoad);
    
    fetchJobs(query, loc, pageToLoad, {
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
    // CRITICAL: Validate job has an ID (either id or sourceId) and ALWAYS convert to string
    const jobId = String(job.id || job.sourceId || '');
    if (!jobId || jobId === 'undefined') {
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
      description: job.description || '',
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


  // Handle quick view - opens job in new tab
  const handleQuickView = async (job: JobResult) => {
    try {
      // Generate SEO-friendly URL using the same method as EnhancedJobCard
      const { generateSEOJobUrl, cleanJobDataForSEO } = await import('@/lib/seo-url-utils');
      const cleanJob = cleanJobDataForSEO(job);
      const seoUrl = generateSEOJobUrl(cleanJob);
      
      if (seoUrl && seoUrl !== '#') {
        window.open(seoUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback to simple ID-based URL
        const fallbackUrl = `/jobs/${job.id || job.sourceId}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening quick view:', error);
      // Fallback to simple ID-based URL
      const fallbackUrl = `/jobs/${job.id || job.sourceId}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle pagination — URL is source of truth; useEffect on searchParams loads the page (avoids double fetch).
  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    saveJobSearchContext(params.toString(), page);
    saveJobNavigationSource(`${window.location.pathname}?${params.toString()}`);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  };

  // Handle bookmark toggle
  const toggleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  // Track filters section and view bar heights for fixed positioning
  const [filtersHeight, setFiltersHeight] = React.useState(140);
  const [viewBarTop, setViewBarTop] = React.useState(204);
  const [filtersTop, setFiltersTop] = React.useState(64);

  // Update heights for fixed positioning
  React.useEffect(() => {
    const updateHeights = () => {
      // Navbar height: 64px mobile, 80px sm, 96px lg
      const navbarHeight = window.innerWidth >= 1024 ? 96 : window.innerWidth >= 640 ? 80 : 64;
      setFiltersTop(navbarHeight);
      
      if (filtersSectionRef.current) {
        const height = filtersSectionRef.current.offsetHeight;
        setFiltersHeight(height);
        setViewBarTop(navbarHeight + height);
      }
    };

    // Initial update after mount
    const timeoutId = setTimeout(updateHeights, 100);
    updateHeights();
    
    window.addEventListener('resize', updateHeights);
    
    // Use ResizeObserver for dynamic height changes
    let resizeObserver: ResizeObserver | null = null;
    if (filtersSectionRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeights);
      resizeObserver.observe(filtersSectionRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateHeights);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [jobs.length, loading, totalJobs, searchParams]); // Recalculate when content changes

  return (
    <div className="w-full overflow-x-hidden">
      {/* Search Results Header with Filters - Fixed (like navbar, stays visible on scroll) */}
      <div 
        ref={filtersSectionRef} 
        className="fixed left-0 right-0 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/60 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] z-[9999] px-4 sm:px-6 lg:px-8" 
        style={{ 
          top: `${filtersTop}px`,
          transition: 'top 0.2s ease-in-out'
        }}
      >
        <div className="w-full py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight mb-1 antialiased">
                {totalJobs > 0 ? `${totalJobs} Jobs Found` : 'No Jobs Found'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {searchParams.get('q') && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-violet-50/60 text-[#2563EB] border border-blue-200/50 shadow-sm">
                    {searchParams.get('q')}
                  </span>
                )}
                {searchParams.get('location') && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-50/80 to-emerald-50/50 text-teal-700 border border-cyan-200/50 shadow-sm">
                    {searchParams.get('location')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-slate-500 hover:text-[#2563EB] text-sm font-medium whitespace-nowrap transition-colors duration-200"
            >
              ← Back to Search
            </button>
          </div>

          {/* Quick Filters */}
          <div className="border-t border-slate-100/80 pt-3 sm:pt-3.5 mt-2">
            <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 mr-0.5 sm:mr-1 whitespace-nowrap tracking-tight">Quick Filters</span>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('jobType', url.searchParams.get('jobType') === 'full-time' ? '' : 'full-time');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('jobType') === 'full-time' ? filterPillActive : filterPillInactive
                }
              >
                Full-time
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('isRemote', url.searchParams.get('isRemote') === 'true' ? '' : 'true');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('isRemote') === 'true' ? filterPillActive : filterPillInactive
                }
              >
                Remote
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('experienceLevel', url.searchParams.get('experienceLevel') === 'senior' ? '' : 'senior');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('experienceLevel') === 'senior' ? filterPillActive : filterPillInactive
                }
              >
                Senior Level
              </button>
              {/* Country Filters */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  const currentCountry = searchParams.get('country')?.toUpperCase();
                  url.searchParams.set('country', currentCountry === 'IN' ? '' : 'IN');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('country')?.toUpperCase() === 'IN' ? filterPillActive : filterPillInactive
                }
              >
                India
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  const currentCountry = searchParams.get('country')?.toUpperCase();
                  url.searchParams.set('country', currentCountry === 'US' ? '' : 'US');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('country')?.toUpperCase() === 'US' ? filterPillActive : filterPillInactive
                }
              >
                USA
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  const currentCountry = searchParams.get('country')?.toUpperCase();
                  url.searchParams.set('country', currentCountry === 'GB' ? '' : 'GB');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('country')?.toUpperCase() === 'GB' ? filterPillActive : filterPillInactive
                }
              >
                UK
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  const currentCountry = searchParams.get('country')?.toUpperCase();
                  url.searchParams.set('country', currentCountry === 'AE' ? '' : 'AE');
                  router.push(url.pathname + url.search);
                }}
                className={
                  searchParams.get('country')?.toUpperCase() === 'AE' ? filterPillActive : filterPillInactive
                }
              >
                UAE
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('jobType');
                  url.searchParams.delete('isRemote');
                  url.searchParams.delete('experienceLevel');
                  url.searchParams.delete('salaryMin');
                  url.searchParams.delete('salaryMax');
                  url.searchParams.delete('country');
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(JOB_NAV_KEYS.searchParams);
                    sessionStorage.removeItem(JOB_NAV_KEYS.listPage);
                  }
                  router.push(url.pathname + (url.search || ''));
                }}
                className={filterPillClear}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed filters section - dynamically calculated */}
      <div 
        className="w-full" 
        style={{ 
          height: filtersHeight > 0 ? `${filtersHeight}px` : '140px',
          minHeight: '120px'
        }} 
      />

      {/* Loading State */}
      {loading && (jobs || []).length === 0 && (
        <div className="space-y-4 mt-4">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-[#2563EB]">
              <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold tracking-tight">Loading optimized jobs...</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Searching across all sectors and countries</p>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] border border-slate-200/60 p-6 animate-pulse">
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
        <div className="text-center py-8 mt-4">
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

      {/* Jobs List */}
      {!loading && !error && (jobs || []).length > 0 && (
        <div className="space-y-3">
          {/* View Mode Toggle and Refresh - Fixed (below filters section, stays visible on scroll) */}
          <div 
            ref={viewBarRef} 
            className="fixed left-0 right-0 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/60 shadow-[0_2px_16px_-6px_rgba(15,23,42,0.06)] z-[9998] px-4 sm:px-6 lg:px-8" 
            id="view-sticky-bar"
            style={{ 
              top: viewBarTop > 0 ? `${viewBarTop}px` : '204px',
              transition: 'top 0.2s ease-in-out'
            }}
          >
            <div className="w-full py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600 whitespace-nowrap">View</span>
              <button
                onClick={() => handleViewModeChange('list')}
                className={viewMode === 'list' ? viewPillActive : viewPillInactive}
              >
                List
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={viewMode === 'grid' ? viewPillActive : viewPillInactive}
              >
                Grid
              </button>
              <button
                onClick={() => handleViewModeChange('compact')}
                className={viewMode === 'compact' ? viewPillActive : viewPillInactive}
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
                  const countryParam = (searchParams.get('country') || '').toUpperCase();
                  
                  fetchJobs(query, location, currentPage, {
                    jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector,
                    country: countryParam || undefined,
                    refreshExternal: true,
                  });
                }}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#2563EB] hover:text-[#7C3AED] hover:bg-blue-50/80 rounded-lg border border-transparent hover:border-blue-100 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              {lastRefresh && (
                <div className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                  <span className="text-slate-400">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Spacer to push content below fixed view bar */}
          <div 
            className="w-full" 
            style={{ 
              height: '60px',
              minHeight: '50px'
            }} 
          />

          {/* Jobs Grid/List - Fully responsive grid (2 columns on mobile, 2 on tablet, 3 on desktop) */}
          <div 
            className={`w-full mt-3 ${
              viewMode === 'grid' 
                ? 'jobs-grid-container grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6' 
                : viewMode === 'compact'
                ? 'space-y-2 sm:space-y-3'
                : 'space-y-3 sm:space-y-4'
            }`}
          >
            {jobs.map((job) => (
              <EnhancedJobCard
                key={job.id}
                job={job as any}
                isBookmarked={bookmarkedJobs.includes(job.id)}
                onBookmark={() => toggleBookmark(job.id)}
                onQuickView={handleQuickView}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 w-full" style={{ minHeight: '80px' }}>
              <EnhancedPagination
                config={{
                  page: currentPage,
                  limit: 25,
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

