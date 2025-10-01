'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  Heart,
  Building2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Globe,
  Navigation,
  Filter,
  SortAsc,
  SortDesc,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getSmartLocation, getMobileGeolocationOptions, isMobileDevice } from '@/lib/mobile-geolocation';

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

interface LocationOption {
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates: { lat: number; lng: number };
  jobCount: number;
}

interface SearchFilters {
  query: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  radius: number;
  sortBy: 'relevance' | 'distance' | 'date' | 'salary';
  sortOrder: 'asc' | 'desc';
}

const popularLocations: LocationOption[] = [
  { name: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { lat: 19.0760, lng: 72.8777 }, jobCount: 1250 },
  { name: 'Bangalore, Karnataka, India', city: 'Bangalore', state: 'Karnataka', country: 'India', coordinates: { lat: 12.9716, lng: 77.5946 }, jobCount: 2100 },
  { name: 'Delhi, NCR, India', city: 'Delhi', state: 'NCR', country: 'India', coordinates: { lat: 28.7041, lng: 77.1025 }, jobCount: 1800 },
  { name: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', country: 'India', coordinates: { lat: 17.3850, lng: 78.4867 }, jobCount: 950 },
  { name: 'Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', country: 'India', coordinates: { lat: 18.5204, lng: 73.8567 }, jobCount: 800 },
  { name: 'Chennai, Tamil Nadu, India', city: 'Chennai', state: 'Tamil Nadu', country: 'India', coordinates: { lat: 13.0827, lng: 80.2707 }, jobCount: 700 },
  { name: 'New York, NY, USA', city: 'New York', state: 'NY', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 }, jobCount: 3200 },
  { name: 'San Francisco, CA, USA', city: 'San Francisco', state: 'CA', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, jobCount: 2800 },
  { name: 'London, UK', city: 'London', state: 'England', country: 'UK', coordinates: { lat: 51.5074, lng: -0.1278 }, jobCount: 1900 },
  { name: 'Dubai, UAE', city: 'Dubai', state: 'Dubai', country: 'UAE', coordinates: { lat: 25.2048, lng: 55.2708 }, jobCount: 1100 }
];

const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const experienceLevels = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'];

export default function LocationBasedJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationOption[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    jobType: 'All',
    experienceLevel: 'All',
    isRemote: false,
    salaryMin: '',
    salaryMax: '',
    radius: 25,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Get user's current location using robust geolocation service
  const detectCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      console.log('🚀 Starting location detection...');
      
      // Use mobile-optimized geolocation
      const isMobile = isMobileDevice();
      const options = getMobileGeolocationOptions();
      
      if (isMobile) {
        console.log('📱 Using mobile-optimized geolocation...');
      }
      
      const result = await getSmartLocation(options);
      
      if (result.success) {
        if (result.coordinates) {
          setUserLocation({
            lat: result.coordinates.lat,
            lng: result.coordinates.lng
          });
          setLocationDetected(true);
          console.log('✅ Location detected:', result);
          
          // Show success message
          toast.success(`Location detected: ${result.city || 'Unknown City'}`, {
            description: `Using ${result.source === 'gps' ? 'GPS' : 'IP-based'} location detection`,
            duration: 3000,
          });
        } else {
          throw new Error('No coordinates received');
        }
      } else {
        throw new Error(result.error || 'Location detection failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Location detection failed';
      setLocationError(errorMessage);
      console.error('❌ Location detection failed:', error);
      
      // Show error message
      toast.error('Location detection failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Auto-detect location on component mount
  useEffect(() => {
    detectCurrentLocation();
  }, [detectCurrentLocation]);

  // Location suggestions
  const getLocationSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    
    const filtered = popularLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.state.toLowerCase().includes(query.toLowerCase())
    );
    setLocationSuggestions(filtered.slice(0, 5));
  }, []);

  // Fetch jobs with location-based filtering
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        query: filters.query,
        location: filters.location,
        jobType: filters.jobType === 'All' ? '' : filters.jobType,
        experienceLevel: filters.experienceLevel === 'All' ? '' : filters.experienceLevel,
        isRemote: filters.isRemote.toString(),
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        radius: filters.radius.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(userLocation && {
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
          includeDistance: 'true',
          sortByDistance: filters.sortBy === 'distance' ? 'true' : 'false'
        })
      });

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, userLocation]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleLocationSelect = (location: LocationOption) => {
    setLocationInput(location.name);
    handleFilterChange('location', location.name);
    setLocationSuggestions([]);
  };

  const handleBookmark = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        setBookmarkedJobs(prev => 
          prev.includes(jobId) 
            ? prev.filter(id => id !== jobId)
            : [...prev, jobId]
        );
        toast.success(bookmarkedJobs.includes(jobId) ? 'Removed from bookmarks' : 'Added to bookmarks');
      }
    } catch (error) {
      toast.error('Failed to update bookmarks');
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'full-time': return 'bg-green-100 text-green-800 border-green-200';
      case 'part-time': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contract': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'internship': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'freelance': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Find Your Dream Job</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Discover opportunities near you with our AI-powered location-based job search
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 shadow-xl border-0 bg-white/98 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    placeholder="Job title, company, or keywords..."
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    getLocationSuggestions(e.target.value);
                  }}
                  placeholder="City or location..."
                  className="pl-10 pr-20 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectCurrentLocation}
                  disabled={locationLoading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs"
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  ) : (
                    <Navigation className="h-3 w-3" />
                  )}
                </Button>
                {locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1">
                    {locationSuggestions.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-slate-500">
                          {location.jobCount} jobs available
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="h-12 px-4 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  onClick={fetchJobs}
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-slate-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
                      <select
                        value={filters.jobType}
                        onChange={(e) => handleFilterChange('jobType', e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        {jobTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level</label>
                      <select
                        value={filters.experienceLevel}
                        onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Search Radius: {filters.radius} km</label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={filters.radius}
                        onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="distance">Distance</option>
                        <option value="date">Date Posted</option>
                        <option value="salary">Salary</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.isRemote}
                        onChange={(e) => handleFilterChange('isRemote', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Remote Work</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Listings */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (jobs || []).length > 0 ? (
              jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden group-hover:border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                              <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {job.title}
                              </h3>
                              <p className="text-slate-600 font-medium">{job.company}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                            {job.distance && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {job.distance.toFixed(1)} km away
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={getJobTypeColor(job.jobType)}>
                              {job.jobType}
                            </Badge>
                            <Badge variant="outline" className="border-slate-300 text-slate-700">
                              {job.experienceLevel}
                            </Badge>
                            {job.isRemote && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Remote
                              </Badge>
                            )}
                            {job.isHybrid && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Hybrid
                              </Badge>
                            )}
                            {job.isUrgent && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                Urgent
                              </Badge>
                            )}
                            {job.isFeatured && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Featured
                              </Badge>
                            )}
                          </div>

                          <p className="text-slate-700 text-sm leading-relaxed mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {job.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{job.skills.length - 5} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>{job._count.applications} applications</span>
                              <span>{job._count.bookmarks} bookmarks</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBookmark(job.id)}
                                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                              >
                                <Heart className={`h-4 w-4 ${bookmarkedJobs.includes(job.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Apply Now
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
                  <p className="text-slate-600 mb-4">Try adjusting your search criteria or location</p>
                  <Button onClick={() => setFilters({
                    query: '', location: '', jobType: 'All', experienceLevel: 'All',
                    isRemote: false, salaryMin: '', salaryMax: '', radius: 25,
                    sortBy: 'relevance', sortOrder: 'desc'
                  })}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Insights */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Location Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Detecting your location...</span>
                  </div>
                ) : locationDetected && userLocation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Location detected</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>🔍 Searching within {filters.radius} km radius</p>
                      <p>📊 {(jobs || []).length} jobs found</p>
                      <p>📍 Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                    </div>
                  </div>
                ) : locationError ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Location detection failed</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>🔍 Showing jobs by relevance</p>
                      <p>📊 {(jobs || []).length} jobs found</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={detectCurrentLocation}
                      className="w-full text-xs"
                    >
                      <Navigation className="h-3 w-3 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    <p>📍 Location not detected</p>
                    <p>🔍 Showing jobs by relevance</p>
                    <p>📊 {jobs.length} jobs found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={detectCurrentLocation}
                      className="w-full text-xs mt-2"
                    >
                      <Navigation className="h-3 w-3 mr-2" />
                      Detect Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Locations */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Popular Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {popularLocations.slice(0, 5).map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="font-medium text-slate-900">{location.city}</div>
                    <div className="text-sm text-slate-500">{location.jobCount} jobs</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(i + 1)}
                  className="w-10 h-10"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
