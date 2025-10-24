/**
 * Google Fallback Notification Component
 * Shows an enhanced notification when no jobs are found with Google search option
 */

import React from 'react';
import { ExclamationTriangleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface GoogleFallbackData {
  message: string;
  google_url: string;
  redirect_to_google: boolean;
  search_query: string;
  alternative_platforms?: {
    linkedin: string;
    indeed: string;
    naukri: string;
  };
}

interface GoogleFallbackNotificationProps {
  fallbackData: GoogleFallbackData;
  searchQuery: string;
  location: string;
  onDismiss?: () => void;
}

export default function GoogleFallbackNotification({
  fallbackData,
  searchQuery,
  location,
  onDismiss
}: GoogleFallbackNotificationProps) {
  const handleGoogleSearch = () => {
    window.open(fallbackData.google_url, '_blank', 'noopener,noreferrer');
    if (onDismiss) onDismiss();
  };

  const handlePlatformSearch = (platform: keyof NonNullable<GoogleFallbackData['alternative_platforms']>) => {
    const url = fallbackData.alternative_platforms?.[platform];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      if (onDismiss) onDismiss();
    }
  };

  return (
    <div className="fixed top-4 right-4 max-w-md bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 border-b border-orange-200 dark:border-orange-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                No Jobs Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search: "{searchQuery}" in {location}
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {fallbackData.message}
        </p>

        {/* Primary Google Search Button */}
        <button
          onClick={handleGoogleSearch}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium mb-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Search on Google Jobs
        </button>

        {/* Alternative Platforms */}
        {fallbackData.alternative_platforms && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <GlobeAltIcon className="w-3 h-3" />
              Or try other platforms:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePlatformSearch('linkedin')}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-700 text-white text-xs rounded-md hover:bg-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
              <button
                onClick={() => handlePlatformSearch('indeed')}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
                </svg>
                Indeed
              </button>
              <button
                onClick={() => handlePlatformSearch('naukri')}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Naukri
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip: Try different keywords or locations for better results
        </div>
      </div>
    </div>
  );
}

