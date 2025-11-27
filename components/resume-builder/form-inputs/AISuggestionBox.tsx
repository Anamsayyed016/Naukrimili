'use client';

/**
 * AI Suggestion Box Component
 * Reusable component for displaying AI-powered suggestions in resume builder steps
 * Uses the existing ATS suggestion engine API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Lightbulb, TrendingUp, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { publishQuery, subscribeToResults } from '@/lib/services/ably-service';

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

// Generate multiple summary variations by creating different versions
async function generateSummaryVariations(
  baseSummary: string,
  formData: Record<string, any>,
  jobTitle: string,
  industry: string,
  experienceLevel: string
): Promise<string[]> {
  const variations: string[] = [baseSummary];
  
  // If summary is good, create variations with different focuses
  if (baseSummary.length > 50) {
    try {
      // Generate 2 additional variations with different focuses
      const variationPrompts = [
        `Generate an alternative professional summary for a ${jobTitle || 'professional'} in ${industry || 'the industry'}. Focus on achievements, metrics, and quantifiable results. Current summary: ${baseSummary.substring(0, 100)}...`,
        `Generate an alternative professional summary for a ${jobTitle || 'professional'} in ${industry || 'the industry'}. Focus on technical skills, expertise, and methodologies. Current summary: ${baseSummary.substring(0, 100)}...`,
      ];
      
      // Make requests for variations (limit to 2 additional to avoid too many calls)
      const variationPromises = variationPrompts.slice(0, 2).map(async (prompt) => {
        try {
          const variationResponse = await fetch('/api/resume-builder/ats-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_title: jobTitle,
              industry,
              experience_level: experienceLevel,
              summary_input: prompt,
              skills_input: '',
              experience_input: '',
              education_input: '',
            }),
          });

          if (variationResponse.ok) {
            const variationData: ATSSuggestionResponse = await variationResponse.json();
            if (variationData.summary && 
                variationData.summary !== baseSummary && 
                variationData.summary.length > 50 &&
                !variations.includes(variationData.summary)) {
              return variationData.summary;
            }
          }
        } catch (err) {
          console.warn('Variation request failed:', err);
        }
        return null;
      });
      
      const variationResults = await Promise.all(variationPromises);
      variationResults.forEach(variation => {
        if (variation) {
          variations.push(variation);
        }
      });
      
      console.log('📝 Generated', variations.length, 'summary variations');
    } catch (err) {
      console.warn('⚠️ Failed to generate summary variations:', err);
      // Return at least the base summary
    }
  }
  
  return variations;
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
  const [useAbly, setUseAbly] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentRequestIdRef = useRef<string>('');

  // Debounce the current value for auto-trigger
  const debouncedValue = useDebounce(currentValue, debounceMs);
  
  // Use refs to access latest values without causing re-renders
  const formDataRef = useRef(formData);
  const fieldRef = useRef(field);
  const loadingRef = useRef(loading);
  
  // Update refs when props change
  useEffect(() => {
    formDataRef.current = formData;
    fieldRef.current = field;
    loadingRef.current = loading;
  }, [formData, field, loading]);

  // Memoize fetchSuggestions to avoid recreating on every render
  const fetchSuggestions = useCallback(async (inputValue?: string) => {
      // Use provided input value or current value for filtering
    const searchValue = inputValue || currentValue;
    
    if (loadingRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Use refs to get latest formData and field
      const latestFormData = formDataRef.current;
      const latestField = fieldRef.current;
      
      // Prepare request data
      const jobTitle = latestFormData.jobTitle || latestFormData.title || '';
      const industry = latestFormData.industry || '';
      const experienceLevel = latestFormData.experienceLevel || 'experienced';

      // Build context from form data
      const summaryInput = latestField === 'summary' ? searchValue : (latestFormData.summary || '');
      // For skills, use current typing input + existing skills for context
      const existingSkills = Array.isArray(latestFormData.skills) ? latestFormData.skills : [];
      const skillsInput = latestField === 'skills' 
        ? (existingSkills.length > 0 
          ? `${existingSkills.join(', ')}, ${searchValue}`.trim()
          : searchValue)
        : (existingSkills.join(', ') || '');
      const experienceInput = latestField === 'experience' 
        ? searchValue 
        : (Array.isArray(latestFormData.experience) 
          ? latestFormData.experience.map((exp: any) => exp.description || '').join(' ') 
          : '');
      const educationInput = Array.isArray(latestFormData.education)
        ? latestFormData.education.map((edu: any) => `${edu.degree || ''} ${edu.school || ''}`).join(' ')
        : '';

      console.log('🔍 Fetching AI suggestions:', { field: latestField, searchValue, skillsInput });

      // Check if Ably is available (enable by default if key exists)
      const ablyAvailable = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_ABLY_API_KEY;
      const shouldUseAbly = ablyAvailable && (useAbly !== false);
      
      // Try Ably first if available, fallback to REST
      if (shouldUseAbly) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        currentRequestIdRef.current = requestId;

        // Unsubscribe previous listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        // Subscribe to results
        const unsubscribe = subscribeToResults((resultData) => {
          if (resultData.requestId === requestId && resultData.data) {
            handleAblyResult(resultData.data, latestField, searchValue);
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
          }
        }, requestId);

        if (unsubscribe) {
          unsubscribeRef.current = unsubscribe;
        }

        // Publish query
        publishQuery({
          field: latestField,
          searchValue,
          formData: {
            jobTitle,
            industry,
            experienceLevel,
            summary_input: summaryInput,
            skills_input: skillsInput,
            experience_input: experienceInput,
            education_input: educationInput,
          },
          requestId,
        });

        // Set timeout fallback to REST API
        setTimeout(() => {
          if (loadingRef.current) {
            console.log('⏱️ Ably timeout, falling back to REST API');
            setUseAbly(false);
            fetchSuggestionsRest(inputValue);
          }
        }, 5000);

        return;
      }

      // Fallback to REST API
      fetchSuggestionsRest(inputValue);
    } catch (err) {
      console.error('❌ Error in fetchSuggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      setLoading(false);
    }
  }, [currentValue]);

  // Helper function for REST API fallback
  const fetchSuggestionsRest = useCallback(async (inputValue?: string) => {
    const searchValue = inputValue || currentValue;
    
    if (loadingRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const latestFormData = formDataRef.current;
      const latestField = fieldRef.current;
      
      const jobTitle = latestFormData.jobTitle || latestFormData.title || '';
      const industry = latestFormData.industry || '';
      const experienceLevel = latestFormData.experienceLevel || 'experienced';

      const summaryInput = latestField === 'summary' ? searchValue : (latestFormData.summary || '');
      const existingSkills = Array.isArray(latestFormData.skills) ? latestFormData.skills : [];
      const skillsInput = latestField === 'skills' 
        ? (existingSkills.length > 0 
          ? `${existingSkills.join(', ')}, ${searchValue}`.trim()
          : searchValue)
        : (existingSkills.join(', ') || '');
      const experienceInput = latestField === 'experience' 
        ? searchValue 
        : (Array.isArray(latestFormData.experience) 
          ? latestFormData.experience.map((exp: any) => exp.description || '').join(' ') 
          : '');
      const educationInput = Array.isArray(latestFormData.education)
        ? latestFormData.education.map((edu: any) => `${edu.degree || ''} ${edu.school || ''}`).join(' ')
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
      console.log('✅ AI suggestions received (REST):', { field: latestField, skillsCount: data.skills?.length, summaryLength: data.summary?.length });

      // Use the same result handler
      handleAblyResult(data, latestField, searchValue);
    } catch (err) {
      console.error('❌ Error fetching AI suggestions (REST):', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [currentValue, handleAblyResult]);

  // Auto-trigger suggestions when value changes (if enabled)
  useEffect(() => {
    if (autoTrigger && debouncedValue && debouncedValue.trim().length >= 2) {
      // Reset previous suggestions when new input comes in
      setShowSuggestions(false);
      setSuggestions([]);
      fetchSuggestions(debouncedValue);
    }
  }, [debouncedValue, autoTrigger, fetchSuggestions]);

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
          onClick={() => fetchSuggestions()}
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
          onClick={() => fetchSuggestions()}
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

