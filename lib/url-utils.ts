/**
 * Centralized URL Utilities
 * Provides a single source of truth for the application's base URL
 * Ensures consistency across the entire application
 */

/**
 * Get the canonical base URL for the application
 * Uses NEXT_PUBLIC_APP_URL environment variable
 * Falls back to https://naukrimili.com in production
 * Falls back to http://localhost:3000 in development
 */
export function getBaseUrl(): string {
  // Server-side: Use environment variable or default
  if (typeof window === 'undefined') {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.NODE_ENV === 'production' 
        ? 'https://naukrimili.com' 
        : 'http://localhost:3000')
    );
  }

  // Client-side: Use environment variable or construct from window
  // Always normalize to https://naukrimili.com (non-www)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return normalizeUrl(envUrl);
  }

  // Fallback: Use window.location but normalize it
  const origin = window.location.origin;
  return normalizeUrl(origin);
}

/**
 * Normalize URL to canonical format: https://naukrimili.com (non-www, https)
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove www subdomain
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
    }
    
    // Force https
    urlObj.protocol = 'https:';
    
    // Remove port if it's default
    if (urlObj.port === '443' || urlObj.port === '') {
      urlObj.port = '';
    }
    
    return urlObj.toString().replace(/\/$/, ''); // Remove trailing slash
  } catch {
    // If URL parsing fails, return the canonical URL
    return 'https://naukrimili.com';
  }
}

/**
 * Build absolute URL from relative path
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if URL needs to be redirected to canonical format
 */
export function shouldRedirect(url: string): { should: boolean; redirectTo?: string } {
  try {
    const urlObj = new URL(url);
    const canonical = normalizeUrl(url);
    
    // Check if URL differs from canonical
    if (urlObj.toString() !== canonical) {
      return { should: true, redirectTo: canonical };
    }
    
    return { should: false };
  } catch {
    return { should: false };
  }
}

