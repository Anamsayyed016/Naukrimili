'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface InputWithATSProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  className?: string;
  fieldType?: 'summary' | 'description' | 'position' | 'company' | 'other';
  formData?: Record<string, any>;
  experienceLevel?: string;
}

export default function InputWithATS({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  className,
  fieldType = 'other',
  formData = {},
  experienceLevel = 'experienced',
}: InputWithATSProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce value for auto-suggestions
  const debouncedValue = useDebounce(value, 400);
  
  // Auto-fetch suggestions when value changes
  useEffect(() => {
    if (autoSuggestEnabled && debouncedValue && debouncedValue.length >= 3 && !loading) {
      fetchSuggestions(debouncedValue);
    } else if (!debouncedValue || debouncedValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedValue, autoSuggestEnabled]);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (currentValue?: string) => {
    if (loading) return;
    
    const valueToUse = currentValue || value;
    if (!valueToUse || valueToUse.length < 3) {
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
          job_title: formData.jobTitle || formData.position || '',
          industry: formData.industry || '',
          experience_level: experienceLevel,
          summary_input: fieldType === 'summary' ? valueToUse : '',
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
          fieldSuggestions = data.experience_bullets.slice(0, 5);
        } else if (fieldType === 'position' && data.ats_keywords) {
          fieldSuggestions = data.ats_keywords
            .filter((k: string) => 
              k.toLowerCase().includes('developer') || 
              k.toLowerCase().includes('engineer') ||
              k.toLowerCase().includes('manager') ||
              k.toLowerCase().includes('specialist') ||
              k.toLowerCase().includes('analyst')
            )
            .slice(0, 5);
        } else if (data.ats_keywords) {
          fieldSuggestions = data.ats_keywords.slice(0, 5);
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
        <Input
          ref={inputRef}
          type={type}
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
        />
        {/* Inline Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1.5 bg-white border border-gray-300 rounded-lg shadow-md max-h-64 overflow-y-auto"
          >
            <div className="p-1.5">
              <div className="flex items-center justify-between mb-1 px-2 py-1">
                <span className="text-xs font-medium text-gray-600">AI Suggestions</span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="h-5 w-5 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                  aria-label="Close suggestions"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
              <div className="space-y-0.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors flex items-start gap-2 group border border-transparent hover:border-blue-200"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                    <span className="flex-1 leading-relaxed">{suggestion}</span>
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

