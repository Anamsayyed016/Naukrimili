'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AISuggestionsProps {
  fieldValue: string;
  fieldType: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship' | 'company' | 'position';
  onSuggestionSelect: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
  inputElementId?: string;
  context?: {
    jobTitle?: string;
    experienceLevel?: string;
    skills?: string[];
    industry?: string;
    isProjectDescription?: boolean;
  };
}

export default function AISuggestions({
  fieldValue,
  fieldType,
  onSuggestionSelect,
  className,
  inputElementId,
  context = {},
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map fieldType to API field format
  const fieldMap: Record<string, string> = {
    'summary': 'summary',
    'skill': 'skills',
    'description': 'description',
    'bullet': 'description',
    'keyword': 'skills',
    'project': 'project',
    'certification': 'certification',
    'language': 'language',
    'achievement': 'achievement',
    'internship': 'internship',
    'company': 'company',
    'position': 'position',
  };

  const apiField = fieldMap[fieldType] || fieldType;

  // Calculate dropdown position based on input element
  const updatePosition = () => {
    if (!inputElementId || typeof window === 'undefined') return;

    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4, // 4px gap
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  // Update position when dropdown should show
  useEffect(() => {
    if (showDropdown && (loading || suggestions.length > 0)) {
      updatePosition();
      
      // Update on scroll/resize
      const handleUpdate = () => updatePosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [showDropdown, loading, suggestions.length, inputElementId]);

  // Fetch suggestions when field value changes
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't fetch if field is empty or too short
    if (!fieldValue || fieldValue.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      setPosition(null);
      return;
    }

    // Show dropdown and loading state
    setShowDropdown(true);
    setLoading(true);
    updatePosition();

    // Debounce API call - reduced to 300ms for more real-time feel
    timeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: apiField,
            value: fieldValue,
            context: {
              jobTitle: context.jobTitle || '',
              experienceLevel: context.experienceLevel || '',
              skills: context.skills || [],
              industry: context.industry || '',
              isProjectDescription: context.isProjectDescription || false,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setLoading(false);
          updatePosition(); // Update position after suggestions load
        } else {
          setSuggestions([]);
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[AISuggestions] Error fetching suggestions:', error);
          setSuggestions([]);
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce for real-time updates

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fieldValue, apiField, context.jobTitle, context.experienceLevel, context.skills?.join(','), context.industry, inputElementId]); // Include context fields for real-time updates

  // Hide dropdown when field becomes empty
  useEffect(() => {
    if (!fieldValue || fieldValue.trim().length < 2) {
      setShowDropdown(false);
      setPosition(null);
    }
  }, [fieldValue]);

  // Don't render if no content or no suggestions/loading
  if (!fieldValue || fieldValue.trim().length < 2) {
    return null;
  }

  if (!showDropdown || (!loading && suggestions.length === 0) || !position) {
    return null;
  }

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn('bg-white border border-gray-200 rounded-lg shadow-xl', className)}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 10000, // Very high z-index to appear above everything
        maxHeight: '400px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {loading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Getting AI suggestions...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2 border-b border-gray-100 mb-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Suggestions ({suggestions.length})</span>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSuggestionSelect(suggestion);
                  setShowDropdown(false);
                  setSuggestions([]);
                  setPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer text-sm text-gray-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  // Render using portal to document.body to avoid z-index issues
  if (typeof window === 'undefined') return null;
  
  return createPortal(dropdownContent, document.body);
}
