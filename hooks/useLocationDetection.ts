import { useState, useEffect, useCallback } from 'react';
import { 
  getMobileGeolocationMethodWithFallback,
  getMobileErrorMessageWithSolution,
  detectMobileWithFallback
} from '@/lib/mobile-auth-fixes';

// Minimal country metadata used by the app (extend when needed)
export const TARGET_COUNTRIES = {
  US: { name: 'United States', currency: 'USD', currencySymbol: '$', cities: ['New York', 'San Francisco'] },
  GB: { name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', cities: ['London', 'Manchester'] },
  IN: { name: 'India', currency: 'INR', currencySymbol: '₹', cities: ['Mumbai', 'Bengaluru'] },
  AE: { name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'AED', cities: ['Dubai', 'Abu Dhabi'] }
} as const;

export type CountryCode = keyof typeof TARGET_COUNTRIES;

export interface LocationData {
  country: CountryCode;
  countryName: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  currency: string;
  currencySymbol: string;
  isDetected: boolean;
  error?: string;
}

interface UseLocationDetectionOptions {
  autoDetect?: boolean;
  fallbackCountry?: CountryCode;
  enableHighAccuracy?: boolean;
}

export function useLocationDetection(options: UseLocationDetectionOptions = {}) {
  const { autoDetect = true, fallbackCountry = 'IN', enableHighAccuracy = false } = options;

  const [location, setLocation] = useState<LocationData>(() => {
    const c = TARGET_COUNTRIES[fallbackCountry];
    return {
      country: fallbackCountry,
      countryName: c.name,
      currency: c.currency,
      currencySymbol: c.currencySymbol,
      isDetected: false
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(autoDetect);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileInfo, setMobileInfo] = useState<any>(null);

  // Check geolocation permission status
  const checkPermissionStatus = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }

    // Check if we're on HTTPS (required for geolocation on mobile)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Geolocation requires HTTPS on mobile devices');
      return 'denied';
    }

    // Check permission status if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionState(permission.state);
        return permission.state;
      } catch (error) {
        console.warn('Permission query not supported:', error);
        return null;
      }
    }

    return null;
  }, []);

  // Very lightweight IP lookup (single service; silent failure)
  const detectCountryFromIP = useCallback(async (): Promise<Partial<LocationData> | null> => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) return null;
      const data: any = await res.json();
      if (data && data.country_code && TARGET_COUNTRIES[data.country_code as CountryCode]) {
        return {
          country: data.country_code,
          countryName: data.country_name,
          city: data.city,
          state: data.region
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  }, []);

  const detectLocationFromGPS = useCallback(async (): Promise<Partial<LocationData> | null> => {
    if (typeof window === 'undefined') return null;

    try {
      // Get mobile-optimized geolocation method
      const geoMethod = getMobileGeolocationMethodWithFallback();
      console.log('📍 Mobile geolocation method:', geoMethod);

      if (geoMethod.method === 'fallback') {
        console.log('⚠️ Using fallback geolocation method:', geoMethod.fallbackMessage);
        // Fallback to IP-based detection
        return await detectCountryFromIP();
      }

      if (!('geolocation' in navigator)) {
        const mobileError = getMobileErrorMessageWithSolution({ code: 'not_supported' }, 'geolocation');
        setError(`${mobileError.message}. ${mobileError.solution}`);
        return null;
      }

      // Check HTTPS requirement for mobile
      if (mobileInfo?.isMobile && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        const mobileError = getMobileErrorMessageWithSolution({ code: 'https_required' }, 'geolocation');
        setError(`${mobileError.message}. ${mobileError.solution}`);
        console.log('⚠️ HTTPS required for mobile geolocation, using IP fallback');
        return await detectCountryFromIP();
      }

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Geolocation timeout'));
        }, 15000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeoutId);
            try {
              const { latitude, longitude } = position.coords;
              console.log('📍 GPS coordinates obtained:', { latitude, longitude });

              // Use existing reverse geocoding logic
              let locationData = null;
              
              // Try BigDataCloud first
              try {
                const r = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                if (r.ok) {
                  const d: any = await r.json();
                  if (d.countryCode && TARGET_COUNTRIES[d.countryCode as CountryCode]) {
                    locationData = {
                      country: d.countryCode,
                      countryName: d.countryCode,
                      city: d.city || d.locality,
                      state: d.principalSubdivision,
                      coordinates: { lat: latitude, lng: longitude },
                      source: 'gps'
                    };
                  }
                }
              } catch (error) {
                console.warn('BigDataCloud reverse geocoding failed, trying fallback');
              }

              // Fallback to OpenStreetMap if BigDataCloud fails
              if (!locationData) {
                try {
                  const r = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`
                  );
                  if (r.ok) {
                    const d: any = await r.json();
                    if (d.address && d.address.country_code && TARGET_COUNTRIES[d.address.country_code.toUpperCase() as CountryCode]) {
                      locationData = {
                        country: d.address.country_code.toUpperCase(),
                        countryName: d.address.country,
                        city: d.address.city || d.address.town || d.address.village,
                        state: d.address.state,
                        coordinates: { lat: latitude, lng: longitude },
                        source: 'gps'
                      };
                    }
                  }
                } catch (error) {
                  console.warn('OpenStreetMap reverse geocoding also failed');
                }
              }

              resolve(locationData);
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            const mobileError = getMobileErrorMessageWithSolution(error, 'geolocation');
            setError(`${mobileError.message}. ${mobileError.solution}`);
            console.error('❌ GPS geolocation error:', mobileError);
            reject(error);
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000
          }
        );
      });
    } catch (error: any) {
      const mobileError = getMobileErrorMessageWithSolution(error, 'geolocation');
      setError(`${mobileError.message}. ${mobileError.solution}`);
      console.error('❌ GPS detection failed:', mobileError);
      return null;
    }
  }, [mobileInfo]);

  const detectLocation = useCallback(async (): Promise<Partial<LocationData> | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check mobile compatibility first
      if (mobileInfo?.isMobile) {
        const geoMethod = getMobileGeolocationMethodWithFallback();
        console.log('📍 Mobile geolocation strategy:', geoMethod);
        
        if (geoMethod.method === 'gps') {
          console.log('📍 Attempting GPS geolocation on mobile');
          const gpsLocation = await detectLocationFromGPS();
          if (gpsLocation) {
            setLocation(prev => ({ ...prev, ...gpsLocation }));
            return gpsLocation;
          }
        }
        
        if (geoMethod.method === 'ip' || geoMethod.method === 'fallback') {
          console.log('📍 Using IP-based geolocation on mobile');
          const ipLocation = await detectCountryFromIP();
          if (ipLocation) {
            setLocation(prev => ({ ...prev, ...ipLocation }));
            return ipLocation;
          }
        }
      } else {
        // Desktop flow
        console.log('📍 Desktop geolocation flow');
        const gpsLocation = await detectLocationFromGPS();
        if (gpsLocation) {
          setLocation(prev => ({ ...prev, ...gpsLocation }));
          return gpsLocation;
        }
      }

      // Fallback to IP detection
      console.log('📍 Falling back to IP-based detection');
      const ipLocation = await detectCountryFromIP();
      if (ipLocation) {
        setLocation(prev => ({ ...prev, ...ipLocation }));
        return ipLocation;
      }

      throw new Error('All location detection methods failed');
    } catch (error: any) {
      const mobileError = getMobileErrorMessageWithSolution(error, 'geolocation');
      setError(`${mobileError.message}. ${mobileError.solution}`);
      console.error('❌ Location detection failed:', mobileError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mobileInfo, detectLocationFromGPS, detectCountryFromIP]);

  const setCountry = useCallback((code: CountryCode) => {
    const meta = TARGET_COUNTRIES[code];
    setLocation(prev => ({
      ...prev,
      country: code,
      countryName: meta.name,
      city: undefined,
      state: undefined,
      coordinates: undefined,
      currency: meta.currency,
      currencySymbol: meta.currencySymbol,
      isDetected: false,
      error: undefined
    }));
  }, []);

  // Request geolocation permission explicitly
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return false;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      setHasPermission(true);
      setPermissionState('granted');
      return true;
    } catch (error: any) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      
      if (error.code === error.PERMISSION_DENIED) {
        setPermissionState('denied');
      } else {
        setPermissionState('prompt');
      }
      
      return false;
    }
  }, []);

  useEffect(() => {
    // Check mobile compatibility on mount
    const mobile = detectMobileWithFallback();
    setMobileInfo(mobile);
  }, []);

  useEffect(() => {
    if (autoDetect) {
      detectLocation();
      checkPermissionStatus();
    }
  }, [autoDetect, detectLocation, checkPermissionStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    location, 
    isLoading, 
    hasPermission, 
    permissionState,
    detectLocation, 
    setCountry, 
    requestPermission,
    targetCountries: TARGET_COUNTRIES,
    error,
    clearError,
    mobileInfo
  };
}
