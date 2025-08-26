'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Navigation, Globe, Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { 
  getSmartLocation, 
  getGeolocationErrorMessage, 
  isMobileDevice, 
  getMobileGeolocationOptions 
} from '@/lib/mobile-geolocation';

interface LocationSearchProps {
  onLocationChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  onSortByDistance: (sort: boolean) => void;
  className?: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  displayName: string;
  jobCount: number;
  distance?: number;
}

export default function EnhancedLocationSearch({
  onLocationChange,
  onRadiusChange,
  onSortByDistance,
  className = ''
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState(25);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use existing location detection hook
  const { location: detectedLocation, isLoading: isDetectingLocation, permissionState, requestPermission } = useLocationDetection({
    autoDetect: true,
    fallbackCountry: 'IN'
  });

  // Popular locations with job counts
  const popularLocations = [
    { name: 'Mumbai', country: 'IN', jobCount: 1250, icon: '🏙️' },
    { name: 'Delhi', country: 'IN', jobCount: 980, icon: '🏛️' },
    { name: 'Bangalore', country: 'IN', jobCount: 2100, icon: '💻' },
    { name: 'Hyderabad', country: 'IN', jobCount: 850, icon: '🏢' },
    { name: 'Chennai', country: 'IN', jobCount: 720, icon: '🏭' },
    { name: 'Pune', country: 'IN', jobCount: 650, icon: '🚗' },
    { name: 'Kolkata', country: 'IN', jobCount: 580, icon: '🎭' },
    { name: 'Ahmedabad', country: 'IN', jobCount: 420, icon: '🏺' }
  ];

  // Detect user's current location with enhanced mobile support
  const detectCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use mobile-optimized geolocation
      const isMobile = isMobileDevice();
      const options = getMobileGeolocationOptions();
      
      if (isMobile) {
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
        
        if (isMobile) {
          console.log(`✅ Mobile geolocation successful: ${cityName} (${result.source})`);
        }
      } else {
        // Handle error with user-friendly message
        const errorMessage = getGeolocationErrorMessage(result.errorCode);
        alert(errorMessage);
        
        if (isMobile) {
          console.warn(`❌ Mobile geolocation failed: ${result.error}`);
        }
      }
      
    } catch (error) {
      console.error('Location detection failed:', error);
      alert('An unexpected error occurred while detecting location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange]);

  // Search for location suggestions
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.locations);
        }
      }
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocations(searchQuery);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchLocations]);

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location.displayName);
    setSearchQuery(location.displayName);
    setShowSuggestions(false);
    onLocationChange(location.displayName);
  };

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };

  // Handle sort by distance toggle
  const handleSortByDistance = (checked: boolean) => {
    setSortByDistance(checked);
    onSortByDistance(checked);
  };

  // Use detected location when available
  useEffect(() => {
    if (detectedLocation && detectedLocation.city && !selectedLocation) {
      setSelectedLocation(detectedLocation.city);
      onLocationChange(detectedLocation.city);
    }
  }, [detectedLocation, selectedLocation, onLocationChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for a city, state, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
              onFocus={() => setShowSuggestions(true)}
            />
            
            {/* Current Location Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={detectCurrentLocation}
              disabled={isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Navigation className="h-4 w-4 mr-1" />
              {isLoading ? 'Detecting...' : 'My Location'}
            </Button>
          </div>

          {/* Mobile-Specific Information */}
          {isMobileDevice() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="text-sm">
                  <strong>📱 Mobile Device Detected</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>GPS location will be used if available</li>
                    <li>IP-based fallback if GPS fails</li>
                    <li>HTTPS required for GPS on mobile</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* HTTPS Warning for Non-HTTPS */}
          {typeof window !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <div className="text-sm">
                  <strong>⚠️ HTTPS Required</strong> Geolocation requires HTTPS on mobile devices. Use HTTPS or localhost for full functionality.
                </div>
              </div>
            </div>
          )}

          {/* Location Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-gray-500">{suggestion.country}</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{suggestion.jobCount} jobs</Badge>
                </button>
              ))}
            </div>
          )}

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{selectedLocation}</span>
              {userCoordinates && (
                <Badge variant="outline" className="ml-auto">
                  📍 {userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Radius & Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Search Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Radius Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Search Radius</label>
              <Badge variant="outline">{radius} km</Badge>
            </div>
            <Slider
              value={[radius]}
              onValueChange={handleRadiusChange}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 km</span>
              <span>25 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Sort by Distance</span>
            </div>
            <Switch
              checked={sortByDistance}
              onCheckedChange={handleSortByDistance}
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Popular Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularLocations.map((location) => (
              <button
                key={`${location.name}-${location.country}`}
                onClick={() => {
                  setSelectedLocation(location.name);
                  onLocationChange(location.name);
                }}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                  selectedLocation === location.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{location.icon}</div>
                <div className="font-medium text-sm">{location.name}</div>
                <div className="text-xs text-gray-500">{location.jobCount} jobs</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Insights */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Location Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {popularLocations.find(l => l.name === selectedLocation)?.jobCount || 'N/A'}
                </div>
                <div className="text-sm text-orange-600">Active Jobs</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {radius}km
                </div>
                <div className="text-sm text-green-600">Search Radius</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {sortByDistance ? 'Distance' : 'Date'}
                </div>
                <div className="text-sm text-blue-600">Sort By</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
