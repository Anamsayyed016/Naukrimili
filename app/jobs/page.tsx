"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  Heart,
  Bookmark,
  Star,
  Building2,
  Calendar,
  ArrowRight,
  X,
  SlidersHorizontal,
  TrendingUp,
  Users,
  ChevronDown,
  Sparkles,
  Navigation,
  Loader2,
  AlertCircle,
  Globe,
  Target,
  Map
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
// import AuthGuard from "@/components/auth/AuthGuard";
import { useResponsive } from "@/components/ui/use-mobile";
import { getSmartLocation, isMobileDevice } from "@/lib/mobile-geolocation";
// ModernGoogleCSESearch removed - using enhanced job search instead

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  createdAt: string;
  description: string;
  skills: string[];
  distance?: number | null;
  _count: {
    applications: number;
    bookmarks: number;
  };
}

export default function JobsPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Auto-hide filters on mobile by default
  useEffect(() => {
    if (isMobile) {
      setShowAdvancedFilters(false);
    } else {
      setShowAdvancedFilters(true);
    }
  }, [isMobile]);
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all',
    isRemote: false,
    salaryMin: '',
    salaryMax: ''
  });
  
  // Enhanced Geolocation state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
    state?: string;
    country: string;
    area?: string;
    source: 'gps' | 'ip' | 'manual';
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showLocationFilters, setShowLocationFilters] = useState(false);
  const [dynamicConstants, setDynamicConstants] = useState({
    jobTypes: [],
    experienceLevels: [],
    sectors: [],
    skills: [],
    locations: []
  });
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDynamicConstants = async () => {
    try {
      const response = await fetch('/api/jobs/constants');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDynamicConstants(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dynamic constants:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/jobs/bookmarks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookmarkedJobs(data.bookmarks || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchJobs = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchJobs...');
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(filters.query && { query: filters.query }),
        ...(filters.location && { location: filters.location }),
        ...(filters.jobType !== 'all' && { jobType: filters.jobType }),
        ...(filters.experienceLevel !== 'all' && { experienceLevel: filters.experienceLevel }),
        ...(filters.isRemote && { isRemote: 'true' }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax }),
        // Add geolocation parameters
        ...(userLocation && { lat: userLocation.lat.toString() }),
        ...(userLocation && { lng: userLocation.lng.toString() }),
        ...(searchRadius && { radius: searchRadius.toString() }),
        ...(sortByDistance && { sortByDistance: 'true' }),
        ...(sortByDistance && { includeDistance: 'true' })
      });

      const apiUrl = `/api/jobs/unified?${params}&includeExternal=true`;
      console.log('🔍 Fetching jobs from:', apiUrl);
      console.log('📋 Search params:', Object.fromEntries(params.entries()));

      const response = await fetch(apiUrl);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success && data.jobs) {
        // Ensure all jobs have required properties
        const jobs = (data.jobs || []).map((job: any) => ({
          id: job.id || `job-${Math.random()}`,
          title: job.title || 'Job Title',
          company: job.company || 'Company',
          location: job.location || 'Location',
          description: job.description || 'No description available',
          jobType: job.jobType || 'full-time',
          experienceLevel: job.experienceLevel || 'mid',
          salary: job.salary || null,
          isRemote: job.isRemote || false,
          isHybrid: job.isHybrid || false,
          isUrgent: job.isUrgent || false,
          isFeatured: job.isFeatured || false,
          createdAt: job.createdAt || job.postedAt || new Date().toISOString(),
          skills: job.skills || [],
          distance: job.distance || null,
          _count: job._count || {
            applications: job.applicationsCount || 0,
            bookmarks: 0
          }
        }));
        
        setJobs(jobs);
        setTotalPages(data.pagination?.totalPages || 1);
        console.log(`✅ Successfully loaded ${jobs.length} jobs`);
        console.log('📋 Jobs data:', jobs);
      } else {
        console.error('❌ API returned error:', data.error);
        setJobs([]);
      }
    } catch (error) {
      console.error('💥 Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchJobs completed');
    }
  }, [filters, currentPage, userLocation, searchRadius, sortByDistance]);

  useEffect(() => {
    fetchDynamicConstants();
    fetchBookmarks();
  }, []);

  // Initial load - fetch jobs on component mount
  useEffect(() => {
    console.log('🚀 Initial load - fetching jobs...');
    fetchJobs();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔍 Search triggered with filters:', filters);
      if (filters.query || filters.location || filters.jobType !== 'all' || filters.experienceLevel !== 'all' || filters.isRemote || filters.salaryMin || filters.salaryMax) {
        console.log('✅ Filters active, fetching jobs...');
        fetchJobs();
      } else {
        console.log('⚠️ No active filters, fetching default jobs...');
        fetchJobs();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchJobs]);


  const handleBookmark = async (jobId: string) => {
    try {
      const isBookmarked = bookmarkedJobs.includes(jobId);
      
      const response = await fetch('/api/jobs/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        if (isBookmarked) {
          setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        } else {
          setBookmarkedJobs(prev => [...prev, jobId]);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      isRemote: false,
      salaryMin: '',
      salaryMax: ''
    });
    setUserLocation(null);
    setSearchRadius(25);
    setSortByDistance(false);
    setLocationError(null);
  };

  // Enhanced Geolocation functions
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsDetectingLocation(true);
      setLocationError(null);
      
      const result = await getSmartLocation();
      
      if (result.success && result.coordinates) {
        const locationData = {
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
          city: result.city || 'Current Location',
          state: result.state,
          country: result.country || 'Unknown',
          area: result.state ? `${result.city}, ${result.state}` : result.city,
          source: result.source
        };
        
        setUserLocation(locationData);
        setFilters(prev => ({ 
          ...prev, 
          location: result.state 
            ? `${result.city}, ${result.state}` 
            : result.city || 'Current Location' 
        }));
        console.log('✅ Enhanced location detected:', locationData);
      } else {
        setLocationError(result.error || 'Failed to detect location');
        console.warn('❌ Location detection failed:', result.error);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setLocationError('An unexpected error occurred while detecting location');
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  // Popular locations for top 4 countries
  const popularLocations = [
    // USA
    { name: 'New York', country: 'USA', flag: '🇺🇸', jobCount: 2150, lat: 40.7128, lng: -74.0060 },
    { name: 'San Francisco', country: 'USA', flag: '🇺🇸', jobCount: 1890, lat: 37.7749, lng: -122.4194 },
    { name: 'Los Angeles', country: 'USA', flag: '🇺🇸', jobCount: 1650, lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', country: 'USA', flag: '🇺🇸', jobCount: 1420, lat: 41.8781, lng: -87.6298 },
    { name: 'Seattle', country: 'USA', flag: '🇺🇸', jobCount: 1280, lat: 47.6062, lng: -122.3321 },
    
    // UAE
    { name: 'Dubai', country: 'UAE', flag: '🇦🇪', jobCount: 1850, lat: 25.2048, lng: 55.2708 },
    { name: 'Abu Dhabi', country: 'UAE', flag: '🇦🇪', jobCount: 1200, lat: 24.2992, lng: 54.3773 },
    { name: 'Sharjah', country: 'UAE', flag: '🇦🇪', jobCount: 650, lat: 25.3573, lng: 55.4033 },
    
    // UK
    { name: 'London', country: 'UK', flag: '🇬🇧', jobCount: 1950, lat: 51.5074, lng: -0.1278 },
    { name: 'Manchester', country: 'UK', flag: '🇬🇧', jobCount: 850, lat: 53.4808, lng: -2.2426 },
    { name: 'Birmingham', country: 'UK', flag: '🇬🇧', jobCount: 720, lat: 52.4862, lng: -1.8904 },
    { name: 'Edinburgh', country: 'UK', flag: '🇬🇧', jobCount: 580, lat: 55.9533, lng: -3.1883 },
    
    // India
    { name: 'Mumbai', country: 'India', flag: '🇮🇳', jobCount: 2250, lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', country: 'India', flag: '🇮🇳', jobCount: 1980, lat: 12.9716, lng: 77.5946 },
    { name: 'Delhi', country: 'India', flag: '🇮🇳', jobCount: 1890, lat: 28.7041, lng: 77.1025 },
    { name: 'Hyderabad', country: 'India', flag: '🇮🇳', jobCount: 1650, lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', country: 'India', flag: '🇮🇳', jobCount: 1520, lat: 13.0827, lng: 80.2707 },
    { name: 'Pune', country: 'India', flag: '🇮🇳', jobCount: 1480, lat: 18.5204, lng: 73.8567 },
    { name: 'Kolkata', country: 'India', flag: '🇮🇳', jobCount: 1420, lat: 22.5726, lng: 88.3639 },
    { name: 'Ahmedabad', country: 'India', flag: '🇮🇳', jobCount: 1380, lat: 23.0225, lng: 72.5714 }
  ];

  const handleLocationSelect = useCallback((location: typeof popularLocations[0]) => {
    const locationData = {
      lat: location.lat,
      lng: location.lng,
      city: location.name,
      country: location.country,
      area: location.name,
      source: 'manual' as const
    };
    
    setUserLocation(locationData);
    setFilters(prev => ({ ...prev, location: location.name }));
    setLocationError(null);
  }, []);

  const getStatusBadge = (job: Job) => {
    if (!job) return null;
    if (job.isFeatured) return <Badge className="bg-purple-100 text-purple-800 border-2 border-purple-200 font-bold">Featured</Badge>;
    if (job.isUrgent) return <Badge className="bg-red-100 text-red-800 border-2 border-red-200 font-bold">Urgent</Badge>;
    return null;
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-blue-100 text-blue-800 border-2 border-blue-200';
      case 'mid': return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200';
      case 'senior': return 'bg-orange-100 text-orange-800 border-2 border-orange-200';
      case 'lead': return 'bg-purple-100 text-purple-800 border-2 border-purple-200';
      case 'executive': return 'bg-red-100 text-red-800 border-2 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-2 border-gray-200';
    }
  };

  // Error boundary for job rendering
  if (jobs.some(job => !job || !job.id)) {
    console.error('❌ Invalid job data detected:', jobs);
    setJobs(jobs.filter(job => job && job.id));
  }

  return (
    /* AuthGuard temporarily disabled for testing */
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Unified Hero Section with Enhanced Search */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-16 sm:py-20 lg:py-24">
            <div className="text-center max-w-6xl mx-auto">
              {/* Enhanced Header */}
              <div className="mb-8">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Discover the 
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"> Career You Deserve</span>
                </h1>
                <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Connect with top companies worldwide through our AI-powered job matching platform
                </p>
              </div>
              
              {/* Unified Enhanced Search Interface */}
              <div className="max-w-5xl mx-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
                  {/* Search Header */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        Smart Job Search
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-bold">
                          AI Powered
                        </Badge>
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Find your perfect job with intelligent matching
                      </p>
                    </div>
                  </div>

                  {/* Main Search Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Job Title Search */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <input
                          type="text"
                          placeholder="Job title, keywords, or company name"
                          value={filters.query}
                          onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                          className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-base font-medium transition-all duration-200 shadow-sm"
                        />
                      </div>

                      {/* Location Search with Enhanced Geolocation */}
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <input
                          type="text"
                          placeholder="City, state, country, or remote"
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full pl-12 pr-20 py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-base font-medium transition-all duration-200 shadow-sm"
                        />
                        <Button
                          type="button"
                          onClick={detectCurrentLocation}
                          disabled={isDetectingLocation}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {isDetectingLocation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <Navigation className="w-4 h-4" />
                              <span className="hidden sm:inline">Live Location</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Search Button */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleSearch} 
                        className="inline-flex items-center justify-center px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg min-w-[200px]"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Search Jobs
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced Location Status Display */}
                  {userLocation && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-green-800 text-sm">
                              Current Location Detected
                            </div>
                            <div className="text-green-700 text-sm">
                              {userLocation.city}, {userLocation.state || userLocation.country}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                            {userLocation.source === 'gps' ? 'GPS' : 'IP'} Location
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserLocation(null)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8 p-0 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Error Display */}
                  {locationError && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-red-800 text-sm">
                            Location Detection Failed
                          </div>
                          <div className="text-red-700 text-sm">
                            {locationError}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Location Suggestions */}
                  <div className="mt-6">
                    <div className="text-center mb-4">
                      <span className="text-sm font-medium text-gray-600">Popular Locations</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {popularLocations.slice(0, 6).map((location) => (
                        <Button
                          key={`${location.name}-${location.country}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleLocationSelect(location)}
                          className={`justify-start h-auto p-3 text-left transition-all duration-200 ${
                            userLocation?.city === location.name 
                              ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-md' 
                              : 'hover:bg-gray-50 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-lg">{location.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">{location.name}</div>
                              <div className="text-xs text-gray-500 truncate">{location.country}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">

          {/* Enhanced Advanced Filters */}
          <Card className="mb-8 shadow-2xl border-2 border-gray-200 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <SlidersHorizontal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      Advanced Filters
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-bold">
                        Smart Search
                      </Badge>
                    </h3>
                    <p className="text-gray-600 mt-1">Refine your search with intelligent filters</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="space-y-6">
                  {/* Enhanced Location Filters Section */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <Map className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          Location & Distance
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 font-bold">
                            Smart Detection
                          </Badge>
                        </h4>
                        <p className="text-gray-600 mt-1">Find jobs by area, state, country with intelligent location matching</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enhanced Popular Locations */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-bold text-gray-800">Popular Locations</Label>
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-bold">
                            {popularLocations.length} Cities
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                          {popularLocations.map((location) => (
                            <Button
                              key={`${location.name}-${location.country}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleLocationSelect(location)}
                              className={`justify-start h-auto p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md ${
                                userLocation?.city === location.name 
                                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-500 text-blue-800 shadow-lg' 
                                  : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-gray-300 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-2xl">{location.flag}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">{location.name}</div>
                                  <div className="text-xs text-gray-600 truncate">{location.country}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <Badge variant="secondary" className="text-xs mb-1">
                                    {location.jobCount.toLocaleString()} jobs
                                  </Badge>
                                  {userLocation?.city === location.name && (
                                    <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Enhanced Distance Controls */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-lg font-bold text-gray-800">Search Radius</Label>
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0 font-bold">
                              {searchRadius} km
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>5 km</span>
                              <span>100 km</span>
                            </div>
                            <Slider
                              value={[searchRadius]}
                              onValueChange={(value) => setSearchRadius(value[0])}
                              max={100}
                              min={5}
                              step={5}
                              className="w-full"
                            />
                            <div className="text-center">
                              <Badge variant="outline" className="text-sm font-medium bg-blue-50 text-blue-800 border-blue-300">
                                {searchRadius} km search radius
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="sortByDistance"
                              checked={sortByDistance}
                              onCheckedChange={(checked) => setSortByDistance(!!checked)}
                              className="w-5 h-5 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label htmlFor="sortByDistance" className="text-sm font-semibold text-gray-700 cursor-pointer">
                              Sort by distance (closest first)
                            </Label>
                          </div>
                          
                          {/* Enhanced Location Status */}
                          {userLocation && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Target className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-green-800 text-sm">
                                    Current Location
                                  </div>
                                  <div className="text-green-700 text-sm">
                                    {userLocation.area || userLocation.city}, {userLocation.country}
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    {userLocation.source === 'gps' ? 'GPS Location' : userLocation.source === 'ip' ? 'IP Location' : 'Manual Selection'}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                    Active
                                  </Badge>
                                  <div className="text-xs text-green-600">
                                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Filter Grid */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-3">
                        <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          Job Type
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Required</Badge>
                        </Label>
                        <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                          <SelectTrigger className="h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                            <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Types</SelectItem>
                            <SelectItem value="full-time" className="text-gray-900 hover:bg-blue-50">Full-time</SelectItem>
                            <SelectItem value="part-time" className="text-gray-900 hover:bg-blue-50">Part-time</SelectItem>
                            <SelectItem value="contract" className="text-gray-900 hover:bg-blue-50">Contract</SelectItem>
                            <SelectItem value="internship" className="text-gray-900 hover:bg-blue-50">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          Experience Level
                          <Badge className="bg-purple-100 text-purple-800 border-0 text-xs">Smart</Badge>
                        </Label>
                        <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                          <SelectTrigger className="h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                            <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Levels</SelectItem>
                            <SelectItem value="entry" className="text-gray-900 hover:bg-blue-50">Entry Level (0-2 years)</SelectItem>
                            <SelectItem value="mid" className="text-gray-900 hover:bg-blue-50">Mid Level (2-5 years)</SelectItem>
                            <SelectItem value="senior" className="text-gray-900 hover:bg-blue-50">Senior Level (5-10 years)</SelectItem>
                            <SelectItem value="lead" className="text-gray-900 hover:bg-blue-50">Lead (10+ years)</SelectItem>
                            <SelectItem value="executive" className="text-gray-900 hover:bg-blue-50">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          Min Salary
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
                        </Label>
                        <Input
                          placeholder="e.g., 50000"
                          value={filters.salaryMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                          type="number"
                          className="h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          Max Salary
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
                        </Label>
                        <Input
                          placeholder="e.g., 100000"
                          value={filters.salaryMax}
                          onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                          type="number"
                          className="h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="remote"
                            checked={filters.isRemote}
                            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                            className="w-6 h-6 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                          />
                          <Label htmlFor="remote" className="text-lg font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                            Remote Work Only
                            <Badge className="bg-orange-100 text-orange-800 border-0 text-xs">Popular</Badge>
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-blue-800">{jobs.length.toLocaleString()} jobs found</div>
                            <div className="text-xs text-blue-600">Based on your filters</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={clearFilters} 
                          className="w-full sm:w-auto border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <X className="h-5 w-5 mr-2" />
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-blue-300 opacity-20"></div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Finding the best jobs for you...</h3>
                <p className="text-gray-600">Our AI is analyzing thousands of opportunities</p>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">No jobs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or location filters</p>
                <Button 
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-8 ${
              isMobile ? 'grid-cols-1' : 
              isTablet ? 'grid-cols-1 sm:grid-cols-2' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {jobs?.map((job) => {
                if (!job || !job.id) return null;
                return (
                <Card key={job.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Job Header with Gradient */}
                    <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                              {job.title || 'Job Title'}
                            </h3>
                            {getStatusBadge(job)}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-gray-700 font-semibold truncate">{job.company || 'Company'}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookmark(job.id)}
                          className={`p-3 rounded-xl border-2 hover:scale-110 transition-all duration-300 ${
                            bookmarkedJobs.includes(job.id) 
                              ? 'text-red-500 hover:text-red-600 border-red-200 bg-red-50 shadow-lg' 
                              : 'text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-300 hover:bg-red-50'
                          }`}
                        >
                          <Heart className={`h-5 w-5 ${bookmarkedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700 font-medium truncate">{job.location || 'Location'}</span>
                            {job.distance !== null && job.distance !== undefined && (
                              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs font-bold px-2 py-1">
                                {job.distance.toFixed(1)} km
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                            <Briefcase className="h-4 w-4 text-green-600" />
                            <span className="text-gray-700 font-medium capitalize">{job.jobType || 'Full-time'}</span>
                          </div>
                        </div>
                        
                        {job.salary && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 font-bold">{job.salary}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getExperienceColor(job.experienceLevel)} font-bold px-3 py-1 rounded-lg`}>
                          {job.experienceLevel ? job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1) : 'Not Specified'}
                        </Badge>
                        {job.isRemote && (
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 font-bold px-3 py-1 rounded-lg">Remote</Badge>
                        )}
                        {job.isHybrid && (
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-bold px-3 py-1 rounded-lg">Hybrid</Badge>
                        )}
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                        {job.description || 'No description available'}
                      </p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 px-3 py-1 rounded-lg">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                              +{job.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Job Footer */}
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="font-semibold">{job._count?.applications || 0} applications</span>
                        </div>
                        <Link href={`/jobs/${job.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 font-medium"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg border-2 font-medium ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-600' 
                            : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 font-medium"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {jobs.length === 0 && !loading && (
            <Card className="mt-8 border-2 border-gray-200 shadow-2xl bg-white">
              <CardContent className="p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
                  <Briefcase className="relative h-20 w-20 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any jobs matching your criteria. Try adjusting your search filters or browse all available positions.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="px-6 py-3 rounded-lg font-medium"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Adjust Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    /* /AuthGuard temporarily disabled for testing */
  );
}