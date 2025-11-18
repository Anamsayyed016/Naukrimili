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
  // CRITICAL: Initialize showDropdown and loading based on fieldValue to show immediately if content exists
  const hasInitialContent = !!(fieldValue && fieldValue.trim().length >= 2);
  const [showDropdown, setShowDropdown] = useState(hasInitialContent);
  const [loading, setLoading] = useState(hasInitialContent); // Start loading immediately if content exists
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
    if (!inputElementId || typeof window === 'undefined') {
      console.warn('[AISuggestions] No inputElementId or window not available');
      return false;
    }

    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) {
      console.warn(`[AISuggestions] Input element with id "${inputElementId}" not found`);
      return false;
    }

    const rect = inputElement.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4, // 4px gap
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    return true;
  };

  // CRITICAL: Calculate position on mount if we have content
  useEffect(() => {
    if (hasInitialContent && inputElementId && !position) {
      // Try to calculate position immediately on mount
      const timeoutId = setTimeout(() => {
        updatePosition();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Run once on mount

  // Update position when dropdown should show - CRITICAL: Run immediately and on changes
  useEffect(() => {
    if (showDropdown && (loading || suggestions.length > 0)) {
      // Try to update position immediately
      const success = updatePosition();
      
      // If failed, try again after a short delay (DOM might not be ready)
      if (!success) {
        const timeoutId = setTimeout(() => {
          updatePosition();
        }, 50);
        return () => clearTimeout(timeoutId);
      }
      
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
    // Try to calculate position immediately
    setTimeout(() => updatePosition(), 0);

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
          // Update position after suggestions load
          setTimeout(() => updatePosition(), 0);
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

  // Don't render if no content
  if (!fieldValue || fieldValue.trim().length < 2) {
    return null;
  }

  // Don't render if dropdown shouldn't show or no content
  if (!showDropdown || (!loading && suggestions.length === 0)) {
    return null;
  }

  // CRITICAL: Calculate position synchronously during render as fallback
  // This ensures we always have a position even if state hasn't updated yet
  let finalPosition = position;
  
  if (!finalPosition && typeof window !== 'undefined' && inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      finalPosition = {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      };
      // Update state for next render (but don't block current render)
      if (!position) {
        setPosition(finalPosition);
      }
    } else {
      console.warn(`[AISuggestions] Input element with id "${inputElementId}" not found in DOM`);
    }
  }

  // Don't render if we still can't get position
  if (!finalPosition) {
    console.warn('[AISuggestions] Cannot calculate position, not rendering dropdown', {
      inputElementId,
      hasWindow: typeof window !== 'undefined',
      showDropdown,
      loading,
      suggestionsCount: suggestions.length,
      fieldType,
      fieldValueLength: fieldValue.length,
    });
    return null;
  }

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn('bg-white border border-gray-200 rounded-lg shadow-xl', className)}
      style={{
        position: 'fixed',
        top: `${finalPosition.top}px`,
        left: `${finalPosition.left}px`,
        width: `${finalPosition.width}px`,
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
