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
      console.log('✅ AI suggestions received:', { field: latestField, skillsCount: data.skills?.length, summaryLength: data.summary?.length });

      // Set suggestions based on field type
      switch (latestField) {
        case 'summary':
          if (data.summary) {
            // Generate multiple summary variations
            try {
              const variations = await generateSummaryVariations(data.summary, latestFormData, jobTitle, industry, experienceLevel);
              const uniqueVariations = Array.from(new Set(variations));
              console.log('📝 Summary variations:', uniqueVariations.length);
              setSuggestions(uniqueVariations.length > 1 ? uniqueVariations : [data.summary]);
            } catch (err) {
              console.warn('⚠️ Summary variations failed:', err);
              // Fallback to single summary if variations fail
              setSuggestions([data.summary]);
            }
          }
          break;
        case 'skills':
          // Filter and prioritize skills based on current input for relevance
          const allSkills = data.skills || [];
          const searchLower = searchValue.toLowerCase().trim();
          
          if (searchLower && searchLower.length >= 2) {
            const inputWords = searchLower.split(/\s+/).filter(w => w.length > 1);
            
            // Prioritize: exact match > starts with > contains > word match > partial
            const prioritized = allSkills
              .map(skill => {
                const skillLower = skill.toLowerCase();
                let score = 0;
                
                // Exact match (highest priority)
                if (skillLower === searchLower) score = 100;
                // Starts with
                else if (skillLower.startsWith(searchLower)) score = 90;
                // Contains (high relevance)
                else if (skillLower.includes(searchLower)) score = 70;
                // Word match
                else if (inputWords.length > 0 && inputWords.some(word => skillLower.includes(word))) score = 50;
                // Partial word match (e.g., "re" matches "React", "REST")
                else if (inputWords.some(word => {
                  const wordParts = skillLower.split(/\s+/);
                  return wordParts.some(part => part.startsWith(word) || word.startsWith(part));
                })) score = 30;
                // Fuzzy match (e.g., "human re" might match "Human Resources")
                else if (skillLower.split(/\s+/).some(part => part.startsWith(searchLower.substring(0, 2)))) score = 10;
                
                return { skill, score };
              })
              .filter(item => item.score > 0)
              .sort((a, b) => b.score - a.score)
              .map(item => item.skill)
              .slice(0, 15); // Top 15 most relevant
            
            console.log('🎯 Filtered skills:', prioritized.length, 'from', allSkills.length);
            setSuggestions(prioritized.length > 0 ? prioritized : allSkills.slice(0, 12));
          } else {
            // No input or too short - show all skills
            setSuggestions(allSkills.slice(0, 12));
          }
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
      console.error('❌ Error fetching AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [currentValue]);

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

