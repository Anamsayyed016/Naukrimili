'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Briefcase, TrendingUp, Star, Clock, Users, BookmarkPlus, Filter, ArrowRight, Zap } from 'lucide-react';
import type { JobResult } from '@/types/jobs';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useRealTimeJobSearch } from '@/hooks/useRealTimeJobSearch';
import { userActivityService, UserInteraction, TrendingMetrics } from '@/lib/userActivityService';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  category: string;
  description: string;
  requirements: string[];
  isHot?: boolean;
  isNew?: boolean;
  postedAt: string}

interface TrendingCategory {
  name: string;
  count: number;
  growth: number;
  icon: string;
  searches: number;
  userEngagement: number}

interface SmartSuggestion {
  text: string;
  type: 'location' | 'skill' | 'company' | 'category';
  confidence: number}

const UnifiedJobPortal: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobType, setJobType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { location: detectedLocation, isLoading: isDetecting } = useLocationDetection();
  const { 
    jobs: searchResults, 
    isLoading: isSearching, 
    error: searchError,
    updateFilters,
    updateFilter,
    refetch
  } = useRealTimeJobSearch({
    query: '',
    location: '',
    country: 'US',
    jobType: '',
    experienceLevel: '',
    companyType: '',
    category: '',
    sortBy: 'relevance',
    remote: false,
    datePosted: 'any'
  });

  // Client-side only data to prevent hydration errors
  const [trendingCategories, setTrendingCategories] = useState<TrendingCategory[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [userMetrics, setUserMetrics] = useState<TrendingMetrics | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Initialize client-side data after mount
    const initializeData = async () => {
      try {
        // Get user metrics - simplified for now
        const metrics = {
          categorySearches: {},
          categoryEngagement: {},
          averageSessionTime: 5.2,
          totalSearches: 15,
          totalJobViews: 42,
          suggestedSearches: ['React Developer', 'Product Manager'],
          suggestedLocations: ['Remote', 'San Francisco'],
          suggestedCategories: ['Technology', 'Marketing'],
          bestSearchTime: 'Morning'
        };
        setUserMetrics(metrics as any);

        // Generate trending categories based on user activity
        const baseTrendingCategories: TrendingCategory[] = [
          { name: 'Software Development', count: 1250, growth: 15.2, icon: '💻', searches: 0, userEngagement: 0 },
          { name: 'Data Science', count: 890, growth: 23.1, icon: '📊', searches: 0, userEngagement: 0 },
          { name: 'Product Management', count: 567, growth: 8.5, icon: '🚀', searches: 0, userEngagement: 0 },
          { name: 'Digital Marketing', count: 432, growth: 12.3, icon: '📢', searches: 0, userEngagement: 0 },
          { name: 'UX/UI Design', count: 398, growth: 18.7, icon: '🎨', searches: 0, userEngagement: 0 },
          { name: 'DevOps Engineering', count: 321, growth: 25.4, icon: '⚙️', searches: 0, userEngagement: 0 },
          { name: 'Cybersecurity', count: 289, growth: 31.2, icon: '🔒', searches: 0, userEngagement: 0 },
          { name: 'Mobile Development', count: 267, growth: 19.8, icon: '📱', searches: 0, userEngagement: 0 },
          { name: 'Machine Learning', count: 245, growth: 28.5, icon: '🤖', searches: 0, userEngagement: 0 },
          { name: 'Cloud Computing', count: 223, growth: 22.1, icon: '☁️', searches: 0, userEngagement: 0 },
          { name: 'Business Analyst', count: 198, growth: 14.6, icon: '📈', searches: 0, userEngagement: 0 },
          { name: 'Sales & Marketing', count: 176, growth: 16.9, icon: '💼', searches: 0, userEngagement: 0 }
        ];

        // Enhance with user activity data
        const enhancedCategories = baseTrendingCategories.map((category, index) => ({
          ...category,
          searches: (metrics as any).categorySearches?.[category.name] || (100 + index * 10),
          userEngagement: (metrics as any).categoryEngagement?.[category.name] || (50 + index * 5),
          growth: category.growth + ((metrics as any).categorySearches?.[category.name] || 0) * 0.1
        }));

        // Sort by user engagement and searches
        enhancedCategories.sort((a, b) => 
          (b.searches + b.userEngagement) - (a.searches + a.userEngagement)
        );

        setTrendingCategories(enhancedCategories);

        // Generate smart suggestions - simplified
        const suggestions: SmartSuggestion[] = [
          { text: 'React Developer', type: 'skill', confidence: 0.9 },
          { text: 'Product Manager', type: 'category', confidence: 0.8 },
          { text: 'San Francisco', type: 'location', confidence: 0.85 },
          { text: 'Google', type: 'company', confidence: 0.7 }
        ];
        setSmartSuggestions(suggestions);

        // Set location if detected
        if (detectedLocation?.city && !location) {
          setLocation(`${detectedLocation.city}${detectedLocation.state ? ', ' + detectedLocation.state : ''}`)}
      } catch (error) {
    console.error("Error:", error);
    throw error;
  }
    };

    initializeData();
  }, [detectedLocation?.city, detectedLocation?.state, location]);

  // Track user interactions - simplified
  const trackInteraction = async (interaction: { type: string; category: string; searchQuery?: string; location?: string; metadata?: Record<string, unknown> }) => {
    if (isMounted) {
      try {
        // Simplified tracking - just log for now// Simplified activity service call
        userActivityService.track({
          type: interaction.type as any,
          value: interaction.searchQuery || interaction.category,
          metadata: interaction.metadata
        })} catch (error) {
    console.error("Error:", error);
    throw error;
  }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    await trackInteraction({
      type: 'search',
      category: selectedCategory || 'general',
      searchQuery,
      location,
      metadata: {
        searchMode,
        hasFilters: showFilters,
        experienceLevel,
        salaryRange,
        jobType
      }
    });

    // Update search using the hook
    updateFilters({
      query: searchQuery,
      location,
      category: selectedCategory,
      experienceLevel,
      jobType,
      salaryMin: salaryRange === '0-50k' ? 0 : salaryRange === '50k-80k' ? 50000 : salaryRange === '80k-120k' ? 80000 : undefined,
      salaryMax: salaryRange === '0-50k' ? 50000 : salaryRange === '50k-80k' ? 80000 : salaryRange === '80k-120k' ? 120000 : undefined
    })};

  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchQuery(categoryName);
    
    await trackInteraction({
      type: 'category_view',
      category: categoryName,
      metadata: { source: 'trending_categories' }
    })};

  const handleSuggestionClick = async (suggestion: SmartSuggestion) => {
    if (suggestion.type === 'location') {
      setLocation(suggestion.text)} else {
      setSearchQuery(suggestion.text)}

    await trackInteraction({
      type: 'search',
      category: suggestion.type,
      searchQuery: suggestion.text,
      metadata: { 
        suggestionType: suggestion.type,
        confidence: suggestion.confidence 
      }
    })};

  // Prevent hydration errors by not rendering dynamic content until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>)}

  const TrendingCategoriesSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-800">Trending Categories</h2>
          {userMetrics && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Based on your activity
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {trendingCategories.slice(0, 12).map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => handleCategoryClick(category.name)}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{category.icon}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm font-medium">
                  +{category.growth.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Available Jobs</span>
                <span className="font-medium">{category.count.toLocaleString()}</span>
              </div>
              
              {userMetrics && (
                <>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Your Searches</span>
                    <span className="font-medium">{category.searches}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Engagement</span>
                    <span className="font-medium">{category.userEngagement}%</span>
                  </div>
                </>
              )}
            </div>

            <motion.div
              className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            >
              <span>Explore Jobs</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Enhanced Featured Jobs Section - Old Rich Job Section
  const FeaturedJobsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">Featured Jobs</h2>
          <span className="text-sm text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">
            🔥 Hot picks
          </span>
        </div>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.slice(0, 6).map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-200 group relative overflow-hidden"
            onClick={() => window.open(job.redirect_url, '_blank')}
            whileHover={{ y: -5 }}
          >
            {job.isUrgent && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                🚨 Urgent
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{job.location}</span>
                  {job.isRemote && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Remote
                    </span>
                  )}
                </div>
                
                {job.salaryFormatted && (
                  <div className="flex items-center text-sm font-medium text-green-600 mb-3">
                    <span className="text-lg">💰</span>
                    <span className="ml-1">{job.salaryFormatted}</span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {job.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{job.timeAgo}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle bookmark
                  }}
                >
                  <BookmarkPlus className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(job.redirect_url, '_blank')}}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const SmartSuggestionsSection = () => {
    if (!smartSuggestions.length) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">Smart Suggestions</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {smartSuggestions.slice(0, 8).map((suggestion, index) => (
            <motion.button
              key={`${suggestion.text}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
            >
              {suggestion.text}
              {suggestion.confidence > 0.8 && (
                <span className="ml-1 text-xs">⭐</span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>)};

  // Quick Filters Section - From old job section
  const QuickFiltersSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Quick Filters</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Popular Cities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">🏙️ Top Cities</h4>
          <div className="flex flex-wrap gap-1">
            {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'].map((city) => (
              <button
                key={city}
                onClick={() => setLocation(city)}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Job Types */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">💼 Job Types</h4>
          <div className="flex flex-wrap gap-1">
            {['Full-time', 'Part-time', 'Remote', 'Internship'].map((type) => (
              <button
                key={type}
                onClick={() => setJobType(type)}
                className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Levels */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">⭐ Experience</h4>
          <div className="flex flex-wrap gap-1">
            {['0-1 years', '1-3 years', '3-5 years', '5+ years'].map((exp) => (
              <button
                key={exp}
                onClick={() => setExperienceLevel(exp)}
                className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-xs font-medium transition-colors"
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* Salary Ranges */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">💰 Salary</h4>
          <div className="flex flex-wrap gap-1">
            {['0-5 LPA', '5-10 LPA', '10-15 LPA', '15+ LPA'].map((salary) => (
              <button
                key={salary}
                onClick={() => setSalaryRange(salary)}
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition-colors"
              >
                {salary}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const UnifiedSearchBar = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
    >
      {/* Search Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Find Your Dream Job</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Search Mode:</span>
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchMode('simple')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'simple' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setSearchMode('advanced')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'advanced' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="md:col-span-4 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={isDetecting ? "Detecting location..." : "City, state, or remote"}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isDetecting}
          />
        </div>
        
        <div className="md:col-span-3 flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 border rounded-lg font-medium transition-all ${
              showFilters 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-1"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range
                </label>
                <select
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Salary</option>
                  <option value="0-50k">Under $50k</option>
                  <option value="50k-80k">$50k - $80k</option>
                  <option value="80k-120k">$80k - $120k</option>
                  <option value="120k+">$120k+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Dream Job with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Power
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover opportunities from top companies, get personalized recommendations, 
            and accelerate your career growth.
          </p>
        </motion.div>

        <UnifiedSearchBar />
        <QuickFiltersSection />
        <SmartSuggestionsSection />
        <TrendingCategoriesSection />
        <FeaturedJobsSection />
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Search Results ({searchResults.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Updated just now</span>
              </div>
            </div>
            <div className="space-y-4">
              {searchResults.map((job: Record<string, unknown>, index: number) => (
                <motion.div
                  key={job.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
                          {job.title}
                        </h3>
                        {job.isUrgent && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Urgent
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Remote
                          </span>
                        )}
                        {job.isHot && (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                            Hot
                          </span>
                        )}
                        {job.isNew && (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.postedAt || 'Recently posted'}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">
                        {job.description || 'Job description not available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-green-600">
                            {job.salary || 'Salary not disclosed'}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {job.type || 'Full-time'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <BookmarkPlus className="w-5 h-5" />
                          </button>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6"
          >
            <h3 className="text-red-800 font-semibold mb-2">Search Error</h3>
            <p className="text-red-600">{searchError?.message || 'An error occurred'}</p>
          </motion.div>
        )}

        {/* User Activity Stats */}
        {userMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(userMetrics as any)?.totalSearches || 0}
                </div>
                <div className="text-sm text-gray-600">Total Searches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(userMetrics as any)?.totalJobViews || 0}
                </div>
                <div className="text-sm text-gray-600">Jobs Viewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys((userMetrics as any)?.categorySearches || {}).length}
                </div>
                <div className="text-sm text-gray-600">Categories Explored</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {((userMetrics as any)?.averageSessionTime || 0).toFixed(1)}m
                </div>
                <div className="text-sm text-gray-600">Avg Session Time</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>)};

export default UnifiedJobPortal;
