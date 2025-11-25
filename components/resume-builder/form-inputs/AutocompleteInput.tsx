'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { JOB_SECTORS } from '@/lib/jobs/sectors';

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  fieldType: 'location' | 'industry';
}

// Popular locations for fallback (India-focused)
const POPULAR_LOCATIONS = [
  'Bangalore, Karnataka',
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Gurgaon, Haryana',
  'Noida, Uttar Pradesh',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Chandigarh',
  'Bhopal, Madhya Pradesh',
  'Indore, Madhya Pradesh',
];

// Popular industries for fallback
const POPULAR_INDUSTRIES = JOB_SECTORS.map(sector => sector.name);

export default function AutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className,
  fieldType,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounce value for API calls - 400ms for smooth real-time experience
  const debouncedValue = useDebounce(value, 400);
  
  // Fetch suggestions from API or use fallback
  const fetchSuggestions = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Minimum 1 character to trigger suggestions
    if (!query || query.trim().length < 1) {
      // Show popular options when empty
      if (fieldType === 'location') {
        setSuggestions(POPULAR_LOCATIONS.slice(0, 10));
      } else {
        setSuggestions(POPULAR_INDUSTRIES.slice(0, 10));
      }
      setShowSuggestions(isFocused);
      return;
    }
    
    setLoading(true);
    
    try {
      if (fieldType === 'location') {
        // Try API first, fallback to local filtering
        try {
          const response = await fetch(
            `/api/search/autocomplete?q=${encodeURIComponent(query)}&type=location&limit=10`,
            { signal: abortControllerRef.current.signal }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.suggestions && data.suggestions.length > 0) {
              const locationSuggestions = data.suggestions
                .map((s: any) => s.text || s.label || s)
                .filter(Boolean)
                .slice(0, 10);
              
              if (locationSuggestions.length > 0) {
                setSuggestions(locationSuggestions);
                setShowSuggestions(true);
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError: any) {
          if (apiError.name === 'AbortError') {
            return; // Request was cancelled
          }
          console.warn('Location API failed, using fallback:', apiError);
        }
        
        // Fallback: Filter popular locations client-side
        const filtered = POPULAR_LOCATIONS.filter(loc =>
          loc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        
      } else if (fieldType === 'industry') {
        // For industry, use local filtering with job sectors
        const queryLower = query.toLowerCase();
        const filtered = POPULAR_INDUSTRIES.filter(industry =>
          industry.toLowerCase().includes(queryLower)
        ).slice(0, 10);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('Failed to fetch suggestions:', error);
      // Use fallback suggestions on error
      if (fieldType === 'location') {
        setSuggestions(POPULAR_LOCATIONS.slice(0, 5));
      } else {
        setSuggestions(POPULAR_INDUSTRIES.slice(0, 5));
      }
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  }, [fieldType, isFocused]);
  
  // Auto-fetch suggestions when debounced value changes
  useEffect(() => {
    if (isFocused || debouncedValue) {
      fetchSuggestions(debouncedValue || '');
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedValue, isFocused, fetchSuggestions]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // Don't hide suggestions - let them update via debounce
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    // Show suggestions if we have them or trigger fetch
    if (suggestions.length > 0 || value.length >= 1) {
      fetchSuggestions(value || '');
    }
  };
  
  const handleBlur = () => {
    // Delay to allow suggestion click
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };
  
  const icon = fieldType === 'location' ? MapPin : Building2;
  const IconComponent = icon;
  
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            className={cn(
              "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all",
              "pl-10 pr-10"
            )}
          />
          <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin pointer-events-none" />
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <IconComponent className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {fieldType === 'location' ? 'Location' : 'Industry'} Suggestions
                </span>
                <span className="text-xs text-gray-500">({suggestions.length})</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => {
                  // Highlight matching text
                  const query = debouncedValue || '';
                  const suggestionLower = suggestion.toLowerCase();
                  const queryLower = query.toLowerCase();
                  const matchIndex = suggestionLower.indexOf(queryLower);
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSuggestion(suggestion);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-all flex items-center gap-2 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                    >
                      <IconComponent className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                      <span className="flex-1 leading-relaxed text-gray-700 group-hover:text-gray-900">
                        {matchIndex !== -1 && query ? (
                          <>
                            {suggestion.substring(0, matchIndex)}
                            <strong className="font-semibold text-blue-700">
                              {suggestion.substring(matchIndex, matchIndex + query.length)}
                            </strong>
                            {suggestion.substring(matchIndex + query.length)}
                          </>
                        ) : (
                          suggestion
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

