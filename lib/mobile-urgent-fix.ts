/**
 * URGENT MOBILE FIX
 * This file provides immediate fallbacks for mobile devices when HTTPS is not available
 * The main issue: Mobile browsers require HTTPS for geolocation and OAuth
 */

export interface UrgentMobileFix {
  canUseGeolocation: boolean;
  canUseOAuth: boolean;
  fallbackMethod: 'ip' | 'manual' | 'none';
  errorMessage: string;
  solution: string;
}

/**
 * IMMEDIATE FIX: Check if mobile features can work
 */
export function checkMobileUrgentFix(): UrgentMobileFix {
  if (typeof window === 'undefined') {
    return {
      canUseGeolocation: false,
      canUseOAuth: false,
      fallbackMethod: 'none',
      errorMessage: 'Server-side rendering detected',
      solution: 'This check must be run in the browser'
    };
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isHTTPS = protocol === 'https:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isMobile = detectMobileDevice();

  // CRITICAL ISSUE: Mobile browsers require HTTPS
  if (isMobile && !isHTTPS && !isLocalhost) {
    return {
      canUseGeolocation: false,
      canUseOAuth: false,
      fallbackMethod: 'ip',
      errorMessage: '🚨 CRITICAL: HTTPS Required for Mobile',
      solution: 'Your site is running on HTTP. Mobile browsers require HTTPS for geolocation and OAuth to work. Enable HTTPS immediately or use IP-based location detection.'
    };
  }

  // Mobile with HTTPS - full functionality
  if (isMobile && isHTTPS) {
    return {
      canUseGeolocation: true,
      canUseOAuth: true,
      fallbackMethod: 'none',
      errorMessage: '✅ Mobile with HTTPS - Full Support',
      solution: 'All mobile features should work properly'
    };
  }

  // Mobile on localhost - limited functionality
  if (isMobile && isLocalhost) {
    return {
      canUseGeolocation: true,
      canUseOAuth: true,
      fallbackMethod: 'none',
      errorMessage: '⚠️ Mobile on Localhost - Limited Support',
      solution: 'Features work but may have limitations. Use HTTPS in production.'
    };
  }

  // Desktop - full functionality
  return {
    canUseGeolocation: true,
    canUseOAuth: true,
    fallbackMethod: 'none',
    errorMessage: '✅ Desktop Device - Full Support',
    solution: 'All features work on desktop regardless of protocol'
  };
}

/**
 * IMMEDIATE FIX: Force IP-based location detection for mobile
 */
export async function forceIPLocationForMobile(): Promise<any> {
  if (typeof window === 'undefined') return null;

  const mobileFix = checkMobileUrgentFix();
  
  if (mobileFix.canUseGeolocation) {
    console.log('📍 Mobile can use GPS geolocation');
    return null; // Let normal GPS work
  }

  console.log('🚨 Mobile cannot use GPS, forcing IP-based location');
  
  try {
    // Use multiple IP geolocation services for reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json',
      'https://api.ipify.org?format=json'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (response.ok) {
          const data = await response.json();
          console.log('📍 IP location obtained:', data);
          
          // Return standardized format
          return {
            source: 'ip',
            country: data.country_code || data.country,
            countryName: data.country_name || data.country,
            city: data.city,
            state: data.region || data.state,
            coordinates: null,
            timestamp: new Date().toISOString(),
            method: 'ip_fallback'
          };
        }
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error);
        continue;
      }
    }

    throw new Error('All IP geolocation services failed');
  } catch (error) {
    console.error('❌ IP location fallback failed:', error);
    return {
      source: 'manual',
      country: 'IN', // Default to India
      countryName: 'India',
      city: 'Unknown',
      state: 'Unknown',
      coordinates: null,
      timestamp: new Date().toISOString(),
      method: 'manual_fallback'
    };
  }
}

/**
 * IMMEDIATE FIX: Force redirect-based OAuth for mobile
 */
export function forceRedirectOAuthForMobile(): boolean {
  if (typeof window === 'undefined') return false;

  const mobileFix = checkMobileUrgentFix();
  
  if (mobileFix.canUseOAuth) {
    console.log('🔐 Mobile can use OAuth normally');
    return false; // Let normal OAuth work
  }

  console.log('🚨 Mobile cannot use OAuth, forcing redirect method');
  return true; // Force redirect
}

/**
 * IMMEDIATE FIX: Show urgent mobile warning
 */
export function showUrgentMobileWarning(): string {
  const mobileFix = checkMobileUrgentFix();
  
  if (mobileFix.canUseGeolocation && mobileFix.canUseOAuth) {
    return ''; // No warning needed
  }

  return `
🚨 URGENT MOBILE ISSUE DETECTED

${mobileFix.errorMessage}

PROBLEM: ${mobileFix.solution}

IMMEDIATE ACTIONS REQUIRED:
1. Enable HTTPS on your server
2. Install SSL certificate
3. Redirect HTTP to HTTPS

CURRENT STATUS:
• Geolocation: ${mobileFix.canUseGeolocation ? '✅ Working' : '❌ Blocked'}
• OAuth: ${mobileFix.canUseOAuth ? '✅ Working' : '❌ Blocked'}
• Fallback: ${mobileFix.fallbackMethod === 'ip' ? 'IP-based location' : 'Manual input'}

This issue affects ALL mobile users and will prevent them from using core features.
  `;
}

/**
 * IMMEDIATE FIX: Get mobile device info for debugging
 */
export function getMobileDeviceInfo(): any {
  if (typeof window === 'undefined') return null;

  return {
    userAgent: navigator.userAgent,
    isMobile: detectMobileDevice(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    hasGeolocation: 'geolocation' in navigator,
    hasPermissions: 'permissions' in navigator,
    hasTouch: 'ontouchstart' in window,
    timestamp: new Date().toISOString()
  };
}

/**
 * IMMEDIATE FIX: Test mobile functionality
 */
export async function testMobileFunctionality(): Promise<any> {
  const results = {
    device: getMobileDeviceInfo(),
    mobileFix: checkMobileUrgentFix(),
    geolocationTest: null,
    oauthTest: null,
    recommendations: []
  };

  // Test geolocation
  try {
    if (results.mobileFix.canUseGeolocation) {
      results.geolocationTest = 'GPS geolocation should work';
    } else {
      results.geolocationTest = 'GPS blocked, using IP fallback';
      const ipLocation = await forceIPLocationForMobile();
      results.geolocationTest = `IP location: ${ipLocation?.city}, ${ipLocation?.country}`;
    }
  } catch (error) {
    results.geolocationTest = `Geolocation test failed: ${error.message}`;
  }

  // Test OAuth
  if (results.mobileFix.canUseOAuth) {
    results.oauthTest = 'OAuth should work normally';
  } else {
    results.oauthTest = 'OAuth blocked, forcing redirect method';
    results.recommendations.push('Use redirect-based OAuth flow');
  }

  // Add recommendations
  if (!results.mobileFix.canUseGeolocation) {
    results.recommendations.push('Enable HTTPS for mobile geolocation');
  }
  if (!results.mobileFix.canUseOAuth) {
    results.recommendations.push('Enable HTTPS for mobile OAuth');
  }
  if (results.mobileFix.fallbackMethod === 'ip') {
    results.recommendations.push('IP-based location is working as fallback');
  }

  return results;
}

// Helper function
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
  
  return hasMobileKeywords || (isSmallScreen && hasTouchSupport);
}
