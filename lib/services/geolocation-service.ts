export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  accuracy?: number;
  timestamp: string;
}

export interface LocationSearchResult {
  name: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  jobCount?: number;
}

export class GeolocationService {
  private static readonly CACHE_KEY = 'user_location';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get user's current location using browser geolocation API
   */
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Reverse geocoding to get address
            const address = await this.reverseGeocode(latitude, longitude);
            
            const locationData: LocationData = {
              latitude,
              longitude,
              city: address.city,
              state: address.state,
              country: address.country,
              countryCode: address.countryCode,
              accuracy,
              timestamp: new Date().toISOString()
            };

            // Cache the location
            this.cacheLocation(locationData);
            
            resolve(locationData);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get cached location if available
   */
  static getCachedLocation(): LocationData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const locationData: LocationData = JSON.parse(cached);
      const now = new Date().getTime();
      const cachedTime = new Date(locationData.timestamp).getTime();

      if (now - cachedTime > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return locationData;
    } catch (error) {
      console.warn('Failed to get cached location:', error);
      return null;
    }
  }

  /**
   * Search for locations with job counts
   */
  static async searchLocations(query: string, limit: number = 10): Promise<LocationSearchResult[]> {
    try {
      // This would typically call a geocoding API like Google Places or OpenCage
      // For now, we'll return mock data with popular locations
      const popularLocations: LocationSearchResult[] = [
        {
          name: 'Mumbai, Maharashtra, India',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          countryCode: 'IN',
          latitude: 19.0760,
          longitude: 72.8777,
          jobCount: 1250
        },
        {
          name: 'Bangalore, Karnataka, India',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          countryCode: 'IN',
          latitude: 12.9716,
          longitude: 77.5946,
          jobCount: 2100
        },
        {
          name: 'Delhi, NCR, India',
          city: 'Delhi',
          state: 'NCR',
          country: 'India',
          countryCode: 'IN',
          latitude: 28.7041,
          longitude: 77.1025,
          jobCount: 1800
        },
        {
          name: 'Hyderabad, Telangana, India',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          countryCode: 'IN',
          latitude: 17.3850,
          longitude: 78.4867,
          jobCount: 950
        },
        {
          name: 'Pune, Maharashtra, India',
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          countryCode: 'IN',
          latitude: 18.5204,
          longitude: 73.8567,
          jobCount: 800
        },
        {
          name: 'Chennai, Tamil Nadu, India',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          countryCode: 'IN',
          latitude: 13.0827,
          longitude: 80.2707,
          jobCount: 700
        }
      ];

      // Filter by query
      const filtered = popularLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.city.toLowerCase().includes(query.toLowerCase()) ||
        location.state?.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get jobs within radius of a location
   */
  static async getJobsInRadius(
    latitude: number,
    longitude: number,
    radiusKm: number,
    jobType?: string,
    experienceLevel?: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radiusKm.toString(),
        includeDistance: 'true',
        sortByDistance: 'true',
        ...(jobType && { jobType }),
        ...(experienceLevel && { experienceLevel })
      });

      const response = await fetch(`/api/jobs/unified?${params}&includeExternal=true`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      return data.success ? data.jobs : [];
    } catch (error) {
      console.error('Failed to get jobs in radius:', error);
      return [];
    }
  }

  /**
   * Get popular locations with job counts
   */
  static async getPopularLocations(): Promise<LocationSearchResult[]> {
    return this.searchLocations('', 20);
  }

  /**
   * Cache location data
   */
  private static cacheLocation(locationData: LocationData): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.warn('Failed to cache location:', error);
    }
  }

  /**
   * Reverse geocoding (mock implementation)
   */
  private static async reverseGeocode(_latitude: number, _longitude: number): Promise<{
    city: string;
    state?: string;
    country: string;
    countryCode: string;
  }> {
    // This would typically call a reverse geocoding API
    // For now, we'll return mock data based on coordinates
    const mockData = {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      countryCode: 'IN'
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockData;
  }

  /**
   * Convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if geolocation is supported
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get location permission status
   */
  static async getPermissionStatus(): Promise<PermissionState> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state;
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }
}
