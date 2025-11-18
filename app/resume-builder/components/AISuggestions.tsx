'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Check if we should show the dropdown
  const hasContent = !!(fieldValue && fieldValue.trim().length >= 2);
  const shouldShow = hasContent && (loading || suggestions.length > 0);

  // Calculate dropdown position based on input element
  const updatePosition = () => {
    if (!inputElementId || typeof window === 'undefined') {
      console.warn('[AISuggestions] No inputElementId or window not available');
      return null;
    }

    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) {
      console.warn(`[AISuggestions] Input element with id "${inputElementId}" not found`);
      return null;
    }

    const rect = inputElement.getBoundingClientRect();
    const newPosition = {
      top: rect.bottom + window.scrollY + 4, // 4px gap
      left: rect.left + window.scrollX,
      width: rect.width,
    };
    
    // Use requestAnimationFrame to batch state updates
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current);
    }
    positionUpdateTimeoutRef.current = setTimeout(() => {
      setPosition(newPosition);
    }, 0);
    
    return newPosition;
  };

  // Calculate position synchronously during render (no setState)
  // CRITICAL: Make this work even if inputElementId is not provided (for skills, etc.)
  const currentPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // If inputElementId is provided, try to find the element
    if (inputElementId) {
      const inputElement = document.getElementById(inputElementId);
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        return {
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        };
      }
      // Element not found, return null (will retry)
      return null;
    }
    
    // If no inputElementId, return null (component will use relative positioning or skip portal)
    // For now, we'll still try to render with a default position
    return null;
  }, [inputElementId, position]); // Recalculate when position state changes

  // CRITICAL: Calculate position on mount and when inputElementId changes
  useEffect(() => {
    if (hasContent) {
      // If inputElementId is provided, try to calculate position
      if (inputElementId) {
        // Try multiple times to ensure DOM is ready
        let retryCount = 0;
        const maxRetries = 20; // Increased retries for better reliability (1 second total)
        const tryUpdate = () => {
          const newPos = updatePosition();
          if (!newPos && retryCount < maxRetries) {
            retryCount++;
            setTimeout(tryUpdate, 50);
          } else if (newPos) {
            // Position found, ensure it's set
            setPosition(newPos);
          }
        };
        // Start immediately
        tryUpdate();
      } else {
        // No inputElementId - use default positioning (relative to parent)
        // Set a default position for relative positioning
        if (!position) {
          setPosition({
            top: 0,
            left: 0,
            width: 300, // Default width
          });
        }
      }
    }
  }, [inputElementId, hasContent, fieldValue]); // Run when inputElementId, hasContent, or fieldValue changes

  // Update position when dropdown should show and on scroll/resize
  useEffect(() => {
    if (!shouldShow) return;
    
    // If inputElementId is provided, update position
    if (inputElementId) {
      // Update position immediately
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
    // If no inputElementId, we don't need to update on scroll/resize
  }, [shouldShow, inputElementId, loading, suggestions.length]);

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
      console.log('[AISuggestions] Field too short, clearing state', { fieldValueLength: fieldValue?.length });
      setSuggestions([]);
      setLoading(false);
      setPosition(null);
      return;
    }

    console.log('[AISuggestions] Starting fetch for suggestions', {
      fieldType,
      fieldValueLength: fieldValue.length,
      apiField,
      hasContext: !!context,
    });

    // Show loading state immediately
    setLoading(true);

    // Debounce API call - reduced to 300ms for more real-time feel
    timeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        console.log('[AISuggestions] Making API call', {
          field: apiField,
          value: fieldValue.substring(0, 50),
          context: {
            jobTitle: context.jobTitle || '',
            experienceLevel: context.experienceLevel || '',
            skillsCount: context.skills?.length || 0,
          },
        });

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
        console.log('[AISuggestions] API response received', {
          success: data.success,
          suggestionsCount: data.suggestions?.length || 0,
          aiProvider: data.aiProvider,
        });

        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setLoading(false);
          // Update position after suggestions load
          setTimeout(() => updatePosition(), 0);
        } else {
          console.warn('[AISuggestions] No suggestions in response', data);
          setSuggestions([]);
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[AISuggestions] Error fetching suggestions:', error);
          setSuggestions([]);
          setLoading(false);
        } else {
          console.log('[AISuggestions] Request aborted');
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
  }, [fieldValue, apiField, inputElementId, context.jobTitle, context.experienceLevel, context.skills?.join(','), context.industry]); // Include inputElementId and context fields for real-time updates

  // Don't render if no content
  if (!hasContent) {
    return null;
  }

  // Use currentPosition (from useMemo) or position state, whichever is available
  // CRITICAL: If inputElementId is provided, we MUST have a position. If not provided, we can use relative positioning.
  const finalPosition = position || currentPosition;

  // Don't render if we can't get position or shouldn't show
  if (!shouldShow) {
    console.log('[AISuggestions] Not showing dropdown', {
      hasContent,
      loading,
      suggestionsCount: suggestions.length,
      shouldShow,
    });
    return null;
  }

  // CRITICAL FIX: If inputElementId is provided, try harder to get position
  // Don't immediately return null - try to calculate position one more time
  if (inputElementId && !finalPosition) {
    // Try one more synchronous calculation
    if (typeof window !== 'undefined') {
      const inputElement = document.getElementById(inputElementId);
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const syncPosition = {
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        };
        // Use this position if we have it
        const renderPosition = syncPosition;
        
        console.log('[AISuggestions] Using synchronous position calculation', {
          position: renderPosition,
          loading,
          suggestionsCount: suggestions.length,
        });
        
        // Render with this position
        const dropdownContent = (
          <div
            ref={dropdownRef}
            className={cn('bg-white border border-gray-200 rounded-lg shadow-xl', className)}
            style={{
              position: 'fixed',
              top: `${renderPosition.top}px`,
              left: `${renderPosition.left}px`,
              width: `${renderPosition.width}px`,
              zIndex: 10000,
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
        
        return createPortal(dropdownContent, document.body);
      }
    }
    
    // If we still can't get position, log warning but don't render
    console.warn('[AISuggestions] Cannot calculate position for element with ID after retries, not rendering dropdown', {
      inputElementId,
      hasWindow: typeof window !== 'undefined',
      loading,
      suggestionsCount: suggestions.length,
      fieldType,
      fieldValueLength: fieldValue.length,
      hasPosition: !!position,
      hasCurrentPosition: !!currentPosition,
    });
    return null;
  }
  
  // If no inputElementId and no position, use a default position for relative rendering
  // This allows skills and other fields without inputElementId to still work
  const renderPosition = finalPosition || (inputElementId ? null : {
    top: 0,
    left: 0,
    width: 300,
  });
  
  if (!renderPosition && inputElementId) {
    return null;
  }

  console.log('[AISuggestions] Rendering dropdown', {
    position: renderPosition,
    loading,
    suggestionsCount: suggestions.length,
    fieldType,
    hasInputElementId: !!inputElementId,
    positionType: inputElementId ? 'fixed' : 'absolute',
  });

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn('bg-white border border-gray-200 rounded-lg shadow-xl', className)}
      style={{
        position: inputElementId ? 'fixed' : 'absolute', // Use fixed for inputElementId, absolute for relative positioning
        top: inputElementId ? `${renderPosition.top}px` : '100%', // Fixed position or relative to parent
        left: inputElementId ? `${renderPosition.left}px` : '0',
        width: `${renderPosition.width}px`,
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
  // CRITICAL: Only use portal if inputElementId is provided (for fixed positioning)
  // If no inputElementId, render inline (for relative positioning like skills)
  if (typeof window === 'undefined') return null;
  
  // Use portal for fixed positioning (when inputElementId is provided)
  // Use inline rendering for relative positioning (when no inputElementId)
  if (inputElementId) {
    return createPortal(dropdownContent, document.body);
  } else {
    // Render inline for relative positioning (skills, etc.)
    return dropdownContent;
  }
}
