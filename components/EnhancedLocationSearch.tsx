'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getSmartLocation, 
  getMobileGeolocationOptions,
  isMobileDevice 
} from '@/lib/mobile-geolocation';

interface LocationSearchProps {
  onLocationChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onRadiusChange?: (radius: number) => void;
  onSortByDistance?: (enabled: boolean) => void;
  className?: string;
}

export default function EnhancedLocationSearch({
  onLocationChange,
  onRadiusChange,
  onSortByDistance,
  className = ''
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Popular locations with job counts
  const popularLocations = [
    { name: 'Mumbai', country: 'IN', jobCount: 1250, icon: '🏙️' },
    { name: 'Bangalore', country: 'IN', jobCount: 980, icon: '💻' },
    { name: 'Delhi', country: 'IN', jobCount: 890, icon: '🏛️' },
    { name: 'Hyderabad', country: 'IN', jobCount: 650, icon: '🏢' },
    { name: 'Chennai', country: 'IN', jobCount: 520, icon: '🌊' },
    { name: 'Pune', country: 'IN', jobCount: 480, icon: '🏔️' },
    { name: 'Kolkata', country: 'IN', jobCount: 420, icon: '🎭' },
    { name: 'Ahmedabad', country: 'IN', jobCount: 420, icon: '🏺' }
  ];

  // Detect user's current location with enhanced mobile support
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use mobile-optimized geolocation
      const mobile = isMobileDevice();
      const options = getMobileGeolocationOptions();
      
      if (mobile) {
        console.log('🔄 Using mobile-optimized geolocation...');
      }
      
      const result = await getSmartLocation(options);
      
      if (result.success) {
        if (result.coordinates) {
          setUserCoordinates(result.coordinates);
        }
        
        const cityName = result.city || 'Current Location';
        setSelectedLocation(cityName);
        onLocationChange(cityName, result.coordinates);
        
        if (mobile) {
          console.log(`✅ Mobile geolocation successful: ${cityName} (${result.source})`);
        }
      } else {
        // Handle error with user-friendly message
        const errorMessage = result.error || 'Failed to detect location';
        setError(errorMessage);
        
        if (mobile) {
          console.warn(`❌ Mobile geolocation failed: ${errorMessage}`);
        }
      }
      
    } catch (error) {
      console.error('Location detection failed:', error);
      setError('An unexpected error occurred while detecting location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange]);

  // Search for location suggestions
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    
    // Simple client-side search for now
    const filtered = popularLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered;
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: string, coordinates?: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setSearchQuery(location);
    onLocationChange(location, coordinates);
  }, [onLocationChange]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSelectedLocation('');
    }
  }, []);

  // Handle search submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleLocationSelect(searchQuery.trim());
    }
  }, [searchQuery, handleLocationSelect]);

  // Initialize mobile detection
  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Location Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
          {isMobile && (
            <Badge variant="secondary" className="text-xs">
              📱 Mobile
            </Badge>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter city, state, or country..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-20"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Current Location Button */}
        <Button
          onClick={detectCurrentLocation}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use my current location
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
                         {isMobile && (
               <p className="text-xs text-red-600 mt-1">
                 💡 Mobile tip: Make sure location access is enabled in your browser settings
               </p>
             )}
          </div>
        )}

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Selected: {selectedLocation}
                </span>
              </div>
              {userCoordinates && (
                <Badge variant="outline" className="text-xs">
                  GPS: {userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popular Locations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Popular Locations</h4>
        <div className="grid grid-cols-2 gap-2">
          {popularLocations.filter(location => (location.jobCount || 0) > 0).map((location) => (
            <Button
              key={location.name}
              variant="outline"
              size="sm"
              onClick={() => handleLocationSelect(location.name)}
              className="justify-start h-auto p-3"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{location.icon}</span>
                  <span className="font-medium">{location.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {location.jobCount} jobs available
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

             {/* Mobile-Specific Tips */}
       {isMobile && (
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
           <div className="flex items-start">
             <div className="text-blue-600 mr-2 mt-0.5">💡</div>
             <div className="text-sm text-blue-800">
               <p className="font-medium mb-1">Mobile Location Tips:</p>
               <ul className="text-xs space-y-1">
                 <li>• Allow location access when prompted</li>
                 <li>• Ensure GPS is enabled on your device</li>
                 <li>• Use "Current Location" for best results</li>
                 <li>• Manual search works if GPS fails</li>
               </ul>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
