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
import { cn } from '@/lib/utils';
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
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame
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
  showAdvancedFilters = false 
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

  // Rotating placeholder — high-volume roles only (8 examples, animation unchanged)
  const ROTATING_PLACEHOLDERS = [
    'React Developer · Hyderabad',
    'Python Developer · Bangalore',
    'Data Analyst · Mumbai',
    'Business Analyst · Dubai',
    'Marketing Manager · London',
    'Accountant · New York',
    'Full Stack Developer · Pune',
    'AI Engineer · Remote',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Hero trending — 6 focused high-demand tags (static, no rotation)
  const TRENDING_TAGS = [
    'React Developer',
    'Python Developer',
    'Data Analyst',
    'Business Analyst',
    'Marketing Manager',
    'Accountant',
  ];
  
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

  // Rotate the AI placeholder text every ~3s — only while the input is empty.
  // Pauses when user starts typing to keep typing UX undisturbed.
  useEffect(() => {
    if (filters.query) return;
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [filters.query, ROTATING_PLACEHOLDERS.length]);

  // Apply a trending search chip click to the query
  const applyTrendingSearch = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, query: term }));
    setShowHistory(false);
    setShowSuggestions(false);
    // Defer focus + search slightly so React state has committed
    requestAnimationFrame(() => {
      queryInputRef.current?.focus();
    });
  }, []);

  // Manual search only - no auto-redirect

  return (
    <div
      className={`relative isolate overflow-hidden bg-white ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Subtle neutral + ambient indigo/blue/teal glow (hero only, near-invisible) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(15,23,42,0.036)_0%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[min(100%,52rem)] h-[min(90vw,28rem)] -z-10 opacity-[0.85] bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(124,58,237,0.055)_0%,rgba(37,99,235,0.04)_42%,rgba(6,182,212,0.028)_68%,transparent_78%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* Animation keyframes — global so inline style and arbitrary Tailwind classes can reference them */}
      <style jsx global>{`
        @keyframes ai-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.95; }
          50% { transform: scale(1.15) rotate(8deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-[ai-pulse"] {
            animation: none !important;
          }
        }
      `}</style>

      <div className="relative container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-5 max-w-full" style={{ overflow: 'visible' }}>
        <div className="relative text-center max-w-full lg:max-w-6xl mx-auto">
          {/* Hero heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 sm:mb-3"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold text-[#0F172A] mb-0 leading-[1.08] tracking-tight antialiased">
              Discover the{' '}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
                Career
              </span>{' '}
              You Deserve
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto"
          >
            <div className="relative z-10 flex justify-center -mb-2 sm:-mb-2.5">
              <div className="group/badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/75 backdrop-blur-md border border-[#2563EB]/15 text-[#64748B] text-[11px] sm:text-xs font-semibold tracking-wide shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_14px_-4px_rgba(37,99,235,0.12)] ring-1 ring-inset ring-white/60 transition-[box-shadow,color,border-color] duration-200 hover:border-[#2563EB]/25 hover:text-[#0F172A] hover:shadow-[0_2px_16px_-4px_rgba(37,99,235,0.18)]">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2563EB]/80 transition-colors duration-200 group-hover/badge:text-[#2563EB]" aria-hidden />
                <span>AI Job Match Engine</span>
              </div>
            </div>

            <div
              className="relative rounded-[1.75rem] sm:rounded-[2rem]"
              style={{ position: 'relative', overflow: 'visible' }}
            >
              <div className="relative rounded-[1.75rem] sm:rounded-[2rem] bg-white border border-[#2563EB]/12 shadow-[0_0_0_1px_rgba(37,99,235,0.06),0_1px_2px_0_rgba(15,23,42,0.03),0_8px_20px_-6px_rgba(37,99,235,0.08),0_24px_56px_-16px_rgba(15,23,42,0.11)] overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.1),0_1px_2px_0_rgba(15,23,42,0.03),0_12px_28px_-8px_rgba(37,99,235,0.1),0_28px_60px_-18px_rgba(15,23,42,0.12)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 sm:inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/35 to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.22) 35%, rgba(124,58,237,0.16) 52%, rgba(6,182,212,0.1) 70%, transparent 100%)',
                  }}
                />
                <div className="relative p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="group/icon relative shrink-0">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 via-[#7C3AED]/12 to-[#06B6D4]/8 blur-lg opacity-60 transition-opacity duration-200 group-hover/icon:opacity-75"
                  />
                  <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#2563EB] rounded-2xl shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_14px_-3px_rgba(37,99,235,0.28)] ring-1 ring-inset ring-white/20 transition-[box-shadow] duration-200 group-hover/icon:shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_6px_18px_-4px_rgba(37,99,235,0.32)]">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2 antialiased">
                    <span className="relative">
                      Smart Job Search
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-[#2563EB]/80 via-[#7C3AED]/70 to-[#06B6D4]/60"
                      />
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 backdrop-blur-sm text-[#64748B] border border-[#2563EB]/12 text-[10px] font-semibold uppercase tracking-wider shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_2px_8px_-2px_rgba(37,99,235,0.1)] ring-1 ring-inset ring-white/50 transition-[box-shadow,color,border-color] duration-200 hover:border-[#2563EB]/22 hover:text-[#2563EB]">
                      <Sparkles className="h-2.5 w-2.5 text-[#7C3AED]/80" aria-hidden /> AI
                    </span>
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    Every industry. Every career level. Worldwide opportunities.
                  </p>
                </div>
              </div>

              {/* Main Search Form */}
              <div className="space-y-4 lg:space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-4 lg:gap-5">
                  {/* Job Title Search */}
                  <div className="group/input relative w-full min-w-0">
                    <div className="relative">
                      <Search
                        className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#64748B] z-10 flex-shrink-0 transition-colors duration-200 group-focus-within/input:text-[#2563EB]"
                        aria-hidden
                      />
                      <Input
                        ref={queryInputRef}
                        type="text"
                        placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                        value={filters.query}
                        onChange={(e) => {
                          setFilters((prev) => ({ ...prev, query: e.target.value }));
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
                        className={cn(
                          'w-full min-w-0 pl-10 sm:pl-11 lg:pl-12 pr-10 sm:pr-12 py-3.5 sm:py-4',
                          'text-[#0F172A] placeholder:text-[#64748B] placeholder:font-normal',
                          'bg-white border border-slate-200/90',
                          'focus:border-[#2563EB] focus:bg-white focus:ring-0 focus:outline-none',
                          'focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12),inset_0_1px_2px_0_rgba(15,23,42,0.03)]',
                          'rounded-2xl text-sm sm:text-base font-medium',
                          'transition-[background-color,border-color,box-shadow] duration-200',
                          'shadow-[inset_0_1px_2px_0_rgba(15,23,42,0.03)]',
                          'focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:ring-offset-0'
                        )}
                      />
                      {/* Clear button — appears when input has value */}
                      {filters.query && (
                        <button
                          type="button"
                          aria-label="Clear query"
                          onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    
                    {/* Suggestions & History Dropdown — glass dropdown matching card */}
                    {(showSuggestions || showHistory) && (
                      <div
                        ref={suggestionsRef}
                        className="absolute left-0 right-0 rounded-2xl bg-white/95 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/80 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.25)] max-h-80 overflow-y-auto"
                        style={{
                          zIndex: 99999,
                          position: 'absolute',
                          top: 'calc(100% + 10px)',
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

                  {/* Location Search */}
                  <div className="group/loc relative w-full min-w-0">
                    <div className="relative">
                      <MapPin
                        className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#64748B] z-10 flex-shrink-0 transition-colors duration-200 group-focus-within/loc:text-[#2563EB]"
                        aria-hidden
                      />
                      <Input
                        type="text"
                        placeholder="City, state, country"
                        value={filters.location}
                        onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch();
                          }
                        }}
                        className={cn(
                          'w-full min-w-0 pl-10 sm:pl-11 lg:pl-12 pr-24 sm:pr-28 py-3.5 sm:py-4',
                          'text-[#0F172A] placeholder:text-[#64748B] placeholder:font-normal',
                          'bg-white border border-slate-200/90',
                          'focus:border-[#2563EB] focus:bg-white focus:ring-0 focus:outline-none',
                          'focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12),inset_0_1px_2px_0_rgba(15,23,42,0.03)]',
                          'rounded-2xl text-sm sm:text-base font-medium',
                          'transition-[background-color,border-color,box-shadow] duration-200',
                          'shadow-[inset_0_1px_2px_0_rgba(15,23,42,0.03)]',
                          'focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:ring-offset-0'
                        )}
                      />
                      <Button
                        type="button"
                        onClick={detectCurrentLocation}
                        disabled={isDetectingLocation}
                        className={cn(
                          'absolute right-1.5 top-1/2 -translate-y-1/2 h-8 sm:h-9 px-2.5 sm:px-3',
                          'bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#2563EB]',
                          'hover:from-[#1d4ed8] hover:via-[#6d28d9] hover:to-[#1d4ed8]',
                          'text-white text-xs font-semibold rounded-xl',
                          'shadow-[0_1px_2px_0_rgba(15,23,42,0.08),0_4px_12px_-2px_rgba(37,99,235,0.35)]',
                          'hover:shadow-[0_2px_6px_0_rgba(15,23,42,0.06),0_10px_24px_-6px_rgba(37,99,235,0.38)]',
                          'transition-[transform,box-shadow,background] duration-200 ease-out hover:-translate-y-px',
                          'active:scale-[0.98]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2',
                          'flex-shrink-0'
                        )}
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Detect</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Trending searches — quick chips */}
                <div className="group/trend flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider shrink-0 transition-colors duration-200 group-hover/trend:text-[#2563EB]">
                    <Flame className="w-3.5 h-3.5 text-[#94A3B8] transition-[color,transform] duration-200 group-hover/trend:text-[#7C3AED] group-hover/trend:scale-105" aria-hidden /> Trending
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {TRENDING_TAGS.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => applyTrendingSearch(term)}
                        className={cn(
                          'group/chip relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full',
                          'bg-[#2563EB]/[0.06] border border-[#2563EB]/10 text-[#64748B] text-xs sm:text-[13px] font-medium',
                          'hover:bg-[#2563EB]/10 hover:border-[#2563EB]/22 hover:text-[#2563EB]',
                          'hover:shadow-[0_2px_8px_-2px_rgba(37,99,235,0.2)]',
                          'active:scale-[0.98] transition-[background-color,border-color,color,box-shadow] duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 focus-visible:ring-offset-1'
                        )}
                      >
                        <span>{term}</span>
                        <ArrowRight className="h-3 w-3 text-[#2563EB] opacity-0 -ml-1 transition-all duration-200 group-hover/chip:opacity-80 group-hover/chip:ml-0 group-hover/chip:translate-x-0.5" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-center pt-2">
                  <div className="group/cta relative inline-flex w-full sm:w-auto">
                    <Button
                      onClick={handleSearch}
                      data-testid="search-button"
                      type="button"
                      className={cn(
                        'relative overflow-hidden inline-flex items-center justify-center w-full sm:w-auto',
                        'px-7 sm:px-10 lg:px-14 py-3 sm:py-3.5 lg:py-4',
                        'text-white font-bold text-sm sm:text-base lg:text-lg tracking-tight',
                        'rounded-2xl min-w-0 sm:min-w-[220px] lg:min-w-[260px] max-w-full cursor-pointer',
                        'bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#2563EB]',
                        'hover:from-[#1d4ed8] hover:via-[#6d28d9] hover:to-[#1d4ed8]',
                        'shadow-[0_1px_2px_0_rgba(15,23,42,0.08),0_4px_16px_-4px_rgba(37,99,235,0.35)]',
                        'hover:shadow-[0_2px_6px_0_rgba(15,23,42,0.06),0_16px_36px_-10px_rgba(37,99,235,0.42)]',
                        'transition-[transform,box-shadow,background] duration-200 ease-out hover:-translate-y-px',
                        'active:scale-[0.98]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2'
                      )}
                    >
                      <Sparkles className="relative w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 transition-transform duration-200 group-hover/cta:rotate-6" aria-hidden />
                      <span className="relative truncate">Search Jobs</span>
                      <ArrowRight className="relative w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden />
                    </Button>
                  </div>
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

              {/* Advanced Filters Toggle — minimal glass pill */}
              {showAdvancedFilters && (
                <div className="mt-5 sm:mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                      'group/adv inline-flex items-center gap-2 px-4 py-2 rounded-full',
                      'bg-white/60 hover:bg-white border border-slate-200/80 hover:border-indigo-200',
                      'text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-700',
                      'shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_6px_18px_-6px_rgba(99,102,241,0.35)]',
                      'transition-all duration-200'
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
                    {showAdvanced ? 'Hide filters' : 'Advanced filters'}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-300',
                        showAdvanced && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </button>
                </div>
              )}

              {/* Advanced Filters — animated glass drawer */}
              {showAdvancedFilters && showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 sm:mt-6 space-y-4"
                >
                  {/* Filter Grid */}
                  <div className="rounded-2xl p-4 sm:p-5 bg-white/65 backdrop-blur-md border border-slate-200/70 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.6)]">
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
                </motion.div>
              )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
