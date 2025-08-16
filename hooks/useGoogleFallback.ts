/**
 * Custom hook for managing Google search fallback functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleSearchResult, GoogleSearchParams } from '@/lib/google-search-service';

interface UseGoogleFallbackOptions {
  enabled?: boolean;
  autoTrigger?: boolean;
  minJobCount?: number;
}

export function useGoogleFallback(
  searchQuery: string,
  location: string,
  jobCount: number,
  options: UseGoogleFallbackOptions = {}
) {
  const {
    enabled = true,
    autoTrigger = true,
    minJobCount = 3
  } = options;

  const [googleFallback, setGoogleFallback] = useState<GoogleSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowFallback, setShouldShowFallback] = useState(false);

  // Determine if fallback should be shown
  useEffect(() => {
    if (!enabled) {
      setShouldShowFallback(false);
      return;
    }

    const shouldTrigger = jobCount < minJobCount && searchQuery.trim().length > 0;
    setShouldShowFallback(shouldTrigger);
  }, [enabled, jobCount, searchQuery, minJobCount]);

  // Auto-trigger fallback when conditions are met
  useEffect(() => {
    if (autoTrigger && shouldShowFallback && !googleFallback) {
      fetchGoogleFallback();
    }
  }, [autoTrigger, shouldShowFallback, googleFallback]);

  const fetchGoogleFallback = useCallback(async () => {
    if (!searchQuery.trim() || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/search/google-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          location: location === 'All Locations' ? 'India' : location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Google fallback');
      }

      const data = await response.json();
      if (data.success) {
        setGoogleFallback(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch Google fallback');
      }
    } catch (err: any) {
      console.error('Google fallback error:', err);
      setError(err?.message || 'Failed to fetch Google fallback');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, enabled]);

  const refreshFallback = useCallback(() => {
    setGoogleFallback(null);
    fetchGoogleFallback();
  }, [fetchGoogleFallback]);

  const clearFallback = useCallback(() => {
    setGoogleFallback(null);
    setError(null);
    setShouldShowFallback(false);
  }, []);

  const handleGoogleSearch = useCallback(() => {
    if (googleFallback?.searchUrl) {
      window.open(googleFallback.searchUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleFallback]);

  const handlePlatformSearch = useCallback((platformUrl: string) => {
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    // State
    googleFallback,
    loading,
    error,
    shouldShowFallback,
    
    // Actions
    fetchGoogleFallback,
    refreshFallback,
    clearFallback,
    handleGoogleSearch,
    handlePlatformSearch,
    
    // Computed values
    hasAlternativePlatforms: googleFallback?.alternativePlatforms?.length > 0,
    hasSearchSuggestions: googleFallback?.metadata?.searchSuggestions?.length > 0,
    hasSmartQueries: googleFallback?.metadata?.smartQueries?.length > 0,
    
    // Metadata
    searchSuggestions: googleFallback?.metadata?.searchSuggestions || [],
    smartQueries: googleFallback?.metadata?.smartQueries || [],
    alternativePlatforms: googleFallback?.alternativePlatforms || []
  };
}
