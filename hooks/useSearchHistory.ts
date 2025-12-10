/**
 * Search History Hook
 * React hook for managing search history operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface SearchHistoryEntry {
  id: string;
  query: string;
  location?: string;
  filters?: Record<string, unknown>;
  resultCount: number;
  searchType: string;
  source: string;
  createdAt: string;
}

export interface SearchHistoryOptions {
  limit?: number;
  offset?: number;
  searchType?: string;
  query?: string;
  includePopular?: boolean;
}

export interface SearchHistoryData {
  history: SearchHistoryEntry[];
  popularSearches: Array<{ query: string; count: number }>;
  total: number;
  hasMore: boolean;
}

export function useSearchHistory() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchHistoryData>({
    history: [],
    popularSearches: [],
    total: 0,
    hasMore: false
  });

  /**
   * Fetch search history
   */
  const fetchSearchHistory = useCallback(async (options: SearchHistoryOptions = {}) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.searchType) params.append('type', options.searchType);
      if (options.query) params.append('query', options.query);
      if (options.includePopular === false) params.append('includePopular', 'false');

      const response = await fetch(`/api/search/history?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch search history');
      }

      setData({
        history: result.data.history || [],
        popularSearches: result.data.popularSearches || [],
        total: result.data.pagination?.total || 0,
        hasMore: result.data.pagination?.hasMore || false
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching search history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Create a new search history entry
   */
  const createSearchHistory = useCallback(async (searchData: {
    query: string;
    location?: string;
    filters?: Record<string, unknown>;
    resultCount?: number;
    searchType?: string;
    source?: string;
  }) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const response = await fetch('/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create search history');
      }

      // Refresh the history list
      await fetchSearchHistory();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating search history:', err);
      return false;
    }
  }, [session?.user?.id, fetchSearchHistory]);

  /**
   * Delete a specific search history entry
   */
  const deleteSearchHistory = useCallback(async (id: string) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const response = await fetch(`/api/search/history/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete search history');
      }

      // Refresh the history list
      await fetchSearchHistory();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting search history:', err);
      return false;
    }
  }, [session?.user?.id, fetchSearchHistory]);

  /**
   * Clear all search history
   */
  const clearSearchHistory = useCallback(async (olderThanDays?: number) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const params = new URLSearchParams();
      if (olderThanDays) params.append('olderThan', olderThanDays.toString());

      const response = await fetch(`/api/search/history?${params.toString()}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear search history');
      }

      // Refresh the history list
      await fetchSearchHistory();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error clearing search history:', err);
      return false;
    }
  }, [session?.user?.id, fetchSearchHistory]);

  /**
   * Load more search history (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!data.hasMore || isLoading) return;

    const currentOffset = (data.history || []).length;
    const newOptions: SearchHistoryOptions = {
      limit: 20,
      offset: currentOffset
    };

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', newOptions.limit!.toString());
      params.append('offset', newOptions.offset!.toString());

      const response = await fetch(`/api/search/history?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch more search history');
      }

      setData(prev => ({
        history: [...prev.history, ...(result.data.history || [])],
        popularSearches: result.data.popularSearches || prev.popularSearches,
        total: result.data.pagination?.total || prev.total,
        hasMore: result.data.pagination?.hasMore || false
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading more search history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [(data.history || []).length, data.hasMore, isLoading]);

  /**
   * Search within history
   */
  const searchHistory = useCallback(async (query: string) => {
    await fetchSearchHistory({ query });
  }, [fetchSearchHistory]);

  // Auto-fetch on mount if user is authenticated
  useEffect(() => {
    if (session?.user?.id && (data.history || []).length === 0) {
      fetchSearchHistory();
    }
  }, [session?.user?.id, fetchSearchHistory, (data.history || []).length]);

  return {
    // Data
    data,
    isLoading,
    error,
    
    // Actions
    fetchSearchHistory,
    createSearchHistory,
    deleteSearchHistory,
    clearSearchHistory,
    loadMore,
    searchHistory,
    
    // Utilities
    hasHistory: (data.history || []).length > 0,
    hasMore: data.hasMore,
    totalCount: data.total
  };
}
