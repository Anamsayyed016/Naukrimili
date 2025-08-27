/**
 * Mobile-specific geolocation utilities
 * Handles mobile device geolocation issues and provides better fallbacks
 */

export interface MobileGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  forceIPFallback?: boolean;
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
 * Check geolocation permission status
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt' | null> {
  if (!isGeolocationSupported()) return null;
  
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state;
    } catch (error) {
      console.warn('Permission query not supported:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Request geolocation permission explicitly
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (!isGeolocationSupported()) return false;
  
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      });
    });
    return true;
  } catch (error: any) {
    console.error('Permission request failed:', error);
    return false;
  }
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

  if (!isGeolocationSupported()) {
    return {
      success: false,
      error: 'Geolocation not supported by this browser',
      source: 'ip'
    };
  }

  if (isHTTPSRequired()) {
    return {
      success: false,
      error: 'Geolocation requires HTTPS on mobile devices',
      errorCode: -1,
      source: 'ip'
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
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
          resolve({
            success: true,
            coordinates: { lat: latitude, lng: longitude },
            source: 'gps'
          });
        }
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
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
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('IP geolocation service unavailable');
    
    const data = await response.json();
    
    return {
      success: true,
      city: data.city,
      country: data.country_code,
      state: data.region,
      source: 'ip'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get location from IP',
      source: 'ip'
    };
  }
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
  // Check permission first
  const permission = await checkGeolocationPermission();
  
  if (permission === 'denied') {
    // Permission denied, use IP fallback
    return getLocationFromIP();
  }
  
  if (permission === 'granted' || permission === 'prompt') {
    // Try GPS first
    const gpsResult = await getCurrentLocationGPS(options);
    
    if (gpsResult.success) {
      return gpsResult;
    }
    
    // GPS failed, use IP fallback
    return getLocationFromIP();
  }
  
  // No permission info available, try GPS anyway
  const gpsResult = await getCurrentLocationGPS(options);
  
  if (gpsResult.success) {
    return gpsResult;
  }
  
  // Fallback to IP
  return getLocationFromIP();
}

/**
 * Get user-friendly error message for geolocation errors
 */
export function getGeolocationErrorMessage(errorCode?: number): string {
  switch (errorCode) {
    case 1:
      return 'Location access denied. Please allow location access in your browser settings.';
    case 2:
      return 'Location information unavailable. Please check your GPS settings.';
    case 3:
      return 'Location request timed out. Please check your internet connection.';
    case -1:
      return 'Geolocation requires HTTPS on mobile devices.';
    default:
      return 'Failed to detect location. Please try again or select a location manually.';
  }
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
    timeout: 15000, // Longer timeout for mobile GPS
    maximumAge: 300000, // 5 minutes cache
    forceIPFallback: false
  };
}
