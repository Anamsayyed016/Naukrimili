import { useState, useEffect, useCallback } from 'react';

// Target countries configuration
export const TARGET_COUNTRIES = {
  'US': {
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    cities: ['New York', 'San Francisco'],
  },
  'GB': {
    name: 'United Kingdom', 
    currency: 'GBP',
    currencySymbol: '£',
    cities: ['New York', 'San Francisco'],
  },
  'IN': {
    name: 'India',
    currency: 'INR', 
    currencySymbol: '₹',
    cities: ['New York', 'San Francisco'],
  },
  'AE': {
    name: 'UAE (Dubai)',
    currency: 'AED',
    currencySymbol: 'AED',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain']
  }
} as const;

export type CountryCode = keyof typeof TARGET_COUNTRIES;

export interface LocationData {
  country: CountryCode;
  countryName: string;
  city?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number};
  currency: string;
  currencySymbol: string;
  isDetected: boolean;
  error?: string}

interface UseLocationDetectionOptions {
  autoDetect?: boolean;
  fallbackCountry?: CountryCode;
  enableHighAccuracy?: boolean}

export function useLocationDetection(options: UseLocationDetectionOptions = {
  }) {
  const {
    autoDetect = true,
    fallbackCountry = 'US',
    enableHighAccuracy = false
  } = options;

  const [location, setLocation] = useState<LocationData>({
    country: fallbackCountry,
    countryName: TARGET_COUNTRIES[fallbackCountry].name,
    currency: TARGET_COUNTRIES[fallbackCountry].currency,
    currencySymbol: TARGET_COUNTRIES[fallbackCountry].currencySymbol,
    isDetected: false
  });
  
  const [isLoading, setIsLoading] = useState(autoDetect);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Detect country from IP using multiple services
  const detectCountryFromIP = useCallback(async (): Promise<Partial<LocationData> | null> => {
    const services = [
      // Primary service
      async () => {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
          country: data.country_code,
          countryName: data.country_name,
          city: data.city,
          state: data.region};
  },
      // Fallback service 1
      async () => {
        const response = await fetch('https://ip-api.com/json/');
        const data = await response.json();
        return {
          country: data.countryCode,
          countryName: data.country,
          city: data.city,
          state: data.regionName};
  },
      // Fallback service 2
      async () => {
        const response = await fetch('https://freegeoip.app/json/');
        const data = await response.json();
        return {
          country: data.country_code,
          countryName: data.country_name,
          city: data.city,
          state: data.region_name};
  }];

    for (const service of services) {
      try {
        const result = await service();
        if (result.country && TARGET_COUNTRIES[result.country as CountryCode]) {
          return result}
      } catch (error) {
    console.error("Error:", error);
    throw error}
        // console.warn('Location service failed, trying next...', error);
        continue;
    }
    }
    
    return null;
;
  }, []);

  // Detect location using GPS
  const detectLocationFromGPS = useCallback((): Promise<Partial<LocationData> | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {;
        resolve(null);
        return}

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocoding to get country info
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const countryCode = data.countryCode;
            if (TARGET_COUNTRIES[countryCode as CountryCode]) {
              resolve({
                country: countryCode,
                countryName: data.countryName,
                city: data.city,
                state: data.principalSubdivision,
                coordinates: { lat: latitude, lng: longitude }
  })} else {
              resolve(null)}
          } catch (error) {
    console.error("Error:", error);
    throw error}
            // console.warn('GPS location detection failed:', error);
            resolve(null)};
  },
        (error) => {
          // console.warn('GPS permission denied or failed:', error);
          setHasPermission(false);
          resolve(null);
  },
        {
          enableHighAccuracy,
          timeout: 10000,
          maximumAge: 300000 })});
  }, [enableHighAccuracy]);

  // Main detection function
  const detectLocation = useCallback(async (useGPS: boolean = false) => {
    setIsLoading(true);
    
    try {
      let locationData: Partial<LocationData> | null = null;

      // Try GPS first if requested and permission available
      if (useGPS && hasPermission !== false) {
        setHasPermission(null); // Reset permission state
        locationData = await detectLocationFromGPS();
        if (locationData) {
          setHasPermission(true)}
      }

      // Fallback to IP detection
      if (!locationData) {
        locationData = await detectCountryFromIP()}

      if (locationData && locationData.country && TARGET_COUNTRIES[locationData.country as CountryCode]) {
        const countryCode = locationData.country as CountryCode;
        const countryInfo = TARGET_COUNTRIES[countryCode];
        
        setLocation({
          country: countryCode,
          countryName: locationData.countryName || countryInfo.name,
          city: locationData.city,
          state: locationData.state,
          coordinates: locationData.coordinates,
          currency: countryInfo.currency,
          currencySymbol: countryInfo.currencySymbol,
          isDetected: true
  })} else {
        // Use fallback country
        const countryInfo = TARGET_COUNTRIES[fallbackCountry];
        setLocation(prev => ({
          ...prev,
          error: 'Could not detect your location. Using default country.'
  }))}
    } catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('Location detection failed:', error);
      setLocation(prev => ({
        ...prev,
        error: 'Location detection failed. Using default country.'
  }))} finally {
      setIsLoading(false)};
  }, [hasPermission, detectLocationFromGPS, detectCountryFromIP, fallbackCountry]);

  // Manual country selection
  const setCountry = useCallback((countryCode: CountryCode) => {
    const countryInfo = TARGET_COUNTRIES[countryCode];
    setLocation(prev => ({
      ...prev,
      country: countryCode,
      countryName: countryInfo.name,
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      city: undefined,
      state: undefined,
      coordinates: undefined,
      isDetected: false,
      error: undefined
  }));
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    if (autoDetect) {
      detectLocation(false); // Start with IP detection
    };
  }, [autoDetect, detectLocation]);

  return {
    location,
    isLoading,
    hasPermission,
    detectLocation,
    setCountry,
    targetCountries: TARGET_COUNTRIES};
}

