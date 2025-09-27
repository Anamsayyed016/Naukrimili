/**
 * Enhanced Suggestions Hook
 * React hook for AI-powered search suggestions
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface EnhancedSuggestion {
  query: string;
  confidence: number;
  reasoning: string;
  category: 'job_title' | 'company' | 'location' | 'skill' | 'industry';
  source: 'history' | 'resume' | 'applications' | 'ai_generated' | 'popular';
}

export interface SuggestionContext {
  hasHistory: boolean;
  hasResume: boolean;
  hasApplications: boolean;
  userSkills?: string[];
  recentSearches?: string[];
}

export interface SuggestionOptions {
  query?: string;
  location?: string;
  context?: 'job_search' | 'company_search' | 'skill_search';
  includeHistory?: boolean;
  includeResume?: boolean;
  includeApplications?: boolean;
}

export function useEnhancedSuggestions() {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [context, setContext] = useState<SuggestionContext>({
    hasHistory: false,
    hasResume: false,
    hasApplications: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get enhanced suggestions
   */
  const getSuggestions = useCallback(async (options: SuggestionOptions = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.query) params.append('query', options.query);
      if (options.location) params.append('location', options.location);
      if (options.context) params.append('context', options.context);
      if (options.includeHistory !== undefined) params.append('includeHistory', options.includeHistory.toString());
      if (options.includeResume !== undefined) params.append('includeResume', options.includeResume.toString());
      if (options.includeApplications !== undefined) params.append('includeApplications', options.includeApplications.toString());

      const response = await fetch(`/api/search/suggestions/enhanced?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch suggestions');
      }

      setSuggestions(result.suggestions || []);
      setContext(result.context || {
        hasHistory: false,
        hasResume: false,
        hasApplications: false
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get suggestions with detailed context (POST)
   */
  const getDetailedSuggestions = useCallback(async (options: SuggestionOptions = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/search/suggestions/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch detailed suggestions');
      }

      setSuggestions(result.suggestions || []);
      setContext(result.context || {
        hasHistory: false,
        hasResume: false,
        hasApplications: false
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching detailed suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get suggestions by category
   */
  const getSuggestionsByCategory = useCallback((category: EnhancedSuggestion['category']) => {
    return suggestions.filter(suggestion => suggestion.category === category);
  }, [suggestions]);

  /**
   * Get suggestions by source
   */
  const getSuggestionsBySource = useCallback((source: EnhancedSuggestion['source']) => {
    return suggestions.filter(suggestion => suggestion.source === source);
  }, [suggestions]);

  /**
   * Get high-confidence suggestions
   */
  const getHighConfidenceSuggestions = useCallback((minConfidence: number = 0.7) => {
    return suggestions.filter(suggestion => suggestion.confidence >= minConfidence);
  }, [suggestions]);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  /**
   * Refresh suggestions
   */
  const refreshSuggestions = useCallback((options: SuggestionOptions = {}) => {
    return getSuggestions(options);
  }, [getSuggestions]);

  return {
    // Data
    suggestions,
    context,
    isLoading,
    error,
    
    // Actions
    getSuggestions,
    getDetailedSuggestions,
    clearSuggestions,
    refreshSuggestions,
    
    // Utilities
    getSuggestionsByCategory,
    getSuggestionsBySource,
    getHighConfidenceSuggestions,
    
    // State
    hasSuggestions: suggestions.length > 0,
    hasError: !!error,
    isAuthenticated: !!session?.user?.id
  };
}
