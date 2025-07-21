"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  BuildingOfficeIcon, 
  ClockIcon, 
  FireIcon, 
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

interface SerpJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryFormatted?: string;
  timeAgo?: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType?: string;
  via?: string;
}

const SerpApiJobSearch = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [jobType, setJobType] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Popular searches for Indian job market
  const popularSearches = [
    "Software Engineer",
    "Data Scientist", 
    "Product Manager",
    "Digital Marketing",
    "Full Stack Developer",
    "DevOps Engineer",
    "UI/UX Designer",
    "Business Analyst"
  ];

  const indianCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", 
    "Pune", "Kolkata", "Ahmedabad", "Gurgaon", "Noida"
  ];

  // Fetch jobs using React Query
  const { data: jobsData, isLoading, error, refetch } = useQuery({
    queryKey: ["serpapi-jobs", query, location, jobType, datePosted, searchTrigger],
    queryFn: async () => {
      if (!query.trim()) return { results: [], total: 0 };
      
      setIsSearching(true);
      console.log("🚀 Searching for:", query, "in", location);
      
      const params = new URLSearchParams();
      params.append("q", query);
      params.append("location", location);
      if (jobType) params.append("job_type", jobType);
      if (datePosted) params.append("date_posted", datePosted);
      params.append("num", "20");
      
      const response = await axios.get(`/api/jobs/serpapi?${params.toString()}`);
      setIsSearching(false);
      return response.data;
    },
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const jobs: SerpJob[] = jobsData?.results || [];
  const totalJobs = jobsData?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTrigger(prev => prev + 1);
    }
  };

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
            🚀 Powered by SerpApi
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Real-time job search across India's top job boards
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Live Data
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              Real-time Updates
            </span>
            <span className="flex items-center gap-1">
              <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
              Google Jobs API
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Posted</label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  )}
                  Search Jobs
                </button>
              </div>
            </div>
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
                    className="px-3 py-1 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-700 rounded-full text-sm transition-colors"
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
            {!isLoading && jobs.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎯 Found {totalJobs?.toLocaleString() || jobs.length} jobs for "{query}"
                </h2>
                <p className="text-gray-600">in {location}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
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
            {!isLoading && jobs.length === 0 && query && !error && (
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
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Try "{search}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Job Results */}
            {!isLoading && jobs.length > 0 && (
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {job.isUrgent && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-2">
                                <FireIcon className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                            {job.isRemote && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2 ml-1">
                                🏠 Remote
                              </span>
                            )}
                            <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
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
                        </div>

                        {job.salaryFormatted && (
                          <div className="flex items-center text-green-600 font-semibold mb-3">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
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
                          {job.via && (
                            <span className="text-xs text-gray-500">
                              via {job.via}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-gray-50 border-t">
                        <a
                          href={job.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
                        >
                          Apply Now
                          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SerpApiJobSearch;
