"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyRupeeIcon,
  BuildingOfficeIcon, 
  ClockIcon, 
  FireIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  SparklesIcon,
  BookmarkIcon
} from "@heroicons/react/24/outline";
import { UnifiedJob } from "@/lib/unified-job-service";
import SalaryRangeSelector, { SalaryRange } from "./salary/SalaryRangeSelector";

interface JobSearchProps {
  initialQuery?: string;
  initialLocation?: string;
}

const JobCard = ({ job, bookmarked, onBookmark }: { 
  job: UnifiedJob; 
  bookmarked: boolean;
  onBookmark: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
  >
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {job.isUrgent && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-2">
              <FireIcon className="w-3 h-3" />
              Urgent Hiring
            </span>
          )}
          {job.isRemote && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2 ml-1">
              🏠 Remote
            </span>
          )}
          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company}</span>
          </div>
          <div className="flex items-center text-gray-500 mb-3">
            <MapPinIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">{job.location}</span>
            {job.jobType && (
              <>
                <span className="mx-2">•</span>
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {job.jobType}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => onBookmark(job.id)}
          className={`p-2 rounded-full transition-colors ${
            bookmarked 
              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        >
          <BookmarkIcon className="w-5 h-5" />
        </button>
      </div>

      {job.salaryFormatted && (
        <div className="flex items-center text-green-600 font-semibold mb-3">
          <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
          <span>{job.salaryFormatted}</span>
        </div>
      )}

      {job.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {job.timeAgo && (
          <div className="flex items-center text-gray-400 text-xs">
            <CalendarIcon className="w-3 h-3 mr-1" />
            <span>{job.timeAgo}</span>
          </div>
        )}
      </div>
    </div>

    <div className="px-6 py-4 bg-gray-50 border-t">
      <a
        href={job.apply_url || job.redirect_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
      >
        Apply Now
        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function JobSearch({ initialQuery = "", initialLocation = "India" }: JobSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [page, setPage] = useState(1);
  const [allJobs, setAllJobs] = useState<UnifiedJob[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showSalaryFilter, setShowSalaryFilter] = useState(false);
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({
    min: 30000,
    max: 150000,
    currency: "INR",
    period: "year"
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    }
    return [];
  });
  const [categories, setCategories] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Popular searches for Indian job market
  const popularSearches = [
    "Software Engineer",
    "Data Scientist", 
    "Product Manager",
    "Digital Marketing",
    "Full Stack Developer",
    "DevOps Engineer",
    "UI/UX Designer",
    "Business Analyst",
    "Sales Manager",
    "HR Manager"
  ];

  const indianCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", 
    "Pune", "Kolkata", "Ahmedabad", "Gurgaon", "Noida",
    "Kochi", "Indore", "Jaipur", "Lucknow", "Bhopal"
  ];

  useEffect(() => {
    localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/jobs/categories');
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch jobs using React Query
  const { data: jobsData, isLoading, error, refetch } = useQuery({
    queryKey: ["jobs", query, location, jobType, datePosted, page, searchTrigger, selectedCategory, showSalaryFilter ? salaryRange : null],
    queryFn: async () => {
      if (!query.trim()) return { jobs: [], total: 0, hasMore: false };
      
      const params = new URLSearchParams();
      params.append("q", query);
      params.append("location", location);
      if (jobType) params.append("job_type", jobType);
      if (datePosted) params.append("date_posted", datePosted);
      if (selectedCategory) params.append("category", selectedCategory);
      if (showSalaryFilter) {
        params.append("salary_min", salaryRange.min.toString());
        params.append("salary_max", salaryRange.max.toString());
      }
      params.append("page", page.toString());
      params.append("limit", "20");
      
      const response = await axios.get(`/api/jobs?${params.toString()}`);
      return response.data;
    },
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  const jobs: UnifiedJob[] = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const hasMore = jobsData?.hasMore || false;

  // Handle pagination - append new jobs to existing ones
  useEffect(() => {
    if (jobs.length > 0) {
      if (page === 1) {
        setAllJobs(jobs);
      } else {
        setAllJobs(prev => [...prev, ...jobs]);
      }
    }
  }, [jobs, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      setAllJobs([]);
      setSearchTrigger(prev => prev + 1);
    }
  };

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setPage(1);
    setAllJobs([]);
    setSearchTrigger(prev => prev + 1);
  };

  const handleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) 
        ? prev.filter(jobId => jobId !== id)
        : [...prev, id]
    );
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Search thousands of jobs from top companies across India
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="w-4 h-4 text-blue-500" />
              Live Job Listings
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-green-500" />
              Updated Daily
            </span>
            <span className="flex items-center gap-1">
              <SparklesIcon className="w-4 h-4 text-purple-500" />
              AI-Powered Search
            </span>
          </div>
        </motion.div>

        {/* Search Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Main Search Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What job are you looking for?
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager, Data Scientist..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where?
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="India">All India</option>
                    {indianCities.map(city => (
                      <option key={city} value={`${city}, India`}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Posted</label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSalaryFilter(!showSalaryFilter)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {showSalaryFilter ? "Hide" : "Show"} Salary Filter
              </button>
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
                Search Jobs
              </button>
            </div>

            {showSalaryFilter && (
              <div className="pt-6 border-t border-gray-200">
                <SalaryRangeSelector
                  countryCode="IN"
                  value={salaryRange}
                  onChange={setSalaryRange}
                />
              </div>
            )}
          </form>

          {/* Popular Searches */}
          {!query && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handlePopularSearch(search)}
                    className="px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-full text-sm transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        {query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Results Header */}
            {!isLoading && allJobs.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Found {totalJobs?.toLocaleString() || allJobs.length}+ jobs for "{query}"
                </h2>
                <p className="text-gray-600">in {location}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && page === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Search Error</h3>
                <p className="text-red-600 mb-4">
                  Unable to fetch jobs. Please check your connection and try again.
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results */}
            {!isLoading && allJobs.length === 0 && query && !error && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">
                  Try different keywords or adjust your location
                </p>
                <div className="flex justify-center gap-3">
                  {popularSearches.slice(0, 3).map((search) => (
                    <button
                      key={search}
                      onClick={() => handlePopularSearch(search)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try "{search}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Job Results */}
            {allJobs.length > 0 && (
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allJobs.map((job, index) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      bookmarked={bookmarks.includes(job.id)}
                      onBookmark={handleBookmark}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Load More Button */}
            {hasMore && allJobs.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRightIcon className="w-4 h-4" />
                  )}
                  Load More Jobs
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
