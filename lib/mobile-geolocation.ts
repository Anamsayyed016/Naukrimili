/**
 * Simplified Mobile Geolocation Utility
 * Provides reliable geolocation for both mobile and desktop devices
 */

export interface MobileGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationResult {
  success: boolean;
  coordinates?: { lat: number; lng: number };
  city?: string;
  country?: string;
  state?: string;
  error?: string;
  errorCode?: number;
  source: 'gps' | 'ip' | 'manual';
}

/**
 * Check if the current environment supports geolocation
 */
export function isGeolocationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'geolocation' in navigator;
}

/**
 * Check if HTTPS is required (mobile browsers require HTTPS for geolocation)
 */
export function isHTTPSRequired(): boolean {
  if (typeof window === 'undefined') return false;
  return location.protocol !== 'https:' && location.hostname !== 'localhost';
}

/**
 * Check if the device is likely mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         window.innerWidth <= 768;
}

/**
 * Get mobile-optimized geolocation options
 */
export function getMobileGeolocationOptions(): MobileGeolocationOptions {
  return {
    enableHighAccuracy: false, // Better for mobile battery life
    timeout: 15000, // 15 seconds for mobile
    maximumAge: 300000 // 5 minutes cache
  };
}

/**
 * Get current location using GPS with mobile-optimized settings
 */
export async function getCurrentLocationGPS(options: MobileGeolocationOptions = {}): Promise<GeolocationResult> {
  const {
    enableHighAccuracy = false,
    timeout = 15000,
    maximumAge = 300000
  } = options;

  console.log('📍 Starting GPS geolocation...');

  if (!isGeolocationSupported()) {
    console.warn('❌ Geolocation not supported by this browser');
    return {
      success: false,
      error: 'Geolocation not supported by this browser',
      source: 'ip'
    };
  }

  // Check HTTPS requirement for mobile
  if (isMobileDevice() && isHTTPSRequired()) {
    console.warn('❌ Mobile device requires HTTPS for geolocation');
    return {
      success: false,
      error: 'Geolocation requires HTTPS on mobile devices. Please use HTTPS or try the IP-based location detection.',
      errorCode: -1,
      source: 'ip'
    };
  }

  // Check if we're on localhost (development)
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  console.log(`📍 GPS geolocation settings:`, {
    enableHighAccuracy,
    timeout,
    maximumAge,
    isMobile: isMobileDevice(),
    isHTTPS: !isHTTPSRequired(),
    isLocalhost
  });

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const duration = Date.now() - startTime;
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log(`✅ GPS location obtained in ${duration}ms:`, {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        });
        
        try {
          // Try to get city name from coordinates
          const locationData = await reverseGeocode(latitude, longitude);
          
          resolve({
            success: true,
            coordinates: { lat: latitude, lng: longitude },
            city: locationData.city,
            country: locationData.country,
            state: locationData.state,
            source: 'gps'
          });
        } catch (error) {
          console.warn('⚠️ Reverse geocoding failed, returning coordinates only:', error);
          // Return coordinates even if reverse geocoding fails
          resolve({
            success: true,
            coordinates: { lat: latitude, lng: longitude },
            source: 'gps'
          });
        }
      },
      (error) => {
        const duration = Date.now() - startTime;
        let errorMessage = 'Unknown geolocation error';
        
        console.warn(`❌ GPS geolocation failed after ${duration}ms:`, error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS settings and internet connection.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = `Geolocation error: ${error.message || 'Unknown error'}`;
        }
        
        resolve({
          success: false,
          error: errorMessage,
          errorCode: error.code,
          source: 'ip'
        });
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

/**
 * Get location from IP address as fallback
 */
export async function getLocationFromIP(): Promise<GeolocationResult> {
  const services = [
    {
      url: 'https://ipapi.co/json/',
      parser: (data: any) => ({
        city: data.city,
        country: data.country_code,
        state: data.region
      })
    },
    {
      url: 'https://ipinfo.io/json',
      parser: (data: any) => ({
        city: data.city,
        country: data.country,
        state: data.region
      })
    },
    {
      url: 'https://api.ipify.org?format=json',
      parser: (data: any) => ({
        city: 'Unknown',
        country: 'Unknown',
        state: 'Unknown'
      })
    }
  ];

  for (const service of services) {
    try {
      console.log(`🌐 Trying IP service: ${service.url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(service.url, {
        method: 'GET',
        mode: 'cors',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JobPortal/1.0)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const locationData = service.parser(data);
        
        console.log(`✅ IP service success: ${service.url}`, locationData);
        
        return {
          success: true,
          city: locationData.city,
          country: locationData.country,
          state: locationData.state,
          source: 'ip'
        };
      } else {
        console.warn(`❌ IP service failed with status ${response.status}: ${service.url}`);
      }
    } catch (error) {
      console.warn(`❌ IP service error: ${service.url}`, error);
      continue;
    }
  }

  return {
    success: false,
    error: 'All IP geolocation services failed. Please check your internet connection or try again later.',
    source: 'ip'
  };
}

/**
 * Reverse geocode coordinates to get city/country information
 */
async function reverseGeocode(lat: number, lng: number): Promise<{ city?: string; country?: string; state?: string }> {
  // Try BigDataCloud first
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.city || data.locality,
        country: data.countryCode,
        state: data.principalSubdivision
      };
    }
  } catch (error) {
    console.warn('BigDataCloud reverse geocoding failed');
  }

  // Fallback to OpenStreetMap
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.address) {
        return {
          city: data.address.city || data.address.town || data.address.village,
          country: data.address.country_code?.toUpperCase(),
          state: data.address.state
        };
      }
    }
  } catch (error) {
    console.warn('OpenStreetMap reverse geocoding failed');
  }

  return {};
}

/**
 * Smart location detection that tries GPS first, then falls back to IP
 */
export async function getSmartLocation(options: MobileGeolocationOptions = {}): Promise<GeolocationResult> {
  console.log('🚀 Starting smart location detection...');
  
  const isMobile = isMobileDevice();
  const needsHTTPS = isHTTPSRequired();
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  console.log('📍 Environment check:', {
    isMobile,
    needsHTTPS,
    isLocalhost,
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown'
  });

  // Strategy 1: Try GPS if conditions are met
  if (!isMobile || !needsHTTPS || isLocalhost) {
    console.log('📍 Attempting GPS geolocation...');
    const gpsResult = await getCurrentLocationGPS(options);
    
    if (gpsResult.success) {
      console.log('✅ GPS geolocation successful');
      return gpsResult;
    } else {
      console.log('❌ GPS geolocation failed:', gpsResult.error);
    }
  } else {
    console.log('📍 Skipping GPS - mobile device requires HTTPS');
  }

  // Strategy 2: IP-based fallback
  console.log('📍 Falling back to IP-based location detection...');
  const ipResult = await getLocationFromIP();
  
  if (ipResult.success) {
    console.log('✅ IP-based location successful');
    return ipResult;
  } else {
    console.log('❌ IP-based location failed:', ipResult.error);
  }

  // Strategy 3: Manual fallback with helpful error
  const errorMessage = isMobile && needsHTTPS 
    ? 'Location detection failed. Mobile devices require HTTPS for GPS access. Please use HTTPS or select a location manually.'
    : 'Location detection failed. Please check your internet connection or select a location manually.';

  console.log('❌ All location detection methods failed');
  
  return {
    success: false,
    error: errorMessage,
    source: 'manual'
  };
}

/**
 * Get user-friendly error message for geolocation errors
 */
export function getGeolocationErrorMessage(errorCode?: number): string {
  switch (errorCode) {
    case 1:
      return 'Location access denied. Please allow location access in your browser settings and try again.';
    case 2:
      return 'Location information unavailable. Please check your GPS settings and internet connection.';
    case 3:
      return 'Location request timed out. Please check your internet connection and try again.';
    case -1:
      return 'Geolocation requires HTTPS on mobile devices. Please use HTTPS or select a location manually.';
    default:
      return 'Failed to detect location. Please try again or select a location manually.';
  }
}

/**
 * Get comprehensive geolocation diagnostics
 */
export function getGeolocationDiagnostics(): {
  supported: boolean;
  isMobile: boolean;
  needsHTTPS: boolean;
  isLocalhost: boolean;
  protocol: string;
  userAgent: string;
  recommendations: string[];
} {
  const supported = isGeolocationSupported();
  const isMobile = isMobileDevice();
  const needsHTTPS = isHTTPSRequired();
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown';
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown';

  const recommendations: string[] = [];

  if (!supported) {
    recommendations.push('Geolocation is not supported by this browser');
  }

  if (isMobile && needsHTTPS) {
    recommendations.push('Mobile devices require HTTPS for geolocation to work');
  }

  if (!isMobile && needsHTTPS) {
    recommendations.push('Consider using HTTPS for better geolocation support');
  }

  if (isLocalhost) {
    recommendations.push('Development environment detected - geolocation should work');
  }

  return {
    supported,
    isMobile,
    needsHTTPS,
    isLocalhost,
    protocol,
    userAgent,
    recommendations
  };
}
