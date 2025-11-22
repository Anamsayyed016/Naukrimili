'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';

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
  
  // Debounce value for auto-suggestions - reduced for more real-time feel
  const debouncedValue = useDebounce(value, 300);
  
  // Auto-fetch suggestions when value changes - more dynamic
  useEffect(() => {
    if (autoSuggestEnabled && !loading) {
      // For position field, fetch even with empty value for better suggestions
      if (fieldType === 'position') {
        if (debouncedValue && debouncedValue.length >= 2) {
          fetchSuggestions(debouncedValue);
        } else if (!debouncedValue || debouncedValue.length === 0) {
          // Allow fetching suggestions even with empty value for position
          fetchSuggestions('');
        }
      } else if (debouncedValue && debouncedValue.length >= 3) {
        fetchSuggestions(debouncedValue);
      } else if (!debouncedValue || debouncedValue.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  }, [debouncedValue, autoSuggestEnabled, fieldType]);

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
    
    const valueToUse = currentValue !== undefined ? currentValue : value;
    
    // Allow fetching for position field even with empty value
    if (fieldType === 'position') {
      // Allow empty or minimum 2 characters
      if (valueToUse && valueToUse.length > 0 && valueToUse.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    } else if (!valueToUse || valueToUse.length < 3) {
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
          // Show multiple experience bullets for better selection
          fieldSuggestions = data.experience_bullets.filter((b: string) => b && b.trim().length > 0).slice(0, 6);
        } else if (fieldType === 'position' && data.ats_keywords) {
          // For position field, show relevant job title keywords
          const jobKeywords = data.ats_keywords
            .filter((k: string) => {
              const lower = k.toLowerCase();
              return lower.includes('developer') || 
                     lower.includes('engineer') ||
                     lower.includes('manager') ||
                     lower.includes('specialist') ||
                     lower.includes('analyst') ||
                     lower.includes('lead') ||
                     lower.includes('senior') ||
                     lower.includes('junior');
            })
            .slice(0, 5);
          fieldSuggestions = jobKeywords.length > 0 ? jobKeywords : data.ats_keywords.slice(0, 5);
        } else if (data.ats_keywords && data.ats_keywords.length > 0) {
          // For other fields, show ATS keywords as suggestions
          fieldSuggestions = data.ats_keywords.slice(0, 8);
        } else if (data.summary) {
          fieldSuggestions = [data.summary];
        }

        setSuggestions(fieldSuggestions);
        if (fieldSuggestions.length > 0) {
          setShowSuggestions(true);
          toast({
            title: "✨ AI Suggestions Ready",
            description: `Found ${fieldSuggestions.length} suggestion${fieldSuggestions.length > 1 ? 's' : ''} for you`,
            duration: 2000,
          });
        } else {
          setShowSuggestions(false);
        }
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      toast({
        title: "⚠️ AI Suggestion Error",
        description: "Unable to fetch suggestions. Please try again later.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [value, fieldType, formData, experienceLevel, loading]);

  const applySuggestion = (suggestion: string) => {
    // Intelligently merge suggestion with existing value
    const currentValue = value || '';
    
    if (fieldType === 'position' || fieldType === 'company') {
      // For position/company fields, replace if empty, otherwise keep existing
      const newValue = currentValue.trim() ? currentValue : suggestion;
      onChange(newValue);
    } else if (fieldType === 'summary') {
      // For summary, append if there's existing content, otherwise use suggestion
      const newValue = currentValue.trim() 
        ? `${currentValue.trim()}\n\n${suggestion}` 
        : suggestion;
      onChange(newValue);
    } else {
      // For other fields, append if there's existing content
      const newValue = currentValue.trim() 
        ? `${currentValue.trim()} ${suggestion}` 
        : suggestion;
      onChange(newValue);
    }
    
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
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleManualFetch}
          disabled={loading || (fieldType !== 'position' && (!value || value.length < 3))}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all",
            "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && "animate-pulse"
          )}
          title="Get AI-powered suggestions"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">AI Suggest</span>
              <span className="sm:hidden">AI</span>
            </>
          )}
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
          className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        {/* Inline Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">AI Suggestions</span>
                  <span className="text-xs text-gray-500">({suggestions.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="h-6 w-6 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                  aria-label="Close suggestions"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-1.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-all flex items-center gap-3 group border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Check className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="flex-1 leading-relaxed text-gray-700 group-hover:text-gray-900">{suggestion}</span>
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

