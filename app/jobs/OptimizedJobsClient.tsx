'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedJobCard from '@/components/EnhancedJobCard';
import { JobResult } from '@/types/jobs';
import EnhancedPagination from '@/components/ui/enhanced-pagination';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  postedAt?: string;
  source_url?: string;
  source?: string;
  is_remote?: boolean;
  is_featured?: boolean;
}

interface OptimizedJobsClientProps {
  initialJobs: any[];
}

export default function OptimizedJobsClient({ initialJobs }: OptimizedJobsClientProps) {
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

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    responseTime: number;
    cached: boolean;
    sources: any;
  } | null>(null);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());


  const searchParams = useSearchParams();

  // Initialize with search params and load jobs
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const loc = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const sector = searchParams.get('sector') || '';

    console.log('⚡ OptimizedJobsClient initializing with params:', { 
      query, loc, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector 
    });

    // Reset pagination when search params change
    setCurrentPage(1);
    
    // Always fetch jobs using unlimited API with all filters
    fetchJobs(query, loc, 1, {
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
    });
  }, [searchParams]);

  // Add periodic refresh to show newly posted jobs
  useEffect(() => {
    const interval = setInterval(() => {
      const query = searchParams.get('q') || searchParams.get('query') || '';
      const loc = searchParams.get('location') || '';
      const jobType = searchParams.get('jobType') || '';
      const experienceLevel = searchParams.get('experienceLevel') || '';
      const isRemote = searchParams.get('isRemote') === 'true';
      const salaryMin = searchParams.get('salaryMin') || '';
      const salaryMax = searchParams.get('salaryMax') || '';
      const sector = searchParams.get('sector') || '';
      
      console.log('🔄 Refreshing jobs to show newly posted jobs...');
      fetchJobs(query, loc, currentPage, {
        jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [searchParams, currentPage]);

  // Convert any job format to simple Job format
  function convertToSimpleJob(job: any): Job {
    return {
      id: job.id || `job-${Math.random()}`,
      title: job.title || 'Job Title',
      company: job.company || job.companyRelation?.name || 'Company',
      location: job.location || 'Location',
      description: job.description || 'Job description not available',
      salary: job.salary || job.salary_formatted,
      postedAt: job.postedAt || job.createdAt || job.created_at,
      source_url: job.source_url || job.redirect_url || job.applyUrl,
      source: job.source || (job.isExternal ? 'external' : 'database'),
      is_remote: job.is_remote || job.isRemote,
      is_featured: job.is_featured || job.isFeatured
    };
  }

  // Fetch jobs using optimized API for better performance
  const fetchJobs = async (
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
    } = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('⚡ Fetching optimized jobs with query:', query, 'location:', location, 'page:', page);

      // Determine country based on location or default to India
      let country = 'IN'; // Default to India
      if (location) {
        const locationLower = location.toLowerCase();
        if (locationLower.includes('usa') || locationLower.includes('united states') || locationLower.includes('us')) {
          country = 'US';
        } else if (locationLower.includes('uae') || locationLower.includes('united arab emirates') || locationLower.includes('dubai')) {
          country = 'AE';
        } else if (locationLower.includes('uk') || locationLower.includes('united kingdom') || locationLower.includes('london')) {
          country = 'GB';
        } else if (locationLower.includes('canada') || locationLower.includes('toronto') || locationLower.includes('vancouver')) {
          country = 'CA';
        } else if (locationLower.includes('australia') || locationLower.includes('sydney') || locationLower.includes('melbourne')) {
          country = 'AU';
        }
      }

      // Use unlimited job search API with all filters from home page
      const unlimitedParams = new URLSearchParams({
        ...(query && { query }),
        ...(location && { location }),
        country: country,
        page: page.toString(),
        limit: '500', // Truly unlimited jobs per page
        includeExternal: 'true',
        includeDatabase: 'true',
        includeSample: 'true',
        // Add all filter parameters from home page search
        ...(filters.jobType && { jobType: filters.jobType }),
        ...(filters.experienceLevel && { experienceLevel: filters.experienceLevel }),
        ...(filters.isRemote && { isRemote: 'true' }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax }),
        ...(filters.sector && { sector: filters.sector })
      });

      console.log('📡 Making unlimited job search API call to:', `/api/jobs/unlimited?${unlimitedParams.toString()}`);

      const startTime = Date.now();
      const response = await fetch(`/api/jobs/unlimited?${unlimitedParams.toString()}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`📡 Unlimited job search API Response status: ${response.status} (${responseTime}ms)`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Unlimited job search API Error Response:', errorText);
        throw new Error(`Unlimited job search API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Unlimited job search API Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Unlimited job search API returned success: false');
      }

      // Process jobs
      const jobs = (data.jobs || []).map(convertToSimpleJob);
      console.log(`✅ Processed ${jobs.length} unlimited jobs in ${responseTime}ms`);

      // Update state
      setJobs(jobs);
      setTotalJobs(data.pagination?.totalJobs || jobs.length);
      setTotalPages(data.pagination?.totalPages || 1);
      setHasNextPage(data.pagination?.hasMore || false);
      setHasPrevPage(page > 1);

      // Update performance metrics
      setPerformanceMetrics({
        responseTime,
        cached: data.metadata?.cached || false,
        sources: data.sources
      });

      // Update last refresh time
      setLastRefresh(new Date());

      console.log('✅ Unlimited jobs loaded successfully:', {
        jobsCount: jobs.length,
        totalJobs: data.pagination?.totalJobs || jobs.length,
        currentPage: page,
        totalPages: data.pagination?.totalPages || 1,
        hasMore: data.pagination?.hasMore || false,
        sources: data.sources,
        realJobsPercentage: data.metadata?.realJobsPercentage || 0,
        performance: data.metadata?.performance
      });
      
      console.log('🔍 Pagination Debug:', {
        totalJobs: data.pagination?.totalJobs,
        totalPages: data.pagination?.totalPages,
        hasMore: data.pagination?.hasMore,
        currentPage: page,
        limit: 500,
        shouldShowPagination: (data.pagination?.totalPages || 1) > 1 || (data.pagination?.hasMore || false) || (data.pagination?.totalJobs || jobs.length) > 500
      });

    } catch (error) {
      console.error('❌ Error fetching unlimited jobs, trying fallback:', error);
      
      // Fallback to simple unlimited API
      try {
        console.log('🔄 Trying fallback to simple unlimited API...');
        const fallbackParams = new URLSearchParams({
          ...(query && { query }),
          ...(location && { location }),
          country: 'IN', // Default country for fallback
          page: page.toString(),
          limit: '200'
        });
        
        const fallbackResponse = await fetch(`/api/jobs/simple-unlimited?${fallbackParams.toString()}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackJobs = (fallbackData.jobs || []).map(convertToSimpleJob);
          
          setJobs(fallbackJobs);
          setTotalJobs(fallbackData.pagination?.totalJobs || fallbackJobs.length);
          setTotalPages(fallbackData.pagination?.totalPages || 1);
          setHasNextPage(fallbackData.pagination?.hasMore || false);
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
  };

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
    
    setCurrentPage(page);
    fetchJobs(query, location, page, {
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
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
    <div className="space-y-6">

      {/* Loading State */}
      {loading && jobs.length === 0 && (
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

      {/* Current Search Filters Display */}
      {!loading && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Current Search:</h3>
              <div className="flex flex-wrap gap-2">
                {searchParams.get('q') && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Keyword: {searchParams.get('q')}
                  </span>
                )}
                {searchParams.get('location') && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Location: {searchParams.get('location')}
                  </span>
                )}
                {searchParams.get('jobType') && searchParams.get('jobType') !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Type: {searchParams.get('jobType')}
                  </span>
                )}
                {searchParams.get('experienceLevel') && searchParams.get('experienceLevel') !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Level: {searchParams.get('experienceLevel')}
                  </span>
                )}
                {searchParams.get('isRemote') === 'true' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    Remote
                  </span>
                )}
                {searchParams.get('salaryMin') && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Salary: {searchParams.get('salaryMin')}+
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-blue-600">
              {totalJobs} jobs found
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle and Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'compact' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Compact
              </button>
            </div>
            <div className="flex items-center gap-4">
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
              <div className="text-sm text-gray-600">
                {lastRefresh && (
                  <span className="text-xs text-gray-400">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Jobs Grid/List */}
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : viewMode === 'compact'
              ? 'space-y-2'
              : 'space-y-4'
          }`}>
            {jobs.map((job) => (
              <EnhancedJobCard
                key={job.id}
                job={job as JobResult}
                isBookmarked={bookmarkedJobs.includes(job.id)}
                onBookmark={() => toggleBookmark(job.id)}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {(totalPages > 1 || hasNextPage || totalJobs > jobs.length) && (
            <div className="flex justify-center mt-8">
              <EnhancedPagination
                config={{
                  page: currentPage,
                  limit: 500,
                  total: totalJobs,
                  maxVisiblePages: 5,
                  showFirstLast: true,
                  showPrevNext: true,
                  showPageNumbers: true
                }}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* No Jobs State */}
      {!loading && !error && jobs.length === 0 && (
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
