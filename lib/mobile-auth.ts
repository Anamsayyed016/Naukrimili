/**
 * Mobile-optimized authentication utilities
 * Handles mobile-specific OAuth flows and browser compatibility
 */

export interface MobileAuthOptions {
  provider: 'google' | 'linkedin';
  callbackUrl?: string;
  redirect?: boolean;
}

export interface MobileAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  url?: string;
}

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         window.innerWidth <= 768;
}

/**
 * Check if the current browser supports OAuth popups
 */
export function supportsOAuthPopup(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Mobile browsers often don't support popups well
  if (isMobileDevice()) {
    return false;
  }
  
  // Check if popup is blocked
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return true;
    }
  } catch {
    return false;
  }
  
  return false;
}

/**
 * Get mobile-optimized OAuth configuration
 */
export function getMobileOAuthConfig(_provider: string): any {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile-optimized settings
    return {
      redirect: true, // Force redirect on mobile
      prompt: 'select_account', // Show account picker
      access_type: 'offline',
      response_type: 'code'
    };
  }
  
  // Desktop settings
  return {
    redirect: false, // Allow popup on desktop
    prompt: 'consent',
    access_type: 'offline',
    response_type: 'code'
  };
}

/**
 * Handle mobile-specific OAuth errors
 */
export function getMobileOAuthErrorMessage(error: any): string {
  if (!error) return 'Authentication failed';
  
  const errorCode = error.error || error.code;
  
  switch (errorCode) {
    case 'popup_closed_by_user':
      return 'Authentication was cancelled. Please try again.';
    case 'popup_blocked':
      return 'Popup was blocked. Please allow popups for this site.';
    case 'access_denied':
      return 'Access was denied. Please try again.';
    case 'invalid_request':
      return 'Invalid request. Please refresh and try again.';
    case 'unauthorized_client':
      return 'Authentication service error. Please try again later.';
    case 'unsupported_response_type':
      return 'Authentication service error. Please try again later.';
    case 'server_error':
      return 'Authentication service is temporarily unavailable. Please try again later.';
    case 'temporarily_unavailable':
      return 'Authentication service is temporarily unavailable. Please try again later.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

/**
 * Check if HTTPS is required for authentication
 */
export function isHTTPSRequired(): boolean {
  if (typeof window === 'undefined') return false;
  
  // HTTPS is required for OAuth on mobile
  if (isMobileDevice()) {
    return window.location.protocol !== 'https:' && 
           window.location.hostname !== 'localhost';
  }
  
  return false;
}

/**
 * Get mobile-friendly authentication method
 */
export function getPreferredAuthMethod(): 'popup' | 'redirect' {
  if (isMobileDevice()) {
    return 'redirect';
  }
  
  if (supportsOAuthPopup()) {
    return 'popup';
  }
  
  return 'redirect';
}

/**
 * Validate mobile authentication environment
 */
export function validateMobileAuthEnvironment(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (typeof window === 'undefined') {
    return { isValid: false, warnings, errors: ['Server-side rendering detected'] };
  }
  
  // Check HTTPS requirement
  if (isHTTPSRequired()) {
    warnings.push('HTTPS is recommended for OAuth authentication on mobile devices');
  }
  
  // Check mobile browser support
  if (isMobileDevice()) {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      // iOS Safari has some OAuth limitations
      warnings.push('iOS Safari may have limited OAuth support');
    }
    
    if (userAgent.includes('android') && userAgent.includes('chrome')) {
      // Android Chrome generally works well
      // No warnings needed
    }
  }
  
  // Check if geolocation is available (for location-based features)
  if (!('geolocation' in navigator)) {
    warnings.push('Geolocation not supported - some features may be limited');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}
