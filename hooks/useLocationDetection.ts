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
  const { autoDetect = true, fallbackCountry = 'US', enableHighAccuracy = false } = options;

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
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return Promise.resolve(null);
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const { latitude, longitude } = pos.coords;
            const r = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (!r.ok) return resolve(null);
            const d: any = await r.json();
            if (d.countryCode && TARGET_COUNTRIES[d.countryCode as CountryCode]) {
              resolve({
                country: d.countryCode,
                countryName: d.countryName,
                city: d.city || d.locality,
                state: d.principalSubdivision,
                coordinates: { lat: latitude, lng: longitude }
              });
            } else resolve(null);
          } catch {
            resolve(null);
          }
        },
        () => {
          setHasPermission(false);
          resolve(null);
        },
        { enableHighAccuracy, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, [enableHighAccuracy]);

  const detectLocation = useCallback(
    async (useGPS = false) => {
      setIsLoading(true);
      try {
        let data: Partial<LocationData> | null = null;
        if (useGPS && hasPermission !== false) {
          const gps = await detectLocationFromGPS();
            if (gps) {
            setHasPermission(true);
            data = gps;
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
    [detectCountryFromIP, detectLocationFromGPS, fallbackCountry, hasPermission]
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

  useEffect(() => {
    if (autoDetect) detectLocation(false);
  }, [autoDetect, detectLocation]);

  return { location, isLoading, hasPermission, detectLocation, setCountry, targetCountries: TARGET_COUNTRIES };
}
