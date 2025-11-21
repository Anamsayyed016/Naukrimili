'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';

interface TextareaWithATSProps {
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

export default function TextareaWithATS({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  className,
  fieldType = 'other',
  formData = {},
  experienceLevel = 'experienced',
}: TextareaWithATSProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce value for auto-suggestions
  const debouncedValue = useDebounce(value, 500);
  
  // Auto-fetch suggestions when value changes
  useEffect(() => {
    if (autoSuggestEnabled && debouncedValue && debouncedValue.length >= 10 && !loading) {
      fetchSuggestions(debouncedValue);
    } else if (!debouncedValue || debouncedValue.length < 10) {
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
    // Allow fetching even with empty value for AI to generate suggestions
    const minLength = fieldType === 'summary' ? 0 : 5;
    if (valueToUse && valueToUse.length < minLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get experience data from formData
      const experienceData = formData.experience || formData['Work Experience'] || [];
      const experienceText = Array.isArray(experienceData) 
        ? experienceData.map((exp: any) => {
            if (typeof exp === 'string') return exp;
            return `${exp.Position || exp.position || ''} at ${exp.Company || exp.company || ''}: ${exp.Description || exp.description || ''}`;
          }).join('\n')
        : String(experienceData || '');

      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: formData.jobTitle || formData.position || formData.desiredJobTitle || '',
          industry: formData.industry || '',
          experience_level: experienceLevel,
          summary_input: fieldType === 'summary' ? valueToUse : '',
          skills_input: Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || ''),
          experience_input: fieldType === 'description' ? (valueToUse || experienceText) : experienceText,
          education_input: formData.education || formData['Education'] || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI Suggestions Response:', { fieldType, data });
      
      let fieldSuggestions: string[] = [];
      if (fieldType === 'summary' && data.summary) {
        fieldSuggestions = [data.summary];
      } else if (fieldType === 'description' && data.experience_bullets) {
        // Filter out empty bullets and ensure we have valid suggestions
        fieldSuggestions = Array.isArray(data.experience_bullets) 
          ? data.experience_bullets.filter((bullet: string) => bullet && bullet.trim().length > 0).slice(0, 5)
          : [];
      } else if (data.summary && fieldType !== 'description') {
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
        toast({
          title: "No suggestions available",
          description: "Try adding more context or click the AI button again",
          variant: "default",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
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
      {label && (
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
            disabled={loading || (!value && fieldType !== 'description')}
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
      )}
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
          className="resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        {/* Inline Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
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
                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-all flex items-start gap-3 group border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0 mt-0.5">
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

