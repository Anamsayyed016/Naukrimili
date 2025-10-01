/**
 * OPTIMIZED JOB SEARCH COMPONENT
 * 
 * High-performance, feature-rich job search interface with:
 * - Real-time search with debouncing
 * - Advanced filtering capabilities
 * - Auto-complete suggestions
 * - Responsive design
 * - Performance monitoring
 * - Error handling and retry logic
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  useOptimizedJobSearch, 
  useSearchSuggestions,
  useFilterOptions,
  type OptimizedSearchFilters,
  type OptimizedJobResult
} from '@/hooks/useOptimizedJobSearch';

// ===== INTERFACES =====

interface OptimizedJobSearchProps {
  onJobsUpdate?: (jobs: OptimizedJobResult[]) => void;
  onFiltersChange?: (filters: OptimizedSearchFilters) => void;
  onJobSelect?: (job: OptimizedJobResult) => void;
  initialFilters?: Partial<OptimizedSearchFilters>;
  showAdvancedFilters?: boolean;
  showPerformanceMetrics?: boolean;
  className?: string;
}

interface SearchStats {
  totalJobs: number;
  searchTime: number;
  queryType: string;
  appliedFiltersCount: number;
}

// ===== CONSTANTS =====

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' }
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
  { value: 'internship', label: 'Internship' }
];

const POSTED_SINCE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'quarter', label: 'Past 3 Months' },
  { value: 'year', label: 'Past Year' }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'salary_desc', label: 'Highest Salary' },
  { value: 'salary_asc', label: 'Lowest Salary' },
  { value: 'title', label: 'Job Title A-Z' },
  { value: 'company', label: 'Company A-Z' }
];

// ===== MAIN COMPONENT =====

export default function OptimizedJobSearch({
  onJobsUpdate,
  onFiltersChange,
  onJobSelect,
  initialFilters = {},
  showAdvancedFilters = true,
  showPerformanceMetrics = false,
  className = ''
}: OptimizedJobSearchProps) {
  
  // ===== STATE =====
  
  const [filters, setFilters] = useState<OptimizedSearchFilters>({
    query: '',
    location: '',
    country: 'IN',
    sort_by: 'relevance',
    include_suggestions: true,
    include_stats: true,
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 1000000]);
  const [skillsInput, setSkillsInput] = useState('');

  // ===== HOOKS =====
  
  const {
    jobs,
    pagination,
    appliedFilters,
    availableFilters,
    suggestions,
    isLoading,
    isFetching,
    isError,
    error,
    searchTime,
    queryType,
    totalInDb,
    refetch
  } = useOptimizedJobSearch(filters, {
    enabled: true,
    debounceMs: 300,
    staleTime: 2 * 60 * 1000
  });

  const searchSuggestions = useSearchSuggestions(filters.query || '', !!filters.query);
  const filterOptions = useFilterOptions(filters);

  // ===== COMPUTED VALUES =====
  
  const searchStats: SearchStats = useMemo(() => ({
    totalJobs: pagination.total,
    searchTime,
    queryType,
    appliedFiltersCount: appliedFilters ? Object.keys(appliedFilters).length : 0
  }), [pagination.total, searchTime, queryType, appliedFilters]);

  const hasActiveFilters = useMemo(() => {
    return appliedFilters ? Object.keys(appliedFilters).length > 0 : false;
  }, [appliedFilters]);

  // ===== EFFECTS =====
  
  useEffect(() => {
    if (onJobsUpdate) {
      onJobsUpdate(jobs);
    }
  }, [jobs, onJobsUpdate]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // ===== HANDLERS =====
  
  const updateFilter = useCallback((key: keyof OptimizedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateMultipleFilters = useCallback((newFilters: Partial<OptimizedSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      location: '',
      country: 'IN',
      sort_by: 'relevance',
      include_suggestions: true,
      include_stats: true
    });
    setSalaryRange([0, 1000000]);
    setSkillsInput('');
  }, []);

  const handleSalaryChange = useCallback((value: [number, number]) => {
    setSalaryRange(value);
    updateMultipleFilters({
      salary_min: value[0] > 0 ? value[0] : undefined,
      salary_max: value[1] < 1000000 ? value[1] : undefined
    });
  }, [updateMultipleFilters]);

  const handleSkillsSubmit = useCallback(() => {
    if (skillsInput.trim()) {
      const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      updateFilter('skills', skillsArray.length > 0 ? skillsArray : undefined);
    }
  }, [skillsInput, updateFilter]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    updateFilter('query', suggestion);
  }, [updateFilter]);

  const handleJobClick = useCallback((job: OptimizedJobResult) => {
    if (onJobSelect) {
      onJobSelect(job);
    }
  }, [onJobSelect]);

  // ===== RENDER HELPERS =====
  
  const renderSearchStats = () => {
    if (!showPerformanceMetrics) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-blue-700 dark:text-blue-300">
              <strong>{(searchStats?.totalJobs || 0).toLocaleString()}</strong> jobs found
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Search time: <strong>{searchStats.searchTime}ms</strong>
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Type: <strong>{searchStats.queryType}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 dark:text-blue-400">
              {searchStats.appliedFiltersCount} filters active
            </span>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="h-6 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSuggestions = () => {
    if (!searchSuggestions.data || (searchSuggestions.data || []).length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Suggestions:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {searchSuggestions.data.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(suggestion)}
              className="h-7 text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center space-x-2 mb-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Filters:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {appliedFilters ? Object.entries(appliedFilters).map(([key, value]) => (
            <Badge 
              key={key} 
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <span>{key}: {Array.isArray(value) ? value.join(', ') : String(value)}</span>
              <XMarkIcon 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => updateFilter(key as keyof OptimizedSearchFilters, undefined)}
              />
            </Badge>
          )) : null}
        </div>
      </motion.div>
    );
  };

  const renderAdvancedFilters = () => {
    if (!showAdvanced) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        {/* Job Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Type
          </label>
          <Select 
            value={filters.job_type || ''} 
            onValueChange={(value) => updateFilter('job_type', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {JOB_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Experience Level
          </label>
          <Select 
            value={filters.experience_level || ''} 
            onValueChange={(value) => updateFilter('experience_level', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {EXPERIENCE_LEVEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Posted Since */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Posted Since
          </label>
          <Select 
            value={filters.posted_since || ''} 
            onValueChange={(value) => updateFilter('posted_since', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Time</SelectItem>
              {POSTED_SINCE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sector
          </label>
          <Input
            placeholder="e.g., Technology, Healthcare"
            value={filters.sector || ''}
            onChange={(e) => updateFilter('sector', e.target.value || undefined)}
          />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Company
          </label>
          <Input
            placeholder="Company name"
            value={filters.company || ''}
            onChange={(e) => updateFilter('company', e.target.value || undefined)}
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort By
          </label>
          <Select 
            value={filters.sort_by || 'relevance'} 
            onValueChange={(value) => updateFilter('sort_by', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Salary Range */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Salary Range (₹)
          </label>
          <div className="px-3">
            <Slider
              value={salaryRange}
              onValueChange={handleSalaryChange}
              max={1000000}
              min={0}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>₹{(salaryRange[0] || 0).toLocaleString()}</span>
              <span>₹{(salaryRange[1] || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Skills (comma-separated)
          </label>
          <div className="flex space-x-2">
            <Input
              placeholder="React, Node.js, Python"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSkillsSubmit()}
            />
            <Button onClick={handleSkillsSubmit} size="sm">
              Add
            </Button>
          </div>
        </div>

        {/* Boolean Filters */}
        <div className="space-y-4 md:col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.remote_only || false}
                onCheckedChange={(checked) => updateFilter('remote_only', checked || undefined)}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Remote Only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.is_hybrid || false}
                onCheckedChange={(checked) => updateFilter('is_hybrid', checked || undefined)}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Hybrid
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.is_featured || false}
                onCheckedChange={(checked) => updateFilter('is_featured', checked || undefined)}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Featured
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.is_urgent || false}
                onCheckedChange={(checked) => updateFilter('is_urgent', checked || undefined)}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Urgent
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ===== MAIN RENDER =====

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Stats */}
      {renderSearchStats()}

      {/* Main Search Card */}
      <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Find Your Dream Job
            </span>
            {showAdvancedFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Advanced Filters</span>
                <ChevronDownIcon 
                  className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Search Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Query */}
            <div className="lg:col-span-5 relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={filters.query || ''}
                  onChange={(e) => updateFilter('query', e.target.value || undefined)}
                  className="pl-12 h-14 text-lg border-2 focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
                {isFetching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="lg:col-span-4 relative">
              <div className="relative">
                <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="City, state, or remote"
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value || undefined)}
                  className="pl-12 h-14 text-lg border-2 focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-3">
              <Button 
                onClick={() => refetch()}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>{isLoading ? 'Searching...' : 'Search Jobs'}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {renderAdvancedFilters()}
          </AnimatePresence>

          {/* Search Suggestions */}
          {renderSuggestions()}

          {/* Active Filters */}
          {renderActiveFilters()}

          {/* Results Summary */}
          {!isLoading && !isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl"
            >
              <div className="text-3xl mb-3">
                {pagination.total > 0 ? '🎯' : '🔍'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {pagination.total > 0 
                  ? `Found ${(pagination.total || 0).toLocaleString()} Jobs`
                  : 'No Jobs Found'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {pagination.total > 0
                  ? `Showing ${(jobs || []).length} results with ${searchStats.appliedFiltersCount} filters applied`
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
              
              {/* Quick Stats */}
              {pagination.total > 0 && (
                <div className="flex justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 text-green-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Updated in {searchTime}ms</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    <span>{(availableFilters?.companies || []).length || 0} Companies</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-600">
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>{(availableFilters?.sectors || []).length || 0} Sectors</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Error State */}
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                Search Error
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error?.message || 'Something went wrong. Please try again.'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
