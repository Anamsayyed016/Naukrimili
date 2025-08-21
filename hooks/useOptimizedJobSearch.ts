/**
 * OPTIMIZED JOB SEARCH HOOK
 * 
 * High-performance React hook for job search with:
 * - Debounced search queries
 * - Intelligent caching
 * - Real-time filter updates
 * - Standardized parameter handling
 * - Error handling and retry logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

// ===== TYPES =====

export interface OptimizedSearchFilters {
  query?: string;
  location?: string;
  company?: string;
  job_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive' | 'internship';
  sector?: string;
  country?: string;
  remote_only?: boolean;
  is_hybrid?: boolean;
  is_featured?: boolean;
  is_urgent?: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  skills?: string[];
  posted_since?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  sort_by?: 'relevance' | 'date' | 'salary_asc' | 'salary_desc' | 'title' | 'company';
  include_suggestions?: boolean;
  include_stats?: boolean;
}

export interface OptimizedSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  retryDelay?: number;
}

export interface OptimizedJobResult {
  id: string;
  title: string;
  company: string | null;
  company_logo: string | null;
  location: string | null;
  country: string;
  description_preview: string;
  salary_formatted: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  job_type: string | null;
  experience_level: string | null;
  skills: string[];
  sector: string | null;
  is_remote: boolean;
  is_hybrid: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  posted_at: string | null;
  created_at: string;
  apply_url: string | null;
  relevance_score?: number;
  match_reasons?: string[];
}

export interface OptimizedSearchResponse {
  success: boolean;
  data: {
    jobs: OptimizedJobResult[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    nextPage?: number;
  };
  filters: {
    applied: Record<string, any>;
    available?: {
      job_types: Array<{ value: string; count: number; label: string }>;
      experience_levels: Array<{ value: string; count: number; label: string }>;
      sectors: Array<{ value: string; count: number; label: string }>;
      locations: Array<{ value: string; count: number }>;
      companies: Array<{ value: string; count: number }>;
      salary_ranges: Array<{ min: number; max: number; count: number }>;
    };
  };
  meta: {
    search_time_ms: number;
    query_type: 'exact' | 'fuzzy' | 'full_text' | 'filter';
    suggestions?: string[];
    related_searches?: string[];
    total_in_db: number;
  };
  timestamp: string;
}

// ===== SEARCH UTILITIES =====

export class SearchParamsBuilder {
  private params = new URLSearchParams();

  add(key: string, value: any): this {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        this.params.append(key, value.join(','));
      } else {
        this.params.append(key, String(value));
      }
    }
    return this;
  }

  addAll(filters: OptimizedSearchFilters, page = 1, limit = 20): this {
    return this
      .add('query', filters.query)
      .add('location', filters.location)
      .add('company', filters.company)
      .add('job_type', filters.job_type)
      .add('experience_level', filters.experience_level)
      .add('sector', filters.sector)
      .add('country', filters.country)
      .add('remote_only', filters.remote_only)
      .add('is_hybrid', filters.is_hybrid)
      .add('is_featured', filters.is_featured)
      .add('is_urgent', filters.is_urgent)
      .add('salary_min', filters.salary_min)
      .add('salary_max', filters.salary_max)
      .add('salary_currency', filters.salary_currency)
      .add('skills', filters.skills)
      .add('posted_since', filters.posted_since)
      .add('sort_by', filters.sort_by)
      .add('include_suggestions', filters.include_suggestions)
      .add('include_stats', filters.include_stats)
      .add('page', page)
      .add('limit', limit);
  }

  toString(): string {
    return this.params.toString();
  }
}

// ===== SEARCH FUNCTION =====

async function searchJobs(filters: OptimizedSearchFilters, page = 1, pageSize = 20): Promise<OptimizedSearchResponse> {
  const searchParams = new SearchParamsBuilder()
    .addAll(filters, page, pageSize)
    .toString();

  const response = await fetch(`/api/jobs/search?${searchParams}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

// ===== MAIN SEARCH HOOK =====

export function useOptimizedJobSearch(
  filters: OptimizedSearchFilters,
  options: OptimizedSearchOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 300,
    staleTime = 2 * 60 * 1000, // 2 minutes
    gcTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false,
    retry = 2,
    retryDelay = 1000
  } = options;

  // Debounce search query and location for better UX
  const debouncedQuery = useDebounce(filters.query || '', debounceMs);
  const debouncedLocation = useDebounce(filters.location || '', debounceMs);

  // Create debounced filters
  const debouncedFilters = useMemo(() => ({
    ...filters,
    query: debouncedQuery,
    location: debouncedLocation
  }), [filters, debouncedQuery, debouncedLocation]);

  // Generate query key for React Query
  const queryKey = useMemo(() => [
    'jobs', 
    'optimized-search', 
    debouncedFilters
  ], [debouncedFilters]);

  // Main search query
  const query = useQuery<OptimizedSearchResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new SearchParamsBuilder()
        .addAll(debouncedFilters, 1, 20)
        .toString();

      const response = await fetch(`/api/jobs/search?${searchParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache headers for better performance
        cache: 'force-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Search failed with status ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && (!!debouncedQuery || Object.keys(debouncedFilters).length > 2),
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  return {
    // Data
    jobs: query.data?.data?.jobs || [],
    pagination: query.data?.data || {
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 0,
      has_next: false,
      has_prev: false
    },
    appliedFilters: query.data?.filters?.applied || {},
    availableFilters: query.data?.filters?.available,
    suggestions: query.data?.meta?.suggestions || [],
    
    // State
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Performance metrics
    searchTime: query.data?.meta?.search_time_ms || 0,
    queryType: query.data?.meta?.query_type || 'filter',
    totalInDb: query.data?.meta?.total_in_db || 0,
    
    // Actions
    refetch: query.refetch
  };
}

// ===== PAGINATED SEARCH HOOK =====

export function usePaginatedJobSearch(
  filters: OptimizedSearchFilters,
  initialPage = 1,
  pageSize = 20,
  options: OptimizedSearchOptions = {}
) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const searchResult = useOptimizedJobSearch(
    { ...filters },
    { ...options, debounceMs: 500 }
  );

  // Separate query for paginated results
  const paginatedQuery = useQuery<OptimizedSearchResponse>({
    queryKey: ['jobs', 'paginated', filters, currentPage, pageSize],
    queryFn: async () => {
      const searchParams = new SearchParamsBuilder()
        .addAll(filters, currentPage, pageSize)
        .toString();

      const response = await fetch(`/api/jobs/search?${searchParams}`);
      if (!response.ok) throw new Error('Paginated search failed');
      return response.json();
    },
    enabled: options.enabled !== false && currentPage > 1,
    staleTime: options.staleTime || 2 * 60 * 1000
  });

  const activeQuery = currentPage === 1 ? searchResult : paginatedQuery;

  return {
    ...activeQuery,
    currentPage,
    pageSize,
    setPage: setCurrentPage,
    nextPage: () => setCurrentPage(prev => prev + 1),
    prevPage: () => setCurrentPage(prev => Math.max(1, prev - 1)),
    goToPage: (page: number) => setCurrentPage(Math.max(1, page))
  };
}

// ===== INFINITE SCROLL SEARCH HOOK =====

export function useInfiniteJobSearch(
  filters: OptimizedSearchFilters,
  pageSize = 20,
  options: OptimizedSearchOptions = {}
) {
  const infiniteQuery = useInfiniteQuery<OptimizedSearchResponse>({
    queryKey: ['jobs', 'infinite', filters, pageSize],
    queryFn: ({ pageParam = 1 }) => searchJobs(filters, pageParam, pageSize),
    getNextPageParam: (lastPage: OptimizedSearchResponse) => {
      const nextPage = lastPage.data.nextPage;
      return nextPage && typeof nextPage === 'number' ? (nextPage as number) : undefined;
    },
    enabled: options.enabled !== false,
    initialPageParam: 1,
    staleTime: options.staleTime || 2 * 60 * 1000,
    gcTime: options.gcTime || 5 * 60 * 1000
  });

  // Flatten all pages into single array
  const allJobs = useMemo(() => {
    return infiniteQuery.data?.pages.flatMap(page => page.data.jobs) || [];
  }, [infiniteQuery.data]);

  return {
    jobs: allJobs,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch
  };
}

// ===== SEARCH SUGGESTIONS HOOK =====

export function useSearchSuggestions(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery<string[]>({
    queryKey: ['search', 'suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const response = await fetch(
        `/api/jobs/search?query=${encodeURIComponent(debouncedQuery)}&limit=1&include_suggestions=true`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.meta?.suggestions || [];
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

// ===== FILTER OPTIONS HOOK =====

export function useFilterOptions(baseFilters?: Partial<OptimizedSearchFilters>) {
  return useQuery({
    queryKey: ['jobs', 'filter-options', baseFilters],
    queryFn: async () => {
      const searchParams = new SearchParamsBuilder()
        .addAll({ ...baseFilters, include_stats: true } as OptimizedSearchFilters, 1, 1)
        .toString();

      const response = await fetch(`/api/jobs/search?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch filter options');
      
      const data = await response.json();
      return data.filters?.available || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000  // 15 minutes
  });
}

// ===== SEARCH ANALYTICS HOOK =====

export function useSearchAnalytics() {
  const queryClient = useQueryClient();

  const trackSearch = useCallback((filters: OptimizedSearchFilters, resultCount: number) => {
    // Track search for analytics (implement based on your analytics needs)
    const searchEvent = {
      query: filters.query,
      location: filters.location,
      filters: Object.keys(filters).filter(key => filters[key as keyof OptimizedSearchFilters] !== undefined),
      resultCount,
      timestamp: new Date().toISOString()
    };

    // Send to analytics service
    // Search tracking logged
  }, []);

  const invalidateSearchCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [queryClient]);

  return {
    trackSearch,
    invalidateSearchCache
  };
}

// ===== EXPORT DEFAULT HOOK =====

export default useOptimizedJobSearch;
