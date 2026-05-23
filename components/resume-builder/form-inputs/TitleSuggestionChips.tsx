'use client';

/**
 * Inline job-title / role suggestions (contacts + experience).
 * Uses existing form-suggestions API — no duplicate engine.
 */

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { buildSmartSuggestionContext } from '@/lib/resume-builder/suggestion-context-engine';
import { useResumeOptimizationOptional } from '@/components/resume-builder/ResumeOptimizationProvider';
import {
  mergeSuggestionItems,
  pickMergeMode,
  stringsToItems,
  itemsToDisplayTexts,
} from '@/lib/resume-builder/suggestion-items';

export type TitleSuggestionSection = 'contacts' | 'experience';

interface TitleSuggestionChipsProps {
  value: string;
  onApply: (title: string) => void;
  formData: Record<string, unknown>;
  section: TitleSuggestionSection;
  className?: string;
}

export default function TitleSuggestionChips({
  value,
  onApply,
  formData,
  section,
  className,
}: TitleSuggestionChipsProps) {
  const optimization = useResumeOptimizationOptional();
  const debouncedValue = useDebounce(value, 600);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(() => new Set());
  const skipFetchRef = useRef(false);
  const applyLockUntilRef = useRef(0);
  const appliedRef = useRef(applied);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  appliedRef.current = applied;

  useEffect(() => {
    const trimmed = debouncedValue?.trim() ?? '';
    if (trimmed.length < 2) {
      if (!value.trim()) setSuggestions([]);
      return;
    }
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    if (Date.now() < applyLockUntilRef.current) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const jobDescription = optimization?.hasJobDescription
          ? optimization.jobDescription.trim()
          : '';
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'title',
            value: debouncedValue,
            formData: formDataRef.current,
            jobDescription: jobDescription || undefined,
            context: buildSmartSuggestionContext({
              formData: formDataRef.current,
              currentSection: section === 'contacts' ? 'contacts' : 'experience',
              currentField: section === 'contacts' ? 'jobTitle' : 'title',
              userInput: debouncedValue,
              jobDescription,
              resolvedRole: optimization?.resolvedRole || debouncedValue,
            }),
          }),
        });

        if (cancelled || !response.ok) return;

        const data = await response.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions((prev) => {
            const currentItems = stringsToItems(
              prev,
              prev.map((text) => ({
                id: text,
                text,
                applied: appliedRef.current.has(text.toLowerCase()),
              }))
            );
            const mode = pickMergeMode(currentItems, { source: 'auto' });
            return itemsToDisplayTexts(
              mergeSuggestionItems(currentItems, data.suggestions, mode)
            );
          });
        }
      } catch (error) {
        console.error('Failed to fetch title suggestions:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedValue,
    value,
    section,
    optimization?.hasJobDescription,
    optimization?.jobDescription,
    optimization?.resolvedRole,
  ]);

  const handleSelect = (suggestion: string) => {
    skipFetchRef.current = true;
    applyLockUntilRef.current = Date.now() + 3000;
    onApply(suggestion);
    setApplied((prev) => new Set(prev).add(suggestion.toLowerCase()));
  };

  if (!loading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-2 space-y-1', className)}>
      {suggestions.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Sparkles className="w-3 h-3" />
            <span>AI Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'text-xs px-2 py-1 rounded border transition-colors',
                  applied.has(suggestion.toLowerCase())
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                )}
              >
                {applied.has(suggestion.toLowerCase()) ? `${suggestion} ✓` : suggestion}
              </button>
            ))}
          </div>
        </>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Getting AI suggestions...</span>
        </div>
      )}
    </div>
  );
}
