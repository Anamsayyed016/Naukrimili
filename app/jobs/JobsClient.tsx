'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building2, ExternalLink, Clock, DollarSign, Navigation } from 'lucide-react';
import { getSmartLocation, getMobileGeolocationOptions, isMobileDevice, getGeolocationDiagnostics } from '@/lib/mobile-geolocation';
import GoogleCSESearch from '@/components/GoogleCSESearch';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('IN');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Initialize with search params
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const loc = searchParams.get('location') || '';
    const countryParam = searchParams.get('country') || 'IN';

    setSearchQuery(query);
    setLocation(loc);
    setCountry(countryParam);

    // Convert initial jobs to simple format
    const convertedJobs = initialJobs.map(convertToSimpleJob);
    setJobs(convertedJobs);
  }, [searchParams, initialJobs]);

  // Convert any job format to simple Job format
  function convertToSimpleJob(job: any): Job {
    return {
      id: job.id || `job-${Math.random()}`,
      title: job.title || 'Job Title',
      company: job.company || job.company?.name || 'Company',
      location: job.location || 'Location',
      description: job.description || 'Job description not available',
      salary: job.salary || job.salary_formatted,
      postedAt: job.postedAt || job.created_at,
      source_url: job.source_url || job.redirect_url,
      source: job.source || 'external',
      is_remote: job.is_remote || job.isRemote,
      is_featured: job.is_featured || job.isFeatured
    };
  }

  // Fetch jobs using Adzuna API directly
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ...(searchQuery && { query: searchQuery }),
        ...(location && { location }),
        country: country,
        includeExternal: 'true',
        // Include coordinates for better location-based search
        ...(userCoordinates && { 
          lat: userCoordinates.lat.toString(),
          lng: userCoordinates.lng.toString(),
          sortByDistance: 'true',
          includeDistance: 'true'
        })
      });

      const response = await fetch(`/api/jobs/unified?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newJobs = (data.jobs || []).map(convertToSimpleJob);
        setJobs(newJobs);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchJobs();
  };

  // Handle job application
  const handleApply = (job: Job) => {
    if (job.source_url) {
      window.open(job.source_url, '_blank');
    } else {
      window.open(`/jobs/${job.id}`, '_blank');
    }
  };

  // Detect user's current location
  const detectCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      // Get diagnostics for better error handling
      const diagnostics = getGeolocationDiagnostics();
      console.log('🔍 Geolocation diagnostics:', diagnostics);
      
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const isMobile = isMobileDevice();
      
      console.log('🔍 Environment check:', {
        isSecure,
        isMobile,
        protocol: window.location.protocol,
        hostname: window.location.hostname
      });
      
      // Use mobile-optimized geolocation
      const options = getMobileGeolocationOptions();
      
      if (isMobile) {
        console.log('🔄 Using mobile-optimized geolocation...');
      }
      
      const result = await getSmartLocation(options);
      
      if (result.success) {
        if (result.coordinates) {
          setUserCoordinates(result.coordinates);
        }
        
        const cityName = result.city || 'Current Location';
        setLocation(cityName);
        
        console.log(`✅ Geolocation successful: ${cityName} (${result.source})`);
        
        // Clear any previous errors
        setLocationError(null);
      } else {
        const errorMessage = result.error || 'Failed to detect location';
        setLocationError(errorMessage);
        
        console.warn(`❌ Geolocation failed: ${errorMessage}`);
        
        // Provide helpful suggestions based on diagnostics
        if (isMobile && !isSecure) {
          setLocationError('Mobile devices require HTTPS for location access. Please use HTTPS or select a location manually.');
        } else if (result.errorCode === 1) {
          setLocationError('Location access denied. Please allow location access in your browser settings and try again.');
        } else if (result.errorCode === 3) {
          setLocationError('Location request timed out. Please check your internet connection and try again.');
        }
      }
      
    } catch (error) {
      console.error('Location detection failed:', error);
      setLocationError('An unexpected error occurred while detecting location. Please try again or select a location manually.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover opportunities from top companies worldwide with our AI-powered job matching platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Search Query */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Job title, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-12 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
              <button
                onClick={detectCurrentLocation}
                disabled={locationLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
                title="Detect my location"
              >
                {locationLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Country */}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
            >
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="AE">UAE</option>
            </select>
          </div>

          {/* Additional Filters - Collapsible on mobile */}
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 mb-4">
            <select className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm">
              <option value="">Job Type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
            
            <select className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm">
              <option value="">Experience Level</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
            
            <select className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm">
              <option value="">Salary Range</option>
              <option value="0-3">₹0-3 LPA</option>
              <option value="3-6">₹3-6 LPA</option>
              <option value="6-10">₹6-10 LPA</option>
              <option value="10+">₹10+ LPA</option>
            </select>
            
            <select className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm">
              <option value="">Industry</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Location Detection Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{locationError}</p>
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      <strong>Try these solutions:</strong>
                    </p>
                    <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                      <li>Allow location access in your browser settings</li>
                      <li>Check your internet connection</li>
                      <li>Try typing your location manually</li>
                      <li>If on mobile, ensure you're using HTTPS</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base sm:text-sm font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Searching...</span>
                <span className="sm:hidden">Searching...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search Jobs</span>
                <span className="sm:hidden">Search</span>
              </div>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {jobs.length > 0 ? `${jobs.length} Jobs Found` : 'No Jobs Found'}
              </h2>
              {searchQuery && (
                <p className="text-gray-600">Results for "{searchQuery}"</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="List View">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="Grid View">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            <div className="space-y-4 sm:space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.is_featured && (
                            <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full shadow-sm">
                              ⭐ Featured
                            </span>
                          )}
                          {job.is_remote && (
                            <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full shadow-sm">
                              🏠 Remote
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{job.salary}</span>
                          </div>
                        )}
                        {job.postedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(job.postedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleApply(job)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">Apply Now</span>
                        <span className="sm:hidden">Apply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && jobs.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We couldn't find any jobs matching your criteria. Try adjusting your search or browse all available positions.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLocation('');
                    setCountry('IN');
                    fetchJobs();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Clear Filters & Browse All Jobs
                </button>
              </div>
            </div>
          )}

          {/* Google CSE Additional Results */}
          {searchQuery && (
            <div className="mt-8">
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Additional Job Results from Google
                </h2>
                <GoogleCSESearch 
                  searchQuery={searchQuery}
                  location={location}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
