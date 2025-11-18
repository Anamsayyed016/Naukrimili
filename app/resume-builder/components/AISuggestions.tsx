'use client';

import { useState, useEffect, useRef } from 'react';
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
  context = {},
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

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
      return;
    }

    // Show dropdown and loading state
    setShowDropdown(true);
    setLoading(true);

    // Debounce API call
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
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fieldValue, apiField, context]);

  // Hide dropdown when field becomes empty
  useEffect(() => {
    if (!fieldValue || fieldValue.trim().length < 2) {
      setShowDropdown(false);
    }
  }, [fieldValue]);

  // Don't render if no content or no suggestions/loading
  if (!fieldValue || fieldValue.trim().length < 2) {
    return null;
  }

  if (!showDropdown || (!loading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div className={cn('absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg', className)}>
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
}
