import { useState, useEffect, useCallback } from 'react';

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

  const detectLocationFromGPS = useCallback((): Promise<Partial<LocationData> | null> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return Promise.resolve(null);
    }

    // Check HTTPS requirement for mobile
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Geolocation requires HTTPS on mobile devices');
      return Promise.resolve(null);
    }

    return new Promise(resolve => {
      const options = {
        enableHighAccuracy,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const { latitude, longitude } = pos.coords;
            setHasPermission(true);
            setPermissionState('granted');
            
            // Use multiple reverse geocoding services for better reliability
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
                    countryName: d.countryName,
                    city: d.city || d.locality,
                    state: d.principalSubdivision,
                    coordinates: { lat: latitude, lng: longitude }
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
                      coordinates: { lat: latitude, lng: longitude }
                    };
                  }
                }
              } catch (error) {
                console.warn('OpenStreetMap reverse geocoding also failed');
              }
            }

            resolve(locationData);
          } catch (error) {
            console.error('Error processing GPS coordinates:', error);
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setHasPermission(false);
          
          // Set appropriate permission state based on error
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setPermissionState('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setPermissionState('denied');
              break;
            case error.TIMEOUT:
              setPermissionState('prompt');
              break;
            default:
              setPermissionState('denied');
          }
          
          resolve(null);
        },
        options
      );
    });
  }, [enableHighAccuracy]);

  const detectLocation = useCallback(
    async (useGPS = false) => {
      setIsLoading(true);
      try {
        let data: Partial<LocationData> | null = null;
        
        if (useGPS && hasPermission !== false) {
          // Check permission status first
          const permissionStatus = await checkPermissionStatus();
          
          if (permissionStatus === 'denied') {
            setHasPermission(false);
            setPermissionState('denied');
          } else if (permissionStatus === 'granted' || permissionStatus === 'prompt') {
            const gps = await detectLocationFromGPS();
            if (gps) {
              setHasPermission(true);
              data = gps;
            }
          }
        }
        
        if (!data) {
          data = await detectCountryFromIP();
        }
        
        if (data && data.country && TARGET_COUNTRIES[data.country as CountryCode]) {
          const cc = data.country as CountryCode;
          const meta = TARGET_COUNTRIES[cc];
          setLocation(prev => ({
            ...prev,
            country: cc,
            countryName: data.countryName || meta.name,
            city: data.city,
            state: data.state,
            coordinates: data.coordinates,
            currency: meta.currency,
            currencySymbol: meta.currencySymbol,
            isDetected: true,
            error: undefined
          }));
        } else {
          const meta = TARGET_COUNTRIES[fallbackCountry];
          setLocation(prev => ({
            ...prev,
            country: fallbackCountry,
            countryName: meta.name,
            currency: meta.currency,
            currencySymbol: meta.currencySymbol,
            isDetected: false,
            error: 'Could not detect location; using default.'
          }));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [detectCountryFromIP, detectLocationFromGPS, fallbackCountry, hasPermission, checkPermissionStatus]
  );

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
    if (autoDetect) {
      detectLocation(false);
      checkPermissionStatus();
    }
  }, [autoDetect, detectLocation, checkPermissionStatus]);

  return { 
    location, 
    isLoading, 
    hasPermission, 
    permissionState,
    detectLocation, 
    setCountry, 
    requestPermission,
    targetCountries: TARGET_COUNTRIES 
  };
}
