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
import { useResumeOptimizationOptional } from '@/components/resume-builder/ResumeOptimizationProvider';
import type { SuggestionField } from '@/lib/resume-builder/ai-optimization/field-suggestions';
import { buildSmartSuggestionContext } from '@/lib/resume-builder/suggestion-context-engine';
import { normalizeForCompare } from '@/lib/resume-builder/suggestion-orchestrator';
import {
  type SuggestionItem,
  type MergeMode,
  mergeSuggestionItems,
  markItemApplied,
  markAllApplied,
  pickMergeMode,
} from '@/lib/resume-builder/suggestion-items';

type FetchOptions = {
  regenerate?: boolean;
  source?: 'auto' | 'manual';
};

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
  const optimization = useResumeOptimizationOptional();
  const [suggestionItems, setSuggestionItems] = useState<SuggestionItem[]>([]);
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
  const optimizationRef = useRef(optimization);
  optimizationRef.current = optimization;
  const suggestionItemsRef = useRef<SuggestionItem[]>([]);
  const regenerateCounterRef = useRef(0);
  const skipNextAutoFetchRef = useRef(false);
  const applyLockUntilRef = useRef(0);
  const fetchGenerationRef = useRef(0);
  const [panelDismissed, setPanelDismissed] = useState(false);

  const commitFetched = useCallback(
    (texts: string[], mode: MergeMode, generation: number) => {
      if (generation !== fetchGenerationRef.current || texts.length === 0) return;
      setSuggestionItems((prev) => {
        const merged = mergeSuggestionItems(prev, texts, mode);
        suggestionItemsRef.current = merged;
        return merged;
      });
      setShowSuggestions(true);
      setPanelDismissed(false);
      setError(null);
    },
    []
  );

  // Debounce the current value for auto-trigger
  const debouncedValue = useDebounce(currentValue, debounceMs);
  
  // Use refs to access latest values without causing re-renders
  const formDataRef = useRef(formData);
  const fieldRef = useRef(field);
  const loadingRef = useRef(loading);
  
  useEffect(() => {
    formDataRef.current = formData;
    fieldRef.current = field;
    loadingRef.current = loading;
    suggestionItemsRef.current = suggestionItems;
  }, [formData, field, loading, suggestionItems]);

  // Handle Ably result (also used for REST fallback) - MUST be defined before use
  const handleAblyResult = useCallback(
    (
      data: ATSSuggestionResponse,
      field: string,
      searchValue: string,
      generation: number,
      fetchOptions?: FetchOptions
    ) => {
    if (generation !== fetchGenerationRef.current) return;

    const latestFormData = formDataRef.current;
    const jobTitle = latestFormData.jobTitle || latestFormData.title || '';
    const industry = latestFormData.industry || '';
    const experienceLevel = latestFormData.experienceLevel || 'experienced';
    const mergeMode = pickMergeMode(suggestionItemsRef.current, {
      source: fetchOptions?.source || 'auto',
      regenerate: fetchOptions?.regenerate,
    });
    
    switch (field) {
      case 'summary':
        if (data.summary) {
          const optNow = optimizationRef.current;
          if (optNow?.shouldUseReportForField('summary')) {
            commitFetched([data.summary], 'append-new', generation);
            break;
          }
          generateSummaryVariations(data.summary, latestFormData, jobTitle, industry, experienceLevel)
            .then((variations) => {
              const uniqueVariations = deduplicateSummaries(variations);
              if (generation !== fetchGenerationRef.current) return;
              if (uniqueVariations.length >= 1) {
                commitFetched(uniqueVariations.slice(0, 8), mergeMode, generation);
              } else {
                commitFetched([data.summary], mergeMode, generation);
              }
            })
            .catch(() => {
              if (generation === fetchGenerationRef.current) {
                commitFetched([data.summary], mergeMode, generation);
              }
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
          
          commitFetched(
            prioritized.length > 0 ? prioritized : availableSkills.slice(0, 12),
            mergeMode,
            generation
          );
        } else {
          commitFetched(availableSkills.slice(0, 12), mergeMode, generation);
        }
        break;
      case 'experience':
        commitFetched(data.experience_bullets || [], mergeMode, generation);
        break;
      case 'keywords':
        setKeywords(data.ats_keywords || []);
        break;
    }

    if (data.ats_keywords && data.ats_keywords.length > 0) {
      setKeywords(data.ats_keywords);
    }

    setShowSuggestions(true);
    setPanelDismissed(false);
  },
  [commitFetched]
  );

  /** Apply report-first suggestions from shared optimization context */
  const tryReportFirstSuggestions = useCallback(
    (latestField: string, searchValue: string, latestFormData: Record<string, unknown>) => {
      const opt = optimizationRef.current;
      if (!opt || opt.isAnalyzing) return false;

      const fieldKey = latestField as SuggestionField;
      if (!opt.shouldUseReportForField(fieldKey)) return false;

      const { suggestions: fromReport, keywords: kwFromReport } = opt.getFieldSuggestions(
        fieldKey,
        latestFormData,
        searchValue
      );

      if (fieldKey === 'keywords') {
        if (kwFromReport.length === 0) return false;
        setKeywords(kwFromReport);
      } else {
        if (fromReport.length === 0) return false;
        setSuggestionItems((prev) => {
          const merged = mergeSuggestionItems(prev, fromReport, 'append-new');
          suggestionItemsRef.current = merged;
          return merged;
        });
        if (kwFromReport.length > 0) setKeywords(kwFromReport);
      }

      setShowSuggestions(true);
      setPanelDismissed(false);
      setError(null);
      return true;
    },
    []
  );

  // Helper function for REST API fallback (defined first to be used in fetchSuggestions)
  const fetchSuggestionsRest = useCallback(async (
    inputValue?: string,
    options?: FetchOptions,
    parentGeneration?: number
  ) => {
    const searchValue = inputValue || currentValue;
    const regenerate = !!options?.regenerate;
    const source = options?.source || 'auto';
    const generation = parentGeneration ?? ++fetchGenerationRef.current;
    if (regenerate) regenerateCounterRef.current += 1;
    
    if (loadingRef.current) return;

    const opt = optimizationRef.current;
    if (opt?.isAnalyzing) {
      setError('Full resume analysis in progress — try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const latestFormData = formDataRef.current;
      const latestField = fieldRef.current;

      if (
        source === 'manual' &&
        !regenerate &&
        tryReportFirstSuggestions(latestField, searchValue, latestFormData)
      ) {
        setLoading(false);
        return;
      }

      const jobTitle =
        opt?.resolvedRole ||
        String(latestFormData.jobTitle || latestFormData.title || '');
      const industry = String(latestFormData.industry || '');
      const experienceLevel =
        opt?.experienceLevel ||
        String(latestFormData.experienceLevel || 'experienced');
      const jobDescription =
        opt?.hasJobDescription ? opt.jobDescription.trim() : '';

      const smartContext = buildSmartSuggestionContext({
        formData: latestFormData,
        currentSection: latestField,
        currentField: latestField,
        userInput: searchValue,
        jobDescription,
        resolvedRole: jobTitle,
        excludeSuggestions: regenerate
          ? suggestionItemsRef.current.map((i) => i.text)
          : [],
        regenerate,
        regenerateIndex: regenerateCounterRef.current,
      });

      // Summary + experience bullets: form-suggestions (resume-aware, not job postings)
      if (latestField === 'summary' || latestField === 'experience') {
        const timestamp = Date.now();
        const requestId = Math.random().toString(36).substr(2, 9);
        const apiField = latestField === 'experience' ? 'experience' : 'summary';
        
        const response = await fetch(`/api/ai/form-suggestions?t=${timestamp}&r=${requestId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: apiField,
            value: searchValue,
            formData: latestFormData,
            regenerate,
            excludeSuggestions: regenerate
              ? suggestionItemsRef.current.map((i) => i.text)
              : [],
            jobDescription: jobDescription || undefined,
            context: {
              ...smartContext,
              jobTitle,
              experienceLevel,
              industry,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        console.log('✅ AI form suggestions received:', { 
          field: latestField, 
          suggestionsCount: data.suggestions?.length,
          provider: data.aiProvider 
        });

        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          const minLen = latestField === 'summary' ? 50 : 20;
          const validSuggestions = data.suggestions
            .filter((s: string) => s && s.trim().length >= minLen)
            .slice(0, latestField === 'summary' ? 8 : 6);

          if (validSuggestions.length > 0) {
            const mode = pickMergeMode(suggestionItemsRef.current, { regenerate, source });
            commitFetched(validSuggestions, mode, generation);
          } else if (suggestionItemsRef.current.length === 0) {
            setError('No valid suggestions received');
          }
        } else if (suggestionItemsRef.current.length === 0) {
          setError('No suggestions available');
        }
        return;
      }

      // For other fields (skills, experience, keywords), use ats-suggestions API
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
          ...(jobDescription.length >= 40 ? { job_description: jobDescription } : {}),
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
      handleAblyResult(data, latestField, searchValue, generation, options);
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        console.error('❌ Error fetching AI suggestions (REST):', err);
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [currentValue, handleAblyResult, commitFetched, tryReportFirstSuggestions]);

  // Memoize fetchSuggestions to avoid recreating on every render
  const fetchSuggestions = useCallback(async (inputValue?: string, options?: FetchOptions) => {
    const searchValue = inputValue || currentValue;
    const generation = ++fetchGenerationRef.current;

    if (loadingRef.current) return;

    const opt = optimizationRef.current;
    if (opt?.isAnalyzing) {
      setError('Full resume analysis in progress — try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const latestFormData = formDataRef.current;
      const latestField = fieldRef.current;
      const source = options?.source || 'manual';

      if (
        source === 'manual' &&
        !options?.regenerate &&
        tryReportFirstSuggestions(latestField, searchValue, latestFormData)
      ) {
        setLoading(false);
        return;
      }

      const jobTitle =
        opt?.resolvedRole ||
        String(latestFormData.jobTitle || latestFormData.title || '');
      const industry = String(latestFormData.industry || '');
      const experienceLevel =
        opt?.experienceLevel ||
        String(latestFormData.experienceLevel || 'experienced');

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

      // Resume summary/experience use form-suggestions (not ATS job-posting style)
      if (latestField === 'summary' || latestField === 'experience') {
        await fetchSuggestionsRest(inputValue, { ...options, source }, generation);
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
        }
        return;
      }

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
            if (generation === fetchGenerationRef.current) {
              setError(resultData.error);
              setLoading(false);
            }
            fetchSuggestionsRest(inputValue, { ...options, source }, generation);
            return;
          }

          if (resultData.requestId === requestId && resultData.data) {
            console.log('✅ Processing Ably result for request:', requestId);
            handleAblyResult(resultData.data, latestField, searchValue, generation, options);
            if (generation === fetchGenerationRef.current) {
              setLoading(false);
            }
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
          if (loadingRef.current && generation === fetchGenerationRef.current) {
            console.log('⏱️ Ably timeout (8s), falling back to REST API');
            setUseAbly(false);
            setLoading(false);
            fetchSuggestionsRest(inputValue, { ...options, source }, generation);
          }
        }, 8000);

        return;
      }

      await fetchSuggestionsRest(inputValue, { ...options, source }, generation);
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        console.error('❌ Error in fetchSuggestions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
        setLoading(false);
      }
    }
  }, [currentValue, useAbly, handleAblyResult, fetchSuggestionsRest, tryReportFirstSuggestions]);

  useEffect(() => {
    if (optimization?.isAnalyzing) return;
    if (Date.now() < applyLockUntilRef.current) return;
    if (skipNextAutoFetchRef.current) {
      skipNextAutoFetchRef.current = false;
      return;
    }
    if (autoTrigger && debouncedValue && debouncedValue.trim().length >= 2) {
      fetchSuggestions(debouncedValue, { source: 'auto' });
    }
  }, [debouncedValue, autoTrigger, fetchSuggestions, optimization?.isAnalyzing]);

  const handleApply = (suggestion: string) => {
    fetchGenerationRef.current += 1;
    applyLockUntilRef.current = Date.now() + 3000;
    skipNextAutoFetchRef.current = true;
    onApply(suggestion);
    setSuggestionItems((prev) => {
      const next = markItemApplied(prev, suggestion);
      suggestionItemsRef.current = next;
      return next;
    });
    setShowSuggestions(true);
    setPanelDismissed(false);
    setError(null);
  };

  const handleApplyAll = () => {
    if (onApplyMultiple && suggestionItems.length > 0) {
      fetchGenerationRef.current += 1;
      applyLockUntilRef.current = Date.now() + 3000;
      skipNextAutoFetchRef.current = true;
      const texts = suggestionItems.map((i) => i.text);
      onApplyMultiple(texts);
      setSuggestionItems((prev) => {
        const next = markAllApplied(prev);
        suggestionItemsRef.current = next;
        return next;
      });
      setShowSuggestions(true);
      setPanelDismissed(false);
      setError(null);
    }
  };

  const hasSuggestions =
    field === 'keywords' ? keywords.length > 0 : suggestionItems.length > 0;
  const panelVisible = hasSuggestions && (showSuggestions || !panelDismissed);

  if (!panelVisible && !loading && !hasSuggestions) {
    const canFetch =
      !!currentValue.trim() ||
      !!(optimization?.resolvedRole && optimization.shouldUseReportForField(field));
    return (
      <div className={cn('space-y-1', className)}>
        {optimization?.resolvedRole && (
          <p className="text-xs text-slate-600">
            Suggestions tailored for <strong>{optimization.resolvedRole}</strong>
            {optimization.hasJobDescription && !optimization.isReportStale
              ? ' (job description applied).'
              : '.'}
          </p>
        )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchSuggestions(undefined, { source: 'manual' })}
          disabled={loading || !canFetch}
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
          {field === 'skills' && 'Get skills recruiters expect for your role'}
          {field === 'experience' && 'Get achievement bullet points'}
          {field === 'keywords' && 'Get ATS keywords for your role'}
        </span>
      </div>
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
          onClick={() => {
            setPanelDismissed(true);
            setShowSuggestions(false);
          }}
          className="h-6 w-6 p-0"
          title="Collapse suggestions"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Error Message — only when no cards to show */}
      {error && !hasSuggestions && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Collapsed but data retained */}
      {hasSuggestions && panelDismissed && !showSuggestions && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs w-full"
          onClick={() => {
            setPanelDismissed(false);
            setShowSuggestions(true);
          }}
        >
          Show {suggestionItems.length} suggestions
        </Button>
      )}

      {/* Suggestions List */}
      {panelVisible && (
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
              {suggestionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleApply(item.text)}
                  className={cn(
                    'w-full text-left p-2 rounded border transition-colors text-sm',
                    item.applied
                      ? 'bg-green-50 border-green-200 text-gray-800 hover:bg-green-100'
                      : 'bg-white border-blue-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TrendingUp
                        className={cn(
                          'w-4 h-4 flex-shrink-0 mt-0.5',
                          item.applied ? 'text-green-600' : 'text-blue-500'
                        )}
                      />
                      <span className="flex-1">{item.text}</span>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium shrink-0',
                        item.applied ? 'text-green-700' : 'text-blue-600'
                      )}
                    >
                      {item.applied ? 'Applied' : 'Use'}
                    </span>
                  </div>
                </button>
              ))}
              {field === 'skills' && suggestionItems.length > 1 && onApplyMultiple && (
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
      {panelVisible && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fetchSuggestions(undefined, { regenerate: true, source: 'manual' })}
          disabled={loading}
          className="text-xs w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Regenerate
            </>
          )}
        </Button>
      )}
    </div>
  );
}

