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
import AuthGuard from "@/components/auth/AuthGuard";
import { useResponsive } from "@/components/ui/use-mobile";
import { getSmartLocation, isMobileDevice } from "@/lib/mobile-geolocation";

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
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
    country: string;
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

  useEffect(() => {
    fetchDynamicConstants();
    fetchJobs();
    fetchBookmarks();
  }, [currentPage, filters]);

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

  const fetchJobs = async () => {
    try {
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

      const response = await fetch(`/api/jobs/unified?${params}&includeExternal=true`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/jobs/bookmarks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookmarkedJobs(data.data.map((bookmark: any) => bookmark.job_id));
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

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

  // Geolocation functions
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsDetectingLocation(true);
      setLocationError(null);
      
      const result = await getSmartLocation();
      
      if (result.success && result.coordinates) {
        setUserLocation({
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
          city: result.city || 'Current Location',
          country: result.country || 'Unknown'
        });
        setFilters(prev => ({ ...prev, location: result.city || 'Current Location' }));
        console.log('✅ Location detected:', result);
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
    setUserLocation({
      lat: location.lat,
      lng: location.lng,
      city: location.name,
      country: location.country
    });
    setFilters(prev => ({ ...prev, location: location.name }));
    setLocationError(null);
  }, []);

  const getStatusBadge = (job: Job) => {
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

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Find Your Dream Job
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto">
                Discover opportunities from top companies worldwide with our AI-powered job matching platform
              </p>
              
              {/* Enhanced Search Bar with Geolocation */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <input
                        type="text"
                        placeholder="Job title, keywords, or company"
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 sm:py-5 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-base sm:text-lg font-medium transition-all duration-200"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <input
                        type="text"
                        placeholder="Location or remote"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full pl-12 pr-20 py-4 sm:py-5 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-base sm:text-lg font-medium transition-all duration-200"
                      />
                      <Button
                        type="button"
                        onClick={detectCurrentLocation}
                        disabled={isDetectingLocation}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-base sm:text-lg min-w-[140px]"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search Jobs
                    </Button>
                  </div>
                  
                  {/* Location Status and Error Display */}
                  {userLocation && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Location: {userLocation.city}, {userLocation.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserLocation(null)}
                            className="text-green-600 hover:text-green-700 h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {locationError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700">{locationError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Advanced Filters */}
          <Card className="mb-8 shadow-xl border-2 border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Advanced Filters</h3>
                    <p className="text-sm text-gray-600">Refine your search to find the perfect job</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="space-y-6">
                  {/* Location Filters Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Map className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Location & Distance</h4>
                        <p className="text-sm text-gray-600">Find jobs near you or in specific locations</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Popular Locations */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Popular Locations</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {popularLocations.map((location) => (
                            <Button
                              key={`${location.name}-${location.country}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleLocationSelect(location)}
                              className={`justify-start h-auto p-3 text-left transition-all duration-200 ${
                                userLocation?.city === location.name 
                                  ? 'bg-blue-100 border-blue-500 text-blue-800' 
                                  : 'hover:bg-gray-50 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-lg">{location.flag}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{location.name}</div>
                                  <div className="text-xs text-gray-500">{location.country}</div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {location.jobCount}
                                </Badge>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Distance Controls */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Search Radius</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">5 km</span>
                              <span className="text-sm text-gray-600">100 km</span>
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
                              <Badge variant="outline" className="text-sm font-medium">
                                {searchRadius} km radius
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sortByDistance"
                              checked={sortByDistance}
                              onCheckedChange={(checked) => setSortByDistance(!!checked)}
                              className="w-4 h-4 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label htmlFor="sortByDistance" className="text-sm font-semibold text-gray-700 cursor-pointer">
                              Sort by distance (closest first)
                            </Label>
                          </div>
                          
                          {userLocation && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Current: {userLocation.city}, {userLocation.country}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Job Type</Label>
                      <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                        <SelectTrigger className="h-12 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium">
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

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Experience Level</Label>
                      <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                        <SelectTrigger className="h-12 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                          <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Levels</SelectItem>
                          <SelectItem value="entry" className="text-gray-900 hover:bg-blue-50">Entry Level</SelectItem>
                          <SelectItem value="mid" className="text-gray-900 hover:bg-blue-50">Mid Level</SelectItem>
                          <SelectItem value="senior" className="text-gray-900 hover:bg-blue-50">Senior Level</SelectItem>
                          <SelectItem value="lead" className="text-gray-900 hover:bg-blue-50">Lead</SelectItem>
                          <SelectItem value="executive" className="text-gray-900 hover:bg-blue-50">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Min Salary</Label>
                      <Input
                        placeholder="e.g., 50000"
                        value={filters.salaryMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                        type="number"
                        className="h-12 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Max Salary</Label>
                      <Input
                        placeholder="e.g., 100000"
                        value={filters.salaryMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                        type="number"
                        className="h-12 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t-2 border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="remote"
                        checked={filters.isRemote}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                        className="w-5 h-5 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                      />
                      <Label htmlFor="remote" className="text-sm font-semibold text-gray-700 cursor-pointer">Remote Work Only</Label>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-800">{jobs.length} jobs found</span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={clearFilters} 
                        className="w-full sm:w-auto border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Finding the best jobs for you...</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : 
              isTablet ? 'grid-cols-1 sm:grid-cols-2' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {jobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-200 bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          {getStatusBadge(job)}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-600 truncate">{job.company}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBookmark(job.id)}
                        className={`p-2 border-2 hover:bg-red-50 transition-colors ${
                          bookmarkedJobs.includes(job.id) 
                            ? 'text-red-500 hover:text-red-600 border-red-200 bg-red-50' 
                            : 'text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${bookmarkedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="truncate">{job.location}</span>
                          {job.distance !== null && job.distance !== undefined && (
                            <Badge variant="outline" className="text-xs ml-2 bg-blue-50 text-blue-700 border-blue-200">
                              {job.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-green-500" />
                          <span className="capitalize">{job.jobType}</span>
                        </div>
                      </div>
                      
                      {job.salary && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge className={`${getExperienceColor(job.experienceLevel)} font-medium`}>
                        {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                      </Badge>
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-800 border-2 border-green-200 font-bold">Remote</Badge>
                      )}
                      {job.isHybrid && (
                        <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-200 font-bold">Hybrid</Badge>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>

                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gray-50 text-gray-700">
                            +{job.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <Users className="h-3 w-3" />
                        <span>{job._count.applications} applications</span>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </AuthGuard>
  );
}