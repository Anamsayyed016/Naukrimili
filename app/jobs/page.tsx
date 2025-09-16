"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign,
  Star,
  Eye,
  Share2,
  Heart,
  Bookmark,
  TrendingUp,
  Users,
  Target,
  Globe,
  Navigation,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import EnhancedJobCard from '@/components/EnhancedJobCard';
import { JobResult } from '@/types/jobs';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  salary_formatted?: string;
  postedAt?: string;
  source_url?: string;
  source?: string;
  is_remote?: boolean;
  is_featured?: boolean;
  is_urgent?: boolean;
  companyLogo?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  views?: number;
  applications?: number;
}

interface SearchFilters {
  query: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  sortBy: string;
  sortOrder: string;
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  
  // State management
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || searchParams.get('query') || '',
    location: searchParams.get('location') || '',
    jobType: searchParams.get('jobType') || 'all',
    experienceLevel: searchParams.get('experienceLevel') || 'all',
    isRemote: searchParams.get('isRemote') === 'true',
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        query: filters.query,
        location: filters.location,
        jobType: filters.jobType === 'all' ? '' : filters.jobType,
        experienceLevel: filters.experienceLevel === 'all' ? '' : filters.experienceLevel,
        isRemote: filters.isRemote.toString(),
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError('Failed to fetch jobs');
        toast.error('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  // Handle bookmark
  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
    toast.success(bookmarkedJobs.includes(jobId) ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  // Handle quick view
  const handleQuickView = (job: JobResult) => {
    // Open job details in new tab
    window.open(`/jobs/${job.id}`, '_blank');
  };

  // Handle share
  const handleShare = async (job: JobResult) => {
    const shareData = {
      title: job.title,
      text: `Check out this job: ${job.title} at ${job.company}`,
      url: `${window.location.origin}/jobs/${job.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Job shared successfully!');
      } catch (err) {
        console.error('Error sharing:', err);
        fallbackShare(shareData);
      }
    } else {
      fallbackShare(shareData);
    }
  };

  // Fallback share method
  const fallbackShare = (shareData: any) => {
    navigator.clipboard.writeText(shareData.url);
    toast.success('Job link copied to clipboard!');
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      isRemote: false,
      salaryMin: '',
      salaryMax: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  // Load jobs on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [currentPage, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Dream Job</h1>
              <p className="text-gray-600">Discover opportunities that match your skills and aspirations</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Compact
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Job Title</label>
                  <Input
                    placeholder="Search jobs..."
                    value={filters.query}
                    onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                  <Input
                    placeholder="City, state, country"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Job Type</label>
                  <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Experience Level</label>
                  <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Remote Work */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={filters.isRemote}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                  />
                  <label htmlFor="remote" className="text-sm font-medium text-gray-700">
                    Remote Work
                  </label>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Salary Range</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Min salary"
                      value={filters.salaryMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                      type="number"
                    />
                    <Input
                      placeholder="Max salary"
                      value={filters.salaryMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                      type="number"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date Posted</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="title">Job Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={handleSearch} className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Search Jobs
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {loading ? 'Searching...' : `${jobs.length} Jobs Found`}
                </h2>
                {filters.query && (
                  <p className="text-gray-600">Results for "{filters.query}"</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {jobs.length} Jobs
                </Badge>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Jobs</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchJobs}>Try Again</Button>
              </Card>
            )}

            {/* Jobs Grid/List */}
            {!loading && !error && jobs.length > 0 && (
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
                    onShare={handleShare}
                    viewMode={viewMode}
                    showCompanyLogo={true}
                    showSalaryInsights={true}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && jobs.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all available positions.
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            )}

            {/* Pagination */}
            {!loading && !error && jobs.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}