'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Building, 
  Briefcase, 
  DollarSign,
  Clock,
  TrendingUp,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

interface FilterState {
  query?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: string;
  salaryMax?: string;
  isRemote?: boolean;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'job' | 'location' | 'company' | 'skill';
  count?: number;
  category?: string;
}

interface SmartFilterSuggestionsProps {
  currentFilters: FilterState;
  onSuggestionSelect: (suggestion: Suggestion) => void;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
}

export default function SmartFilterSuggestions({
  currentFilters,
  onSuggestionSelect,
  onFiltersChange,
  className = ''
}: SmartFilterSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trendingJobs, setTrendingJobs] = useState<Suggestion[]>([]);
  const [popularLocations, setPopularLocations] = useState<Suggestion[]>([]);
  const [topCompanies, setTopCompanies] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'locations' | 'companies'>('trending');

  // Fetch dynamic suggestions based on current filters
  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on current filters
      const params = new URLSearchParams();
      if (currentFilters?.query) params.set('q', currentFilters.query);
      if (currentFilters?.location) params.set('location', currentFilters.location);
      if (currentFilters?.jobType && currentFilters.jobType !== 'all') params.set('jobType', currentFilters.jobType);
      if (currentFilters?.experienceLevel && currentFilters.experienceLevel !== 'all') params.set('experienceLevel', currentFilters.experienceLevel);
      if (currentFilters?.isRemote) params.set('isRemote', 'true');
      
      params.set('limit', '50');
      params.set('includeExternal', 'true');
      params.set('includeDatabase', 'true');

      // Fetch trending job suggestions with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const trendingResponse = await fetch(`/api/jobs/unlimited?${params.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!trendingResponse.ok) {
        throw new Error(`API request failed: ${trendingResponse.status}`);
      }
      
      const trendingData = await trendingResponse.json();
      
      if (trendingData.success && trendingData.jobs && Array.isArray(trendingData.jobs)) {
        // Extract unique job titles and count occurrences
        const jobCounts: { [key: string]: number } = {};
        trendingData.jobs.forEach((job: any) => {
          if (job.title) {
            const title = job.title.toLowerCase().trim();
            jobCounts[title] = (jobCounts[title] || 0) + 1;
          }
        });

        const trendingSuggestions: Suggestion[] = Object.entries(jobCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([title, count], index) => ({
            id: `trending-${index}`,
            text: title.charAt(0).toUpperCase() + title.slice(1),
            type: 'job' as const,
            count: count as number,
            category: 'Trending Jobs'
          }));

        setTrendingJobs(trendingSuggestions);
      } else {
        // Fallback: Use static trending jobs if API fails
        const fallbackSuggestions: Suggestion[] = [
          { id: 'trending-1', text: 'Software Engineer', type: 'job', count: 45, category: 'Trending Jobs' },
          { id: 'trending-2', text: 'Data Analyst', type: 'job', count: 32, category: 'Trending Jobs' },
          { id: 'trending-3', text: 'Product Manager', type: 'job', count: 28, category: 'Trending Jobs' },
          { id: 'trending-4', text: 'Frontend Developer', type: 'job', count: 25, category: 'Trending Jobs' },
          { id: 'trending-5', text: 'DevOps Engineer', type: 'job', count: 22, category: 'Trending Jobs' },
          { id: 'trending-6', text: 'UI/UX Designer', type: 'job', count: 18, category: 'Trending Jobs' },
          { id: 'trending-7', text: 'Backend Developer', type: 'job', count: 35, category: 'Trending Jobs' },
          { id: 'trending-8', text: 'Full Stack Developer', type: 'job', count: 30, category: 'Trending Jobs' }
        ];
        setTrendingJobs(fallbackSuggestions);
      }

      // Fetch location suggestions with fallback
      try {
        const locationController = new AbortController();
        const locationTimeoutId = setTimeout(() => locationController.abort(), 5000);
        
        const locationResponse = await fetch('/api/locations', {
          signal: locationController.signal
        });
        clearTimeout(locationTimeoutId);
        
        if (!locationResponse.ok) {
          throw new Error(`Location API failed: ${locationResponse.status}`);
        }
        
        const locationData = await locationResponse.json();
        
        if (locationData.success && locationData.locations) {
          const locationSuggestions: Suggestion[] = locationData.locations
            .slice(0, 8)
            .map((loc: any, index: number) => ({
              id: `location-${index}`,
              text: loc.name,
              type: 'location' as const,
              count: loc.jobCount || 0,
              category: 'Popular Locations'
            }));
          
          setPopularLocations(locationSuggestions);
        } else {
          // Fallback locations
          const fallbackLocations: Suggestion[] = [
            { id: 'location-1', text: 'Bangalore', type: 'location', count: 45, category: 'Popular Locations' },
            { id: 'location-2', text: 'Mumbai', type: 'location', count: 38, category: 'Popular Locations' },
            { id: 'location-3', text: 'Delhi', type: 'location', count: 42, category: 'Popular Locations' },
            { id: 'location-4', text: 'Hyderabad', type: 'location', count: 28, category: 'Popular Locations' },
            { id: 'location-5', text: 'Chennai', type: 'location', count: 25, category: 'Popular Locations' },
            { id: 'location-6', text: 'Pune', type: 'location', count: 22, category: 'Popular Locations' },
            { id: 'location-7', text: 'Kolkata', type: 'location', count: 18, category: 'Popular Locations' },
            { id: 'location-8', text: 'Dubai', type: 'location', count: 15, category: 'Popular Locations' }
          ];
          setPopularLocations(fallbackLocations);
        }
      } catch (error) {
        console.warn('Location API failed, using fallback:', error);
      }

      // Fetch company suggestions with fallback
      try {
        const companyController = new AbortController();
        const companyTimeoutId = setTimeout(() => companyController.abort(), 5000);
        
        const companyResponse = await fetch('/api/companies/public?limit=8', {
          signal: companyController.signal
        });
        clearTimeout(companyTimeoutId);
        
        if (!companyResponse.ok) {
          throw new Error(`Company API failed: ${companyResponse.status}`);
        }
        
        const companyData = await companyResponse.json();
        
        if (companyData.success && companyData.companies) {
          const companySuggestions: Suggestion[] = companyData.companies
            .map((company: any, index: number) => ({
              id: `company-${index}`,
              text: company.name,
              type: 'company' as const,
              count: company.jobCount || 0,
              category: 'Top Companies'
            }));
          
          setTopCompanies(companySuggestions);
        } else {
          // Fallback companies
          const fallbackCompanies: Suggestion[] = [
            { id: 'company-1', text: 'Boeing', type: 'company', count: 25, category: 'Top Companies' },
            { id: 'company-2', text: 'Ensono', type: 'company', count: 18, category: 'Top Companies' },
            { id: 'company-3', text: 'HRT Technology', type: 'company', count: 15, category: 'Top Companies' },
            { id: 'company-4', text: 'Jobot', type: 'company', count: 12, category: 'Top Companies' },
            { id: 'company-5', text: 'TechCorp', type: 'company', count: 20, category: 'Top Companies' },
            { id: 'company-6', text: 'InnovateLabs', type: 'company', count: 16, category: 'Top Companies' },
            { id: 'company-7', text: 'Digital Solutions', type: 'company', count: 14, category: 'Top Companies' },
            { id: 'company-8', text: 'CloudTech', type: 'company', count: 10, category: 'Top Companies' }
          ];
          setTopCompanies(fallbackCompanies);
        }
      } catch (error) {
        console.warn('Company API failed, using fallback:', error);
      }

    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Set fallback data on complete failure
      const fallbackSuggestions: Suggestion[] = [
        { id: 'trending-1', text: 'Software Engineer', type: 'job', count: 45, category: 'Trending Jobs' },
        { id: 'trending-2', text: 'Data Analyst', type: 'job', count: 32, category: 'Trending Jobs' },
        { id: 'trending-3', text: 'Product Manager', type: 'job', count: 28, category: 'Trending Jobs' },
        { id: 'trending-4', text: 'Frontend Developer', type: 'job', count: 25, category: 'Trending Jobs' }
      ];
      setTrendingJobs(fallbackSuggestions);
      
      const fallbackLocations: Suggestion[] = [
        { id: 'location-1', text: 'Bangalore', type: 'location', count: 45, category: 'Popular Locations' },
        { id: 'location-2', text: 'Mumbai', type: 'location', count: 38, category: 'Popular Locations' },
        { id: 'location-3', text: 'Delhi', type: 'location', count: 42, category: 'Popular Locations' },
        { id: 'location-4', text: 'Hyderabad', type: 'location', count: 28, category: 'Popular Locations' }
      ];
      setPopularLocations(fallbackLocations);
      
      const fallbackCompanies: Suggestion[] = [
        { id: 'company-1', text: 'Boeing', type: 'company', count: 25, category: 'Top Companies' },
        { id: 'company-2', text: 'Ensono', type: 'company', count: 18, category: 'Top Companies' },
        { id: 'company-3', text: 'HRT Technology', type: 'company', count: 15, category: 'Top Companies' },
        { id: 'company-4', text: 'Jobot', type: 'company', count: 12, category: 'Top Companies' }
      ];
      setTopCompanies(fallbackCompanies);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  // Update suggestions when filters change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [currentFilters?.query, currentFilters?.location, currentFilters?.jobType, currentFilters?.experienceLevel, currentFilters?.isRemote]);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSuggestionSelect(suggestion);
    
    // Apply the suggestion to filters
    switch (suggestion.type) {
      case 'job':
        onFiltersChange({ query: suggestion.text });
        break;
      case 'location':
        onFiltersChange({ location: suggestion.text });
        break;
      case 'company':
        onFiltersChange({ query: suggestion.text });
        break;
      case 'skill':
        const currentQuery = currentFilters.query || '';
        const newQuery = currentQuery ? `${currentQuery}, ${suggestion.text}` : suggestion.text;
        onFiltersChange({ query: newQuery });
        break;
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      salaryMin: '',
      salaryMax: '',
      isRemote: false
    });
  };

  // Get current suggestions based on active tab
  const getCurrentSuggestions = () => {
    switch (activeTab) {
      case 'trending':
        return trendingJobs || [];
      case 'locations':
        return popularLocations || [];
      case 'companies':
        return topCompanies || [];
      default:
        return [];
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(currentFilters).some(value => 
    value && value !== 'all' && value !== false
  );

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
            <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0">
              AI Powered
            </Badge>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'trending', label: 'Trending Jobs', icon: TrendingUp },
          { id: 'locations', label: 'Locations', icon: MapPin },
          { id: 'companies', label: 'Companies', icon: Building }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Suggestions Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading suggestions...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {getCurrentSuggestions().map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="justify-start h-auto p-3 text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.count && suggestion.count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                          {suggestion.count} jobs
                        </Badge>
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            {(getCurrentSuggestions() || []).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No suggestions available</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Status */}
      {hasActiveFilters && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {currentFilters.query && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Job: {currentFilters.query}
              </Badge>
            )}
            {currentFilters.location && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Location: {currentFilters.location}
              </Badge>
            )}
            {currentFilters.jobType && currentFilters.jobType !== 'all' && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Type: {currentFilters.jobType}
              </Badge>
            )}
            {currentFilters.experienceLevel && currentFilters.experienceLevel !== 'all' && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Level: {currentFilters.experienceLevel}
              </Badge>
            )}
            {currentFilters.isRemote && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Remote
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
