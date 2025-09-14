"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Globe, Award, Clock, User, Sparkles, Upload, FileText, Building2, BriefcaseIcon, ChevronDown, Loader2, Navigation, Target, Star, Filter } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Job {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  isRemote: boolean;
  isFeatured: boolean;
}

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
  industry?: string | null;
  jobCount: number;
}

interface HomePageClientProps {
  featuredJobs: Job[];
  topCompanies: Company[];
  trendingSearches: string[];
  popularLocations: string[];
}

export default function HomePageClient({
  featuredJobs,
  topCompanies,
  trendingSearches,
  popularLocations
}: HomePageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Advanced Search State
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all',
    salaryRange: 'all',
    isRemote: false,
    skills: ''
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
    country: string;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [dynamicConstants, setDynamicConstants] = useState({
    jobTypes: [],
    experienceLevels: [],
    skills: [],
    locations: []
  });

  // Remove auto-redirect logic to prevent forced authentication
  // Users can stay on homepage regardless of auth status
  useEffect(() => {
    console.log('HomePageClient - Session status:', status);
    console.log('HomePageClient - Session data:', session);
    
    // Only log auth status, don't force redirects
    if (status === 'authenticated' && session?.user) {
      console.log('HomePageClient - User authenticated:', session.user);
    } else if (status === 'unauthenticated') {
      console.log('HomePageClient - User not authenticated');
    } else if (status === 'loading') {
      console.log('HomePageClient - Session loading...');
    }
  }, [session, status]);





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

  // AI-powered search suggestions
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch('/api/ai/search-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          location: searchFilters.location,
          context: 'homepage_search' 
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchSuggestions(data.suggestions.map((s: any) => s.query));
        }
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  }, [searchFilters.location]);

  // Location detection
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              setUserLocation({
                lat: latitude,
                lng: longitude,
                city: result.components.city || result.components.town || 'Unknown',
                country: result.components.country || 'Unknown'
              });
              setSearchFilters(prev => ({
                ...prev,
                location: result.components.city || result.components.town || ''
              }));
            }
          }
        } catch (error) {
          console.error('Error getting location details:', error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsDetectingLocation(false);
      }
    );
  }, []);

  // Handle search submission
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      if (searchFilters.query) params.set('q', searchFilters.query);
      if (searchFilters.location) params.set('location', searchFilters.location);
      if (searchFilters.jobType !== 'all') params.set('jobType', searchFilters.jobType);
      if (searchFilters.experienceLevel !== 'all') params.set('experienceLevel', searchFilters.experienceLevel);
      if (searchFilters.salaryRange !== 'all') params.set('salaryRange', searchFilters.salaryRange);
      if (searchFilters.isRemote) params.set('isRemote', 'true');
      if (searchFilters.skills) params.set('skills', searchFilters.skills);
      
      // Add location coordinates if available
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
        params.set('sortByDistance', 'true');
      }

      const searchUrl = `/jobs?${params.toString()}`;
      router.push(searchUrl);
    } catch (error) {
      console.error('Error handling search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchFilters, userLocation, router]);

  // Initialize dynamic constants
  useEffect(() => {
    fetchDynamicConstants();
  }, [fetchDynamicConstants]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.suggestions-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if user is authenticated for conditional rendering
  const isAuthenticated = status === 'authenticated' && session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* User Profile Corner - Show if authenticated - Hidden on mobile to avoid conflicts */}
      {isAuthenticated && (
        <div className="hidden lg:block fixed top-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-3 max-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{session.user.name || 'User'}</div>
                <div className="text-gray-500 text-xs truncate">{session.user.email}</div>
                {session.user.role && (
                  <div className="text-xs text-blue-600 font-medium capitalize">
                    {session.user.role}
                  </div>
                )}
              </div>
              {!session.user.role && (
                <button
                  onClick={() => router.push('/auth/role-selection')}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  Choose Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Hero Section - Enhanced with Authentication */}
      <section className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AI-Powered Job Matching Platform
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Dream Job
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              with NaukriMili
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover thousands of opportunities from verified companies. 
            <span className="font-semibold text-blue-600"> AI-powered matching</span> ensures you find the perfect fit.
          </p>

          {/* Advanced AI-Powered Search Bar */}
          <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Search Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Smart Job Search</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-semibold">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Powered
                        </Badge>
                        <span className="text-sm text-gray-600">Find your perfect match</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Main Search Inputs */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  {/* Job Title/Skills Input */}
                  <div className="lg:col-span-2 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-semibold text-gray-700">Job Title, Skills, or Company</label>
                    </div>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter skills, designations, or company name"
                        value={searchFilters.query}
                        onChange={(e) => {
                          setSearchFilters(prev => ({ ...prev, query: e.target.value }));
                          fetchSearchSuggestions(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full pl-4 pr-4 py-3 text-gray-900 placeholder-gray-500 border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-base"
                      />
                      {searchSuggestions.length > 0 && showSuggestions && (
                        <div className="suggestions-container absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSearchFilters(prev => ({ ...prev, query: suggestion }));
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                            >
                              <Search className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Input */}
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-semibold text-gray-700">Location</label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="City, state, or remote"
                        value={searchFilters.location}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="flex-1 pl-4 pr-4 py-3 text-gray-900 placeholder-gray-500 border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-base"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={detectCurrentLocation}
                        disabled={isDetectingLocation}
                        className="px-4 py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Live Location</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    {/* Job Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                      <Select
                        value={searchFilters.jobType}
                        onValueChange={(value) => setSearchFilters(prev => ({ ...prev, jobType: value }))}
                      >
                        <SelectTrigger className="border-2 border-gray-200 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {dynamicConstants.jobTypes.map((type: any) => (
                            <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                      <Select
                        value={searchFilters.experienceLevel}
                        onValueChange={(value) => setSearchFilters(prev => ({ ...prev, experienceLevel: value }))}
                      >
                        <SelectTrigger className="border-2 border-gray-200 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {dynamicConstants.experienceLevels.map((level: any) => (
                            <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Salary Range */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range</label>
                      <Select
                        value={searchFilters.salaryRange}
                        onValueChange={(value) => setSearchFilters(prev => ({ ...prev, salaryRange: value }))}
                      >
                        <SelectTrigger className="border-2 border-gray-200 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select salary" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Salaries</SelectItem>
                          <SelectItem value="0-3">₹0-3 LPA</SelectItem>
                          <SelectItem value="3-6">₹3-6 LPA</SelectItem>
                          <SelectItem value="6-10">₹6-10 LPA</SelectItem>
                          <SelectItem value="10-15">₹10-15 LPA</SelectItem>
                          <SelectItem value="15+">₹15+ LPA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remote Work */}
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchFilters.isRemote}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, isRemote: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">Remote Work</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Search Jobs
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>


          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3 mx-auto">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">10K+</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 mx-auto">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">500+</div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3 mx-auto">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">50K+</div>
                <div className="text-sm text-gray-600">Job Seekers</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3 mx-auto">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">95%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Trending Searches */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Trending Searches</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {trendingSearches.map((search, index) => (
                <Link
                  key={index}
                  href={`/jobs?q=${encodeURIComponent(search)}`}
                  className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  {search}
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Locations */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Locations</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {popularLocations.map((location, index) => (
                <Link
                  key={index}
                  href={`/jobs?location=${encodeURIComponent(location)}`}
                  className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {location}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NaukriMili</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of job searching with our cutting-edge platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">AI-Powered Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithm matches you with the perfect job opportunities based on your skills and preferences.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">Verified Companies</h3>
              <p className="text-gray-600 leading-relaxed">
                All companies are verified and legitimate, ensuring you apply to real opportunities.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">Instant Applications</h3>
              <p className="text-gray-600 leading-relaxed">
                Apply to multiple jobs with just a few clicks. No more complex application processes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
            <div className="mb-6 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Featured Jobs</h2>
              <p className="text-sm sm:text-base text-gray-600">Discover the latest opportunities from top companies</p>
            </div>
            <Link 
              href="/jobs"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company}</p>
                    </div>
                    {job.isFeatured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Award className="w-4 h-4 flex-shrink-0" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{job.jobType}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                    >
                      View Details →
                    </Link>
                    <Link
                      href={`/jobs/${job.id}/apply`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Jobs Available</h3>
                <p className="text-gray-600 mb-4">Check back later for new opportunities</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Browse All Jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
            <div className="mb-6 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Top Companies</h2>
              <p className="text-sm sm:text-base text-gray-600">Work with the best companies in the industry</p>
            </div>
            <Link 
              href="/companies"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
            >
              View All Companies
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {topCompanies.length > 0 ? (
              topCompanies.map((company) => (
                <div key={company.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{company.name}</h3>
                      
                      {company.industry && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{company.industry}</span>
                        </div>
                      )}
                      
                      {company.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{company.location}</span>
                        </div>
                      )}
                      
                      {company.jobCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span>{company.jobCount} open position{company.jobCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/companies/${company.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                    >
                      View Company →
                    </Link>
                    <Link 
                      href={`/companies/${company.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105"
                    >
                      Explore Jobs
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Available</h3>
                <p className="text-gray-600 mb-4">Check back later for company listings</p>
                <Link
                  href="/companies"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Browse All Companies
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join thousands of job seekers who have found their dream jobs through NaukriMili. 
            Start your search today and take the first step towards your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <OAuthButtons 
              callbackUrl="/"
              className="!w-auto"
            />
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Start Job Search
            </Link>
            <Link
              href="/resumes/upload"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
