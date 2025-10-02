'use client';

import { useEffect } from 'react';
import { initializeCacheBusting, clearBrowserCache } from '@/lib/cache-busting';

/**
 * Cache Busting Initializer Component
 * Runs on app load to ensure fresh content
 */
export default function CacheBustingInitializer() {
  useEffect(() => {
    // Initialize cache busting logic
    initializeCacheBusting();
    
    // Check for cache busting parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shouldClearCache = urlParams.get('clear_cache') === 'true';
    
    if (shouldClearCache) {
      console.log('🧹 Cache clearing requested via URL parameter');
      clearBrowserCache();
      
      // Remove the parameter from URL without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('clear_cache');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Check for version mismatch in localStorage
    const currentVersion = process.env.NEXT_PUBLIC_BUILD_TIME || Date.now().toString();
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('🔄 Version mismatch detected - clearing cache');
      clearBrowserCache();
    }
    
    // Store current version
    localStorage.setItem('app_version', currentVersion);
    
    // Log cache status for debugging
    console.log('📦 Cache status:', {
      currentVersion,
      storedVersion,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
  }, []);

  // This component doesn't render anything
  return null;
}
