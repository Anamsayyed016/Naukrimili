/**
 * Enhanced Job Search Hook - Frontend Integration
 * Implements the new country priority job search with location detection
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { JobSearchParams, UserLocationData, JobSearchResponse } from '@/types/job-search-params';
import { detectUserLocationFromBrowser } from '@/lib/location-service';

export interface UseEnhancedJobSearchOptions {
  enableCountryPriority?: boolean;
  detectLocation?: boolean;
  autoSearch?: boolean;
  cacheResults?: boolean;
}

export function useEnhancedJobSearch(options: UseEnhancedJobSearchOptions = {}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [searchStrategy, setSearchStrategy] = useState<any>(null);
  const [pagination, setPagination] = useState<any>({
    current_page: 1,
    total_pages: 0,
    total_results: 0,
    per_page: 20,
    has_next: false,
    has_prev: false,
  });

  const {
    enableCountryPriority = true,
    detectLocation = true,
    autoSearch = false,
    cacheResults = true,
  } = options;

  /**
   * Detect user location using browser API
   */
  const detectUserLocation = useCallback(async () => {
    try {
      const location = await detectUserLocationFromBrowser();
      setUserLocation(location);
      return location;
    } catch (err) {
      console.error('Location detection failed:', err);
      return null;
    }
  }, []);

  /**
   * Enhanced job search with country priority
   */
  const searchJobs = useCallback(async (searchParams: JobSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Core search parameters
      if (searchParams.filters?.query) queryParams.set('q', searchParams.filters.query);
      if (searchParams.location) queryParams.set('location', searchParams.location);
      if (searchParams.countries?.length) queryParams.set('countries', searchParams.countries.join(','));
      
      // Filter parameters
      if (searchParams.filters?.jobType) queryParams.set('job_type', searchParams.filters.jobType);
      if (searchParams.filters?.experienceLevel) queryParams.set('experience_level', searchParams.filters.experienceLevel);
      if (searchParams.filters?.sector) queryParams.set('sector', searchParams.filters.sector);
      if (searchParams.filters?.company) queryParams.set('company', searchParams.filters.company);
      if (searchParams.filters?.minSalary) queryParams.set('salary_min', searchParams.filters.minSalary.toString());
      if (searchParams.filters?.maxSalary) queryParams.set('salary_max', searchParams.filters.maxSalary.toString());
      if (searchParams.filters?.skills?.length) queryParams.set('skills', searchParams.filters.skills.join(','));
      if (searchParams.filters?.isRemote !== undefined) queryParams.set('remote', searchParams.filters.isRemote.toString());
      if (searchParams.filters?.isHybrid !== undefined) queryParams.set('hybrid', searchParams.filters.isHybrid.toString());
      
      // Pagination and sorting
      queryParams.set('limit', (searchParams.limit || 20).toString());
      if (searchParams.offset) queryParams.set('page', (Math.floor(searchParams.offset / (searchParams.limit || 20)) + 1).toString());
      if (searchParams.sortBy) queryParams.set('sort_by', searchParams.sortBy);
      if (searchParams.sortOrder) queryParams.set('sort_order', searchParams.sortOrder);
      
      // Enhanced features
      if (enableCountryPriority) queryParams.set('enable_country_priority', 'true');
      if (detectLocation) queryParams.set('detect_location', 'true');

      // Make API request
      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: JobSearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Search failed');
      }

      // Update state
      setJobs(data.jobs);
      setPagination(data.pagination);
      setSearchStrategy(data.search_strategy);
      
      if (data.location_info) {
        setUserLocation(data.location_info);
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableCountryPriority, detectLocation]);

  /**
   * Quick search with smart defaults
   */
  const quickSearch = useCallback(async (query: string, location?: string) => {
    const searchParams: JobSearchParams = {
      countries: [], // Will use defaults
      location: location || userLocation?.city,
      filters: {
        query,
      },
      limit: 20,
      sortBy: 'relevance',
    };

    return await searchJobs(searchParams);
  }, [searchJobs, userLocation]);

  /**
   * Search jobs in specific countries
   */
  const searchByCountries = useCallback(async (countries: string[], filters?: any) => {
    const searchParams: JobSearchParams = {
      countries,
      location: userLocation?.city,
      filters,
      limit: 20,
      sortBy: 'relevance',
    };

    return await searchJobs(searchParams);
  }, [searchJobs, userLocation]);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(async (currentSearchParams: JobSearchParams) => {
    if (!pagination.has_next) return;

    const nextPageParams = {
      ...currentSearchParams,
      offset: (currentSearchParams.offset || 0) + (currentSearchParams.limit || 20),
    };

    const result = await searchJobs(nextPageParams);
    
    // Append new jobs to existing ones
    setJobs(prevJobs => [...prevJobs, ...result.jobs]);
    
    return result;
  }, [searchJobs, pagination]);

  // Auto-detect location on mount
  useEffect(() => {
    if (detectLocation && !userLocation) {
      detectUserLocation();
    }
  }, [detectLocation, userLocation, detectUserLocation]);

  return {
    // State
    jobs,
    loading,
    error,
    userLocation,
    searchStrategy,
    pagination,
    
    // Actions
    searchJobs,
    quickSearch,
    searchByCountries,
    loadMore,
    detectUserLocation,
    
    // Helpers
    clearError: () => setError(null),
    clearJobs: () => setJobs([]),
  };
}
