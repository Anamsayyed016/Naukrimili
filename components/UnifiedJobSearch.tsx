'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertCircle, 
  X,
  SlidersHorizontal,
  ChevronDown,
  Building,
  Building2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getSmartLocation } from '@/lib/mobile-geolocation';
import { useDebounce } from '@/hooks/useDebounce';
// import SmartFilterSuggestions from './SmartFilterSuggestions'; // Removed - causing infinite re-render

// ===== INTERFACES =====

interface UnifiedJobSearchProps {
  className?: string;
  variant?: 'homepage' | 'jobs-page' | 'minimal';
  showAdvancedFilters?: boolean;
  showSuggestions?: boolean;
  showLocationCategories?: boolean;
  autoSearch?: boolean;
  onSearch?: (filters: JobSearchFilters) => void;
  initialFilters?: Partial<JobSearchFilters>;
}

interface JobSearchFilters {
  query: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  sector: string;
  country: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country: string;
  area?: string;
  source: 'gps' | 'ip' | 'manual';
}

interface LocationData {
  id: string;
  name: string;
  country: string;
  flag: string;
  jobCount: number;
  area?: string;
  state?: string;
  type: 'area' | 'state' | 'country' | 'city';
}

// ===== MAIN COMPONENT =====

export default function UnifiedJobSearch({
  className = '',
  variant = 'homepage',
  showAdvancedFilters = true,
  showSuggestions: _showSuggestions = true,
  showLocationCategories = true,
  autoSearch = true,
  onSearch,
  initialFilters = {}
}: UnifiedJobSearchProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  // ===== STATE =====
  
  const [filters, setFilters] = useState<JobSearchFilters>(() => ({
    query: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all',
    isRemote: false,
    salaryMin: '',
    salaryMax: '',
    sector: '',
    country: 'IN',
    ...initialFilters
  }));

  // Debounced filters for auto-search
  const debouncedQuery = useDebounce(filters?.query || '', 500);
  const debouncedLocation = useDebounce(filters?.location || '', 500);
  
  // Advanced filters state - Show by default on homepage
  const [showAdvanced, setShowAdvanced] = useState(variant === 'homepage');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Dynamic constants
  const [, setDynamicConstants] = useState(() => ({
    jobTypes: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    experienceLevels: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'],
    locations: []
  }));

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize filters from URL params
  useEffect(() => {
    if (!isMounted || !searchParams) return;
    
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || 'all';
    const experienceLevel = searchParams.get('experienceLevel') || 'all';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || 'IN';

    setFilters({
      query,
      location,
      jobType,
      experienceLevel,
      isRemote,
      salaryMin,
      salaryMax,
      sector,
      country
    });
  }, [searchParams, isMounted]);

  // Fetch dynamic constants
  const fetchDynamicConstants = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/jobs/constants', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDynamicConstants(data.data);
        }
      } else {
        console.warn('Failed to fetch dynamic constants, using defaults');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Error fetching dynamic constants, using defaults:', error);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    fetchDynamicConstants();
  }, [fetchDynamicConstants]);

  // Auto-search when debounced filters change - Only for jobs page variant
  useEffect(() => {
    if (!isMounted || !filters) return;
    
    if (autoSearch && variant === 'jobs-page' && (debouncedQuery?.trim() || debouncedLocation?.trim())) {
      console.log('🔄 Auto-searching with debounced filters:', { query: debouncedQuery, location: debouncedLocation });
      
      const searchParams = new URLSearchParams();
      if (debouncedQuery?.trim()) searchParams.set('query', debouncedQuery);
      if (debouncedLocation?.trim()) searchParams.set('location', debouncedLocation);
      
      // Add other filters if they're not default values
      if (filters.jobType !== 'all') searchParams.set('jobType', filters.jobType);
      if (filters.experienceLevel !== 'all') searchParams.set('experienceLevel', filters.experienceLevel);
      if (filters.isRemote) searchParams.set('isRemote', 'true');
      if (filters.salaryMin) searchParams.set('salaryMin', filters.salaryMin);
      if (filters.salaryMax) searchParams.set('salaryMax', filters.salaryMax);
      if (filters.sector) searchParams.set('sector', filters.sector);
      if (filters.country) searchParams.set('country', filters.country);

      // Navigate to search results
      router.push(`/jobs?${searchParams.toString()}`);
    }
  }, [debouncedQuery, debouncedLocation, filters, autoSearch, router, variant, isMounted]);

  // ===== HANDLERS =====

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (!filters) return;
    
    const params = new URLSearchParams();
    
    if (filters.query) params.set('query', filters.query);
    if (filters.location) params.set('location', filters.location);
    if (filters.jobType !== 'all') params.set('jobType', filters.jobType);
    if (filters.experienceLevel !== 'all') params.set('experienceLevel', filters.experienceLevel);
    if (filters.isRemote) params.set('isRemote', 'true');
    if (filters.salaryMin) params.set('salaryMin', filters.salaryMin);
    if (filters.salaryMax) params.set('salaryMax', filters.salaryMax);
    if (filters.sector) params.set('sector', filters.sector);
    if (filters.country) params.set('country', filters.country);
    
    // Add unlimited search parameters
    params.set('limit', '100');
    params.set('includeExternal', 'true');
    params.set('includeDatabase', 'true');
    params.set('includeSample', 'true');
    
    // Add location coordinates if available
    if (userLocation) {
      params.set('lat', userLocation.lat.toString());
      params.set('lng', userLocation.lng.toString());
      params.set('radius', searchRadius.toString());
      if (sortByDistance) params.set('sortByDistance', 'true');
    }

    const searchUrl = `/jobs?${params.toString()}`;
    console.log('🔍 Search URL:', searchUrl);
    
    if (onSearch) {
      onSearch(filters);
    } else {
      router.push(searchUrl);
    }
  }, [filters, userLocation, searchRadius, sortByDistance, router, onSearch]);

  // Location detection
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsDetectingLocation(true);
      setLocationError(null);
      
      console.log('📍 Starting location detection...');
      const result = await getSmartLocation();
      
      if (result.success && result.coordinates) {
        const locationData: UserLocation = {
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
          city: result.city || 'Unknown',
          state: result.state,
          country: result.country || 'Unknown',
          area: result.city,
          source: result.source || 'gps'
        };
        
        setUserLocation(locationData);
        setFilters(prev => ({ ...prev, location: locationData.city }));
        console.log('✅ Enhanced location detected:', locationData);
      } else {
        let errorMessage = result.error || 'Failed to detect location';
        
        if (typeof window !== 'undefined') {
          const isHTTPS = window.location.protocol === 'https:';
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isMobile && !isHTTPS) {
            errorMessage = 'Location detection requires HTTPS on mobile devices. Please use HTTPS or select a location manually.';
          } else if (errorMessage.includes('denied')) {
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
          } else if (errorMessage.includes('timeout')) {
            errorMessage = 'Location request timed out. Please check your internet connection and try again.';
          }
        }
        
        setLocationError(errorMessage);
        console.warn('❌ Location detection failed:', errorMessage);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setLocationError('An unexpected error occurred while detecting location. Please try again or select a location manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationData) => {
    const locationData: UserLocation = {
      lat: 0,
      lng: 0,
      city: location.name,
      country: location.country,
      source: 'manual'
    };
    
    setUserLocation(locationData);
    setFilters(prev => ({ ...prev, location: location.name }));
    setLocationError(null);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      isRemote: false,
      salaryMin: '',
      salaryMax: '',
      sector: '',
      country: 'IN'
    });
    setUserLocation(null);
    setSearchRadius(25);
    setSortByDistance(false);
    setLocationError(null);
  }, []);

  // ===== RENDER HELPERS =====

  const getVariantStyles = () => {
    switch (variant) {
      case 'homepage':
        return {
          container: 'relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
          searchBox: 'bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8',
          title: 'text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight',
          subtitle: 'text-lg sm:text-xl text-blue-100 mb-6 max-w-3xl mx-auto leading-relaxed'
        };
      case 'jobs-page':
        return {
          container: 'bg-white rounded-xl shadow-lg border border-gray-200',
          searchBox: 'p-6',
          title: 'text-2xl font-bold text-gray-900 mb-4',
          subtitle: 'text-gray-600 mb-6'
        };
      case 'minimal':
        return {
          container: 'bg-white rounded-lg shadow-sm border border-gray-200',
          searchBox: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-3',
          subtitle: 'text-sm text-gray-600 mb-4'
        };
      default:
        return {
          container: 'bg-white rounded-lg shadow-sm border border-gray-200',
          searchBox: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-3',
          subtitle: 'text-sm text-gray-600 mb-4'
        };
    }
  };

  const styles = getVariantStyles();

  // ===== RENDER =====

  // Add error boundary wrapper
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Animated background for homepage variant */}
      {variant === 'homepage' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          </div>
        </>
      )}

      <div className={`relative ${variant === 'homepage' ? 'container mx-auto px-4 py-12 sm:py-16 lg:py-20' : ''}`}>
        <div className={`${variant === 'homepage' ? 'text-center max-w-6xl mx-auto' : ''}`}>
          {/* Header */}
          {variant === 'homepage' && (
            <div className="mb-8">
              <p className="text-center text-white text-lg sm:text-xl mb-8 max-w-4xl mx-auto leading-relaxed">
                Connect with top companies worldwide through our AI-powered job matching platform
              </p>
            </div>
          )}

          {/* Search Interface */}
          <div className={`${variant === 'homepage' ? 'max-w-5xl mx-auto' : ''}`}>
            <div className={styles.searchBox}>
              {/* Search Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2">
                  Smart Job Search
                  <Badge className="bg-blue-100 text-blue-800 border-0 font-bold text-xs">
                    AI Powered
                  </Badge>
                </h2>
                <p className="text-sm text-gray-600">
                  Find your perfect job with intelligent matching
                </p>
              </div>

              {/* Main Search Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Job Title Search */}
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                     <Input
                       type="text"
                       placeholder="Job title, keywords, or company name"
                       value={filters?.query || ''}
                       onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                       className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-sm sm:text-base font-medium transition-all duration-200 shadow-sm"
                     />
                  </div>

                  {/* Location Search */}
                  <div className="relative">
                    <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                     <Input
                       type="text"
                       placeholder="City, state, country, or remote"
                       value={filters?.location || ''}
                       onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                       className="w-full pl-10 sm:pl-12 pr-16 sm:pr-20 py-3 sm:py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-sm sm:text-base font-medium transition-all duration-200 shadow-sm"
                     />
                    <Button
                      type="button"
                      onClick={detectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-8 sm:h-10 px-2 sm:px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline text-xs">Live</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={handleSearch} 
                    className="inline-flex items-center justify-center px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-sm sm:text-lg min-w-[160px] sm:min-w-[200px]"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Search Jobs
                  </Button>
                </div>

                {/* AI-Powered Locations Indicator */}
                <div className="text-center mt-4">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <span>AI-Powered Locations</span>
                    <Badge className="bg-blue-100 text-blue-800 border-0 font-bold text-xs">
                      Smart
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location Status Display */}
              {userLocation && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800 text-xs sm:text-sm">
                          Current Location Detected
                        </div>
                        <div className="text-green-700 text-xs sm:text-sm">
                          {userLocation.city}, {userLocation.state || userLocation.country}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                        {userLocation.source === 'gps' ? 'GPS' : 'IP'} Location
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserLocation(null)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-100 h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-lg"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {locationError && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-red-800 text-xs sm:text-sm">
                          Location Detection Failed
                        </div>
                        <div className="text-red-700 text-xs sm:text-sm">
                          {locationError}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={detectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 text-xs px-2 py-1 h-6"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Retry'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Location Categories */}
              {showLocationCategories && (
                <div className="mt-8">
                  {/* Custom Location Category Cards */}
                  <div className="mt-6 space-y-3">
                    {/* Metropolitan Areas Card */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex items-center justify-between hover:from-slate-700 hover:to-slate-800 transition-all duration-200 cursor-pointer shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">Metropolitan Areas</h3>
                          <p className="text-gray-300 text-sm">6 locations • 58,370 jobs</p>
                        </div>
                      </div>
                      <div className="text-white">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>

                    {/* States & Provinces Card */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex items-center justify-between hover:from-slate-700 hover:to-slate-800 transition-all duration-200 cursor-pointer shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">States & Provinces</h3>
                          <p className="text-gray-300 text-sm">6 locations • 105,530 jobs</p>
                        </div>
                      </div>
                      <div className="text-white">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Countries Card */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex items-center justify-between hover:from-slate-700 hover:to-slate-800 transition-all duration-200 cursor-pointer shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">Countries</h3>
                          <p className="text-gray-300 text-sm">8 locations • 484,380 jobs</p>
                        </div>
                      </div>
                      <div className="text-white">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

                   {/* Smart Filter Suggestions - Temporarily Disabled */}
                   {/* {showSuggestions && filters && (
                     <div className="mt-6">
                       <ErrorBoundary fallback={<div className="text-sm text-gray-500">Suggestions unavailable</div>}>
                         <SmartFilterSuggestions
                           currentFilters={filters}
                           onSuggestionSelect={(suggestion) => {
                             console.log('Suggestion selected:', suggestion);
                           }}
                           onFiltersChange={(newFilters) => {
                             setFilters(prev => ({ ...prev, ...newFilters }));
                           }}
                         />
                       </ErrorBoundary>
                     </div>
                   )} */}

              {/* Advanced Filters Toggle */}
              {showAdvancedFilters && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              )}

              {/* Advanced Filters */}
              {showAdvancedFilters && showAdvanced && (
                <div className="mt-6 space-y-6">
                  {/* Filter Grid */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {/* Job Type */}
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Job Type
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Required</Badge>
                        </Label>
                         <Select value={filters?.jobType || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                          <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
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

                      {/* Experience Level */}
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Experience
                          <Badge className="bg-purple-100 text-purple-800 border-0 text-xs">Smart</Badge>
                        </Label>
                         <Select value={filters?.experienceLevel || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                          <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
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

                      {/* Salary Range */}
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Min Salary
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
                        </Label>
                         <Input
                           placeholder="e.g., 50000"
                           value={filters?.salaryMin || ''}
                           onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                           type="number"
                           className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                         />
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Max Salary
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
                        </Label>
                         <Input
                           placeholder="e.g., 100000"
                           value={filters?.salaryMax || ''}
                           onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                           type="number"
                           className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                         />
                      </div>
                    </div>

                    {/* Remote Work Checkbox */}
                    <div className="mt-4 sm:mt-6">
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center space-x-3">
                             <Checkbox
                               id="remote"
                               checked={filters?.isRemote || false}
                               onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                               className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                             />
                            <Label htmlFor="remote" className="text-sm sm:text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                              Remote Work
                              <Badge className="bg-orange-100 text-orange-800 border-0 text-xs">Popular</Badge>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
