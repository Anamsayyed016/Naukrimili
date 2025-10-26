/**
 * Mobile authentication fixes and compatibility utilities
 * Provides fallback functions and mobile-specific error handling
 */

export interface MobileFallback {
  type: string;
  message: string;
  solution?: string;
}

export interface MobileInfo {
  isMobile: boolean;
  fallbacks: MobileFallback[];
}

export interface MobileStatus {
  isCompatible: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface MobileCompatibility {
  oauth: boolean;
  popups: boolean;
  geolocation: boolean;
  https: boolean;
}

export interface MobileAuthMethod {
  method: 'popup' | 'redirect' | 'fallback';
  reason: string;
}

export interface MobileErrorSolution {
  message: string;
  solution: string;
}

/**
 * Detect mobile device with fallback detection
 */
export function detectMobileWithFallback(): MobileInfo {
  if (typeof window === 'undefined') {
    return { isMobile: false, fallbacks: [] };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'windows phone'];
  const isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
                   window.innerWidth <= 768;

  const fallbacks: MobileFallback[] = [];

  // Check HTTPS requirement
  if (isMobile && window.location.protocol !== 'https:' && 
      window.location.hostname !== 'localhost') {
    fallbacks.push({
      type: 'https_required',
      message: 'HTTPS is required for mobile authentication',
      solution: 'Please use HTTPS or localhost for testing'
    });
  }

  // Check browser compatibility
  if (isMobile) {
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      fallbacks.push({
        type: 'browser_limitation',
        message: 'iOS Safari has limited OAuth support',
        solution: 'Consider using Chrome or Firefox for better compatibility'
      });
    }

    if (userAgent.includes('opera') || userAgent.includes('edge')) {
      fallbacks.push({
        type: 'browser_limitation',
        message: 'Some mobile browsers may have OAuth limitations',
        solution: 'Chrome or Firefox recommended for best experience'
      });
    }
  }

  return { isMobile, fallbacks };
}

/**
 * Get mobile status message
 */
export function getMobileStatusMessage(): MobileStatus {
  if (typeof window === 'undefined') {
    return {
      isCompatible: false,
      warnings: ['Server-side rendering detected'],
      errors: [],
      recommendations: ['Wait for client-side hydration']
    };
  }

  const _mobileInfo = detectMobileWithFallback();
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];

  // Add fallback messages
  _mobileInfo.fallbacks.forEach(fallback => {
    if (fallback.type === 'https_required') {
      errors.push(fallback.message);
    } else {
      warnings.push(fallback.message);
    }
  });

  // Check geolocation support
  if (!('geolocation' in navigator)) {
    warnings.push('Geolocation not supported');
    recommendations.push('Some location-based features may be limited');
  }

  // Check OAuth popup support
  if (_mobileInfo.isMobile) {
    try {
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      if (testPopup) {
        testPopup.close();
      } else {
        warnings.push('Popup windows may be blocked');
        recommendations.push('OAuth will use redirect method');
      }
    } catch {
      warnings.push('Popup windows not supported');
      recommendations.push('OAuth will use redirect method');
    }
  }

  return {
    isCompatible: errors.length === 0,
    warnings,
    errors,
    recommendations
  };
}

/**
 * Check mobile feature compatibility
 */
export function checkMobileFeatureCompatibility(): MobileCompatibility {
  if (typeof window === 'undefined') {
    return {
      oauth: false,
      popups: false,
      geolocation: false,
      https: false
    };
  }

  // Check OAuth support
  const oauth = true; // OAuth generally works on mobile
  
  // Check popup support
  let popups = false;
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      popups = true;
    }
  } catch {
    popups = false;
  }
  
  // Check geolocation
  const geolocation = 'geolocation' in navigator;
  
  // Check HTTPS
  const https = window.location.protocol === 'https:' || 
                window.location.hostname === 'localhost';

  return { oauth, popups, geolocation, https };
}

/**
 * Get mobile auth method with fallback
 */
export function getMobileAuthMethodWithFallback(): MobileAuthMethod {
  if (typeof window === 'undefined') {
    return { method: 'redirect', reason: 'Server-side rendering' };
  }

  const _mobileInfo = detectMobileWithFallback();
  const compatibility = checkMobileFeatureCompatibility();

  if (_mobileInfo.isMobile) {
    if (compatibility.popups && !compatibility.https) {
      return { method: 'popup', reason: 'Mobile with popup support' };
    } else {
      return { method: 'redirect', reason: 'Mobile device - redirect recommended' };
    }
  }

  if (compatibility.popups) {
    return { method: 'popup', reason: 'Desktop with popup support' };
  }

  return { method: 'redirect', reason: 'Popup not supported - using redirect' };
}

/**
 * Get mobile error message with solution
 */
export function getMobileErrorMessageWithSolution(error: unknown, context: 'oauth' | 'credentials' = 'oauth'): MobileErrorSolution {
  if (!error) {
    return {
      message: 'Authentication failed',
      solution: 'Please try again or contact support if the issue persists'
    };
  }

  const errorCode = (error as { error?: string; code?: string; message?: string }).error || 
                   (error as { error?: string; code?: string; message?: string }).code || 
                   (error as { error?: string; code?: string; message?: string }).message;
  const _mobileInfo = detectMobileWithFallback();

  // OAuth-specific errors
  if (context === 'oauth') {
    switch (errorCode) {
      case 'popup_closed_by_user':
        return {
          message: 'Authentication was cancelled',
          solution: 'Please complete the authentication process'
        };
      case 'popup_blocked':
        return {
          message: 'Popup was blocked by your browser',
          solution: _mobileInfo.isMobile 
            ? 'Please use the redirect method or allow popups'
            : 'Please allow popups for this site and try again'
        };
      case 'access_denied':
        return {
          message: 'Access was denied',
          solution: 'Please grant the required permissions and try again'
        };
      case 'invalid_request':
        return {
          message: 'Invalid authentication request',
          solution: 'Please refresh the page and try again'
        };
      case 'unauthorized_client':
        return {
          message: 'Authentication service error',
          solution: 'Please try again later or contact support'
        };
      case 'server_error':
        return {
          message: 'Authentication service is temporarily unavailable',
          solution: 'Please try again in a few minutes'
        };
      default:
        return {
          message: 'Authentication failed',
          solution: _mobileInfo.isMobile
            ? 'Please try again or use a different browser'
            : 'Please try again or contact support'
        };
    }
  }

  // Credentials-specific errors
  return {
    message: 'Invalid credentials',
    solution: 'Please check your email and password and try again'
  };
}
