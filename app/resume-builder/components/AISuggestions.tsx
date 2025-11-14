'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISuggestion } from '../types';

interface AISuggestionsProps {
  fieldValue: string;
  fieldType: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill';
  onSuggestionSelect: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AISuggestions({
  fieldValue,
  fieldType,
  onSuggestionSelect,
  placeholder,
  className,
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fetch suggestions with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!fieldValue || fieldValue.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Map fieldType to API field format
        const fieldMap: Record<string, string> = {
          'summary': 'summary',
          'skill': 'skills',
          'description': 'description',
          'bullet': 'description',
          'keyword': 'skills',
        };
        const apiField = fieldMap[fieldType] || fieldType;

        // Call AI suggestion API
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: apiField,
            value: fieldValue,
            type: fieldType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const suggestionsList = data.suggestions || [];
          setSuggestions(suggestionsList.map((s: string) => ({
            text: s,
            type: fieldType,
            confidence: 0.8,
          })));
          if (suggestionsList.length > 0) {
            setShowDropdown(true);
          }
        } else {
          // Fallback to default suggestions
          const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
          setSuggestions(defaultSugs);
          if (defaultSugs.length > 0) {
            setShowDropdown(true);
          }
        }
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        // Fallback to default suggestions
        setSuggestions(getDefaultSuggestions(fieldValue, fieldType));
        setShowDropdown(true);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fieldValue, fieldType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDefaultSuggestions = (value: string, type: string): AISuggestion[] => {
    // Default manual suggestions when AI is unavailable
    if (type === 'skill') {
      return [
        { text: 'JavaScript', type: 'skill', confidence: 0.8 },
        { text: 'React', type: 'skill', confidence: 0.8 },
        { text: 'Node.js', type: 'skill', confidence: 0.7 },
        { text: 'Python', type: 'skill', confidence: 0.7 },
      ].filter(s => s.text.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
    }

    if (type === 'summary') {
      return [
        { text: 'Experienced software developer with strong technical skills and passion for creating innovative solutions.', type: 'summary', confidence: 0.8 },
        { text: 'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.', type: 'summary', confidence: 0.8 },
        { text: 'Passionate developer with excellent problem-solving abilities and strong communication skills.', type: 'summary', confidence: 0.7 },
        { text: 'Detail-oriented software engineer with experience in full-stack development and agile methodologies.', type: 'summary', confidence: 0.7 },
        { text: 'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.', type: 'summary', confidence: 0.7 },
      ].slice(0, 3);
    }

    if (type === 'bullet' || type === 'description') {
      return [
        { text: `Developed and maintained ${value}`, type: 'bullet', confidence: 0.8 },
        { text: `Led team of 5+ developers working on ${value}`, type: 'bullet', confidence: 0.7 },
        { text: `Improved performance of ${value} by 40%`, type: 'bullet', confidence: 0.7 },
      ].slice(0, 3);
    }

    return [];
  };

  if (!showDropdown || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto',
        className
      )}
    >
      {loading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Getting AI suggestions...</span>
        </div>
      ) : (
        <div className="p-2">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onSuggestionSelect(suggestion.text);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-gray-900">{suggestion.text}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

