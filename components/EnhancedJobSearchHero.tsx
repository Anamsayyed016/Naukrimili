/**
 * Enhanced Job Search Hero Component
 * Includes search history, AI suggestions, and advanced search features
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertCircle, 
  X,
  SlidersHorizontal,
  ChevronDown,
  Map,
  Target,
  History,
  Lightbulb,
  Clock,
  TrendingUp,
  User,
  Briefcase,
  Building,
  MapPin as LocationIcon
} from 'lucide-react';
import { getSmartLocation } from '@/lib/mobile-geolocation';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useEnhancedSuggestions } from '@/hooks/useEnhancedSuggestions';
import { useDebounce } from '@/hooks/useDebounce';
import LocationCategories from './LocationCategories';
import SmartFilterSuggestions from './SmartFilterSuggestions';

interface EnhancedJobSearchHeroProps {
  className?: string;
  showAdvancedFilters?: boolean;
  showHistory?: boolean;
  showSuggestions?: boolean;
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

export default function EnhancedJobSearchHero({ 
  className = '', 
  showAdvancedFilters = true,
  showHistory = true,
  showSuggestions = true
}: EnhancedJobSearchHeroProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Search filters state
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all',
    isRemote: false,
    salaryMin: '',
    salaryMax: ''
  });

  // Debounced filters for auto-search (fast response)
  const debouncedQuery = useDebounce(filters.query, 500);
  const debouncedLocation = useDebounce(filters.location, 500);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Refs for dropdown management
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Dynamic constants
  const [dynamicConstants, setDynamicConstants] = useState({
    jobTypes: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    experienceLevels: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'],
    locations: []
  });

  // Custom hooks
  const {
    data: searchHistory,
    isLoading: historyLoading,
    createSearchHistory,
    deleteSearchHistory,
    clearSearchHistory,
    hasHistory
  } = useSearchHistory();

  const {
    suggestions,
    context,
    isLoading: suggestionsLoading,
    getSuggestions,
    getDetailedSuggestions,
    clearSuggestions,
    hasSuggestions
  } = useEnhancedSuggestions();

  // Fetch dynamic constants
  const fetchDynamicConstants = useCallback(async () => {
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
  }, []);

  // Detect user location
  const detectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getSmartLocation();
      setUserLocation({
        lat: location.coordinates?.lat || 0,
        lng: location.coordinates?.lng || 0,
        city: location.city || '',
        state: location.state,
        country: location.country || '',
        area: undefined, // Not available in GeolocationResult
        source: location.source as 'gps' | 'ip' | 'manual'
      });
      setFilters(prev => ({ ...prev, location: location.city }));
    } catch (error) {
      console.error('Location detection failed:', error);
      setLocationError('Unable to detect location. Please enter manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, query: value }));
    
    // Show suggestions if user is typing
    if (value.length >= 2 && showSuggestions) {
      setShowSuggestionsDropdown(true);
      getSuggestions({
        query: value,
        location: filters.location,
        context: 'job_search'
      });
    } else {
      setShowSuggestionsDropdown(false);
      clearSuggestions();
    }
  }, [filters.location, showSuggestions, getSuggestions, clearSuggestions]);

  // Handle location input changes
  const handleLocationChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
    
    // Update suggestions if query exists
    if (filters.query.length >= 2 && showSuggestions) {
      getSuggestions({
        query: filters.query,
        location: value,
        context: 'job_search'
      });
    }
  }, [filters.query, showSuggestions, getSuggestions]);

  // Handle search submission
  const handleSearch = useCallback(async (searchFilters = filters) => {
    if (!searchFilters.query.trim()) return;

    // Track search history
    if (session?.user?.id) {
      await createSearchHistory({
        query: searchFilters.query,
        location: searchFilters.location,
        filters: {
          jobType: searchFilters.jobType,
          experienceLevel: searchFilters.experienceLevel,
          isRemote: searchFilters.isRemote,
          salaryMin: searchFilters.salaryMin,
          salaryMax: searchFilters.salaryMax
        },
        searchType: 'job',
        source: 'web'
      });
    }

    // Build search URL with correct parameter names
    const searchParams = new URLSearchParams();
    searchParams.set('query', searchFilters.query); // Fixed: was 'q'
    if (searchFilters.location) searchParams.set('location', searchFilters.location);
    if (searchFilters.jobType !== 'all') searchParams.set('jobType', searchFilters.jobType);
    if (searchFilters.experienceLevel !== 'all') searchParams.set('experienceLevel', searchFilters.experienceLevel);
    if (searchFilters.isRemote) searchParams.set('isRemote', 'true'); // Fixed: was 'remote'
    if (searchFilters.salaryMin) searchParams.set('salaryMin', searchFilters.salaryMin);
    if (searchFilters.salaryMax) searchParams.set('salaryMax', searchFilters.salaryMax);

    // Navigate to search results
    router.push(`/jobs?${searchParams.toString()}`);
    
    // Close dropdowns
    setShowHistoryDropdown(false);
    setShowSuggestionsDropdown(false);
  }, [filters, session?.user?.id, createSearchHistory, router]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }));
    setShowSuggestionsDropdown(false);
    handleSearch({ ...filters, query: suggestion });
  }, [filters, handleSearch]);

  // Handle history click
  const handleHistoryClick = useCallback((historyItem: any) => {
    setFilters(prev => ({
      ...prev,
      query: historyItem.query,
      location: historyItem.location || ''
    }));
    setShowHistoryDropdown(false);
    handleSearch({
      ...filters,
      query: historyItem.query,
      location: historyItem.location || ''
    });
  }, [filters, handleSearch]);

  // Handle history delete
  const handleHistoryDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSearchHistory(id);
  }, [deleteSearchHistory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
      if (suggestionsDropdownRef.current && !suggestionsDropdownRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial data
  useEffect(() => {
    fetchDynamicConstants();
  }, [fetchDynamicConstants]);

  // Get suggestions on mount if user is authenticated
  useEffect(() => {
    if (session?.user?.id && showSuggestions) {
      getDetailedSuggestions({
        context: 'job_search',
        includeHistory: true,
        includeResume: true,
        includeApplications: true
      });
    }
  }, [session?.user?.id, showSuggestions, getDetailedSuggestions]);

  // Auto-search when debounced filters change (fast dynamic filtering)
  useEffect(() => {
    // Only auto-search if we have both query and location
    if (debouncedQuery.trim() && debouncedLocation.trim()) {
      console.log('🔄 Auto-searching with debounced filters:', { query: debouncedQuery, location: debouncedLocation });
      
      // Build search URL with debounced parameters
      const searchParams = new URLSearchParams();
      searchParams.set('query', debouncedQuery);
      searchParams.set('location', debouncedLocation);
      
      // Add other filters if they're not default values
      if (filters.jobType !== 'all') searchParams.set('jobType', filters.jobType);
      if (filters.experienceLevel !== 'all') searchParams.set('experienceLevel', filters.experienceLevel);
      if (filters.isRemote) searchParams.set('isRemote', 'true');
      if (filters.salaryMin) searchParams.set('salaryMin', filters.salaryMin);
      if (filters.salaryMax) searchParams.set('salaryMax', filters.salaryMax);

      // Navigate to search results (this will trigger OptimizedJobsClient to fetch new results)
      router.push(`/jobs?${searchParams.toString()}`);
    }
  }, [debouncedQuery, debouncedLocation, filters.jobType, filters.experienceLevel, filters.isRemote, filters.salaryMin, filters.salaryMax, router]);

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Main Search Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover thousands of job opportunities with AI-powered search and personalized suggestions
          </p>
        </div>

        {/* Search Form */}
        <div className="space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Job Title/Keyword Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={filters.query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (hasHistory && showHistory) {
                      setShowHistoryDropdown(true);
                    }
                  }}
                  className="pl-10 h-12 text-lg"
                />
                
                {/* History Dropdown */}
                {showHistory && hasHistory && showHistoryDropdown && (
                  <div
                    ref={historyDropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <History className="w-4 h-4 mr-2" />
                          Recent Searches
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearSearchHistory()}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="py-1">
                      {searchHistory.history.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                          onClick={() => handleHistoryClick(item)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.query}
                            </div>
                            {item.location && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.location}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleHistoryDelete(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && hasSuggestions && showSuggestionsDropdown && (
                  <div
                    ref={suggestionsDropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        AI Suggestions
                        {suggestionsLoading && (
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        )}
                      </h3>
                    </div>
                    <div className="py-1">
                      {suggestions.slice(0, 8).map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSuggestionClick(suggestion.query)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {suggestion.query}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {suggestion.reasoning}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {suggestion.category.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-gray-400">
                                {Math.round(suggestion.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Input */}
              <div className="sm:w-80 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="City, state, or country"
                  value={filters.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  {isDetectingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search Button */}
              <Button
                onClick={() => handleSearch()}
                className="h-12 px-8 text-lg font-medium"
                size="lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Jobs
              </Button>
            </div>

            {/* Location Error */}
            {locationError && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {locationError}
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {dynamicConstants.jobTypes.map((type) => (
              <Button
                key={type}
                variant={filters.jobType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, jobType: type }))}
              >
                {type}
              </Button>
            ))}
            <Button
              variant={filters.isRemote ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, isRemote: !prev.isRemote }))}
            >
              Remote
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          {showAdvancedFilters && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-gray-600 hover:text-gray-900"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Experience Level */}
              <div>
                <Label htmlFor="experienceLevel" className="text-sm font-medium text-gray-700">
                  Experience Level
                </Label>
                <Select
                  value={filters.experienceLevel}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {dynamicConstants.experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Salary Range (LPA)
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.salaryMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.salaryMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Search Radius */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Search Radius: {searchRadius} km
                </Label>
                <Slider
                  value={[searchRadius]}
                  onValueChange={(value) => setSearchRadius(value[0])}
                  max={100}
                  min={5}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sortByDistance"
                  checked={sortByDistance}
                  onCheckedChange={(checked) => setSortByDistance(checked as boolean)}
                />
                <Label htmlFor="sortByDistance" className="text-sm text-gray-700">
                  Sort by distance
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Smart Filter Suggestions */}
        <SmartFilterSuggestions
          currentFilters={filters}
          onSuggestionSelect={(suggestion) => {
            // Handle suggestion selection if needed
            console.log('Suggestion selected:', suggestion);
          }}
          onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          className="mt-6"
        />
      </div>

      {/* Location Categories */}
      <LocationCategories 
        className="mt-8" 
        onLocationSelect={(location) => {
          setFilters(prev => ({ ...prev, location: location.name }));
        }}
      />
    </div>
  );
}
