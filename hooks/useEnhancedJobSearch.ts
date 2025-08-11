import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobSearchFilters, JobSearchResponse, JobBookmark } from '@/types/jobs';

// Enhanced job search hook with PostgreSQL integration
export function useJobSearch(filters: JobSearchFilters, options?: {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}) {
  const queryKey = ['jobs', 'search', filters];
  
  return useQuery<JobSearchResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/jobs?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      return response.json();
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    cacheTime: options?.cacheTime || 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
    // Refetch when filters change
    refetchOnWindowFocus: false,
    refetchOnMount: 'always'
  });
}

// Hook for managing job bookmarks
export function useJobBookmarks(userId: number) {
  const queryClient = useQueryClient();
  
  // Get user's bookmarks
  const bookmarksQuery = useQuery({
    queryKey: ['jobs', 'bookmarks', userId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/bookmarks?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return response.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobId })
      });
      
      if (!response.ok) throw new Error('Failed to add bookmark');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['jobs', 'bookmarks', userId] });
      // Also invalidate job search queries to update bookmark status
      queryClient.invalidateQueries({ queryKey: ['jobs', 'search'] });
    }
  });

  // Remove bookmark mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      const response = await fetch(`/api/jobs/bookmarks?userId=${userId}&jobId=${jobId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove bookmark');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'bookmarks', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'search'] });
    }
  });

  // Toggle bookmark function
  const toggleBookmark = async (jobId: string, isBookmarked: boolean) => {
    if (isBookmarked) {
      await removeBookmarkMutation.mutateAsync({ jobId });
    } else {
      await addBookmarkMutation.mutateAsync({ jobId });
    }
  };

  return {
    bookmarks: bookmarksQuery.data?.jobs || [],
    isLoading: bookmarksQuery.isLoading,
    error: bookmarksQuery.error,
    addBookmark: addBookmarkMutation.mutate,
    removeBookmark: removeBookmarkMutation.mutate,
    toggleBookmark,
    isAddingBookmark: addBookmarkMutation.isPending,
    isRemovingBookmark: removeBookmarkMutation.isPending
  };
}

// Hook for getting filter options dynamically
export function useFilterOptions(baseFilters?: Partial<JobSearchFilters>) {
  return useQuery({
    queryKey: ['jobs', 'filters', baseFilters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (baseFilters) {
        Object.entries(baseFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/jobs?${searchParams.toString()}&limit=1`);
      if (!response.ok) throw new Error('Failed to fetch filter options');
      
      const data = await response.json();
      return data.filters?.available || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for job analytics and insights
export function useJobInsights(filters?: Partial<JobSearchFilters>) {
  return useQuery({
    queryKey: ['jobs', 'insights', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }

      // Get aggregated data for insights
      const response = await fetch(`/api/jobs/insights?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch job insights');
      
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!filters && Object.keys(filters).length > 0
  });
}

// Enhanced debounced search hook
export function useDebouncedJobSearch(
  initialFilters: JobSearchFilters, 
  debounceMs = 500
) {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);

  // Debounce filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  // Use the main job search hook with debounced filters
  const searchResults = useJobSearch(debouncedFilters);

  const updateFilter = useCallback((key: keyof JobSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<JobSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    debouncedFilters,
    jobs: searchResults.data?.jobs || [],
    pagination: searchResults.data?.pagination,
    availableFilters: searchResults.data?.filters?.available,
    isLoading: searchResults.isLoading,
    error: searchResults.error,
    updateFilter,
    updateFilters,
    resetFilters,
    refetch: searchResults.refetch
  };
}

// Hook for infinite scroll/load more functionality
export function useInfiniteJobSearch(filters: JobSearchFilters) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      
      Object.entries({ ...filters, page: pageParam }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/jobs?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.has_next ? pagination.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
