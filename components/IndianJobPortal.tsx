"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import type { JobResult, JobSearchFilters } from "@/types/jobs";
import { sampleIndianJobs } from "@/lib/sample-indian-jobs";
import SalaryRangeSelector, { SalaryRange } from "./salary/SalaryRangeSelector";
import DynamicJobSearch from "./DynamicJobSearch";
import JobResults from "./JobResults";
import { 
  ChevronRightIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon as CurrencyRupeeIcon, 
  BuildingOffice2Icon as BuildingOfficeIcon, 
  UserGroupIcon, 
  ClockIcon, 
  FireIcon, 
  ChartBarIcon, 
  StarIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";

// Indian States
const indianStates = [
  { code: 'MH', name: 'Maharashtra' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'DL', name: 'Delhi' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'HR', name: 'Haryana' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' }
];

// Popular Indian Cities with state mapping
const popularCities = [
  { name: "Mumbai", state: 'MH', areas: ['Andheri', 'Bandra', 'Powai', 'Lower Parel', 'Goregaon'] },
  { name: "Delhi", state: 'DL', areas: ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Rohini'] },
  { name: "Bangalore", state: 'KA', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'HSR Layout'] },
  { name: "Hyderabad", state: 'TG', areas: ['Hitech City', 'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills'] },
  { name: "Pune", state: 'MH', areas: ['Hinjewadi', 'Koregaon Park', 'Viman Nagar', 'Wakad', 'Baner'] },
  { name: "Chennai", state: 'TN', areas: ['OMR', 'T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
  { name: "Kolkata", state: 'WB', areas: ['Salt Lake', 'Park Street', 'Ballygunge', 'New Town', 'Rajarhat'] },
  { name: "Ahmedabad", state: 'GJ', areas: ['Satellite', 'Vastrapur', 'Bopal', 'Prahlad Nagar', 'Thaltej'] },
  { name: "Gurgaon", state: 'HR', areas: ['Cyber City', 'Golf Course Road', 'Sohna Road', 'MG Road', 'Sector 29'] },
  { name: "Noida", state: 'UP', areas: ['Sector 62', 'Sector 18', 'Greater Noida', 'Sector 16', 'Film City'] },
  { name: "Kochi", state: 'KL', areas: ['Infopark', 'Marine Drive', 'Kakkanad', 'Edappally', 'Fort Kochi'] },
  { name: "Indore", state: 'MP', areas: ['Vijay Nagar', 'Palasia', 'Rajwada', 'Sapna Sangeeta', 'Bhawar Kuan'] },
  { name: "Bhopal", state: 'MP', areas: ['New Market', 'MP Nagar', 'Arera Colony', 'Berasia Road', 'Kolar Road'] }
];

// Popular Job Categories in India
const indianJobCategories = [
  { id: "it-jobs", name: "IT & Software", icon: "💻", trending: true },
  { id: "banking-financial-services-jobs", name: "Banking & Finance", icon: "💰", hot: true },
  { id: "teaching-jobs", name: "Teaching & Education", icon: "📚", trending: false },
  { id: "healthcare-nursing-jobs", name: "Healthcare & Medical", icon: "🏥", hot: true },
  { id: "sales-jobs", name: "Sales & Marketing", icon: "📈", trending: true },
  { id: "engineering-jobs", name: "Engineering", icon: "⚙️", hot: false },
  { id: "hr-jobs", name: "Human Resources", icon: "👥", trending: false },
  { id: "customer-services-jobs", name: "Customer Service", icon: "📞", hot: false },
];

// Experience Levels
const experienceLevels = [
  { value: "", label: "Any Experience" },
  { value: "0-1", label: "Fresher (0-1 years)" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-8", label: "5-8 years" },
  { value: "8+", label: "8+ years" }
];

// Company Types
const companyTypes = [
  { value: "", label: "All Companies" },
  { value: "startup", label: "Startups" },
  { value: "mnc", label: "MNC" },
  { value: "corporate", label: "Corporate" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" }
];

interface JobSearchFilters {
  query: string;
  location: string;
  jobType?: string;
  experienceLevel?: string;
  companySize?: string;
  salaryMin?: number;
  salaryMax?: number;
  remoteOnly?: boolean;
  category?: string}

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salaryFormatted?: string;
    type?: string;
    experience?: string;
    description?: string;
    posted?: string;
    redirect_url?: string};
  bookmarked: boolean;
  onBookmark: (jobId: string) => void}

// Job Card Component
function JobCard({ job, bookmarked, onBookmark }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{job.location}</span>
            {job.type && (
              <>
                <span className="mx-2">•</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {job.type}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => onBookmark(job.id)}
          className={`p-2 rounded-full transition-colors ${
            bookmarked 
              ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900' 
              : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900'
          }`}
        >
          <StarIcon className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {job.salaryFormatted && (
            <span className="font-semibold text-green-600 dark:text-green-400">
              {job.salaryFormatted}
            </span>
          )}
          {job.experience && (
            <span className="ml-3">{job.experience}</span>
          )}
        </div>
        <a
          href={job.redirect_url || `#`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          Apply Now
        </a>
      </div>
    </motion.div>)}

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-2/3"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </div>)}

// Category Card Component
function CategoryCard({ category, isSelected, onClick }: { 
  category: { id: string; name: string; icon: string; trending?: boolean; hot?: boolean }; 
  isSelected: boolean; 
  onClick: () => void}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
      }`}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{category.icon}</div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
          {category.name}
        </h3>
      </div>
      
      {category.trending && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
          🔥 Hot
        </div>
      )}
      
      {category.hot && !category.trending && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          ⭐ New
        </div>
      )}
    </motion.div>)}

// Trending Jobs Section Component
function TrendingJobsSection() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FireIcon className="w-6 h-6 mr-2 text-orange-500" />
          Trending Job Categories
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Click to search instantly
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {indianJobCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={false}
            onClick={() => {
              // Will be handled by parent component
            }}
          />
        ))}
      </div>
    </div>)}

// Quick Filters Section Component
function QuickFiltersSection({ 
  onCitySelect, 
  onCategorySelect 
}: { 
  onCitySelect: (city: string) => void;
  onCategorySelect: (category: string) => void}) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white mb-8">
      <h2 className="text-2xl font-bold mb-6 text-center">🚀 Quick Job Search</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Popular Cities */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2" />
            Popular Cities
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {popularCities.slice(0, 6).map((city) => (
              <button
                key={city.name}
                onClick={() => onCitySelect(city.name)}
                className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-xs opacity-75">{city.state}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Categories */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Quick Categories
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onCategorySelect("software engineer")}
              className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="font-medium">🖥️ Tech Jobs</div>
              <div className="text-xs opacity-75">Software, IT, Development</div>
            </button>
            <button
              onClick={() => onCategorySelect("marketing manager")}
              className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="font-medium">📈 Marketing Jobs</div>
              <div className="text-xs opacity-75">Digital, Content, Sales</div>
            </button>
            <button
              onClick={() => onCategorySelect("data analyst")}
              className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="font-medium">📊 Data Jobs</div>
              <div className="text-xs opacity-75">Analytics, Science, Research</div>
            </button>
          </div>
        </div>
      </div>
    </div>)}

export default function IndianJobPortal() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({ 
    min: 0, 
    max: 2000000, 
    currency: 'INR', 
    period: 'year' 
  });
  const [showSalaryFilter, setShowSalaryFilter] = useState(false);
  const [showAdvancedLocation, setShowAdvancedLocation] = useState(false);
  
  // UI state
  const [showLegacySearch, setShowLegacySearch] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  
  // Dynamic search state
  const [currentJobs, setCurrentJobs] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<JobSearchFilters>({
    query: '',
    location: ''
  });

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('jobBookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))}
  }, []);

  // Save bookmarks to localStorage
  const handleBookmark = useCallback((jobId: string) => {
    const newBookmarks = bookmarks.includes(jobId)
      ? bookmarks.filter(id => id !== jobId)
      : [...bookmarks, jobId];
    
    setBookmarks(newBookmarks);
    localStorage.setItem('jobBookmarks', JSON.stringify(newBookmarks))}, [bookmarks]);

  // Handle job updates from dynamic search
  const handleJobsUpdate = useCallback((jobs: JobResult[]) => {
    setCurrentJobs(jobs)}, []);

  // Handle filter changes from dynamic search
  const handleFiltersChange = useCallback((filters: JobSearchFilters) => {
    setCurrentFilters(filters)}, []);

  // Handle quick city selection
  const handleQuickCitySelect = useCallback((city: string) => {
    if (showLegacySearch) {
      setLocation(city)} else {
      setCurrentFilters(prev => ({ ...prev, location: city }))}
  }, [showLegacySearch]);

  // Handle quick category selection
  const handleQuickCategorySelect = useCallback((query: string) => {
    if (showLegacySearch) {
      setSearchQuery(query);
      setSelectedCategory(query)} else {
      setCurrentFilters(prev => ({ ...prev, query, category: query }))}
  }, [showLegacySearch]);

  // Fetch jobs using React Query
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['indianJobs', searchQuery, location, jobType, experienceLevel, companyType, selectedCategory],
    queryFn: async () => {
      if (!searchQuery && !location && !jobType && !selectedCategory) {
        return []}

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (location) params.append('location', location);
        if (jobType) params.append('job_type', jobType);
        if (experienceLevel) params.append('experience_level', experienceLevel);
        if (companyType) params.append('company_type', companyType);
        
        const response = await axios.get(`/api/jobs?${params.toString()}`);
        return response.data.jobs || []} catch (error) {
    console.error("Error:", error);
    throw error}
        // console.warn('API failed, using sample data:', error);
        return []}
    },
    enabled: !!(searchQuery || location || jobType || selectedCategory),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically trigger due to the dependency array
  }, []);

  // Display jobs (API results or sample data)
  const displayJobs = jobs.length > 0 ? jobs : (
    (searchQuery || location || jobType || selectedCategory) ? sampleIndianJobs.slice(0, 12) : sampleIndianJobs.slice(0, 6)
  );

  // Enhanced sample jobs with redirect URLs
  const enhancedSampleJobs = sampleIndianJobs.map(job => ({
    ...job,
    redirect_url: `/jobs/${job.id}`,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4"
          >
            🇮🇳 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Naukri Mili</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-8"
          >
            Your gateway to Indian job opportunities with dynamic search and location detection
          </motion.p>

          {/* Search Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowLegacySearch(false)}
                className={`px-6 py-2 rounded-md transition-all ${
                  !showLegacySearch 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                🚀 Dynamic Search
              </button>
              <button
                onClick={() => setShowLegacySearch(true)}
                className={`px-6 py-2 rounded-md transition-all ${
                  showLegacySearch 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                📋 Advanced Search
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Search Section */}
        {!showLegacySearch ? (
          <div className="space-y-8">
            {/* Trending Jobs Section */}
            <TrendingJobsSection />
            
            {/* Quick Filters */}
            <QuickFiltersSection 
              onCitySelect={handleQuickCitySelect}
              onCategorySelect={handleQuickCategorySelect}
            />

            {/* New Dynamic Search Component */}
            <DynamicJobSearch
              onJobsUpdate={handleJobsUpdate}
              onFiltersChange={handleFiltersChange}
              className="mb-8"
            />

            {/* Job Results */}
            <JobResults
              jobs={currentJobs}
              isLoading={false}
              className="mt-8"
            />
          </div>
        ) : (
          /* Legacy Search Interface with Full Filters */
          <div className="space-y-8">
            {/* Trending Jobs Section */}
            <TrendingJobsSection />
            
            {/* Quick Filters */}
            <QuickFiltersSection 
              onCitySelect={handleQuickCitySelect}
              onCategorySelect={handleQuickCategorySelect}
            />

            {/* Legacy Search Form with All Original Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Search Query */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      🔍 What job are you looking for?
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      📍 Where do you want to work?
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Mumbai, Bangalore, Delhi, Remote"
                    />
                  </div>
                </div>

                {/* Filter Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      💼 Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      🎯 Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      🏢 Company Type
                    </label>
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {companyTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Filters Toggle */}
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => setShowSalaryFilter(!showSalaryFilter)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-colors border-2 ${
                      showSalaryFilter 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    💰 Salary Filter
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {;
                      setSearchQuery("");
                      setLocation("");
                      setJobType("");
                      setExperienceLevel("");
                      setCompanyType("")}}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🚀 Search Jobs
                  </button>
                </div>
              </form>

              {/* Salary Filter */}
              {showSalaryFilter && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    💰 Salary Range (Indian Rupees)
                  </h3>
                  <SalaryRangeSelector
                    countryCode="IN"
                    value={salaryRange}
                    onChange={setSalaryRange}
                  />
                </div>
              )}
            </div>

            {/* Legacy Job Results */}
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl">
                  <h3 className="font-semibold mb-2">❌ Error Loading Jobs</h3>
                  <p>Unable to fetch jobs. Please check your internet connection and try again.</p>
                </div>
              )}
              
              {!isLoading && !error && displayJobs.length === 0 && (searchQuery || location || jobType || selectedCategory) && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Jobs Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search criteria or explore trending jobs above
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' jobs ' + location)}&ibp=htl;jobs`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-lg shadow-lg"
                    >
                      Search on Google Jobs
                    </a>
                  </div>
                </div>
              )}

              {!searchQuery && !location && !jobType && !selectedCategory && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Start Your Job Search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter keywords, select location, or click on trending categories above
                  </p>
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <>
                  {displayJobs.length > 0 && (
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🎯 {jobs.length > 0 ? `Found ${jobs.length}` : `Featured ${displayJobs.length}`} Jobs
                      </h2>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {jobs.length > 0 ? 'Search results' : 'Sample jobs to get you started'}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayJobs.map((job: Record<string, unknown>) => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        bookmarked={bookmarks.includes(job.id)} 
                        onBookmark={handleBookmark} 
                      />
                    ))}
                  </div>
                </>
              )}

              {displayJobs.length > 0 && (
                <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {jobs.length > 0 ? '🎉 That\'s all for now!' : '🚀 Ready to find your dream job?'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {jobs.length > 0 
                      ? `Showing ${jobs.length} jobs. Try different keywords for more opportunities.`
                      : `These are sample jobs from top Indian companies. Use the search above to find real opportunities!`
                    }
                  </p>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {jobs.length > 0 ? '⬆️ Search Again' : '🔍 Start Job Search'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )}
