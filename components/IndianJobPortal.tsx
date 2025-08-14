"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import { sampleIndianJobs } from "@/lib/sample-indian-jobs";
import SalaryRangeSelector, { SalaryRange } from "./salary/SalaryRangeSelector";
import DynamicJobSearch from "./DynamicJobSearch";
import JobResults from "./JobResults";
import EnhancedJobCard from "./EnhancedJobCard";
import EnhancedFilters from "./EnhancedFilters";
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
import { JobSearchFilters } from "@/hooks/useRealTimeJobSearch";
// import { useJobSearch, useJobBookmarks } from "@/hooks/useEnhancedJobSearch";
// import { JobResult } from "@/types/jobs";

// Temporary types and placeholders
interface JobResult {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryFormatted?: string;
  timeAgo?: string;
  description?: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType?: string;
}

interface ExtendedJobSearchFilters extends JobSearchFilters {
  page: number;
  limit: number;
}

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
    isUrgent?: boolean;
    isRemote?: boolean;
    jobType?: string;
  };
  bookmarked: boolean;
  onBookmark: (id: string) => void;
}

const JobCard = ({ job, bookmarked, onBookmark }: JobCardProps) => (
  <div className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Job Card Header */}
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
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2 ml-2">
              🏠 Remote
            </span>
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company}</span>
          </div>
          {job.location && (
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <span>{job.location}</span>
              {job.jobType && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {job.jobType}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onBookmark(job.id)}
          className={`p-2 rounded-full transition-colors ${
            bookmarked
              ? 'bg-secondary/20 text-secondary hover:bg-secondary/30'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
          }`}
          title={bookmarked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {job.salaryFormatted && (
        <div className="flex items-center text-green-600 dark:text-green-400 font-semibold mb-3">
          <CurrencyRupeeIcon className="w-5 h-5 mr-1" />
          <span className="text-lg">{job.salaryFormatted}</span>
        </div>
      )}

      {job.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {job.timeAgo && (
          <div className="flex items-center text-gray-400 text-sm">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Posted {job.timeAgo}</span>
          </div>
        )}
      </div>
    </div>

    {/* Job Card Footer */}
    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex gap-3">
      <Link href={job.redirect_url} passHref>
        <a target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
          Apply Now
          <ChevronRightIcon className="w-4 h-4" />
        </a>
      </Link>
      <button 
        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => {
          // Quick apply functionality
          alert('Quick Apply feature - Save your profile to apply instantly!');
        }}
      >
        Quick Apply
      </button>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const TrendingJobsSection = () => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-6">
      <ChartBarIcon className="w-6 h-6 text-orange-500" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Jobs in India</h2>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {indianJobCategories.map((category) => (
        <div
          key={category.id}
          onClick={() => {
            setSearchFilters(prev => ({ ...prev, query: category.name, page: 1 }));
            setShowLegacySearch(false);
          }}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 ${
            category.trending 
              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/20 dark:to-red-900/20' 
              : category.hot
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
          }`}
        >
          {category.trending && (
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              🔥 Trending
            </span>
          )}
          {category.hot && !category.trending && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              ⭐ Hot
            </span>
          )}
          <div className="text-center">
            <div className="text-3xl mb-2">{category.icon}</div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {category.name}
            </h3>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickFiltersSection = ({ onCitySelect, onCategorySelect }: { 
  onCitySelect: (city: string) => void;
  onCategorySelect: (category: string) => void;
}) => (
  <div className="mb-8 space-y-6">
        {/* Popular Cities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🏙️ Popular Cities
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularCities.map((city) => (
              <button
                key={city.name}
                onClick={() => onCitySelect(city.name)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
  </div>
);

// Location interface
interface LocationFilter {
  country: string;
  state: string;
  city: string;
  area: string;
}

interface IndianJobPortalProps {
  initialQuery?: string;
  initialLocation?: string;
}

// Location interface for current location
interface CurrentLocationState {
  isLoading: boolean;
  coordinates?: { lat: number; lng: number };
  city?: string;
  state?: string;
  error?: string;
}

export default function IndianJobPortal({ initialQuery = "developer", initialLocation = "London" }: IndianJobPortalProps) {
  // Temporary mock data and states
  const [searchFilters, setSearchFilters] = useState<any>({
    query: initialQuery,
    location: initialLocation,
    page: 1,
    limit: 10,
  });

  // Mock data for enhanced search
  const [jobData, setJobData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bookmarks: any[] = [];

  // State for the new dynamic search
  const [currentJobs, setCurrentJobs] = useState<any[]>(jobData?.jobs || []);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [showLegacySearch, setShowLegacySearch] = useState(true);

  // Update jobs when data changes (temporarily disabled)
  useEffect(() => {
    const fetchRealJobs = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          q: searchFilters.query || '',
          location: searchFilters.location || '',
          country: 'IN',
          limit: String(searchFilters.limit || 10),
          page: String(searchFilters.page || 1),
          sort_by: 'relevance',
        });
        const { data } = await axios.get(`/api/jobs?${params.toString()}`);
        setJobData(data);
        setCurrentJobs(data?.jobs || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load jobs');
        // Fallback to sample data
        setJobData({
          jobs: sampleIndianJobs.slice(0, 6).map(j => ({ ...j, redirect_url: `/jobs/${j.id}` })),
          pagination: { page: 1, limit: 10, total: sampleIndianJobs.length },
          availableFilters: { jobTypes: [], experienceLevels: [], sectors: [], locations: [], companies: [] },
        });
        setCurrentJobs(sampleIndianJobs.slice(0, 6).map(j => ({ ...j, redirect_url: `/jobs/${j.id}` })));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRealJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters.query, searchFilters.location, searchFilters.page, searchFilters.limit]);

  // Legacy state (kept for backward compatibility)
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({
    country: 'India',
    state: '',
    city: '',
    area: ''
  });
  const [currentLocation, setCurrentLocation] = useState<CurrentLocationState>({
    isLoading: false
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance");
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({
    min: 300000,    // ₹3 LPA
    max: 2000000,   // ₹20 LPA
    currency: "INR",
    period: "year"
  });
  const [showSalaryFilter, setShowSalaryFilter] = useState(false);
  const [showAdvancedLocation, setShowAdvancedLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [legacyBookmarks, setLegacyBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    }
    return [];
  });
  const [categories, setCategories] = useState<Array<{id: string, label: string}>>([]);
  const [availableCities, setAvailableCities] = useState<typeof popularCities>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);

  // Handle dynamic search updates
  const handleJobsUpdate = useCallback((jobs: any[]) => {
    setCurrentJobs(jobs);
  }, []);

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
    setSearchFilters(filters);
  }, []);

  useEffect(() => {
    localStorage.setItem('bookmarkedJobs', JSON.stringify(legacyBookmarks));
  }, [legacyBookmarks]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/jobs/categories');
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Set default categories as fallback
        setCategories([
          { id: 'technology', label: 'Technology' },
          { id: 'healthcare', label: 'Healthcare' },
          { id: 'finance', label: 'Finance' },
          { id: 'education', label: 'Education' },
          { id: 'marketing', label: 'Marketing' },
          { id: 'sales', label: 'Sales' },
          { id: 'design', label: 'Design' },
          { id: 'engineering', label: 'Engineering' },
          { id: 'human-resources', label: 'Human Resources' },
          { id: 'operations', label: 'Operations' }
        ]);
      }
    };
    fetchCategories();
  }, []);

  // ... rest of the component code would continue here
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Find Your Dream Job
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Real-time job search across US, UK, India & UAE
            </p>
          </motion.div>
        </div>

        {/* Toggle between new and legacy search */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowLegacySearch(false)}
              className={`px-6 py-2 rounded-md transition-all ${
                !showLegacySearch
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MagnifyingGlassIcon className="h-5 w-5 inline mr-2" />
              Dynamic Search
            </button>
            <button
              onClick={() => setShowLegacySearch(true)}
              className={`px-6 py-2 rounded-md transition-all ${
                showLegacySearch
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 inline mr-2" />
              Advanced Search
            </button>
          </div>
        </div>

        {/* Dynamic Search Section */}
        {!showLegacySearch ? (
          <div className="space-y-8">
            {/* Enhanced Search with PostgreSQL */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <EnhancedFilters
                filters={searchFilters}
                onFiltersChange={handleFiltersChange}
                onReset={() => setSearchFilters({ query: '', location: '', page: 1, limit: 10 })}
                availableFilters={jobData?.availableFilters}
                className="mb-6"
              />
            </div>

            {/* Enhanced Job Results */}
            <div className="space-y-6">
              {isLoading ? (
                // Loading skeleton
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : error ? (
                // Error state
                <div className="text-center py-12">
                  <div className="text-red-500 text-lg mb-4">
                    Error loading jobs: {typeof error === 'string' ? error : 'Unknown error'}
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : currentJobs.length === 0 ? (
                // No results state with Google fallback
                <div className="text-center py-12">
                  <div className="mb-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <div className="text-gray-500 text-xl mb-2">
                      No jobs found matching your criteria
                    </div>
                    <div className="text-gray-400 text-sm mb-6">
                      We searched our database but couldn't find any matching positions
                    </div>
                  </div>
                  
                  {/* Google Search Fallback */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-6 border border-blue-200 dark:border-gray-600">
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      🌐 Search on Google Instead?
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      We'll search Google Jobs with your exact criteria for broader results
                    </div>
                    <button
                      onClick={() => {
                        // Use API-provided Google URL if available, otherwise build manually
                        let googleUrl;
                        if (jobData?.googleFallback?.google_url) {
                          googleUrl = jobData.googleFallback.google_url;
                        } else {
                          const query = searchFilters.query || 'jobs';
                          const location = searchFilters.location || 'India';
                          googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' jobs in ' + location)}&ibp=htl;jobs`;
                        }
                        window.open(googleUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Search on Google Jobs
                    </button>
                  </div>

                  {/* Alternative Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setSearchFilters({ query: '', location: '', page: 1, limit: 10 })}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => {
                        // Suggest popular searches
                        setSearchFilters({ 
                          query: 'developer', 
                          location: 'Mumbai', 
                          page: 1, 
                          limit: 10 
                        });
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Try Popular Search
                    </button>
                  </div>

                  {/* Additional Search Platforms */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Or search on other platforms:
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => {
                          let linkedinUrl;
                          if (jobData?.googleFallback?.alternative_platforms?.linkedin) {
                            linkedinUrl = jobData.googleFallback.alternative_platforms.linkedin;
                          } else {
                            const query = searchFilters.query || 'jobs';
                            const location = searchFilters.location || 'India';
                            linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
                          }
                          window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </button>
                      <button
                        onClick={() => {
                          let indeedUrl;
                          if (jobData?.googleFallback?.alternative_platforms?.indeed) {
                            indeedUrl = jobData.googleFallback.alternative_platforms.indeed;
                          } else {
                            const query = searchFilters.query || 'jobs';
                            const location = searchFilters.location || 'India';
                            indeedUrl = `https://indeed.co.in/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
                          }
                          window.open(indeedUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
                          <path d="M11 6h2v12h-2z"/>
                        </svg>
                        Indeed
                      </button>
                      <button
                        onClick={() => {
                          let naukriUrl;
                          if (jobData?.googleFallback?.alternative_platforms?.naukri) {
                            naukriUrl = jobData.googleFallback.alternative_platforms.naukri;
                          } else {
                            const query = searchFilters.query || 'jobs';
                            const location = searchFilters.location || 'India';
                            naukriUrl = `https://www.naukri.com/jobs-in-${encodeURIComponent(location.toLowerCase())}-for-${encodeURIComponent(query)}`;
                          }
                          window.open(naukriUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Naukri
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Enhanced job cards
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentJobs.map((job) => (
                    <EnhancedJobCard
                      key={job.id}
                      job={job}
                      isBookmarked={bookmarks.some(b => b.jobId === job.id)}
                      onBookmark={(jobId) => {
                        // Handle bookmarking through API
                        console.log('Bookmark job:', jobId);
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {jobData && jobData.pagination.total > jobData.pagination.limit && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setSearchFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={searchFilters.page <= 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600 dark:text-gray-400">
                    Page {jobData.pagination.page} of {Math.ceil(jobData.pagination.total / jobData.pagination.limit)}
                  </span>
                  <button
                    onClick={() => setSearchFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={searchFilters.page >= Math.ceil(jobData.pagination.total / jobData.pagination.limit)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Legacy Search Interface */
          <div className="space-y-8">
            {/* Trending Jobs Section */}
            <TrendingJobsSection />
            
            {/* Quick Filters */}
            <QuickFiltersSection 
              onCitySelect={(city) => setLocation(city)}
              onCategorySelect={(category) => setSelectedCategory(category)}
            />

            {/* Basic search form for legacy mode */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                🔍 Job Search
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title / Keywords
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Bangalore"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  >
                    <option value="">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <button
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Search Jobs
                </button>
              </div>
            </div>

            {/* Sample Jobs Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleIndianJobs.slice(0, 6).map((job: any) => (
                <JobCard 
                  key={job.id} 
                  job={{
                    ...job,
                    redirect_url: `/jobs/${job.id}`
                  }} 
                  bookmarked={legacyBookmarks.includes(job.id)} 
                  onBookmark={(id) => setLegacyBookmarks(prev => 
                    prev.includes(id) 
                      ? prev.filter(jobId => jobId !== id)
                      : [...prev, id]
                  )} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}