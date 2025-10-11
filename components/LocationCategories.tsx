'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  ChevronDown, 
  ChevronRight,
  Globe,
  Building2,
  Map,
  Loader2,
  Sparkles
} from 'lucide-react';

interface LocationData {
  id: string;
  name: string;
  country: string;
  flag: string;
  jobCount: number;
  area?: string;
  state?: string;
  type: 'area' | 'state' | 'country' | 'city';
}

interface LocationCategoriesProps {
  onLocationSelect: (location: LocationData) => void;
  selectedLocation?: LocationData | null;
  className?: string;
}

interface LocationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  locations: LocationData[];
  isExpanded: boolean;
}

export default function LocationCategories({ 
  onLocationSelect, 
  selectedLocation, 
  className = '' 
}: LocationCategoriesProps) {
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // AI-powered dynamic location data with real job counts
  const generateDynamicLocations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real job counts for specific locations
      const fetchLocationJobCount = async (location: string, country: string) => {
        try {
          const response = await fetch(`/api/jobs?location=${encodeURIComponent(location)}&limit=1&includeExternal=true&includeDatabase=true`);
          const data = await response.json();
          return data.pagination?.total || data.total || 0;
        } catch (error) {
          console.warn(`Failed to fetch job count for ${location}:`, error);
          return 0;
        }
      };

      // Fetch real job counts for each location
      const fetchRealJobCounts = async () => {
        const locations = [
          { name: 'Bay Area', country: 'USA' },
          { name: 'London', country: 'UK' },
          { name: 'Toronto', country: 'Canada' },
          { name: 'Sydney', country: 'Australia' },
          { name: 'Dubai', country: 'UAE' },
          { name: 'California', country: 'USA' },
          { name: 'New York', country: 'USA' },
          { name: 'Texas', country: 'USA' },
          { name: 'Florida', country: 'USA' },
          { name: 'Washington', country: 'USA' },
          { name: 'Massachusetts', country: 'USA' },
          { name: 'United States', country: 'USA' },
          { name: 'India', country: 'India' },
          { name: 'United Kingdom', country: 'UK' },
          { name: 'Canada', country: 'Canada' },
          { name: 'Australia', country: 'Australia' },
          { name: 'Germany', country: 'Germany' },
          { name: 'Singapore', country: 'Singapore' }
        ];

        const jobCounts: Record<string, number> = {};
        
        // Fetch counts for all locations in parallel
        await Promise.all(
          locations.map(async (loc) => {
            const count = await fetchLocationJobCount(loc.name, loc.country);
            jobCounts[`${loc.name}-${loc.country}`] = count;
          })
        );

        return jobCounts;
      };

      // Get real job counts for all locations
      const locationJobCounts = await fetchRealJobCounts();

      const areas: LocationData[] = [
        { id: 'bay-area', name: 'Bay Area', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Bay Area-USA'] || 0, type: 'area' },
        { id: 'greater-london', name: 'Greater London', country: 'UK', flag: '🇬🇧', jobCount: locationJobCounts['London-UK'] || 0, type: 'area' },
        { id: 'greater-toronto', name: 'Greater Toronto', country: 'Canada', flag: '🇨🇦', jobCount: locationJobCounts['Toronto-Canada'] || 0, type: 'area' },
        { id: 'silicon-valley', name: 'Silicon Valley', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Bay Area-USA'] || 0, type: 'area' },
        { id: 'greater-sydney', name: 'Greater Sydney', country: 'Australia', flag: '🇦🇺', jobCount: locationJobCounts['Sydney-Australia'] || 0, type: 'area' },
        { id: 'greater-dubai', name: 'Greater Dubai', country: 'UAE', flag: '🇦🇪', jobCount: locationJobCounts['Dubai-UAE'] || 0, type: 'area' }
      ];

      const states: LocationData[] = [
        { id: 'california', name: 'California', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['California-USA'] || 0, type: 'state' },
        { id: 'new-york-state', name: 'New York', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['New York-USA'] || 0, type: 'state' },
        { id: 'texas', name: 'Texas', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Texas-USA'] || 0, type: 'state' },
        { id: 'florida', name: 'Florida', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Florida-USA'] || 0, type: 'state' },
        { id: 'washington', name: 'Washington', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Washington-USA'] || 0, type: 'state' },
        { id: 'massachusetts', name: 'Massachusetts', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['Massachusetts-USA'] || 0, type: 'state' }
      ];

      const countries: LocationData[] = [
        { id: 'usa', name: 'United States', country: 'USA', flag: '🇺🇸', jobCount: locationJobCounts['United States-USA'] || 0, type: 'country' },
        { id: 'india', name: 'India', country: 'India', flag: '🇮🇳', jobCount: locationJobCounts['India-India'] || 0, type: 'country' },
        { id: 'uk', name: 'United Kingdom', country: 'UK', flag: '🇬🇧', jobCount: locationJobCounts['United Kingdom-UK'] || 0, type: 'country' },
        { id: 'canada', name: 'Canada', country: 'Canada', flag: '🇨🇦', jobCount: locationJobCounts['Canada-Canada'] || 0, type: 'country' },
        { id: 'australia', name: 'Australia', country: 'Australia', flag: '🇦🇺', jobCount: locationJobCounts['Australia-Australia'] || 0, type: 'country' },
        { id: 'germany', name: 'Germany', country: 'Germany', flag: '🇩🇪', jobCount: locationJobCounts['Germany-Germany'] || 0, type: 'country' },
        { id: 'singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', jobCount: locationJobCounts['Singapore-Singapore'] || 0, type: 'country' },
        { id: 'uae', name: 'United Arab Emirates', country: 'UAE', flag: '🇦🇪', jobCount: locationJobCounts['Dubai-UAE'] || 0, type: 'country' }
      ];

      // Sort by job count (AI-powered relevance)
      areas.sort((a, b) => b.jobCount - a.jobCount);
      states.sort((a, b) => b.jobCount - a.jobCount);
      countries.sort((a, b) => b.jobCount - a.jobCount);

      const newCategories: LocationCategory[] = [
        {
          id: 'areas',
          name: 'Metropolitan Areas',
          icon: <Map className="w-4 h-4" />,
          locations: areas,
          isExpanded: false
        },
        {
          id: 'states',
          name: 'States & Provinces',
          icon: <Building2 className="w-4 h-4" />,
          locations: states,
          isExpanded: false
        },
        {
          id: 'countries',
          name: 'Countries',
          icon: <Globe className="w-4 h-4" />,
          locations: countries,
          isExpanded: false
        }
      ];

      setCategories(newCategories);
      
      // Auto-expand first category on mobile for better UX
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setExpandedCategory('areas');
      }
      
    } catch (error) {
      console.error('Error generating dynamic locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleLocationClick = useCallback((location: LocationData) => {
    onLocationSelect(location);
    // Auto-trigger search when location is selected
    setTimeout(() => {
      const searchButton = document.querySelector('[data-testid="search-button"]') as HTMLButtonElement;
      if (searchButton) {
        searchButton.click();
      }
    }, 100);
  }, [onLocationSelect]);

  // Initialize locations
  useEffect(() => {
    generateDynamicLocations();
  }, [generateDynamicLocations]);

  if (loading) {
    return (
      <div className={`mt-3 sm:mt-4 ${className}`}>
        <div className="text-center mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            AI-Powered Locations
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
          </span>
        </div>
        <div className="flex justify-center">
          <div className="animate-pulse bg-gradient-to-r from-gray-800 to-blue-800 rounded-xl h-8 w-full max-w-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 sm:mt-4 ${className}`}>
      {/* Compact Header */}
      <div className="text-center mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          AI-Powered Locations
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 text-xs font-bold px-2 py-0.5">
            Smart
          </Badge>
        </span>
      </div>

      {/* Compact Categories */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-xl border-2 border-blue-500/20 shadow-lg">
            {/* Category Header */}
            <Button
              variant="ghost"
              onClick={() => toggleCategory(category.id)}
              className="w-full justify-between p-2 sm:p-3 h-auto hover:bg-blue-800/20 transition-all duration-200 text-white"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg">
                  {category.icon}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-xs sm:text-sm">
                    {category.name}
                  </div>
                  <div className="text-xs text-blue-200">
                    {category.locations.length} locations • {(category.locations.reduce((sum, loc) => sum + (loc.jobCount || 0), 0)).toLocaleString()} jobs
                  </div>
                </div>
              </div>
              {expandedCategory === category.id ? (
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 transition-transform" />
              ) : (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 transition-transform" />
              )}
            </Button>

            {/* Category Locations - Compact Grid */}
            {expandedCategory === category.id && (
              <div className="px-2 sm:px-3 pb-2 sm:pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                  {category.locations.map((location) => (
                    <Button
                      key={location.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLocationClick(location)}
                      className={`justify-start h-auto p-1.5 sm:p-2 text-left transition-all duration-200 ${
                        selectedLocation?.id === location.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 text-white shadow-md' 
                          : 'bg-white/90 border-white/30 text-gray-800 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 w-full">
                        <span className="text-sm sm:text-base">{location.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">
                            {location.name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="secondary" className={`text-xs border-0 px-1 py-0 ${
                              selectedLocation?.id === location.id
                                ? 'bg-white/20 text-white'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {(location.jobCount || 0).toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compact AI Info */}
      <div className="mt-2 p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-400/30">
        <div className="text-center">
          <div className="text-xs text-blue-200 font-medium">
            AI analyzes job market data for optimal results
          </div>
        </div>
      </div>
    </div>
  );
}
