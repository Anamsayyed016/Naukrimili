'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InputWithSuggestionsProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'tel';
  className?: string;
  fieldType?: 'summary' | 'description' | 'position' | 'company' | 'other';
  formData?: Record<string, any>;
  experienceLevel?: string;
}

export default function InputWithSuggestions({
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
}: InputWithSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Use ATS suggestions API for comprehensive suggestions
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
        
        // Map suggestions based on field type
        let fieldSuggestions: string[] = [];
        if (fieldType === 'summary' && data.summary) {
          fieldSuggestions = [data.summary];
        } else if (fieldType === 'description' && data.experience_bullets) {
          fieldSuggestions = data.experience_bullets.slice(0, 5);
        } else if (fieldType === 'position' && data.ats_keywords) {
          // Filter job title related keywords
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
          setOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [value, fieldType, formData, experienceLevel, loading]);

  const applySuggestion = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchSuggestions}
              disabled={loading}
              className="h-7 px-2 text-xs"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="ml-1 hidden sm:inline">AI</span>
            </Button>
          </PopoverTrigger>
          {suggestions.length > 0 && (
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-semibold text-gray-500">AI Suggestions</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
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
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <span className="line-clamp-2">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

