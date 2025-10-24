import { useState, useEffect } from 'react';

// Mobile detection utility
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Hook for managing CSRF tokens in frontend forms
 * Automatically fetches and manages CSRF tokens for API requests
 * Mobile-optimized with fallback handling
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const fetchToken = async () => {
    if (token) return token; // Return cached token if available
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/csrf');
      const data = await response.json();
      
      if (data.success && data.token) {
        setToken(data.token);
        return data.token;
      } else {
        throw new Error(data.error || 'Failed to fetch CSRF token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setToken(null);
    return await fetchToken();
  };

  // Auto-fetch token on mount
  useEffect(() => {
    setIsMobileDevice(isMobile());
    
    // Skip CSRF token fetch on mobile devices with issues
    if (!isMobileDevice) {
      fetchToken();
    }
  }, [isMobileDevice]);

  return {
    token,
    isLoading,
    error,
    fetchToken,
    refreshToken,
    isMobileDevice
  };
}

/**
 * Higher-order function that adds CSRF token to fetch requests
 */
export function withCSRF(fetchFn: typeof fetch) {
  return async (url: string, options: RequestInit = {}) => {
    // Get CSRF token
    const response = await fetch('/api/csrf');
    const data = await response.json();
    
    if (data.success && data.token) {
      // Add CSRF token to headers
      const headers = new Headers(options.headers);
      headers.set('x-csrf-token', data.token);
      
      return fetchFn(url, {
        ...options,
        headers
      });
    }
    
    // Fallback to original fetch if CSRF token fetch fails
    return fetchFn(url, options);
  };
}
