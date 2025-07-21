"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AdzunaJob } from "../types/adzuna";
import { AdzunaService } from "../lib/adzuna-service";
import SalaryRangeSelector, { SalaryRange } from "./salary/SalaryRangeSelector";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salaryFormatted?: string;
    timeAgo?: string;
    description?: string;
    redirect_url: string;
  };
  bookmarked: boolean;
  onBookmark: (id: string) => void;
}

const JobCard = ({ job, bookmarked, onBookmark }: JobCardProps) => (
  <div className="border rounded-lg p-6 hover:shadow-lg transition-all bg-white dark:bg-gray-900 min-h-[200px] flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{job.title}</h3>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">{job.company}</p>
      {job.location && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">📍 {job.location}</p>
      )}
      {job.salaryFormatted && (
        <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
          💰 {job.salaryFormatted}
        </p>
      )}
      {job.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
          {job.description}
        </p>
      )}
      {job.timeAgo && (
        <p className="text-xs text-gray-400 dark:text-gray-500">Posted {job.timeAgo}</p>
      )}
    </div>
    <div className="flex gap-3 mt-4">
      <button 
        onClick={() => window.open(job.redirect_url, '_blank')}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex-1 font-semibold transition-colors"
      >
        Apply Now
      </button>
      <button
        onClick={() => onBookmark(job.id)}
        className={`px-4 py-3 rounded-lg font-semibold border transition-colors ${
          bookmarked 
            ? 'bg-yellow-500 text-white border-yellow-500' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-gray-200'
        }`}
        title={bookmarked ? 'Remove Bookmark' : 'Bookmark'}
      >
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 min-h-[200px]">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const SkeletonList = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

interface EnhancedJobSearchProps {
  initialQuery?: string;
  initialLocation?: string;
}

export default function EnhancedJobSearch({ initialQuery = "", initialLocation = "" }: EnhancedJobSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance");
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({
    min: 30000,
    max: 150000,
    currency: "USD",
    period: "year"
  });
  const [showSalaryFilter, setShowSalaryFilter] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    }
    return [];
  });
  const [categories, setCategories] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

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

  const fetchJobs = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('what', searchQuery);
    if (location) params.append('where', location);
    if (jobType === 'Full-time') params.append('full_time', '1');
    if (jobType === 'Part-time') params.append('part_time', '1');
    if (jobType === 'Contract') params.append('contract', '1');
    if (selectedCategory) params.append('category', selectedCategory);
    if (showSalaryFilter) {
      params.append('salary_min', salaryRange.min.toString());
      params.append('salary_max', salaryRange.max.toString());
    }
    params.append('sort_by', sortBy);
    params.append('results_per_page', '20');

    const { data } = await axios.get(`/api/jobs/search?${params.toString()}`);
    
    return data.results.map((job: AdzunaJob) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      redirect_url: job.redirect_url,
      location: job.location.display_name,
      description: AdzunaService.cleanJobDescription(job.description),
      salaryFormatted: AdzunaService.formatSalary(job.salary_min, job.salary_max),
      timeAgo: AdzunaService.getRelativeTime(job.created)
    }));
  };

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["jobs", searchQuery, location, jobType, selectedCategory, sortBy, showSalaryFilter ? salaryRange : null],
    queryFn: fetchJobs,
    enabled: !!(searchQuery || location || jobType || selectedCategory),
  });

  const handleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) 
        ? prev.filter(jobId => jobId !== id)
        : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be triggered by the query dependency
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="🔍 Job title, skills, or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <input
              type="text"
              placeholder="📍 Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "relevance" | "date" | "salary")}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="relevance">Most Relevant</option>
              <option value="date">Most Recent</option>
              <option value="salary">Highest Salary</option>
            </select>
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Search Jobs
            </button>
          </div>
        </form>

        {showSalaryFilter && (
          <div className="mt-6 pt-6 border-t">
            <SalaryRangeSelector
              countryCode="US"
              value={salaryRange}
              onChange={setSalaryRange}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error loading jobs. Please try again.
          </div>
        )}
        
        {!isLoading && !error && jobs.length === 0 && (searchQuery || location || jobType || selectedCategory) && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}

        {!searchQuery && !location && !jobType && !selectedCategory && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start your job search</h3>
            <p className="text-gray-600 dark:text-gray-400">Enter keywords or location to find jobs</p>
          </div>
        )}

        {isLoading ? (
          <SkeletonList />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any) => (
              <JobCard 
                key={job.id} 
                job={job} 
                bookmarked={bookmarks.includes(job.id)} 
                onBookmark={handleBookmark} 
              />
            ))}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {jobs.length} jobs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
