"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building, Briefcase, TrendingUp, Filter, ChevronDown, Globe, Navigation, Target, MapPinOff } from 'lucide-react';

import { useLocationDetection } from '@/hooks/useLocationDetection';
import ErrorBoundary from '@/components/ErrorBoundary';
import GoogleCSESearch from '@/components/GoogleCSESearch';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  getSmartLocation, 
  getGeolocationErrorMessage, 
  getMobileGeolocationOptions 
} from '@/lib/mobile-geolocation';
import { trackExternalApplication } from '@/lib/jobs/external-application-tracker';

interface Job {
  id: string | number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  isRemote: boolean;
  isFeatured: boolean;
  source: string;
  createdAt: string;
  source_url?: string; // Added for external jobs
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [selectedJobType, setSelectedJobType] = useState(searchParams.get('jobType') || '');
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('experienceLevel') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'IN');
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') === 'true');
  const [includeExternal, setIncludeExternal] = useState(true);
  const [source, setSource] = useState<'all' | 'db' | 'external'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsPerPage] = useState(10);



  // Location detection hook
  const { location: detectedLocation, isLoading: isDetectingLocation } = useLocationDetection({
    autoDetect: false,
    fallbackCountry: 'IN'
  });

  // Location-based search state
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Dynamic locations with job counts and coordinates
  const locationOptions = [
    { name: 'All Locations', value: '', icon: '🌍' },
    { name: 'My Location', value: 'current', icon: '📍', special: true },
    { name: 'Bangalore', value: 'Bangalore', icon: '💻', country: 'IN', jobCount: 2100 },
    { name: 'Mumbai', value: 'Mumbai', icon: '🏙️', country: 'IN', jobCount: 1250 },
    { name: 'Delhi', value: 'Delhi', icon: '🏛️', country: 'IN', jobCount: 980 },
    { name: 'Hyderabad', value: 'Hyderabad', icon: '🏢', country: 'IN', jobCount: 850 },
    { name: 'Chennai', value: 'Chennai', icon: '🏭', country: 'IN', jobCount: 720 },
    { name: 'Pune', value: 'Pune', icon: '🚗', country: 'IN', jobCount: 650 },
    { name: 'Kolkata', value: 'Kolkata', icon: '🎭', country: 'IN', jobCount: 580 },
    { name: 'New York', value: 'New York', icon: '🗽', country: 'US', jobCount: 3200 },
    { name: 'London', value: 'London', icon: '🇬🇧', country: 'UK', jobCount: 2800 },
    { name: 'Dubai', value: 'Dubai', icon: '🏗️', country: 'AE', jobCount: 1500 },
    { name: 'Toronto', value: 'Toronto', icon: '🍁', country: 'CA', jobCount: 1800 },
    { name: 'Sydney', value: 'Sydney', icon: '🦘', country: 'AU', jobCount: 1200 }
  ];
  const jobTypes = ['All Types', 'full-time', 'part-time', 'contract', 'internship'];
  const experienceLevels = ['All Levels', 'entry', 'mid', 'senior', 'executive'];
  const countries = [
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AE', name: 'UAE' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, selectedLocation, selectedJobType, selectedExperience, isRemote, selectedCountry, includeExternal, source, currentPage, userCoordinates, searchRadius, sortByDistance]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedLocation && selectedLocation !== 'All Locations') params.append('location', selectedLocation);
      if (selectedJobType && selectedJobType !== 'All Types') params.append('jobType', selectedJobType);
      if (selectedExperience && selectedExperience !== 'All Levels') params.append('experienceLevel', selectedExperience);
      if (isRemote) params.append('isRemote', 'true');
      if (selectedCountry) params.append('country', selectedCountry);
      if (includeExternal) params.append('includeExternal', 'true');
      if (source) params.append('source', source);
      
      // Add location-based search parameters
      if (userCoordinates) {
        params.append('lat', userCoordinates.lat.toString());
        params.append('lng', userCoordinates.lng.toString());
        params.append('radius', searchRadius.toString());
        if (sortByDistance) params.append('sortByDistance', 'true');
        params.append('includeDistance', 'true');
      }
      
      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', jobsPerPage.toString());

      // Use the new unified API
      const response = await fetch(`/api/jobs/unified?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        
        // Update pagination data
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalJobs(data.pagination.total);
        }
        
        console.log(`✅ Fetched ${data.jobs.length} jobs from ${data.sources.database ? 'database' : ''}${data.sources.external ? ' and external APIs' : ''}`);
      } else {
        setError(data.error || 'Failed to load jobs');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchJobs();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedJobType('');
    setSelectedExperience('');
    setIsRemote(false);
    setSelectedCountry('IN');
    setIncludeExternal(true);
    setSource('all');
    setCurrentPage(1); // Reset to first page
    
    // Clear location-based filters
    clearLocationFilters();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // Location detection functions
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsLocationDetected(true);
      
      // Use mobile-optimized geolocation
      const options = getMobileGeolocationOptions();
      const result = await getSmartLocation(options);
      
      if (result.success) {
        if (result.coordinates) {
          setUserCoordinates(result.coordinates);
        }
        
        const cityName = result.city || 'Current Location';
        const countryCode = result.country || 'IN';
        
        setSelectedLocation(cityName);
        setSelectedCountry(countryCode);
        setIsLocationDetected(false);
        
        // Trigger job search with new location
        setCurrentPage(1);
        fetchJobs();
        
        console.log(`✅ Location detected: ${cityName} (${result.source})`);
      } else {
        // Handle error with user-friendly message
        const errorMessage = getGeolocationErrorMessage(result.errorCode);
        alert(errorMessage);
        setIsLocationDetected(false);
      }
      
    } catch (error: any) {
      console.error('Location detection failed:', error);
      setIsLocationDetected(false);
      alert('An unexpected error occurred while detecting location. Please try again.');
    }
  }, [fetchJobs]);

  const handleLocationChange = (locationValue: string) => {
    if (locationValue === 'current') {
      detectCurrentLocation();
      return;
    }
    
    setSelectedLocation(locationValue);
    setUserCoordinates(null);
    setSortByDistance(false);
    setCurrentPage(1);
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    setCurrentPage(1);
  };

  const handleSortByDistance = (sort: boolean) => {
    setSortByDistance(sort);
    setCurrentPage(1);
  };

  const clearLocationFilters = () => {
    setUserCoordinates(null);
    setSearchRadius(25);
    setSortByDistance(false);
    setSelectedLocation('');
    setCurrentPage(1);
  };

  const importJobsFromCountry = async (countryCode: string) => {
    try {
      setLoading(true);
      console.log(`🚀 Importing jobs from ${countryCode}...`);
      
      const response = await fetch('/api/jobs/import-multi-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countries: [countryCode],
          maxJobsPerCountry: 100
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Imported ${result.summary.totalPersisted} jobs from ${countryCode}`);
        // Refresh jobs after import
        fetchJobs();
      } else {
        console.error('Failed to import jobs');
      }
    } catch (error) {
      console.error('Error importing jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination for large numbers
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <ErrorBoundary>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
                AI-Powered Job Search
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Dream Job
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover thousands of opportunities across multiple countries with intelligent matching
              </p>
            </div>

                         {/* Location Detection Prompt */}
             {!userCoordinates && (
               <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 lg:p-8 mb-8 border border-amber-200/50">
                 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                       <Target className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h3 className="text-xl lg:text-2xl font-semibold text-amber-900 mb-1">🔍 Find Jobs Near You</h3>
                       <p className="text-amber-700 text-sm">
                         Enable location access to discover opportunities in your area and get distance-based job recommendations
                       </p>
                     </div>
                   </div>
                   
                   <button
                     onClick={detectCurrentLocation}
                     disabled={isLocationDetected}
                     className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                   >
                     {isLocationDetected ? (
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     ) : (
                       <Target className="w-5 h-5" />
                     )}
                     {isLocationDetected ? 'Detecting Location...' : 'Use My Location'}
                   </button>
                 </div>
               </div>
             )}

             {/* Enhanced Search and Filters */}
             <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 lg:p-8 mb-8">
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Main Search Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
                  <div className="lg:col-span-2">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 group-focus-within:text-blue-600 transition-all duration-300" />
                      <input
                        type="text"
                        placeholder="Search jobs, companies, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-lg placeholder-gray-500 text-gray-800 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                  
                                     <div className="relative">
                     <select
                       value={selectedLocation}
                       onChange={(e) => handleLocationChange(e.target.value)}
                       className="w-full px-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md cursor-pointer pr-12"
                     >
                       {locationOptions.map((location) => (
                         <option key={location.value || location.name} value={location.value}>
                           {location.icon} {location.name}
                           {location.jobCount && ` (${location.jobCount.toLocaleString()})`}
                         </option>
                       ))}
                     </select>
                     
                     {/* Location detection button */}
                     <button
                       type="button"
                       onClick={detectCurrentLocation}
                       disabled={isLocationDetected}
                       className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       title="Use my current location"
                     >
                       {isLocationDetected ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                       ) : (
                         <Target className="h-4 w-4" />
                       )}
                     </button>
                   </div>
                  
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="px-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'All Types' ? 'All Types' : type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="px-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level === 'All Levels' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                                 {/* Advanced Filters Row */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
                   <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl hover:from-blue-100/80 hover:to-indigo-100/80 transition-all duration-300 cursor-pointer border border-blue-200/30 hover:border-blue-300/50 shadow-sm hover:shadow-md">
                     <input
                       type="checkbox"
                       checked={isRemote}
                       onChange={(e) => setIsRemote(e.target.checked)}
                       className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                     />
                     <label className="text-gray-700 font-medium cursor-pointer select-none">Remote Only</label>
                   </div>
                   
                   <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl hover:from-green-100/80 hover:to-emerald-100/80 transition-all duration-300 cursor-pointer border border-green-200/30 hover:border-green-300/50 shadow-sm hover:shadow-md">
                     <input
                       type="checkbox"
                       checked={includeExternal}
                       onChange={(e) => setIncludeExternal(e.target.checked)}
                       className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 transition-all duration-200"
                     />
                     <label className="text-gray-700 font-medium cursor-pointer select-none">Include External Jobs</label>
                   </div>
                   
                   {/* Location-based search controls */}
                   {userCoordinates && (
                     <>
                       <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50/80 to-violet-50/80 rounded-2xl hover:from-purple-100/80 hover:to-violet-100/80 transition-all duration-300 cursor-pointer border border-purple-200/30 hover:border-purple-300/50 shadow-sm hover:shadow-md">
                         <input
                           type="checkbox"
                           checked={sortByDistance}
                           onChange={(e) => handleSortByDistance(e.target.checked)}
                           className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 transition-all duration-200"
                         />
                         <label className="text-gray-700 font-medium cursor-pointer select-none">Sort by Distance</label>
                       </div>
                       
                       <div className="col-span-2 p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-2xl border border-orange-200/30">
                         <div className="flex items-center justify-between mb-2">
                           <label className="text-gray-700 font-medium text-sm">Search Radius: {searchRadius}km</label>
                           <button
                             type="button"
                             onClick={clearLocationFilters}
                             className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                           >
                             Clear
                           </button>
                         </div>
                         <input
                           type="range"
                           min="1"
                           max="100"
                           value={searchRadius}
                           onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                           className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                         />
                         <div className="flex justify-between text-xs text-gray-500 mt-1">
                           <span>1km</span>
                           <span>25km</span>
                           <span>50km</span>
                           <span>100km</span>
                         </div>
                       </div>
                     </>
                   )}

                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as 'all' | 'db' | 'external')}
                    className="px-4 py-4 border-2 border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/80 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium hover:bg-gray-100/80 focus:bg-white shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <option value="all">All Sources</option>
                    <option value="db">Database Only</option>
                    <option value="external">External APIs Only</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200/60">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-6 py-3 text-gray-600 border-2 border-gray-300/60 rounded-2xl hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-95"
                    >
                      Clear Filters
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Search Jobs
                  </button>
                </div>
              </form>
            </div>

                         {/* Location Status and "Jobs Near You" Section */}
             {userCoordinates && (
               <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 lg:p-8 mb-8 border border-green-200/50">
                 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                       <Navigation className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h3 className="text-xl lg:text-2xl font-semibold text-green-900 mb-1">📍 Jobs Near You</h3>
                       <p className="text-green-700 text-sm">
                         Searching within {searchRadius}km of your current location
                         {selectedLocation && selectedLocation !== 'All Locations' && (
                           <span> • {selectedLocation}</span>
                         )}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <button
                       onClick={clearLocationFilters}
                       className="inline-flex items-center gap-2 px-4 py-2 text-green-700 border border-green-300 rounded-xl hover:bg-green-100 transition-all duration-200 text-sm font-medium"
                     >
                       <MapPinOff className="w-4 h-4" />
                       Clear Location
                     </button>
                     
                     <button
                       onClick={detectCurrentLocation}
                       disabled={isLocationDetected}
                       className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 text-sm font-medium"
                     >
                       {isLocationDetected ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                       ) : (
                         <Target className="w-4 h-4" />
                       )}
                       {isLocationDetected ? 'Detecting...' : 'Update Location'}
                     </button>
                   </div>
                 </div>
                 
                 {/* Location coordinates display */}
                 <div className="bg-white/60 rounded-2xl p-4 border border-green-200/50">
                   <div className="flex items-center gap-4 text-sm text-green-800">
                     <span className="font-medium">Your coordinates:</span>
                     <span className="font-mono bg-green-100 px-2 py-1 rounded">
                       {userCoordinates.lat.toFixed(6)}, {userCoordinates.lng.toFixed(6)}
                     </span>
                     <span className="text-green-600">
                       • Accuracy: ~{Math.round((userCoordinates.lat * 1000000) % 100)}m
                     </span>
                   </div>
                 </div>
               </div>
             )}

             {/* Enhanced Quick Import Section */}
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 lg:p-8 mb-8 border border-blue-200/50">
              <h3 className="text-xl lg:text-2xl font-semibold text-blue-900 mb-6 flex items-center gap-3">
                Quick Job Import
              </h3>
              <p className="text-blue-700 mb-6 max-w-2xl">
                Instantly populate your job search with opportunities from different countries and regions.
              </p>
              <div className="flex flex-wrap gap-3">
                {countries.slice(0, 4).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => importJobsFromCountry(country.code)}
                    disabled={loading}
                    className="group px-6 py-3 bg-white text-blue-700 rounded-2xl hover:bg-blue-50 disabled:opacity-50 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-200"
                  >
                    Import from {country.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Results Section */}
            <div className="space-y-6">
              {loading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center gap-3 mb-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-xl font-medium text-gray-600">Searching for jobs...</span>
                  </div>
                  <p className="text-gray-500">This may take a few moments</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">!</span>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && jobs.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No jobs found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Try adjusting your search criteria or import jobs from different countries to discover more opportunities.
                  </p>
                  
                  {/* Google CSE Integration for No Jobs Found */}
                  {searchQuery && (
                    <div className="mb-6">
                      <GoogleCSESearch 
                        searchQuery={searchQuery}
                        location={selectedLocation}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => importJobsFromCountry('IN')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
                    >
                      Import Sample Jobs
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Google CSE will show additional job opportunities from across the web
                  </p>
                </div>
              )}

              {!loading && !error && jobs.length > 0 && (
                <>
                                     {/* Results Header */}
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-white/30">
                     <div>
                       <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                         Found {totalJobs.toLocaleString()} jobs
                       </h2>
                       <div className="flex items-center gap-2 text-gray-600">
                         <span className="text-sm">
                           Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs.toLocaleString()} jobs
                         </span>
                       </div>
                     </div>
                     

                   </div>

                                       {/* Google CSE Integration - Shows Results Inline */}
                    {searchQuery && (
                      <div className="mb-6">
                        <GoogleCSESearch 
                          searchQuery={searchQuery}
                          location={selectedLocation}
                          className="w-full"
                        />
                      </div>
                    )}

                  {/* Enhanced Job Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {jobs.map((job) => (
                      <div key={job.id} className="group bg-white/90 backdrop-blur-md border border-gray-200/60 rounded-3xl p-6 lg:p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-100/50">
                        {/* Job Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                              {job.title}
                            </h3>
                            
                            {/* Company and Location Info */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Building className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <span className="font-medium truncate">
                                  {job.company || 'Company not specified'}
                                </span>
                              </div>
                              
                                                             <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                 {job.location && (
                                   <div className="flex items-center gap-2">
                                     <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                     <span className="text-sm">{job.location}</span>
                                   </div>
                                 )}
                                 {job.jobType && (
                                   <div className="flex items-center gap-2">
                                     <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                     <span className="text-sm capitalize">{job.jobType}</span>
                                   </div>
                                 )}
                                 {job.experienceLevel && (
                                   <div className="flex items-center gap-2">
                                     <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                     <span className="text-sm capitalize">{job.experienceLevel}</span>
                                   </div>
                                 )}
                                 {/* Distance indicator when location-based search is active */}
                                 {userCoordinates && (job as any).distance && (
                                   <div className="flex items-center gap-2">
                                     <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                     <span className="text-sm text-blue-600 font-medium">
                                       {(job as any).distance.toFixed(1)}km away
                                     </span>
                                   </div>
                                 )}
                               </div>
                            </div>
                          </div>
                          
                          {/* Featured Badge */}
                          {job.isFeatured && (
                            <div className="flex-shrink-0 ml-4">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold rounded-full shadow-sm">
                                ⭐ Featured
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Job Description */}
                        <div className="mb-6">
                          <p className="text-gray-700 line-clamp-3 leading-relaxed text-sm lg:text-base">
                            {job.description}
                          </p>
                        </div>

                        {/* Skills Tags */}
                        {job.skills && job.skills.length > 0 && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                              {job.skills.slice(0, 4).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 4 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                                  +{job.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bottom Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                          <div className="flex flex-wrap items-center gap-3">
                            {job.salary && (
                              <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl font-semibold text-sm border border-green-200">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {job.salary}
                              </span>
                            )}
                            {job.isRemote && (
                              <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm border border-blue-200">
                                🏠 Remote
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-xl font-medium hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm"
                            >
                              View Details
                            </button>
                            
                            <button
                              onClick={() => {
                                const isExternal = job.source && job.source !== 'manual';
                                if (isExternal && job.source_url) {
                                  // External job - track and redirect
                                  if (typeof window !== 'undefined') {
                                    trackExternalApplication({
                                      jobId: String(job.id),
                                      source: job.source,
                                      company: job.company || 'Unknown Company',
                                      title: job.title
                                    });
                                  }
                                  window.open(job.source_url, '_blank', 'noopener,noreferrer');
                                } else {
                                  // Internal job - open apply page
                                  const route = `/jobs/${job.id}/apply`;
                                  window.open(route, '_blank');
                                }
                              }}
                              className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-sm"
                            >
                              Apply Now
                              <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs.toLocaleString()} results
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          {/* Previous Button */}
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) handlePageChange(currentPage - 1);
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          {/* Page Numbers */}
                          {generatePageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === 'ellipsis' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(page as number);
                                  }}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}

                          {/* Next Button */}
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) handlePageChange(currentPage + 1);
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  {/* Google Custom Search Engine - Shows Results Inline */}
                  {searchQuery && (
                    <div className="mt-8">
                      <GoogleCSESearch 
                        searchQuery={searchQuery}
                        location={selectedLocation}
                        className="w-full"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
