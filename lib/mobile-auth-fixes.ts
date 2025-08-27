/**
 * Mobile Authentication Fixes
 * Provides fallbacks and better error handling for mobile devices
 */

export interface MobileAuthFallback {
  type: 'https_required' | 'geolocation_blocked' | 'oauth_popup_blocked';
  message: string;
  solution: string;
  fallback: string;
}

/**
 * Enhanced mobile device detection with fallbacks
 */
export function detectMobileWithFallback(): {
  isMobile: boolean;
  canUseGeolocation: boolean;
  canUseOAuth: boolean;
  fallbacks: MobileAuthFallback[];
} {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      canUseGeolocation: false,
      canUseOAuth: false,
      fallbacks: []
    };
  }

  const isMobile = detectMobileDevice();
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isHTTPS = protocol === 'https:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  const fallbacks: MobileAuthFallback[] = [];
  
  // Check HTTPS requirements
  if (isMobile && !isHTTPS && !isLocalhost) {
    fallbacks.push({
      type: 'https_required',
      message: 'HTTPS is required for mobile geolocation and OAuth',
      solution: 'Enable HTTPS on your server',
      fallback: 'Use IP-based location detection and redirect-based OAuth'
    });
  }
  
  // Check geolocation support
  const hasGeolocation = 'geolocation' in navigator;
  if (isMobile && !hasGeolocation) {
    fallbacks.push({
      type: 'geolocation_blocked',
      message: 'Geolocation not supported on this mobile device',
      solution: 'Use IP-based location detection',
      fallback: 'Fallback to IP geolocation service'
    });
  }
  
  // Check OAuth popup support
  if (isMobile) {
    fallbacks.push({
      type: 'oauth_popup_blocked',
      message: 'Mobile browsers have limited OAuth popup support',
      solution: 'Use redirect-based OAuth flow',
      fallback: 'Redirect to OAuth provider instead of popup'
    });
  }
  
  return {
    isMobile,
    canUseGeolocation: isMobile && hasGeolocation && (isHTTPS || isLocalhost),
    canUseOAuth: isMobile && (isHTTPS || isLocalhost),
    fallbacks
  };
}

/**
 * Get mobile-optimized authentication method with fallbacks
 */
export function getMobileAuthMethodWithFallback(): {
  method: 'popup' | 'redirect' | 'fallback';
  reason: string;
  fallbackMessage?: string;
} {
  const mobileInfo = detectMobileWithFallback();
  
  if (!mobileInfo.isMobile) {
    return {
      method: 'popup',
      reason: 'Desktop device - popup OAuth supported'
    };
  }
  
  if (mobileInfo.canUseOAuth) {
    return {
      method: 'redirect',
      reason: 'Mobile device with HTTPS - redirect OAuth recommended'
    };
  }
  
  // Find HTTPS requirement fallback
  const httpsFallback = mobileInfo.fallbacks.find(f => f.type === 'https_required');
  
  return {
    method: 'fallback',
    reason: 'Mobile device without HTTPS - OAuth limited',
    fallbackMessage: httpsFallback?.fallback || 'Use alternative authentication method'
  };
}

/**
 * Get mobile-optimized geolocation method with fallbacks
 */
export function getMobileGeolocationMethodWithFallback(): {
  method: 'gps' | 'ip' | 'manual' | 'fallback';
  reason: string;
  fallbackMessage?: string;
} {
  const mobileInfo = detectMobileWithFallback();
  
  if (!mobileInfo.isMobile) {
    return {
      method: 'gps',
      reason: 'Desktop device - GPS geolocation supported'
    };
  }
  
  if (mobileInfo.canUseGeolocation) {
    return {
      method: 'gps',
      reason: 'Mobile device with HTTPS - GPS geolocation supported'
    };
  }
  
  // Find HTTPS requirement fallback
  const httpsFallback = mobileInfo.fallbacks.find(f => f.type === 'https_required');
  
  return {
    method: 'ip',
    reason: 'Mobile device without HTTPS - using IP geolocation',
    fallbackMessage: httpsFallback?.fallback || 'IP-based location detection'
  };
}

/**
 * Enhanced mobile error messages with solutions
 */
export function getMobileErrorMessageWithSolution(error: any, context: 'oauth' | 'geolocation'): {
  message: string;
  solution: string;
  fallback: string;
} {
  const mobileInfo = detectMobileWithFallback();
  
  if (context === 'oauth') {
    if (mobileInfo.fallbacks.some(f => f.type === 'https_required')) {
      return {
        message: 'OAuth authentication requires HTTPS on mobile devices',
        solution: 'Enable HTTPS on your server to allow mobile OAuth',
        fallback: 'Use email/password authentication or visit on desktop'
      };
    }
    
    if (mobileInfo.fallbacks.some(f => f.type === 'oauth_popup_blocked')) {
      return {
        message: 'OAuth popup blocked on mobile device',
        solution: 'Use redirect-based OAuth flow for mobile',
        fallback: 'Try again or use email/password authentication'
      };
    }
  }
  
  if (context === 'geolocation') {
    if (mobileInfo.fallbacks.some(f => f.type === 'https_required')) {
      return {
        message: 'Geolocation requires HTTPS on mobile devices',
        solution: 'Enable HTTPS on your server to allow mobile geolocation',
        fallback: 'Using IP-based location detection instead'
      };
    }
    
    if (mobileInfo.fallbacks.some(f => f.type === 'geolocation_blocked')) {
      return {
        message: 'Geolocation not supported on this mobile device',
        solution: 'Use IP-based location detection as fallback',
        fallback: 'Location detected from IP address'
      };
    }
  }
  
  // Default error handling
  const errorCode = error?.error || error?.code;
  
  switch (errorCode) {
    case 'popup_closed_by_user':
      return {
        message: 'Authentication was cancelled',
        solution: 'Try again and complete the authentication process',
        fallback: 'Use email/password authentication instead'
      };
    case 'popup_blocked':
      return {
        message: 'Authentication popup was blocked',
        solution: 'Allow popups for this site in your browser settings',
        fallback: 'Use redirect-based authentication or email/password'
      };
    case 'access_denied':
      return {
        message: 'Access to location/authentication was denied',
        solution: 'Grant permission when prompted by your browser',
        fallback: 'Use IP-based location or email/password authentication'
      };
    case 'timeout':
      return {
        message: 'Authentication request timed out',
        solution: 'Check your internet connection and try again',
        fallback: 'Use alternative authentication method'
      };
    default:
      return {
        message: 'Authentication failed',
        solution: 'Refresh the page and try again',
        fallback: 'Use email/password authentication or contact support'
      };
  }
}

/**
 * Check if mobile features can work with current environment
 */
export function checkMobileFeatureCompatibility(): {
  oauth: 'full' | 'limited' | 'none';
  geolocation: 'full' | 'limited' | 'none';
  recommendations: string[];
} {
  const mobileInfo = detectMobileWithFallback();
  const recommendations: string[] = [];
  
  let oauthStatus: 'full' | 'limited' | 'none' = 'none';
  let geolocationStatus: 'full' | 'limited' | 'none' = 'none';
  
  if (!mobileInfo.isMobile) {
    oauthStatus = 'full';
    geolocationStatus = 'full';
    return { oauth: oauthStatus, geolocation: geolocationStatus, recommendations };
  }
  
  // Check OAuth compatibility
  if (mobileInfo.canUseOAuth) {
    oauthStatus = 'full';
  } else if (mobileInfo.fallbacks.some(f => f.type === 'oauth_popup_blocked')) {
    oauthStatus = 'limited';
    recommendations.push('Use redirect-based OAuth for mobile devices');
  } else {
    oauthStatus = 'none';
    recommendations.push('Enable HTTPS to allow mobile OAuth authentication');
  }
  
  // Check geolocation compatibility
  if (mobileInfo.canUseGeolocation) {
    geolocationStatus = 'full';
  } else if (mobileInfo.fallbacks.some(f => f.type === 'geolocation_blocked')) {
    geolocationStatus = 'limited';
    recommendations.push('Use IP-based location detection for mobile');
  } else {
    geolocationStatus = 'none';
    recommendations.push('Enable HTTPS to allow mobile geolocation');
  }
  
  // Add HTTPS recommendation if needed
  if (mobileInfo.fallbacks.some(f => f.type === 'https_required')) {
    recommendations.unshift('CRITICAL: Enable HTTPS for mobile functionality to work properly');
  }
  
  return {
    oauth: oauthStatus,
    geolocation: geolocationStatus,
    recommendations
  };
}

/**
 * Get user-friendly mobile status message
 */
export function getMobileStatusMessage(): {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  actions?: string[];
} {
  const compatibility = checkMobileFeatureCompatibility();
  const mobileInfo = detectMobileWithFallback();
  
  if (!mobileInfo.isMobile) {
    return {
      title: 'Desktop Device',
      message: 'All features are fully supported on desktop',
      severity: 'info'
    };
  }
  
  if (compatibility.oauth === 'full' && compatibility.geolocation === 'full') {
    return {
      title: 'Mobile Device - Full Support',
      message: 'Your mobile device supports all features including OAuth and GPS location',
      severity: 'info'
    };
  }
  
  if (compatibility.oauth === 'limited' || compatibility.geolocation === 'limited') {
    return {
      title: 'Mobile Device - Limited Support',
      message: 'Some features may work with limitations. OAuth will use redirects, location will use IP detection.',
      severity: 'warning',
      actions: ['Use redirect-based authentication', 'Accept IP-based location']
    };
  }
  
  // No support
  return {
    title: 'Mobile Device - Limited Functionality',
    message: 'HTTPS is required for mobile features to work. Some features may not be available.',
    severity: 'error',
    actions: ['Use email/password authentication', 'Visit on desktop for full features']
  };
}

// Import the mobile device detection function
function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'windows phone', 'blackberry',
    'webos', 'ipod', 'opera mini', 'iemobile', 'mobile safari'
  ];
  
  const hasMobileKeywords = mobileKeywords.some(keyword => userAgent.includes(keyword));
  const isSmallScreen = window.innerWidth <= 768;
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasOrientation = 'orientation' in window;
  const isStandalone = (window.navigator as any).standalone === true;
  
  return hasMobileKeywords || (isSmallScreen && (hasTouchSupport || hasOrientation)) || isStandalone;
}
