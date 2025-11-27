'use client';

/**
 * AI Suggestion Box Component
 * Reusable component for displaying AI-powered suggestions in resume builder steps
 * Uses the existing ATS suggestion engine API
 */

import { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, TrendingUp, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface AISuggestionBoxProps {
  field: 'summary' | 'skills' | 'experience' | 'keywords';
  currentValue: string;
  formData: Record<string, any>;
  onApply: (suggestion: string) => void;
  onApplyMultiple?: (suggestions: string[]) => void;
  className?: string;
  autoTrigger?: boolean; // Auto-trigger suggestions as user types
  debounceMs?: number;
}

interface ATSSuggestionResponse {
  summary: string;
  skills: string[];
  ats_keywords: string[];
  experience_bullets: string[];
  projects: Array<{ title: string; description: string }>;
}

export default function AISuggestionBox({
  field,
  currentValue,
  formData,
  onApply,
  onApplyMultiple,
  className,
  autoTrigger = false,
  debounceMs = 1000,
}: AISuggestionBoxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the current value for auto-trigger
  const debouncedValue = useDebounce(currentValue, debounceMs);

  // Auto-trigger suggestions when value changes (if enabled)
  useEffect(() => {
    if (autoTrigger && debouncedValue && debouncedValue.trim().length >= 3) {
      fetchSuggestions();
    }
  }, [debouncedValue, autoTrigger]);

  const fetchSuggestions = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare request data
      const jobTitle = formData.jobTitle || formData.title || '';
      const industry = formData.industry || '';
      const experienceLevel = formData.experienceLevel || 'experienced';

      // Build context from form data
      const summaryInput = field === 'summary' ? currentValue : (formData.summary || '');
      const skillsInput = field === 'skills' 
        ? (Array.isArray(formData.skills) ? formData.skills.join(', ') : currentValue)
        : (Array.isArray(formData.skills) ? formData.skills.join(', ') : '');
      const experienceInput = field === 'experience' 
        ? currentValue 
        : (Array.isArray(formData.experience) 
          ? formData.experience.map((exp: any) => exp.description || '').join(' ') 
          : '');
      const educationInput = Array.isArray(formData.education)
        ? formData.education.map((edu: any) => `${edu.degree || ''} ${edu.school || ''}`).join(' ')
        : '';

      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          industry,
          experience_level: experienceLevel,
          summary_input: summaryInput,
          skills_input: skillsInput,
          experience_input: experienceInput,
          education_input: educationInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: ATSSuggestionResponse = await response.json();

      // Set suggestions based on field type
      switch (field) {
        case 'summary':
          if (data.summary) {
            setSuggestions([data.summary]);
          }
          break;
        case 'skills':
          setSuggestions(data.skills || []);
          break;
        case 'experience':
          setSuggestions(data.experience_bullets || []);
          break;
        case 'keywords':
          setKeywords(data.ats_keywords || []);
          break;
      }

      // Always set keywords for display
      if (data.ats_keywords && data.ats_keywords.length > 0) {
        setKeywords(data.ats_keywords);
      }

      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestion: string) => {
    onApply(suggestion);
    setShowSuggestions(false);
  };

  const handleApplyAll = () => {
    if (onApplyMultiple && suggestions.length > 0) {
      onApplyMultiple(suggestions);
      setShowSuggestions(false);
    }
  };

  const displaySuggestions = field === 'keywords' ? keywords : suggestions;
  const hasSuggestions = displaySuggestions.length > 0;

  if (!showSuggestions && !loading && !hasSuggestions) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading || !currentValue.trim()}
          className="text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Get AI Suggestions
            </>
          )}
        </Button>
        <span className="text-xs text-gray-500">
          {field === 'summary' && 'Get professional summary suggestions'}
          {field === 'skills' && 'Get relevant skills for your role'}
          {field === 'experience' && 'Get achievement bullet points'}
          {field === 'keywords' && 'Get ATS keywords'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">
            {field === 'keywords' ? 'ATS Keywords' : 'AI Suggestions'}
          </span>
          {loading && (
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowSuggestions(false)}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Suggestions List */}
      {hasSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          {field === 'keywords' ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleApply(keyword)}
                  className="inline-flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-300"
                >
                  <TrendingUp className="w-3 h-3" />
                  {keyword}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleApply(suggestion)}
                  className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm text-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{suggestion}</span>
                  </div>
                </button>
              ))}
              {field === 'skills' && suggestions.length > 1 && onApplyMultiple && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAll}
                  className="w-full text-xs"
                >
                  Add All Skills
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      {hasSuggestions && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-xs w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Get More Suggestions
            </>
          )}
        </Button>
      )}
    </div>
  );
}

