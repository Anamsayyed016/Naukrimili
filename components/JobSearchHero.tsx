'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock,
  TrendingUp
} from 'lucide-react';
import { getSmartLocation } from '@/lib/mobile-geolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchHistory, type SearchHistoryEntry } from '@/hooks/useSearchHistory';
import { motion } from 'framer-motion';
// Note: LocationCategories component intentionally not used here per UX direction.
// Metropolitan/States/Countries sections were removed from the hero for a cleaner
// AI-first search experience. The component remains available for other pages.
// import SmartFilterSuggestions from './SmartFilterSuggestions'; // Removed - causing infinite re-render

interface JobSearchHeroProps {
  className?: string;
  showAdvancedFilters?: boolean;
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

export default function JobSearchHero({ 
  className = '', 
  showAdvancedFilters = true 
}: JobSearchHeroProps) {
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
  const debouncedQuery = useDebounce(filters.query, 300);
  const debouncedLocation = useDebounce(filters.location, 500);
  
  // Advanced filters state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Suggestions & History state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{type: string; value: string}>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Refs for click outside detection
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  
  // Dynamic constants
  const [dynamicConstants, setDynamicConstants] = useState({
    jobTypes: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    experienceLevels: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'],
    locations: []
  });
  
  // Search history hook
  const { data: searchHistoryData, createSearchHistory } = useSearchHistory();


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

  // Fetch job suggestions with Typesense autocomplete (fallback to existing endpoint)
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      
      // Try Typesense autocomplete first (real-time, typo-tolerant)
      try {
        const typesenseResponse = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(query)}&type=all&limit=15`
        );
        
        if (typesenseResponse.ok) {
          const typesenseData = await typesenseResponse.json();
          
          if (typesenseData.success && typesenseData.suggestions && typesenseData.suggestions.length > 0) {
            // Transform Typesense suggestions to match existing format
            const transformedSuggestions = typesenseData.suggestions.map((suggestion: Record<string, unknown>) => ({
              type: String(suggestion.type || ''),
              value: String(suggestion.text || ''),
              highlight: String(suggestion.highlight || ''),
            }));
            
            setSuggestions(transformedSuggestions);
            return; // Successfully got Typesense suggestions
          }
        }
      } catch (typesenseError) {
        // Fall through to existing endpoint if Typesense fails
        console.debug('Typesense autocomplete not available, using fallback:', typesenseError);
      }
      
      // Fallback to existing search-suggestions endpoint
      const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions); // Show all suggestions (API limits to 15)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Handle search submission with unlimited search
  const handleSearch = useCallback(async () => {
    const params = new URLSearchParams();
    
    // Use unlimited search parameters - FIXED: Use correct parameter names
    if (filters.query) params.set('query', filters.query); // Fixed: was 'q'
    if (filters.location) params.set('location', filters.location);
    if (filters.jobType !== 'all') params.set('jobType', filters.jobType);
    if (filters.experienceLevel !== 'all') params.set('experienceLevel', filters.experienceLevel);
    if (filters.isRemote) params.set('isRemote', 'true');
    if (filters.salaryMin) params.set('salaryMin', filters.salaryMin);
    if (filters.salaryMax) params.set('salaryMax', filters.salaryMax);
    
    // Add unlimited search parameters - FIXED: Use correct API endpoint
    params.set('limit', '1000'); // Increased limit for 1000+ jobs
    params.set('includeExternal', 'true');
    params.set('includeDatabase', 'true');
    // Removed includeSample=true to let the API decide when to show sample jobs
    
    // Add location coordinates if available
    if (userLocation) {
      params.set('lat', userLocation.lat.toString());
      params.set('lng', userLocation.lng.toString());
      params.set('radius', searchRadius.toString());
      if (sortByDistance) params.set('sortByDistance', 'true');
    }

    // Save search history if user is authenticated
    if (session?.user?.id && filters.query) {
      await createSearchHistory({
        query: filters.query,
        location: filters.location || undefined,
        filters: {
          jobType: filters.jobType,
          experienceLevel: filters.experienceLevel,
          isRemote: filters.isRemote,
          salaryMin: filters.salaryMin,
          salaryMax: filters.salaryMax
        },
        searchType: 'job',
        source: 'web'
      });
    }

    // Hide dropdowns
    setShowSuggestions(false);
    setShowHistory(false);

    // FIXED: Use the unlimited search API endpoint directly
    const searchUrl = `/jobs?${params.toString()}`;
    console.log('🔍 Search URL:', searchUrl); // Debug log
    router.push(searchUrl);
  }, [filters, userLocation, searchRadius, sortByDistance, session, createSearchHistory]);

  // Location detection with improved error handling
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
        // Provide more helpful error messages
        let errorMessage = result.error || 'Failed to detect location';
        
        // Check if it's an HTTPS issue
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
      lat: 0, // We don't have coordinates for popular locations
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
      salaryMax: ''
    });
    setUserLocation(null);
    setSearchRadius(25);
    setSortByDistance(false);
    setLocationError(null);
  }, []);

  // Fetch suggestions when user types
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, fetchSuggestions]);

  // Show history when user focuses on empty input
  const handleQueryFocus = useCallback(() => {
    if (!filters.query && searchHistoryData && searchHistoryData.history.length > 0) {
      setShowHistory(true);
      setShowSuggestions(false);
    }
  }, [filters.query, searchHistoryData]);

  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          queryInputRef.current && !queryInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: {type: string; value: string}) => {
    setFilters(prev => ({ ...prev, query: suggestion.value }));
    setShowSuggestions(false);
    setShowHistory(false);
  }, []);

  // Handle history selection
  const handleHistorySelect = useCallback((historyItem: SearchHistoryEntry) => {
    setFilters(prev => ({
      ...prev,
      query: historyItem.query,
      location: historyItem.location || prev.location
    }));
    setShowHistory(false);
    setShowSuggestions(false);
  }, []);

  // Initialize dynamic constants
  useEffect(() => {
    fetchDynamicConstants();
  }, [fetchDynamicConstants]);

  // Manual search only - no auto-redirect

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#04060f] ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* === Premium animated background layers (pure CSS, GPU-cheap) === */}
      {/* Base deep gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#1e1b4b_0%,#0b1024_45%,#04060f_100%)]"
      />
      {/* Soft mesh gradient orbs — float gently */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/40 via-violet-500/30 to-fuchsia-500/20 blur-3xl opacity-70 animate-[hero-orb_18s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-32 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-teal-400/30 via-cyan-500/25 to-blue-500/20 blur-3xl opacity-60 animate-[hero-orb_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-fuchsia-500/25 via-rose-500/20 to-amber-400/15 blur-3xl opacity-50 animate-[hero-orb_26s_ease-in-out_infinite]" />
      </div>
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* Animation keyframes scoped to hero — auto-disabled when user prefers reduced motion */}
      <style jsx>{`
        @keyframes hero-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.08); }
          66% { transform: translate(-30px, 25px) scale(0.95); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.absolute[class*="animate-[hero-orb"]) {
            animation: none !important;
          }
        }
      `}</style>

      <div className="relative container mx-auto px-3 sm:px-4 lg:px-6 py-16 sm:py-20 lg:py-24 xl:py-28 max-w-full" style={{ overflow: 'visible' }}>
        <div className="text-center max-w-full lg:max-w-6xl mx-auto">
          {/* === Premium AI Hero Header === */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 lg:mb-12"
          >
            {/* AI pill badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[11px] sm:text-xs font-medium tracking-wider uppercase text-white/90 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
              </span>
              <span>AI-Powered Job Discovery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
              Discover the{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Career
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-1.5 rounded-full bg-gradient-to-r from-teal-400/0 via-indigo-400/70 to-fuchsia-400/0 blur-sm"
                />
              </span>{' '}
              You Deserve
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base lg:text-lg text-white/65 leading-relaxed font-light">
              Smart matching across thousands of roles. Real-time suggestions, location-aware results,
              and the world&apos;s leading employers — all in one search.
            </p>
          </motion.div>
          
          {/* === Floating Glass Search Card === */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-full lg:max-w-5xl xl:max-w-6xl mx-auto"
          >
            <div
              className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 xl:p-8"
              style={{ position: 'relative', overflow: 'visible', minHeight: '300px' }}
            >
              {/* Outer glow ring */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-400/30 via-indigo-400/30 to-fuchsia-400/30 opacity-60 blur-md"
              />
              {/* Glass surface */}
              <div className="relative rounded-2xl sm:rounded-3xl bg-white/[0.92] backdrop-blur-2xl backdrop-saturate-150 border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.6)] p-3 sm:p-4 lg:p-6 xl:p-8">
              {/* Compact search header — minimalist AI badge */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-teal-500 via-indigo-600 to-violet-600 rounded-xl shadow-[0_4px_14px_-4px_rgba(99,102,241,0.5)]">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 tracking-tight">
                    <span>Smart Job Search</span>
                    <Badge className="bg-gradient-to-r from-teal-100 to-indigo-100 text-indigo-800 border-0 font-semibold text-[10px] sm:text-xs">
                      AI Powered
                    </Badge>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 px-2 sm:px-0">
                    Search by title, location, or company
                  </p>
                </div>
              </div>

              {/* Main Search Form */}
              <div className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Job Title Search with Suggestions & History */}
                  <div className="relative w-full min-w-0">
                    <Search className="absolute left-2 sm:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10 flex-shrink-0" />
                    <Input
                      ref={queryInputRef}
                      type="text"
                      placeholder="Job title, keywords, company"
                      value={filters.query}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, query: e.target.value }));
                        if (e.target.value.length >= 2) {
                          setShowHistory(false);
                        }
                      }}
                      onFocus={handleQueryFocus}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      className="w-full min-w-0 pl-8 sm:pl-10 lg:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 shadow-sm"
                    />
                    
                    {/* Suggestions & History Dropdown */}
                    {(showSuggestions || showHistory) && (
                      <div
                        ref={suggestionsRef}
                        className="absolute left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
                        style={{
                          zIndex: 99999,
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Search History */}
                        {showHistory && searchHistoryData && searchHistoryData.history.length > 0 && (
                          <div className="p-2">
                            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                              <div className="flex items-center gap-2">
                                <History className="w-3 h-3" />
                                <span>Recent Searches</span>
                              </div>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowHistory(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                type="button"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {searchHistoryData.history.slice(0, 5).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleHistorySelect(item);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors text-left group cursor-pointer"
                              >
                                <Clock className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{item.query}</div>
                                  {item.location && (
                                    <div className="text-xs text-gray-500 truncate">{item.location}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Job Suggestions */}
                        {showSuggestions && (
                          <div className="p-2">
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                              <TrendingUp className="w-3 h-3" />
                              <span>Suggestions</span>
                            </div>
                            {loadingSuggestions ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              </div>
                            ) : suggestions.length > 0 ? (
                              suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSuggestionSelect(suggestion);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors text-left group cursor-pointer"
                                >
                                  <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate">{suggestion.value}</span>
                                    <Badge variant="outline" className="ml-2 text-xs bg-gray-50 text-gray-600 border-gray-300">
                                      {suggestion.type}
                                    </Badge>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No suggestions found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location Search with Enhanced Geolocation */}
                  <div className="relative w-full min-w-0">
                    <MapPin className="absolute left-2 sm:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10 flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="City, state, country"
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full min-w-0 pl-8 sm:pl-10 lg:pl-12 pr-14 sm:pr-16 lg:pr-20 py-2.5 sm:py-3 lg:py-4 text-gray-900 placeholder-gray-500 bg-gray-50 border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 shadow-sm"
                    />
                    <Button
                      type="button"
                      onClick={detectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="absolute right-1 sm:right-1.5 lg:right-2 top-1/2 transform -translate-y-1/2 h-7 sm:h-8 lg:h-10 px-1.5 sm:px-2 lg:px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                          <span className="hidden sm:inline text-xs">Live</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-center px-2 sm:px-0">
                  <Button 
                    onClick={handleSearch} 
                    data-testid="search-button"
                    type="button"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-lg sm:rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-sm sm:text-base lg:text-lg min-w-0 sm:min-w-[180px] lg:min-w-[220px] max-w-full cursor-pointer"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">Search Jobs</span>
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Location Status Display */}
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
              
              {/* Enhanced Error Display with Retry */}
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

              {/* Manual Location Selection Help */}
              {locationError && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> You can also type your city name in the location field above.
                  </div>
                </div>
              )}

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
                        <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                          <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                            <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Types</SelectItem>
                            {dynamicConstants.jobTypes && dynamicConstants.jobTypes.length > 0 ? (
                              dynamicConstants.jobTypes.map((jobType: string | { value: string; label: string; count?: number }) => {
                                const value = typeof jobType === 'string' ? jobType : jobType.value;
                                const label = typeof jobType === 'string' ? jobType : jobType.label;
                                const count = typeof jobType === 'string' ? undefined : jobType.count;
                                return (
                                  <SelectItem 
                                    key={value} 
                                    value={value} 
                                    className="text-gray-900 hover:bg-blue-50"
                                  >
                                    {label} {count ? `(${count})` : ''}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <>
                                <SelectItem value="full-time" className="text-gray-900 hover:bg-blue-50">Full-time</SelectItem>
                                <SelectItem value="part-time" className="text-gray-900 hover:bg-blue-50">Part-time</SelectItem>
                                <SelectItem value="contract" className="text-gray-900 hover:bg-blue-50">Contract</SelectItem>
                                <SelectItem value="internship" className="text-gray-900 hover:bg-blue-50">Internship</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Experience Level */}
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Experience
                          <Badge className="bg-purple-100 text-purple-800 border-0 text-xs">Smart</Badge>
                        </Label>
                        <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                          <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                            <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Levels</SelectItem>
                            {dynamicConstants.experienceLevels && dynamicConstants.experienceLevels.length > 0 ? (
                              dynamicConstants.experienceLevels.map((level: string | { value: string; label: string; count?: number }) => {
                                const value = typeof level === 'string' ? level : level.value;
                                const label = typeof level === 'string' ? level : level.label;
                                const count = typeof level === 'string' ? undefined : level.count;
                                return (
                                  <SelectItem 
                                    key={value} 
                                    value={value} 
                                    className="text-gray-900 hover:bg-blue-50"
                                  >
                                    {label} {count ? `(${count})` : ''}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <>
                                <SelectItem value="entry" className="text-gray-900 hover:bg-blue-50">Entry Level (0-2 years)</SelectItem>
                                <SelectItem value="mid" className="text-gray-900 hover:bg-blue-50">Mid Level (2-5 years)</SelectItem>
                                <SelectItem value="senior" className="text-gray-900 hover:bg-blue-50">Senior Level (5-10 years)</SelectItem>
                                <SelectItem value="lead" className="text-gray-900 hover:bg-blue-50">Lead (10+ years)</SelectItem>
                                <SelectItem value="executive" className="text-gray-900 hover:bg-blue-50">Executive</SelectItem>
                              </>
                            )}
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
                          value={filters.salaryMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                          type="number"
                          className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>

                      {/* Remote Work */}
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                          Max Salary
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
                        </Label>
                        <Input
                          placeholder="e.g., 100000"
                          value={filters.salaryMax}
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
                              checked={filters.isRemote}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
