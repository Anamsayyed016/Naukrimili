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
  formData: Record<string, unknown>;
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
  formData: Record<string, unknown>,
  jobTitle: string,
  industry: string,
  experienceLevel: string
): Promise<string[]> {
  const variations: Set<string> = new Set([baseSummary]);
  
  // Always generate 2-3 additional variations with different focuses
  try {
    const existingSkills = Array.isArray(formData.skills) ? formData.skills.join(', ') : '';
    const existingExperience = Array.isArray(formData.experience) 
      ? formData.experience.map((exp: Record<string, unknown>) => {
          const desc = exp.description;
          return typeof desc === 'string' ? desc : '';
        }).join(' ') 
      : '';
    
    // Generate 3 variations with different focuses and contexts
    const variationRequests = [
      {
        // Variation 1: Focus on achievements and metrics
        summary_input: baseSummary.substring(0, 200), // Use partial summary as context
        skills_input: existingSkills,
        experience_input: existingExperience,
        variation_focus: 'achievements',
      },
      {
        // Variation 2: Focus on technical skills and expertise
        summary_input: baseSummary.substring(0, 200),
        skills_input: existingSkills,
        experience_input: existingExperience,
        variation_focus: 'technical',
      },
      {
        // Variation 3: Focus on leadership and impact
        summary_input: baseSummary.substring(0, 200),
        skills_input: existingSkills,
        experience_input: existingExperience,
        variation_focus: 'leadership',
      },
    ];
    
    // Make parallel requests for variations
    const variationPromises = variationRequests.map(async (req, index) => {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const variationResponse = await fetch(`/api/resume-builder/ats-suggestions?t=${timestamp}&v=${index}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_title: jobTitle,
            industry,
            experience_level: experienceLevel,
            summary_input: req.summary_input,
            skills_input: req.skills_input,
            experience_input: req.experience_input,
            education_input: Array.isArray(formData.education)
              ? formData.education.map((edu: Record<string, unknown>) => {
                  const degree = typeof edu.degree === 'string' ? edu.degree : '';
                  const school = typeof edu.school === 'string' ? edu.school : '';
                  return `${degree} ${school}`;
                }).join(' ')
              : '',
            // Add variation focus hint
            variation_focus: req.variation_focus,
          }),
        });

        if (variationResponse.ok) {
          const variationData: ATSSuggestionResponse = await variationResponse.json();
          if (variationData.summary && 
              variationData.summary.trim().length > 50 &&
              variationData.summary !== baseSummary) {
            // Check similarity (avoid near-duplicates)
            const isSimilar = Array.from(variations).some(existing => {
              const similarity = calculateSimilarity(existing, variationData.summary);
              return similarity > 0.85; // 85% similarity threshold
            });
            
            if (!isSimilar) {
              return variationData.summary;
            }
          }
        }
      } catch (err) {
        console.warn(`Variation ${index + 1} request failed:`, err);
      }
      return null;
    });
    
    const variationResults = await Promise.all(variationPromises);
    variationResults.forEach(variation => {
      if (variation && variation.trim().length > 50) {
        variations.add(variation);
      }
    });
    
    console.log('📝 Generated', variations.size, 'unique summary variations');
  } catch (err) {
    console.warn('⚠️ Failed to generate summary variations:', err);
  }
  
  return Array.from(variations);
}

// Simple similarity calculation (Jaccard similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

// Deduplicate summaries by removing exact duplicates and near-duplicates
function deduplicateSummaries(summaries: string[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  
  for (const summary of summaries) {
    const normalized = summary.trim().toLowerCase();
    
    // Skip exact duplicates
    if (seen.has(normalized)) continue;
    
    // Check for near-duplicates (high similarity)
    const isNearDuplicate = unique.some(existing => {
      const similarity = calculateSimilarity(existing, summary);
      return similarity > 0.85; // 85% similarity threshold
    });
    
    if (!isNearDuplicate) {
      unique.push(summary);
      seen.add(normalized);
    }
  }
  
  return unique;
}

export default function AISuggestionBox({
  field,
  currentValue,
  formData,
  onApply,
  onApplyMultiple,
  className,
  autoTrigger = false,
  debounceMs = 600, // Reduced from 1000ms to 600ms for faster real-time suggestions
}: AISuggestionBoxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize useAbly based on availability (enable by default if Ably key exists)
  const [useAbly, setUseAbly] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!process.env.NEXT_PUBLIC_ABLY_API_KEY;
    }
    return false;
  });
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

  // Handle Ably result (also used for REST fallback) - MUST be defined before use
  const handleAblyResult = useCallback((data: ATSSuggestionResponse, field: string, searchValue: string) => {
    const latestFormData = formDataRef.current;
    const jobTitle = latestFormData.jobTitle || latestFormData.title || '';
    const industry = latestFormData.industry || '';
    const experienceLevel = latestFormData.experienceLevel || 'experienced';
    
    switch (field) {
      case 'summary':
        if (data.summary) {
          // Generate multiple summary variations (always try to get 3-4 variations)
          generateSummaryVariations(data.summary, latestFormData, jobTitle, industry, experienceLevel)
            .then(variations => {
              // Remove exact duplicates and near-duplicates
              const uniqueVariations = deduplicateSummaries(variations);
              // Always show at least 2-3 variations, fallback to base if needed
              if (uniqueVariations.length >= 2) {
                setSuggestions(uniqueVariations.slice(0, 4)); // Show up to 4 variations
              } else if (uniqueVariations.length === 1) {
                // If only 1 variation, try to generate more by calling API again with different context
                console.log('⚠️ Only 1 summary variation, generating more...');
                generateSummaryVariations(data.summary, latestFormData, jobTitle, industry, experienceLevel)
                  .then(moreVariations => {
                    const allUnique = deduplicateSummaries([...uniqueVariations, ...moreVariations]);
                    setSuggestions(allUnique.length > 0 ? allUnique.slice(0, 4) : [data.summary]);
                  })
                  .catch(() => {
                    setSuggestions([data.summary]);
                  });
              } else {
                setSuggestions([data.summary]);
              }
            })
            .catch((err) => {
              console.error('Failed to generate summary variations:', err);
              setSuggestions([data.summary]);
            });
        }
        break;
      case 'skills':
        const allSkills = data.skills || [];
        // Get existing skills from form data to exclude them
        const existingSkills = Array.isArray(latestFormData.skills) 
          ? latestFormData.skills.map((s: string) => s.toLowerCase().trim())
          : [];
        
        // Filter out already added skills
        const availableSkills = allSkills.filter(skill => {
          const skillLower = skill.toLowerCase().trim();
          return !existingSkills.includes(skillLower) && 
                 !existingSkills.some(existing => 
                   existing.includes(skillLower) || skillLower.includes(existing)
                 );
        });
        
        const searchLower = searchValue.toLowerCase().trim();
        
        if (searchLower && searchLower.length >= 2) {
          const inputWords = searchLower.split(/\s+/).filter(w => w.length > 1);
          
          const prioritized = availableSkills
            .map(skill => {
              const skillLower = skill.toLowerCase();
              let score = 0;
              
              if (skillLower === searchLower) score = 100;
              else if (skillLower.startsWith(searchLower)) score = 90;
              else if (skillLower.includes(searchLower)) score = 70;
              else if (inputWords.length > 0 && inputWords.some(word => skillLower.includes(word))) score = 50;
              else if (inputWords.some(word => {
                const wordParts = skillLower.split(/\s+/);
                return wordParts.some(part => part.startsWith(word) || word.startsWith(part));
              })) score = 30;
              else if (skillLower.split(/\s+/).some(part => part.startsWith(searchLower.substring(0, 2)))) score = 10;
              
              return { skill, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.skill)
            .slice(0, 15);
          
          setSuggestions(prioritized.length > 0 ? prioritized : availableSkills.slice(0, 12));
        } else {
          setSuggestions(availableSkills.slice(0, 12));
        }
        break;
      case 'experience':
        setSuggestions(data.experience_bullets || []);
        break;
      case 'keywords':
        setKeywords(data.ats_keywords || []);
        break;
    }

    if (data.ats_keywords && data.ats_keywords.length > 0) {
      setKeywords(data.ats_keywords);
    }

    setShowSuggestions(true);
  }, []);

  // Helper function for REST API fallback (defined first to be used in fetchSuggestions)
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
          ? latestFormData.experience.map((exp: Record<string, unknown>) => {
              const desc = exp.description;
              return typeof desc === 'string' ? desc : '';
            }).join(' ') 
          : '');
      const educationInput = Array.isArray(latestFormData.education)
        ? latestFormData.education.map((edu: Record<string, unknown>) => {
            const degree = typeof edu.degree === 'string' ? edu.degree : '';
            const school = typeof edu.school === 'string' ? edu.school : '';
            return `${degree} ${school}`;
          }).join(' ')
        : '';

      // Add timestamp and random ID to prevent caching
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);
      
      const response = await fetch(`/api/resume-builder/ats-suggestions?t=${timestamp}&r=${requestId}`, {
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
          // Add request metadata to prevent same responses
          _requestId: requestId,
          _timestamp: timestamp,
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
          ? latestFormData.experience.map((exp: Record<string, unknown>) => {
              const desc = exp.description;
              return typeof desc === 'string' ? desc : '';
            }).join(' ') 
          : '');
      const educationInput = Array.isArray(latestFormData.education)
        ? latestFormData.education.map((edu: Record<string, unknown>) => {
            const degree = typeof edu.degree === 'string' ? edu.degree : '';
            const school = typeof edu.school === 'string' ? edu.school : '';
            return `${degree} ${school}`;
          }).join(' ')
        : '';

      console.log('🔍 Fetching AI suggestions:', { field: latestField, searchValue, skillsInput });

      // Check if Ably is available and enabled
      const ablyAvailable = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_ABLY_API_KEY;
      const shouldUseAbly = ablyAvailable && useAbly;
      
      // Try Ably first if available, fallback to REST
      if (shouldUseAbly) {
        // Ensure Ably handler is initialized (ping the endpoint)
        try {
          await fetch('/api/resume-builder/ably-suggestions', { method: 'GET' });
        } catch (_err) {
          console.warn('⚠️ Could not initialize Ably handler, using REST fallback');
        }

        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        currentRequestIdRef.current = requestId;

        // Unsubscribe previous listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        // Subscribe to results
        const unsubscribe = subscribeToResults((resultData) => {
          console.log('📨 Received Ably result:', { requestId, receivedId: resultData.requestId, hasData: !!resultData.data, hasError: !!resultData.error });
          
          if (resultData.error) {
            console.error('❌ Ably result error:', resultData.error);
            setError(resultData.error);
            setLoading(false);
            // Fallback to REST API on error
            fetchSuggestionsRest(inputValue);
            return;
          }

          if (resultData.requestId === requestId && resultData.data) {
            console.log('✅ Processing Ably result for request:', requestId);
            handleAblyResult(resultData.data, latestField, searchValue);
            setLoading(false);
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

        // Set timeout fallback to REST API (increased to 8 seconds for slower connections)
        setTimeout(() => {
          if (loadingRef.current) {
            console.log('⏱️ Ably timeout (8s), falling back to REST API');
            setUseAbly(false);
            setLoading(false);
            fetchSuggestionsRest(inputValue);
          }
        }, 8000);

        return;
      }

      // Fallback to REST API
      fetchSuggestionsRest(inputValue);
    } catch (err) {
      console.error('❌ Error in fetchSuggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      setLoading(false);
    }
  }, [currentValue, useAbly, handleAblyResult, fetchSuggestionsRest]);

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

