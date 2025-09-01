'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, ExternalLink, Globe, Loader2 } from 'lucide-react';

interface GoogleCSESearchProps {
  searchQuery: string;
  location?: string;
  className?: string;
}

declare global {
  interface Window {
    google?: {
      search?: {
        cse?: {
          element?: {
            render?: (element: HTMLElement, options: any) => void;
          };
        };
      };
    };
    __google_cse_init?: boolean;
  }
}

export default function GoogleCSESearch({ 
  searchQuery, 
  location, 
  className = '' 
}: GoogleCSESearchProps) {
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate script injection
  useEffect(() => {
    if (window.__google_cse_init) {
      return;
    }

    const loadGoogleCSEScript = () => {
      try {
        // Check if script already exists
        if (document.querySelector('script[src*="cse.google.com"]')) {
          return;
        }

        // Create and inject the Google CSE script
        const script = document.createElement('script');
        script.src = 'https://cse.google.com/cse.js?cx=236ab1baa2d4f451d';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          window.__google_cse_init = true;
          setHasLoaded(true);
          setIsLoading(false);
        };

        script.onerror = () => {
          setError('Failed to load Google search');
          setIsLoading(false);
        };

        document.head.appendChild(script);
        setIsLoading(true);
      } catch (err) {
        setError('Failed to initialize Google search');
        setIsLoading(false);
      }
    };

    // Load script when component mounts
    loadGoogleCSEScript();

    // Cleanup function
    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, []);

  // Initialize search when script is loaded and search query changes
  useEffect(() => {
    if (!hasLoaded || !searchQuery.trim() || !window.google?.search?.cse?.element) {
      return;
    }

    try {
      // Clear previous results
      if (resultsRef.current) {
        resultsRef.current.innerHTML = '';
      }

      // Initialize Google CSE search
      if (window.google.search.cse.element && resultsRef.current) {
        const searchQueryWithLocation = location && location !== 'All Locations' 
          ? `${searchQuery} jobs in ${location}`
          : `${searchQuery} jobs`;

        window.google.search.cse.element.render(resultsRef.current, {
          gname: 'gsearch',
          q: searchQueryWithLocation,
          cx: '236ab1baa2d4f451d',
          num: 6, // Show 6 results
          sort: 'date', // Sort by date
          safe: 'active', // Safe search
          linkTarget: '_blank', // Open links in new tab
          defaultToRefinement: 'jobs' // Default to job search
        });
      }
    } catch (err) {
      console.error('Error initializing Google CSE:', err);
      setError('Failed to initialize search');
    }
  }, [hasLoaded, searchQuery, location]);

  // Don't render if no search query
  if (!searchQuery.trim()) {
    return null;
  }

  return (
    <div className={`bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Additional Job Opportunities
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Broader search results from across the web for: 
            <span className="font-medium text-gray-800 ml-1">"{searchQuery}"</span>
            {location && location !== 'All Locations' && (
              <span className="ml-1">in <span className="font-medium text-gray-800">{location}</span></span>
            )}
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            readOnly
            className="block w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 cursor-not-allowed text-sm sm:text-base"
            placeholder="Search query..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Powered by Google
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin mr-2 sm:mr-3" />
          <span className="text-gray-600 text-sm sm:text-base">Loading Google search...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xs">!</span>
            </div>
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
          </div>
          <div className="mt-2 sm:mt-3">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' jobs')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-600 hover:text-red-700 underline"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              Search on Google directly
            </a>
          </div>
        </div>
      )}

      {/* Google CSE Results */}
      {hasLoaded && !error && (
        <div className="space-y-3 sm:space-y-4">
          {/* Results Container */}
          <div 
            ref={resultsRef}
            className="min-h-[200px]"
          />
          
          {/* Footer */}
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500">
              <span>Results powered by Google Custom Search</span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' jobs')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                View more on Google
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for when CSE is not available */}
      {!hasLoaded && !isLoading && !error && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            <span className="text-gray-600 text-sm sm:text-base">Google search loading...</span>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' jobs')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Search on Google
          </a>
        </div>
      )}
    </div>
  );
}
