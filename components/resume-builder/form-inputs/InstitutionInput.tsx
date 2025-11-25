'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getAllInstitutions } from '@/lib/resume-builder/education-data';

interface InstitutionInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Fuzzy search function - matches query even with typos
 */
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest priority
  if (textLower.includes(queryLower)) return true;
  
  // Check if all query characters appear in order (fuzzy match)
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
}

/**
 * Calculate match score for ranking
 */
function calculateMatchScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match
  if (textLower === queryLower) return 100;
  
  // Starts with query
  if (textLower.startsWith(queryLower)) return 90;
  
  // Contains query
  if (textLower.includes(queryLower)) return 80;
  
  // Fuzzy match
  if (fuzzyMatch(text, query)) return 60;
  
  return 0;
}

/**
 * Highlight matched text in suggestion
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: Array<{ text: string; isMatch: boolean }> = [];
  let lastIndex = 0;
  
  // Find all matches
  let searchIndex = textLower.indexOf(queryLower, lastIndex);
  while (searchIndex !== -1) {
    // Add non-matching part before
    if (searchIndex > lastIndex) {
      parts.push({ text: text.substring(lastIndex, searchIndex), isMatch: false });
    }
    // Add matching part
    parts.push({ 
      text: text.substring(searchIndex, searchIndex + query.length), 
      isMatch: true 
    });
    lastIndex = searchIndex + query.length;
    searchIndex = textLower.indexOf(queryLower, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isMatch: false });
  }
  
  // If no matches found, return original text
  if (parts.length === 0) {
    return text;
  }
  
  return (
    <>
      {parts.map((part, index) => 
        part.isMatch ? (
          <strong key={index} className="font-semibold text-blue-700">{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

export default function InstitutionInput({
  label,
  value,
  onChange,
  placeholder = 'Type or select institution',
  required = false,
  className,
}: InstitutionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Update input value when prop value changes (e.g., from form reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter and rank suggestions based on input
  const suggestions = useMemo(() => {
    const allInstitutions = getAllInstitutions();
    
    if (!inputValue || inputValue.length < 2) {
      // Show top institutions when input is short
      return allInstitutions.slice(0, 8).map(inst => ({
        text: inst,
        score: 0,
      }));
    }

    // Calculate scores for all institutions
    const scored = allInstitutions.map(inst => ({
      text: inst,
      score: calculateMatchScore(inst, inputValue),
    }))
    .filter(item => item.score > 0) // Only include matches
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 10); // Limit to top 10

    return scored;
  }, [inputValue]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Update parent immediately for manual entry
    setIsOpen(newValue.length >= 2 && suggestions.length > 0);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
    isSelectingRef.current = false;
  };

  // Handle input focus
  const handleFocus = () => {
    if (inputValue.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur (with delay to allow suggestion click)
  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setIsOpen(false);
      }
    }, 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectingRef.current) {
        return;
      }
      
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  return (
    <div className={cn('space-y-2 relative', className)} ref={containerRef}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full"
        />

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[60vh] sm:max-h-64 overflow-hidden">
            <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] sm:max-h-64 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.text}-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectSuggestion(suggestion.text);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm",
                    "hover:bg-gray-100 focus:bg-gray-100",
                    "transition-colors",
                    "cursor-pointer",
                    "select-none",
                    "touch-manipulation"
                  )}
                >
                  {highlightText(suggestion.text, inputValue)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

