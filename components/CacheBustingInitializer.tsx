/**
 * Cache Busting Initializer Component
 * Ensures fresh JavaScript chunks are loaded on each deployment
 */

'use client';

import { useEffect } from 'react';
import { initializeCacheBusting, BUILD_VERSION, BUILD_TIMESTAMP } from '@/lib/cache-busting';

export default function CacheBustingInitializer() {
  useEffect(() => {
    // Initialize cache busting on component mount
    initializeCacheBusting();
    
    // Log build information for debugging
    console.log('🚀 App initialized with build:', {
      version: BUILD_VERSION,
      timestamp: new Date(BUILD_TIMESTAMP).toISOString(),
      userAgent: navigator.userAgent
    });
    
    // Check for old problematic chunks
    const checkForOldChunks = () => {
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('4bd1b696-100b9d70ed4e49c1.js')) {
          console.warn('🚨 Detected old problematic chunk:', src);
          // Force reload to get fresh chunks
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    };
    
    // Run check after a short delay to ensure all scripts are loaded
    setTimeout(checkForOldChunks, 2000);
    
  }, []);

  // This component doesn't render anything
  return null;
}