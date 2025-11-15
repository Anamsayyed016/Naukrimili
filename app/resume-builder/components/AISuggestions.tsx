'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISuggestion } from '../types';

interface AISuggestionsProps {
  fieldValue: string;
  fieldType: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship';
  onSuggestionSelect: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
  context?: {
    jobTitle?: string;
    experienceLevel?: string;
    skills?: string[];
    industry?: string;
  };
}

export default function AISuggestions({
  fieldValue,
  fieldType,
  onSuggestionSelect,
  placeholder,
  className,
  context = {},
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fetch suggestions with debounce - CRITICAL: This runs on every fieldValue change
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If field is empty, hide suggestions
    if (!fieldValue || fieldValue.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    // For very short values (1 character), show default suggestions immediately
    if (fieldValue.length === 1) {
      const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
      setSuggestions(defaultSugs);
      setShowDropdown(defaultSugs.length > 0);
      setLoading(false);
      return;
    }

    // For 2+ characters, show loading immediately and fetch AI suggestions
    setLoading(true);
    setShowDropdown(true);

    // Debounce API call to avoid too many requests
    timeoutRef.current = setTimeout(async () => {
      try {
        // Map fieldType to API field format
        const fieldMap: Record<string, string> = {
          'summary': 'summary',
          'skill': 'skills',
          'description': 'description',
          'bullet': 'description',
          'keyword': 'skills',
          'project': 'description',
          'certification': 'description',
          'language': 'skills',
          'achievement': 'description',
          'internship': 'description',
        };
        const apiField = fieldMap[fieldType] || fieldType;

        // Call AI suggestion API with current fieldValue and context
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: apiField,
            value: fieldValue, // This will be the latest value due to closure
            type: fieldType,
            context: {
              jobTitle: context.jobTitle || '',
              experienceLevel: context.experienceLevel || '',
              skills: context.skills || [],
              industry: context.industry || '',
              userInput: fieldValue, // What user is currently typing
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const suggestionsList = data.suggestions || [];
          
          if (suggestionsList.length > 0) {
            setSuggestions(suggestionsList.map((s: string) => ({
              text: s,
              type: fieldType,
              confidence: data.confidence ? data.confidence / 100 : 0.8,
            })));
            setShowDropdown(true);
          } else {
            // If no AI suggestions, show default
            const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
            setSuggestions(defaultSugs);
            setShowDropdown(defaultSugs.length > 0);
          }
        } else {
          // Fallback to default suggestions
          const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
          setSuggestions(defaultSugs);
          setShowDropdown(defaultSugs.length > 0);
        }
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        // Fallback to default suggestions
        const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
        setSuggestions(defaultSugs);
        setShowDropdown(defaultSugs.length > 0);
      } finally {
        setLoading(false);
      }
    }, 250); // Reduced to 250ms for faster response

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fieldValue, fieldType, context]); // This effect runs whenever fieldValue or context changes

  // Close dropdown on outside click (but not when clicking on suggestions)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the input field itself
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        setShowDropdown(false);
      }
    };

    // Use a slight delay to allow click events to process first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDefaultSuggestions = (value: string, type: string): AISuggestion[] => {
    // Default manual suggestions when AI is unavailable
    if (type === 'skill') {
      return [
        { text: 'JavaScript', type: 'skill', confidence: 0.8 },
        { text: 'React', type: 'skill', confidence: 0.8 },
        { text: 'Node.js', type: 'skill', confidence: 0.7 },
        { text: 'Python', type: 'skill', confidence: 0.7 },
      ].filter(s => s.text.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
    }

    if (type === 'summary') {
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      const userInput = value.toLowerCase();
      
      // Teaching/Education suggestions
      if (jobTitle.includes('teacher') || jobTitle.includes('educator') || jobTitle.includes('tutor') || userInput.includes('teacher')) {
        return [
          { text: 'Dedicated and passionate educator with strong commitment to student success and innovative teaching methodologies.', type: 'summary', confidence: 0.9 },
          { text: 'Experienced teacher with proven ability to create engaging learning environments and foster academic excellence.', type: 'summary', confidence: 0.9 },
          { text: 'Results-oriented educator with expertise in curriculum development and student-centered instructional approaches.', type: 'summary', confidence: 0.8 },
        ];
      }
      
      // Software/Tech suggestions
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer') || jobTitle.includes('software')) {
        return [
          { text: 'Experienced software developer with strong technical skills and passion for creating innovative solutions.', type: 'summary', confidence: 0.9 },
          { text: 'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.', type: 'summary', confidence: 0.9 },
          { text: 'Passionate developer with excellent problem-solving abilities and strong communication skills.', type: 'summary', confidence: 0.8 },
        ];
      }
      
      // Generic suggestions based on job title
      if (context?.jobTitle) {
        return [
          { text: `Experienced ${context.jobTitle} with strong skills and passion for delivering exceptional results.`, type: 'summary', confidence: 0.8 },
          { text: `Results-driven ${context.jobTitle} with proven track record of success and commitment to excellence.`, type: 'summary', confidence: 0.8 },
          { text: `Dedicated ${context.jobTitle} with expertise in relevant field and ability to drive positive outcomes.`, type: 'summary', confidence: 0.7 },
        ];
      }
      
      // Default software developer suggestions
      return [
        { text: 'Experienced software developer with strong technical skills and passion for creating innovative solutions.', type: 'summary', confidence: 0.8 },
        { text: 'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.', type: 'summary', confidence: 0.8 },
        { text: 'Passionate developer with excellent problem-solving abilities and strong communication skills.', type: 'summary', confidence: 0.7 },
      ];
    }

    if (type === 'bullet' || type === 'description') {
      return [
        { text: `Developed and maintained ${value}`, type: 'bullet', confidence: 0.8 },
        { text: `Led team of 5+ developers working on ${value}`, type: 'bullet', confidence: 0.7 },
        { text: `Improved performance of ${value} by 40%`, type: 'bullet', confidence: 0.7 },
      ].slice(0, 3);
    }

    if (type === 'project') {
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      if (jobTitle.includes('developer') || jobTitle.includes('engineer')) {
        return [
          { text: 'E-Commerce Platform', type: 'project', confidence: 0.9 },
          { text: 'Task Management Application', type: 'project', confidence: 0.9 },
          { text: 'Social Media Dashboard', type: 'project', confidence: 0.8 },
          { text: 'Real-time Chat Application', type: 'project', confidence: 0.8 },
          { text: 'Weather Forecast App', type: 'project', confidence: 0.7 },
        ].filter(p => p.text.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
      }
      return [
        { text: 'Portfolio Website', type: 'project', confidence: 0.8 },
        { text: 'Business Management System', type: 'project', confidence: 0.8 },
        { text: 'Data Analysis Tool', type: 'project', confidence: 0.7 },
      ].slice(0, 3);
    }

    if (type === 'certification') {
      return [
        { text: 'AWS Certified Solutions Architect', type: 'certification', confidence: 0.9 },
        { text: 'Google Cloud Professional', type: 'certification', confidence: 0.9 },
        { text: 'Microsoft Azure Fundamentals', type: 'certification', confidence: 0.8 },
        { text: 'Certified Scrum Master (CSM)', type: 'certification', confidence: 0.8 },
        { text: 'PMP Certification', type: 'certification', confidence: 0.7 },
      ].filter(c => c.text.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
    }

    if (type === 'language') {
      const commonLanguages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Japanese', 'Arabic', 'Portuguese', 'Russian'];
      return commonLanguages
        .filter(lang => lang.toLowerCase().includes(value.toLowerCase()))
        .map(lang => ({ text: lang, type: 'language', confidence: 0.9 }))
        .slice(0, 5);
    }

    if (type === 'achievement') {
      return [
        { text: 'Employee of the Year', type: 'achievement', confidence: 0.9 },
        { text: 'Best Project Award', type: 'achievement', confidence: 0.9 },
        { text: 'Outstanding Performance Recognition', type: 'achievement', confidence: 0.8 },
        { text: 'Innovation Award', type: 'achievement', confidence: 0.8 },
        { text: 'Leadership Excellence Award', type: 'achievement', confidence: 0.7 },
      ].filter(a => a.text.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
    }

    if (type === 'internship') {
      return [
        { text: 'Software Development Intern', type: 'internship', confidence: 0.9 },
        { text: 'Data Science Intern', type: 'internship', confidence: 0.9 },
        { text: 'Marketing Intern', type: 'internship', confidence: 0.8 },
        { text: 'Business Analyst Intern', type: 'internship', confidence: 0.8 },
      ].filter(i => i.text.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
    }

    return [];
  };

  // Always render the component but conditionally show it
  // This prevents remounting and losing state
  if (!showDropdown) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      data-suggestion="true"
      className={cn(
        'absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto ai-suggestions-dropdown pointer-events-auto',
        className
      )}
      style={{ pointerEvents: 'auto' }}
    >
      {loading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Getting AI suggestions...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="p-2">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => {
                // Prevent input from losing focus when clicking suggestion
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Close dropdown immediately to prevent blocking other UI
                setShowDropdown(false);
                // Apply the suggestion
                onSuggestionSelect(suggestion.text);
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-gray-900">{suggestion.text}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

