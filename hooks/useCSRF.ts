import { useState, useEffect } from 'react';

/**
 * Hook for managing CSRF tokens in frontend forms
 * Automatically fetches and manages CSRF tokens for API requests
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    fetchToken();
  }, []);

  return {
    token,
    isLoading,
    error,
    fetchToken,
    refreshToken
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
