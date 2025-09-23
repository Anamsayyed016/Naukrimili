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

  const searchParams = useSearchParams();

  // Initialize with search params and load jobs
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const loc = searchParams.get('location') || '';

    console.log('⚡ OptimizedJobsClient initializing with params:', { query, loc });

    // Reset pagination when search params change
    setCurrentPage(1);
    
    // Always fetch jobs using optimized API
    fetchJobs(query, loc, 1);
  }, [searchParams]);

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
  const fetchJobs = async (query: string = '', location: string = '', page: number = 1) => {
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

      // Use real job search API for quality jobs
      const realParams = new URLSearchParams({
        ...(query && { query }),
        ...(location && { location }),
        country: country,
        page: page.toString(),
        limit: '100' // Increased limit for unlimited job search
      });

      console.log('📡 Making real job search API call to:', `/api/jobs/real?${realParams.toString()}`);

      const startTime = Date.now();
      const response = await fetch(`/api/jobs/real?${realParams.toString()}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`📡 Real job search API Response status: ${response.status} (${responseTime}ms)`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Real job search API Error Response:', errorText);
        throw new Error(`Real job search API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Real job search API Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Real job search API returned success: false');
      }

      // Process jobs
      const jobs = (data.jobs || []).map(convertToSimpleJob);
      console.log(`✅ Processed ${jobs.length} real jobs in ${responseTime}ms`);

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

      console.log('✅ Real jobs loaded successfully:', {
        jobsCount: jobs.length,
        totalJobs: data.pagination?.totalJobs || jobs.length,
        currentPage: page,
        totalPages: data.pagination?.totalPages || 1,
        sources: data.sources,
        realJobsPercentage: data.metadata?.realJobsPercentage || 0,
        performance: data.metadata?.performance
      });

    } catch (error) {
      console.error('❌ Error fetching optimized jobs:', error);
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
    setCurrentPage(page);
    fetchJobs(query, location, page);
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

      {/* Jobs List */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle */}
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
            <div className="text-sm text-gray-600">
              {totalJobs} jobs found
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
          {(totalPages > 1 || hasNextPage) && (
            <div className="flex justify-center mt-8">
              <EnhancedPagination
                config={{
                  page: currentPage,
                  limit: 100,
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
