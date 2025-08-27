import { useState, useEffect, useCallback } from 'react';

// Minimal country metadata used by the app
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

// Simple mobile detection
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if HTTPS is available (required for mobile geolocation)
const isHTTPS = () => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isSecureConnection, setIsSecureConnection] = useState(false);

  // Check geolocation permission status
  const checkPermissionStatus = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }

    // Check if we're on HTTPS (required for geolocation on mobile)
    const secure = isHTTPS();
    setIsSecureConnection(secure);
    
    if (!secure && isMobile()) {
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

  // IP-based location detection with multiple fallback services
  const detectCountryFromIP = useCallback(async (): Promise<Partial<LocationData> | null> => {
    const services = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json',
      'https://api.ipify.org?format=json'
    ];

    for (const service of services) {
      try {
        const res = await fetch(service, { 
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });
        
        if (res.ok) {
          const data: any = await res.json();
          
          // Handle different service response formats
          let countryCode = data.country_code || data.country || data.countryCode;
          let countryName = data.country_name || data.country;
          let city = data.city;
          let state = data.region || data.state;
          
          if (countryCode && TARGET_COUNTRIES[countryCode.toUpperCase() as CountryCode]) {
            return {
              country: countryCode.toUpperCase() as CountryCode,
              countryName: countryName || TARGET_COUNTRIES[countryCode.toUpperCase() as CountryCode].name,
              city,
              state
            };
          }
        }
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error);
        continue;
      }
    }
    
    return null;
  }, []);

  // GPS-based location detection with mobile optimization
  const detectLocationFromGPS = useCallback(async (): Promise<Partial<LocationData> | null> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }

    // Mobile devices need HTTPS for geolocation
    if (isMobile() && !isHTTPS()) {
      setError('Geolocation requires HTTPS on mobile devices. Using IP-based location instead.');
      return await detectCountryFromIP();
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        setError('Location request timed out. Using IP-based location instead.');
        resolve(null);
      }, 15000); // 15 second timeout for mobile

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          try {
            const { latitude, longitude } = position.coords;
            console.log('📍 GPS coordinates obtained:', { latitude, longitude });

            // Try to get city name from coordinates using multiple services
            let locationData = null;
            
            // Service 1: BigDataCloud
            try {
              const r = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              if (r.ok) {
                const d: any = await r.json();
                if (d.countryCode && TARGET_COUNTRIES[d.countryCode as CountryCode]) {
                  locationData = {
                    country: d.countryCode,
                    countryName: TARGET_COUNTRIES[d.countryCode as CountryCode].name,
                    city: d.city || d.locality,
                    state: d.principalSubdivision,
                    coordinates: { lat: latitude, lng: longitude }
                  };
                }
              }
            } catch (error) {
              console.warn('BigDataCloud reverse geocoding failed');
            }

            // Service 2: OpenStreetMap (fallback)
            if (!locationData) {
              try {
                const r = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`
                );
                if (r.ok) {
                  const d: any = await r.json();
                  if (d.address && d.address.country_code && TARGET_COUNTRIES[d.address.country_code.toUpperCase() as CountryCode]) {
                    locationData = {
                      country: d.address.country_code.toUpperCase() as CountryCode,
                      countryName: TARGET_COUNTRIES[d.address.country_code.toUpperCase() as CountryCode].name,
                      city: d.address.city || d.address.town || d.address.village,
                      state: d.address.state,
                      coordinates: { lat: latitude, lng: longitude }
                    };
                  }
                }
              } catch (error) {
                console.warn('OpenStreetMap reverse geocoding failed');
              }
            }

            resolve(locationData);
          } catch (error) {
            console.error('Error processing GPS coordinates:', error);
            resolve(null);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMessage = 'Location access denied';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please check your internet connection.';
              break;
          }
          
          setError(errorMessage);
          console.error('❌ GPS geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: enableHighAccuracy,
          timeout: 15000, // 15 seconds for mobile
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }, [enableHighAccuracy, detectCountryFromIP]);

  // Main location detection function
  const detectLocation = useCallback(async (): Promise<Partial<LocationData> | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Strategy: Try GPS first, then IP fallback
      console.log('📍 Starting location detection...');
      
      // Check if we can use GPS
      if (isMobile() && !isHTTPS()) {
        console.log('📍 Mobile without HTTPS - using IP-based detection');
        const ipLocation = await detectCountryFromIP();
        if (ipLocation) {
          setLocation(prev => ({ ...prev, ...ipLocation, isDetected: true }));
          return ipLocation;
        }
      } else {
        // Try GPS first
        console.log('📍 Attempting GPS geolocation...');
        const gpsLocation = await detectLocationFromGPS();
        if (gpsLocation) {
          setLocation(prev => ({ ...prev, ...gpsLocation, isDetected: true }));
          return gpsLocation;
        }
      }

      // Fallback to IP detection
      console.log('📍 Falling back to IP-based detection...');
      const ipLocation = await detectCountryFromIP();
      if (ipLocation) {
        setLocation(prev => ({ ...prev, ...ipLocation, isDetected: true }));
        return ipLocation;
      }

      // All methods failed
      throw new Error('All location detection methods failed');
    } catch (error: any) {
      const errorMessage = error.message || 'Location detection failed';
      setError(errorMessage);
      console.error('❌ Location detection failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [detectLocationFromGPS, detectCountryFromIP]);

  // Set country manually
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

  // Initialize on mount
  useEffect(() => {
    const mobile = isMobile();
    const secure = isHTTPS();
    
    setIsMobileDevice(mobile);
    setIsSecureConnection(secure);
    
    console.log(`📍 Device: ${mobile ? 'Mobile' : 'Desktop'}, HTTPS: ${secure ? 'Yes' : 'No'}`);
  }, []);

  // Auto-detect location if enabled
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
    isMobileDevice,
    isSecureConnection
  };
}
