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

interface JobsClientProps {
  initialJobs: any[];
}

export default function JobsClient({ initialJobs }: JobsClientProps) {
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

  const searchParams = useSearchParams();

  // Initialize with search params and load jobs
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const loc = searchParams.get('location') || '';

    console.log('🚀 JobsClient initializing with params:', { query, loc });

    // Reset pagination when search params change
    setCurrentPage(1);
    
    // Always fetch jobs (database + external) for dynamic display
    fetchJobs(query, loc, 1)
  }, [searchParams]);

  // Convert any job format to simple Job format
  function convertToSimpleJob(job: any): Job {
    console.log('🔄 Converting job:', { id: job.id, title: job.title, company: job.company });
    
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

  // Fetch jobs using unified API (database + external jobs)
  const fetchJobs = async (query: string = '', location: string = '', page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching jobs with query:', query, 'location:', location, 'page:', page);

      // Use unified API to get both database and external jobs
      const unifiedParams = new URLSearchParams({
        ...(query && { query }),
        ...(location && { location }),
        country: 'IN',
        includeExternal: 'true',
        page: page.toString(),
        limit: '15' // 15 jobs per page for better pagination
      });

      const unifiedResponse = await fetch(`/api/jobs/unified?${unifiedParams.toString()}`);
      
      if (!unifiedResponse.ok) {
        throw new Error(`Failed to fetch jobs: ${unifiedResponse.status}`);
      }

      const unifiedData = await unifiedResponse.json();
      
      if (unifiedData.success) {
        console.log(`✅ Unified API: Found ${unifiedData.jobs?.length || 0} jobs on page ${page}`);
        console.log(`📊 Total jobs available: ${unifiedData.pagination?.total || 0}`);
        
        const newJobs = (unifiedData.jobs || []).map(convertToSimpleJob);
        setJobs(newJobs);
        
        // Update pagination state
        console.log('📊 Pagination data from API:', unifiedData.pagination);
        setTotalPages(unifiedData.pagination?.totalPages || 1);
        setTotalJobs(unifiedData.pagination?.total || 0);
        setHasNextPage(unifiedData.pagination?.hasNext || false);
        setHasPrevPage(unifiedData.pagination?.hasPrev || false);
        setCurrentPage(page);
        console.log('📊 Updated pagination state:', {
          totalPages: unifiedData.pagination?.totalPages || 1,
          totalJobs: unifiedData.pagination?.total || 0,
          hasNext: unifiedData.pagination?.hasNext || false,
          hasPrev: unifiedData.pagination?.hasPrev || false,
          currentPage: page
        });
      } else {
        throw new Error(unifiedData.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Handle bookmark
  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  // Handle quick view
  const handleQuickView = (job: JobResult) => {
    window.open(`/jobs/${job.id}`, '_blank');
  };


  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const loc = searchParams.get('location') || '';
    fetchJobs(query, loc, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      handlePageChange(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading Jobs...' : 'Jobs Found'}
            </h2>
            {searchParams.get('q') && (
              <p className="text-gray-600 mt-1">Results for "{searchParams.get('q')}"</p>
            )}
            {totalPages > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                Page {currentPage} of {totalPages} • Showing {jobs.length} jobs
              </p>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`} 
              title="List View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`} 
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('compact')}
              className={`p-2 transition-colors rounded-lg ${viewMode === 'compact' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`} 
              title="Compact View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="space-y-4">
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

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : viewMode === 'compact'
              ? 'space-y-2'
              : 'space-y-4'
          }>
            {jobs.map((job) => (
              <EnhancedJobCard
                key={job.id}
                job={job as JobResult}
                isBookmarked={bookmarkedJobs.includes(job.id)}
                onBookmark={handleBookmark}
                onQuickView={handleQuickView}
                viewMode={viewMode}
                showCompanyLogo={true}
                showSalaryInsights={true}
              />
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {!loading && jobs.length > 0 && totalPages > 1 && (
          <div className="mt-8">
            <EnhancedPagination
              config={{
                page: currentPage,
                limit: 20,
                total: totalJobs,
                maxVisiblePages: 7,
                showFirstLast: true,
                showPrevNext: true,
                showJumpToPage: totalPages > 10,
                showItemsPerPage: true,
                itemsPerPageOptions: [10, 20, 50, 100]
              }}
              onPageChange={handlePageChange}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              showInfo={true}
              showJumpToPage={totalPages > 10}
              showItemsPerPage={true}
            />
          </div>
        )}

        {/* No Results */}
        {!loading && jobs.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We couldn't find any jobs matching your criteria. Try adjusting your search or browse all available positions.
              </p>
              <button
                onClick={() => {
                  const query = searchParams.get('q') || searchParams.get('query') || '';
                  const loc = searchParams.get('location') || '';
                  setCurrentPage(1);
                  fetchJobs(query, loc, 1);
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Browse All Jobs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}