/**
 * Location Service - User Location Detection
 * Implements IP geolocation (backend) + browser geolocation (frontend fallback)
 */

import { UserLocationData } from '@/types/job-search-params';

export class LocationService {
  
  /**
   * Backend: Get user location from IP address using request headers
   * Uses ipstack.com API (free tier: 1000 requests/month)
   */
  static async getLocationFromIP(request: Request): Promise<UserLocationData | null> {
    try {
      // Extract IP from request headers (handle various proxy scenarios)
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const connectingIP = request.headers.get('x-connecting-ip');
      
      let clientIP = forwardedFor?.split(',')[0].trim() || 
                     realIP || 
                     connectingIP || 
                     '8.8.8.8'; // fallback for development
      
      // Skip local/private IPs in development
      if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
        clientIP = '8.8.8.8'; // Use Google DNS for testing
      }

      const ipstackApiKey = process.env.IPSTACK_API_KEY;
      if (!ipstackApiKey) {
        console.warn('IPSTACK_API_KEY not configured, skipping IP geolocation');
        return null;
      }

      const response = await fetch(
        `http://api.ipstack.com/${clientIP}?access_key=${ipstackApiKey}&format=1`
      );

      if (!response.ok) {
        throw new Error(`IPStack API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.city && !data.region_name && !data.country_name) {
        return null; // No useful location data
      }

      return {
        city: data.city || '',
        region: data.region_name || '',
        country: data.country_name || '',
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        source: 'ip',
        accuracy: data.latitude && data.longitude ? 50000 : undefined, // ~50km accuracy for IP
      };

    } catch (error) {
      console.error('IP geolocation failed:', error);
      return null;
    }
  }

  /**
   * Alternative: MaxMind GeoIP2 (more accurate, requires database file)
   * Uncomment and configure if you prefer this approach
   */
  // static async getLocationFromMaxMind(ip: string): Promise<UserLocationData | null> {
  //   try {
  //     const Reader = require('@maxmind/geoip2-node').Reader;
  //     const reader = await Reader.open('./GeoLite2-City.mmdb');
  //     const response = reader.city(ip);
      
  //     return {
  //       city: response.city?.names?.en || '',
  //       region: response.subdivisions?.[0]?.names?.en || '',
  //       country: response.country?.names?.en || '',
  //       latitude: response.location?.latitude,
  //       longitude: response.location?.longitude,
  //       source: 'ip',
  //       accuracy: response.location?.accuracyRadius,
  //     };
  //   } catch (error) {
  //     console.error('MaxMind geolocation failed:', error);
  //     return null;
  //   }
  // }

  /**
   * Frontend: Browser geolocation API (more accurate than IP)
   * Returns coordinates that can be reverse geocoded
   */
  static getBrowserLocation(): Promise<UserLocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'browser',
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error('Browser geolocation failed:', error);
          resolve(null);
        },
        {
          timeout: 10000,        // 10 second timeout
          maximumAge: 600000,    // Accept 10-minute old location
          enableHighAccuracy: false, // Faster, less battery drain
        }
      );
    });
  }

  /**
   * Reverse geocoding: Convert lat/lng to city/country
   * Uses Google Maps Geocoding API or OpenCage Geocoder
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<Partial<UserLocationData> | null> {
    try {
      // Option 1: Google Maps (requires API key, very accurate)
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results?.[0]) {
            const components = data.results[0].address_components;
            
            const city = components.find((c: any) => c.types.includes('locality'))?.long_name ||
                        components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
            
            const region = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
            const country = components.find((c: any) => c.types.includes('country'))?.long_name;
            
            return { city, region, country };
          }
        }
      }

      // Option 2: OpenCage Geocoder (free tier: 2500 requests/day)
      const opencageApiKey = process.env.OPENCAGE_API_KEY;
      if (opencageApiKey) {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencageApiKey}&no_annotations=1&language=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results?.[0]) {
            const components = data.results[0].components;
            return {
              city: components.city || components.town || components.village || '',
              region: components.state || components.province || '',
              country: components.country || '',
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Determine if user is in a target country
   */
  static isInTargetCountry(userCountry: string, targetCountries: string[]): boolean {
    return targetCountries.some(country => 
      userCountry.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(userCountry.toLowerCase())
    );
  }

  /**
   * Get complete user location (combines IP + browser + reverse geocoding)
   */
  static async getCompleteUserLocation(request?: Request): Promise<UserLocationData | null> {
    let locationData: UserLocationData | null = null;

    // Backend: Try IP geolocation first
    if (request) {
      locationData = await this.getLocationFromIP(request);
    }

    // If IP geolocation failed or incomplete, this should be called from frontend
    // with browser location + reverse geocoding
    return locationData;
  }
}

/**
 * Frontend utility for browser location detection
 * Returns complete location data including reverse geocoding
 */
export async function detectUserLocationFromBrowser(): Promise<UserLocationData | null> {
  try {
    // Step 1: Get browser location
    const browserLocation = await LocationService.getBrowserLocation();
    
    if (browserLocation?.latitude && browserLocation?.longitude) {
      // Step 2: Reverse geocode to get city/country
      const geocodedData = await LocationService.reverseGeocode(
        browserLocation.latitude, 
        browserLocation.longitude
      );
      
      if (geocodedData) {
        return {
          ...browserLocation,
          ...geocodedData,
        };
      } else {
        return browserLocation;
      }
    } else {
      return null;
    }
  } catch (err) {
    console.error('Browser location detection failed:', err);
    return null;
  }
}
