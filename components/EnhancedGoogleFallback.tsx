/**
 * Enhanced Google Fallback Component
 * Provides intelligent fallback when no jobs are found, with Google search and alternative platforms
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Globe, TrendingUp, Lightbulb, ExternalLink } from 'lucide-react';
import { GoogleSearchResult, AlternativePlatform } from '@/lib/google-search-service';

interface EnhancedGoogleFallbackProps {
  searchQuery: string;
  location: string;
  jobCount: number;
  onTryNewSearch?: (query: string, location: string) => void;
  onDismiss?: () => void;
}

export default function EnhancedGoogleFallback({
  searchQuery,
  location,
  jobCount,
  onTryNewSearch,
  onDismiss
}: EnhancedGoogleFallbackProps) {
  const [googleFallback, setGoogleFallback] = useState<GoogleSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (jobCount === 0 && searchQuery.trim()) {
      fetchGoogleFallback();
    }
  }, [searchQuery, location, jobCount]);

  const fetchGoogleFallback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search/google-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          location: location === 'All Locations' ? 'India' : location
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGoogleFallback(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Google fallback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSearch = () => {
    if (googleFallback?.searchUrl) {
      window.open(googleFallback.searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlatformSearch = (platform: AlternativePlatform) => {
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  const handleTrySuggestion = (suggestion: string) => {
    if (onTryNewSearch) {
      onTryNewSearch(suggestion, location);
    }
  };

  const handleTrySmartQuery = (query: string) => {
    if (onTryNewSearch) {
      onTryNewSearch(query, location);
    }
  };

  if (jobCount > 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No jobs found for "{searchQuery}"
        </h3>
        <p className="text-gray-600">
          We searched our database but couldn't find any matching positions in {location === 'All Locations' ? 'India' : location}
        </p>
      </div>

      {/* Google Search Fallback */}
      {googleFallback && (
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Search on Google Jobs</h4>
              <p className="text-sm text-gray-600">
                We'll search Google Jobs with your exact criteria for broader results
              </p>
            </div>
          </div>
          
          <button
            onClick={handleGoogleSearch}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Search on Google Jobs
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alternative Platforms */}
      {googleFallback?.alternativePlatforms && (
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Or try other platforms
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {googleFallback.alternativePlatforms.map((platform, index) => (
              <button
                key={index}
                onClick={() => handlePlatformSearch(platform)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {platform.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{platform.name}</div>
                  <div className="text-xs text-gray-500 truncate">{platform.description}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart Search Suggestions */}
      {googleFallback?.metadata?.searchSuggestions && (
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Try these search variations
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {googleFallback.metadata.searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleTrySuggestion(suggestion)}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm font-medium transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart Query Suggestions */}
      {googleFallback?.metadata?.smartQueries && (
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Smart search alternatives
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {googleFallback.metadata.smartQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleTrySmartQuery(query)}
                className="flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <Search className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onTryNewSearch && onTryNewSearch('', 'All Locations')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Clear All Filters
        </button>
        
        <button
          onClick={() => onTryNewSearch && onTryNewSearch('developer', 'Mumbai')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Try Popular Search
        </button>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 underline font-medium"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            Preparing search alternatives...
          </div>
        </div>
      )}
    </div>
  );
}
