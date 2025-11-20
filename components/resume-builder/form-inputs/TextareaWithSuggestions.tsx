'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface TextareaWithSuggestionsProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  fieldType?: 'summary' | 'description' | 'other';
  formData?: Record<string, any>;
  experienceLevel?: string;
}

export default function TextareaWithSuggestions({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  className,
  fieldType = 'description',
  formData = {},
  experienceLevel = 'experienced',
}: TextareaWithSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce value for auto-suggestions
  const debouncedValue = useDebounce(value, 1000);
  
  // Auto-fetch suggestions when value changes (debounced)
  useEffect(() => {
    if (autoSuggestEnabled && debouncedValue && debouncedValue.length >= 10 && !loading) {
      fetchSuggestions(debouncedValue);
    }
  }, [debouncedValue, autoSuggestEnabled]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (currentValue?: string) => {
    if (loading) return;
    
    const valueToUse = currentValue || value;
    if (!valueToUse || valueToUse.length < 10) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: formData.position || formData.jobTitle || '',
          industry: formData.industry || '',
          experience_level: experienceLevel,
          summary_input: fieldType === 'summary' ? value : '',
          skills_input: Array.isArray(formData.skills) ? formData.skills.join(', ') : '',
          experience_input: formData.experience || '',
          education_input: formData.education || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        let fieldSuggestions: string[] = [];
        if (fieldType === 'summary' && data.summary) {
          fieldSuggestions = [data.summary];
        } else if (fieldType === 'description' && data.experience_bullets) {
          fieldSuggestions = data.experience_bullets;
        } else if (data.summary) {
          fieldSuggestions = [data.summary];
        }

        setSuggestions(fieldSuggestions);
        if (fieldSuggestions.length > 0) {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [value, fieldType, formData, experienceLevel, loading]);

  const applySuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setAutoSuggestEnabled(false);
    // Re-enable after a delay
    setTimeout(() => setAutoSuggestEnabled(true), 2000);
  };

  const handleManualFetch = () => {
    setAutoSuggestEnabled(true);
    fetchSuggestions(value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleManualFetch}
          disabled={loading}
          className="h-7 px-2 text-xs"
          title="Get AI suggestions"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          <span className="ml-1 hidden sm:inline">AI</span>
        </Button>
      </div>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          rows={rows}
        />
        {/* Inline Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-gray-500">AI Suggestions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-md transition-colors flex items-start gap-2 group"
                  >
                    <Check className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-3 flex-1">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

