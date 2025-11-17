'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISuggestion } from '../types';

export interface AISuggestionsProps {
  fieldValue: string;
  fieldType: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship' | 'company' | 'position';
  onSuggestionSelect: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
  inputElementId?: string; // ID of the input/textarea element for positioning
  context?: {
    jobTitle?: string;
    experienceLevel?: string;
    skills?: string[];
    industry?: string;
    isProjectDescription?: boolean;
  };
}

// Fields that can use Typesense for instant results
const TYPESENSE_COMPATIBLE_FIELDS: Record<string, 'job_titles' | 'companies' | 'locations' | 'skills'> = {
  'skill': 'skills',
  'keyword': 'skills',
  'company': 'companies',
  'position': 'job_titles',
};

// Check if field can use Typesense
const isTypesenseCompatible = (fieldType: string): boolean => {
  return fieldType in TYPESENSE_COMPATIBLE_FIELDS;
};

export default function AISuggestions({
  fieldValue,
  fieldType,
  onSuggestionSelect,
  placeholder,
  className,
  inputElementId,
  context = {},
}: AISuggestionsProps): JSX.Element | null {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypesense, setLoadingTypesense] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [source, setSource] = useState<'typesense' | 'ai' | 'hybrid' | 'default'>('default');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const aiTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const justAppliedRef = useRef(false);
  const lastAppliedValueRef = useRef<string>('');
  const positionUpdateRef = useRef<number>();

  // Detect mobile and update position
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update dropdown position based on input field
  const updateDropdownPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    let targetElement: HTMLElement | null = null;

    // Priority 1: Use provided inputElementId
    if (inputElementId) {
      targetElement = document.getElementById(inputElementId);
    }

    // Priority 2: Use stored ref
    if (!targetElement && inputRef.current) {
      targetElement = inputRef.current;
    }

    // Priority 3: Use currently focused element
    if (!targetElement) {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        targetElement = activeElement as HTMLElement;
      }
    }

    // Priority 4: Find by fieldValue match (last resort)
    if (!targetElement && fieldValue && fieldValue.length >= 2) {
      const allInputs = document.querySelectorAll('input, textarea');
      targetElement = Array.from(allInputs).find(el => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const inputValue = input.value || '';
        return inputValue === fieldValue || 
               inputValue.includes(fieldValue.substring(0, Math.min(10, fieldValue.length))) ||
               fieldValue.includes(inputValue.substring(0, Math.min(10, inputValue.length)));
      }) as HTMLElement || null;
      
      if (targetElement) {
        inputRef.current = targetElement;
      }
    }

    // Priority 5: Find the last visible input/textarea in the document
    if (!targetElement) {
      const allInputs = Array.from(document.querySelectorAll('input, textarea')) as HTMLElement[];
      // Find inputs that are visible and in viewport
      targetElement = allInputs.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               rect.top >= 0 && rect.top < window.innerHeight;
      }) || null;
      
      if (targetElement) {
        inputRef.current = targetElement;
      }
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 300), // Minimum width for readability
        });
      }
    } else {
      console.debug('AISuggestions: Could not find target element for positioning', {
        inputElementId,
        fieldValue: fieldValue?.substring(0, 20),
        activeElement: document.activeElement?.tagName,
      });
    }
  }, [inputElementId, fieldValue]);

  // Update position when dropdown shows OR when loading/suggestions change
  useEffect(() => {
    const needsPosition = showDropdown || loading || loadingTypesense || suggestions.length > 0;
    
    if (needsPosition) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updateDropdownPosition();
      });
      
      // Update position on scroll/resize
      const handleUpdate = () => {
        updateDropdownPosition();
      };

      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [showDropdown, loading, loadingTypesense, suggestions.length, updateDropdownPosition]);

  // Fetch Typesense suggestions (instant, 10-30ms)
  const fetchTypesenseSuggestions = useCallback(async (query: string, collection: string): Promise<AISuggestion[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(query)}&type=${collection}&limit=8`,
        { signal: abortControllerRef.current?.signal }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (data.success && data.suggestions) {
        return data.suggestions.map((s: { text: string; type?: string }) => ({
          text: s.text,
          type: fieldType,
          confidence: 0.85, // Typesense results are high confidence
        }));
      }
      return [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return [];
      }
      console.debug('Typesense fetch error:', error);
      return [];
    }
  }, [fieldType]);

  // Fetch AI suggestions (context-aware, 500-1000ms)
  const fetchAISuggestions = useCallback(async (query: string, apiField: string): Promise<AISuggestion[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch('/api/ai/form-suggestions-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: apiField,
          value: query,
          type: fieldType,
          context: {
            jobTitle: context.jobTitle || '',
            experienceLevel: context.experienceLevel || '',
            skills: context.skills || [],
            industry: context.industry || '',
            userInput: query,
            isProjectDescription: context.isProjectDescription || false,
          },
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`AI suggestions API error (${response.status}):`, errorText.substring(0, 200));
        
        // Fallback to original API
        try {
          const fallbackResponse = await fetch('/api/ai/form-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field: apiField,
              value: query,
              type: fieldType,
              context: {
                jobTitle: context.jobTitle || '',
                experienceLevel: context.experienceLevel || '',
                skills: context.skills || [],
                industry: context.industry || '',
                userInput: query,
                isProjectDescription: context.isProjectDescription || false,
              },
            }),
            signal: abortControllerRef.current?.signal,
          });

          if (!fallbackResponse.ok) {
            console.warn(`Fallback API also failed (${fallbackResponse.status})`);
            return [];
          }
          
          const fallbackData = await fallbackResponse.json();
          const suggestions = (fallbackData.suggestions || []).map((s: string) => ({
            text: s,
            type: fieldType,
            confidence: fallbackData.confidence ? fallbackData.confidence / 100 : 0.8,
          }));
          console.debug(`Fallback API returned ${suggestions.length} suggestions`);
          return suggestions;
        } catch (fallbackError: any) {
          if (fallbackError.name !== 'AbortError') {
            console.warn('Fallback API error:', fallbackError);
          }
          return [];
        }
      }

      const data = await response.json();
      
      // Check if response indicates success
      if (data.success === false) {
        console.warn('API returned success: false', data.error || data.message);
        return [];
      }
      
      // Handle both string array and object array formats
      const suggestions = (data.suggestions || []).map((s: string | { text: string; confidence?: number }) => {
        if (typeof s === 'string') {
          return {
            text: s,
            type: fieldType,
            confidence: data.confidence ? data.confidence / 100 : 0.8,
          };
        } else {
          return {
            text: s.text,
            type: fieldType,
            confidence: s.confidence || (data.confidence ? data.confidence / 100 : 0.8),
          };
        }
      });
      
      // Log the response for debugging
      if (suggestions.length === 0) {
        console.debug(`AI suggestions API returned empty array for field "${apiField}" (${fieldType})`, {
          responseStatus: response.status,
          dataSuccess: data.success,
          dataSource: data.source,
          dataMessage: data.message,
        });
      } else {
        console.debug(`AI suggestions API returned ${suggestions.length} suggestions for field "${apiField}" (${fieldType})`);
      }
      
      return suggestions;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return [];
      }
      console.warn('AI fetch error:', error.message || error);
      return [];
    }
  }, [fieldType, context]);

  // Main effect: Fetch suggestions with hybrid approach
  useEffect(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    // If suggestion was just applied, don't show suggestions again immediately
    if (justAppliedRef.current && fieldValue === lastAppliedValueRef.current) {
      setShowDropdown(false);
      setSuggestions([]);
      setLoading(false);
      setLoadingTypesense(false);
      justAppliedRef.current = false;
      return;
    }

    // If field is empty, hide suggestions
    if (!fieldValue || fieldValue.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      setLoadingTypesense(false);
      justAppliedRef.current = false;
      return;
    }

    // For very short values (1 character), show default suggestions immediately
    if (fieldValue.length === 1) {
      const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
      setSuggestions(defaultSugs);
      setShowDropdown(defaultSugs.length > 0);
      setLoading(false);
      setLoadingTypesense(false);
      setSource('default');
      return;
    }

    // Map fieldType to API field format
    const fieldMap: Record<string, string> = {
      'summary': 'summary',
      'skill': 'skills',
      'description': 'description',
      'bullet': 'description',
      'keyword': 'skills',
      'project': 'project',
      'certification': 'certification',
      'language': 'language',
      'achievement': 'achievement',
      'internship': 'internship',
      'company': 'company',
      'position': 'position',
    };
    const apiField = fieldMap[fieldType] || fieldType;

    // Check if field is Typesense-compatible
    const canUseTypesense = isTypesenseCompatible(fieldType);
    const typesenseCollection = canUseTypesense ? TYPESENSE_COMPATIBLE_FIELDS[fieldType] : null;

    // Phase 1: Instant Typesense results (if compatible) - 150ms debounce
    if (canUseTypesense && typesenseCollection) {
      setLoadingTypesense(true);
      setShowDropdown(true);
      setSuggestions([]); // Clear previous suggestions

      timeoutRef.current = setTimeout(async () => {
        const typesenseResults = await fetchTypesenseSuggestions(fieldValue, typesenseCollection);
        
        if (!abortControllerRef.current?.signal.aborted) {
          if (typesenseResults.length > 0) {
            setSuggestions(typesenseResults);
            setSource('typesense');
            // CRITICAL: Set showDropdown BEFORE setLoadingTypesense(false)
            setShowDropdown(true);
            setLoadingTypesense(false);
          } else {
            // Even if no results, show dropdown if we're about to get AI results
            // CRITICAL: Set showDropdown BEFORE setLoadingTypesense(false)
            setShowDropdown(true);
            setLoadingTypesense(false);
          }
        }

        // Phase 2: AI enhancement in background (300ms debounce)
        aiTimeoutRef.current = setTimeout(async () => {
          if (abortControllerRef.current?.signal.aborted) return;

          setLoading(true);
          const aiResults = await fetchAISuggestions(fieldValue, apiField);

          if (!abortControllerRef.current?.signal.aborted) {
            if (aiResults.length > 0) {
              // Merge Typesense + AI results, remove duplicates
              const allSuggestions = [...typesenseResults, ...aiResults];
              const uniqueSuggestions = Array.from(
                new Map(allSuggestions.map(s => [s.text.toLowerCase(), s])).values()
              ).slice(0, 8);

              setSuggestions(uniqueSuggestions);
              setSource(typesenseResults.length > 0 ? 'hybrid' : 'ai');
              // CRITICAL: Set showDropdown BEFORE setLoading(false) to ensure shouldShow stays true
              setShowDropdown(true);
              setLoading(false);
            } else if (typesenseResults.length === 0) {
              // No Typesense results, show defaults
              const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
              if (defaultSugs.length > 0) {
                setSuggestions(defaultSugs);
                // CRITICAL: Set showDropdown BEFORE setLoading(false)
                setShowDropdown(true);
                setSource('default');
                setLoading(false);
              } else {
                // No suggestions available - hide dropdown
                setShowDropdown(false);
                setLoading(false);
              }
            } else {
              // We have Typesense results but no AI results - keep showing Typesense results
              // CRITICAL: Set showDropdown BEFORE setLoading(false)
              setShowDropdown(true);
              setLoading(false);
            }
          }
        }, 300);
      }, 150); // Fast debounce for Typesense
    } else {
      // Phase 1: AI only (for context-dependent fields) - 300ms debounce
      setLoading(true);
      setShowDropdown(true);
      setSuggestions([]); // Clear previous suggestions

      timeoutRef.current = setTimeout(async () => {
        const aiResults = await fetchAISuggestions(fieldValue, apiField);

        if (!abortControllerRef.current?.signal.aborted) {
          if (aiResults.length > 0) {
            setSuggestions(aiResults);
            setSource('ai');
            // CRITICAL: Set showDropdown BEFORE setLoading(false) to ensure shouldShow stays true
            setShowDropdown(true);
            setLoading(false);
          } else {
            // Fallback to defaults when API returns no results
            const defaultSugs = getDefaultSuggestions(fieldValue, fieldType);
            if (defaultSugs.length > 0) {
              setSuggestions(defaultSugs);
              // CRITICAL: Set showDropdown BEFORE setLoading(false)
              setShowDropdown(true);
              setSource('default');
              setLoading(false);
              console.debug(`Using default suggestions (${defaultSugs.length}) for ${fieldType} field`);
            } else {
              // No suggestions available - hide dropdown
              setShowDropdown(false);
              setLoading(false);
              console.debug(`No suggestions available for ${fieldType} field with value: "${fieldValue.substring(0, 20)}"`);
            }
          }
        }
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fieldValue, fieldType, context, fetchTypesenseSuggestions, fetchAISuggestions]);

  // Close dropdown on outside click (mobile-friendly)
  useEffect(() => {
    // Only set up click outside handler when dropdown should be visible
    const isVisible = showDropdown || loading || loadingTypesense;
    if (!isVisible) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Don't close if clicking on the input field itself
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        // Close dropdown and clear suggestions when clicking outside
        setShowDropdown(false);
        setSuggestions([]);
        setLoading(false);
        setLoadingTypesense(false);
      }
    };

    // Use a slight delay to allow click events to process first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown, loading, loadingTypesense]);

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
      const experienceLevel = context?.experienceLevel || 'mid';
      const skills = context?.skills || [];
      const topSkills = skills.slice(0, 3).join(', ');
      
      // Teaching/Education - Comprehensive professional summaries
      if (jobTitle.includes('teacher') || jobTitle.includes('educator') || jobTitle.includes('tutor') || userInput.includes('teacher')) {
        return [
          { text: `Dedicated and passionate educator with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive experience in' : 'proven expertise in'} teaching methodologies and curriculum development. Committed to fostering student success through innovative instructional approaches and creating engaging learning environments. ${experienceLevel === 'senior' ? 'Demonstrated leadership in educational program development and mentoring fellow educators.' : 'Strong ability to adapt teaching methods to diverse learning styles and individual student needs.'} Excellent communication skills and passion for inspiring lifelong learning in students.`, type: 'summary', confidence: 0.9 },
          { text: `Experienced teacher with ${experienceLevel === 'entry' ? 'a solid foundation in' : experienceLevel === 'senior' ? 'over a decade of' : 'proven track record of'} creating dynamic and inclusive classroom environments that promote academic excellence. ${experienceLevel === 'senior' ? 'Led curriculum development initiatives and mentored junior faculty members.' : 'Skilled in developing and implementing student-centered instructional strategies.'} Strong expertise in assessment design, differentiated instruction, and educational technology integration. Passionate about student growth and committed to continuous professional development.`, type: 'summary', confidence: 0.9 },
          { text: `Results-oriented educator with ${experienceLevel === 'entry' ? 'a strong academic background and' : experienceLevel === 'senior' ? 'extensive' : 'demonstrated'} expertise in curriculum development and student-centered instructional approaches. ${experienceLevel === 'senior' ? 'Successfully managed educational programs and collaborated with stakeholders to enhance learning outcomes.' : 'Proven ability to design and deliver engaging lessons that cater to diverse learning needs.'} Excellent classroom management skills and ability to build positive relationships with students, parents, and colleagues. Committed to fostering critical thinking and preparing students for future success.`, type: 'summary', confidence: 0.8 },
        ];
      }
      
      // Software/Tech - Comprehensive professional summaries
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer') || jobTitle.includes('software')) {
        const skillContext = topSkills ? `Proficient in ${topSkills} and` : 'Skilled in';
        return [
          { text: `${experienceLevel === 'entry' ? 'Motivated' : experienceLevel === 'senior' ? 'Accomplished' : 'Experienced'} software ${jobTitle.includes('engineer') ? 'engineer' : 'developer'} with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive expertise in' : 'proven proficiency in'} modern technologies and software development best practices. ${skillContext} ${topSkills ? 'other cutting-edge technologies' : 'various programming languages and frameworks'}, with a passion for creating scalable, efficient, and innovative solutions. ${experienceLevel === 'senior' ? 'Led cross-functional teams in delivering complex projects and mentored junior developers.' : 'Strong problem-solving abilities and commitment to writing clean, maintainable code.'} Excellent collaboration skills and ability to work effectively in agile environments.`, type: 'summary', confidence: 0.9 },
          { text: `Results-driven ${experienceLevel === 'entry' ? 'emerging' : experienceLevel === 'senior' ? 'senior' : ''} software professional with ${experienceLevel === 'entry' ? 'a solid academic background and' : experienceLevel === 'senior' ? 'a proven track record of' : 'demonstrated expertise in'} full-stack development and delivering high-quality software solutions. ${topSkills ? `Specialized in ${topSkills}` : 'Proficient in multiple programming languages and frameworks'}, with experience in building robust applications that meet business requirements. ${experienceLevel === 'senior' ? 'Successfully architected and implemented enterprise-level systems, improving performance and scalability.' : 'Strong analytical thinking and ability to translate complex requirements into efficient code.'} Committed to continuous learning and staying current with industry trends and best practices.`, type: 'summary', confidence: 0.9 },
          { text: `Passionate ${jobTitle.includes('engineer') ? 'engineer' : 'developer'} with ${experienceLevel === 'entry' ? 'strong technical skills and' : experienceLevel === 'senior' ? 'extensive experience in' : 'excellent problem-solving abilities and'} expertise in ${topSkills || 'software development'}. ${experienceLevel === 'senior' ? 'Led multiple successful projects from conception to deployment, collaborating with stakeholders and technical teams.' : 'Proven ability to design and implement efficient solutions while maintaining code quality and following best practices.'} Strong foundation in computer science principles, with experience in agile methodologies and version control systems. ${experienceLevel === 'senior' ? 'Mentored team members and contributed to technical decision-making processes.' : 'Excellent communication skills and ability to work collaboratively in fast-paced environments.'} Dedicated to writing clean, maintainable code and continuously improving technical skills.`, type: 'summary', confidence: 0.8 },
        ];
      }
      
      // Generic professional summaries - Comprehensive
      const professionalTitle = context?.jobTitle || 'professional';
      return [
        { text: `${experienceLevel === 'entry' ? 'Motivated' : experienceLevel === 'senior' ? 'Accomplished' : 'Experienced'} ${professionalTitle} with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive expertise in' : 'proven proficiency in'} ${topSkills || 'relevant field'}. ${experienceLevel === 'senior' ? 'Demonstrated leadership in driving strategic initiatives and delivering exceptional results across multiple projects.' : 'Strong analytical and problem-solving skills with a track record of successfully completing complex tasks.'} ${topSkills ? `Specialized knowledge in ${topSkills}` : 'Comprehensive understanding of industry best practices'}, combined with excellent communication and collaboration abilities. ${experienceLevel === 'senior' ? 'Mentored team members and contributed to organizational growth.' : 'Committed to continuous learning and professional development.'} Passionate about delivering high-quality work and exceeding expectations.`, type: 'summary', confidence: 0.8 },
        { text: `Results-driven ${professionalTitle} with ${experienceLevel === 'entry' ? 'a solid academic background and' : experienceLevel === 'senior' ? 'a proven track record of' : 'demonstrated expertise in'} ${topSkills || 'relevant domain'}. ${experienceLevel === 'senior' ? 'Successfully led cross-functional teams and managed complex projects from inception to completion.' : 'Strong ability to analyze situations, identify opportunities, and implement effective solutions.'} ${topSkills ? `Proficient in ${topSkills}` : 'Skilled in various tools and methodologies'}, with experience in ${experienceLevel === 'senior' ? 'strategic planning and execution' : 'meeting deadlines and managing priorities'}. ${experienceLevel === 'senior' ? 'Built strong relationships with stakeholders and contributed to business growth.' : 'Excellent attention to detail and commitment to quality.'} Adaptable and eager to take on new challenges in dynamic environments.`, type: 'summary', confidence: 0.8 },
        { text: `Dedicated ${professionalTitle} with ${experienceLevel === 'entry' ? 'strong foundational knowledge and' : experienceLevel === 'senior' ? 'extensive experience in' : 'proven ability in'} ${topSkills || 'relevant field'}. ${experienceLevel === 'senior' ? 'Led initiatives that resulted in measurable improvements and organizational success.' : 'Demonstrated success in managing multiple projects and delivering results under tight deadlines.'} ${topSkills ? `Expertise in ${topSkills}` : 'Comprehensive skill set'} combined with strong analytical thinking and attention to detail. ${experienceLevel === 'senior' ? 'Mentored colleagues and contributed to team development and knowledge sharing.' : 'Excellent interpersonal skills and ability to work effectively both independently and as part of a team.'} Committed to excellence and continuous improvement in all professional endeavors.`, type: 'summary', confidence: 0.7 },
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

    if (type === 'company') {
      const commonCompanies = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Oracle',
        'IBM', 'Accenture', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Tech Mahindra',
        'HCL Technologies', 'Capgemini', 'Deloitte', 'PwC', 'EY', 'KPMG', 'JP Morgan',
        'Goldman Sachs', 'Morgan Stanley', 'Salesforce', 'SAP', 'VMware', 'Intel', 'NVIDIA'
      ];
      return commonCompanies
        .filter(company => company.toLowerCase().includes(value.toLowerCase()))
        .map(company => ({ text: company, type: 'company', confidence: 0.8 }))
        .slice(0, 5);
    }

    if (type === 'position') {
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      const userInput = value.toLowerCase();
      
      // Software/Tech positions
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('software') || userInput.includes('developer') || userInput.includes('engineer')) {
        return [
          { text: 'Software Engineer', type: 'position', confidence: 0.9 },
          { text: 'Full Stack Developer', type: 'position', confidence: 0.9 },
          { text: 'Senior Software Developer', type: 'position', confidence: 0.8 },
          { text: 'Frontend Developer', type: 'position', confidence: 0.8 },
          { text: 'Backend Engineer', type: 'position', confidence: 0.8 },
          { text: 'DevOps Engineer', type: 'position', confidence: 0.7 },
        ].filter(p => p.text.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
      }
      
      // Generic positions
      const commonPositions = [
        'Software Engineer', 'Product Manager', 'Data Scientist', 'Business Analyst',
        'Project Manager', 'Marketing Manager', 'Sales Executive', 'HR Manager',
        'Financial Analyst', 'Operations Manager', 'Quality Assurance Engineer',
        'UI/UX Designer', 'System Administrator', 'Network Engineer', 'Database Administrator'
      ];
      return commonPositions
        .filter(pos => pos.toLowerCase().includes(value.toLowerCase()))
        .map(pos => ({ text: pos, type: 'position', confidence: 0.8 }))
        .slice(0, 5);
    }

    return [];
  };

  // Always render the component but conditionally show it
  // This prevents remounting and losing state
  // Show dropdown when:
  // 1. Explicitly requested (showDropdown = true)
  // 2. Actively loading (loading or loadingTypesense = true)
  // 3. We have suggestions AND showDropdown hasn't been explicitly set to false (this handles async updates)
  const shouldShow = showDropdown || loading || loadingTypesense || (suggestions.length > 0 && showDropdown !== false);
  
  // Debug logging (remove in production) - MUST be before any early returns
  useEffect(() => {
    if (shouldShow && suggestions.length === 0 && !loading && !loadingTypesense) {
      console.debug('AISuggestions: shouldShow but no content', { showDropdown, loading, loadingTypesense, suggestionsCount: suggestions.length });
    }
    if (shouldShow && !dropdownPosition) {
      console.debug('AISuggestions: shouldShow but no position yet', { inputElementId, fieldValue: fieldValue.substring(0, 20) });
    }
  }, [shouldShow, suggestions.length, loading, loadingTypesense, showDropdown, dropdownPosition, inputElementId, fieldValue]);
  
  // Force position calculation if we should show but don't have position yet - MUST be before any early returns
  useEffect(() => {
    if (shouldShow && !dropdownPosition && typeof window !== 'undefined') {
      // Try to update position immediately
      updateDropdownPosition();
      // Also try after a short delay in case DOM isn't ready
      const timeoutId = setTimeout(() => {
        updateDropdownPosition();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldShow, dropdownPosition, updateDropdownPosition]);
  
  // Early return AFTER all hooks - this is critical for React's Rules of Hooks
  if (!shouldShow) {
    return null;
  }

  // Source badge color
  const sourceColors = {
    typesense: 'bg-green-100 text-green-700 border-green-200',
    ai: 'bg-blue-100 text-blue-700 border-blue-200',
    hybrid: 'bg-purple-100 text-purple-700 border-purple-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sourceIcons = {
    typesense: <Zap className="w-3 h-3" />,
    ai: <Sparkles className="w-3 h-3" />,
    hybrid: <Sparkles className="w-3 h-3" />,
    default: <Sparkles className="w-3 h-3" />,
  };

  // Dropdown content
  const dropdownContent = (
    <div
      ref={dropdownRef}
      data-suggestion="true"
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-2xl',
        'max-h-[60vh] sm:max-h-[500px] overflow-y-auto',
        'ai-suggestions-dropdown pointer-events-auto',
        'fixed', // Always fixed when using portal
        className
      )}
      style={{ 
        pointerEvents: 'auto',
        zIndex: 999999, // Even higher z-index since we're using portal
        // Always use fixed positioning when using portal (both mobile and desktop)
        ...(dropdownPosition && typeof window !== 'undefined' ? {
          position: 'fixed' as const,
          top: `${dropdownPosition.top}px`,
          left: `${Math.max(8, dropdownPosition.left)}px`,
          width: `${Math.min(dropdownPosition.width, window.innerWidth - 16)}px`,
          maxWidth: 'calc(100vw - 1rem)',
          transform: 'translateZ(0)', // Hardware acceleration
        } : {
          // Fallback: Use viewport-relative positioning until real position is calculated
          position: 'fixed' as const,
          top: '50vh',
          left: '50vw',
          width: '90%',
          maxWidth: '500px',
          transform: 'translate(-50%, -50%) translateZ(0)', // Combine transforms
          // Show fallback but make it less visible
          opacity: 0.3,
          pointerEvents: 'auto' as const,
        }),
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        isolation: 'isolate',
        // Ensure visibility - show dropdown even if position not calculated yet
        visibility: 'visible',
        opacity: dropdownPosition ? 1 : (shouldShow ? 0.3 : 0),
        display: 'block',
      }}
    >
      {(loading || loadingTypesense) ? (
        <div className="p-3 sm:p-4 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs sm:text-sm">
            {loadingTypesense ? 'Getting instant suggestions...' : 'Getting AI suggestions...'}
          </span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="p-1 sm:p-2">
          <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-600 flex items-center gap-2 border-b border-gray-100 mb-1">
            {sourceIcons[source]}
            <span className="flex-1">
              {source === 'typesense' ? 'Instant Suggestions' : 
               source === 'hybrid' ? 'AI-Enhanced Suggestions' : 
               'AI Suggestions'} ({suggestions.length})
            </span>
            <Badge variant="secondary" className={cn('text-xs flex-shrink-0', sourceColors[source])}>
              {source === 'typesense' ? 'Fast' : source === 'hybrid' ? 'Enhanced' : 'AI'}
            </Badge>
          </div>
          <div className="space-y-0.5 sm:space-y-1 max-h-[calc(60vh-80px)] sm:max-h-[450px] overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                type="button"
                data-suggestion={`suggestion-${index}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  justAppliedRef.current = true;
                  lastAppliedValueRef.current = suggestion.text;
                  setShowDropdown(false);
                  setSuggestions([]);
                  onSuggestionSelect(suggestion.text);
                  setTimeout(() => {
                    justAppliedRef.current = false;
                    lastAppliedValueRef.current = '';
                  }, 1000);
                }}
                className={cn(
                  'w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg',
                  'hover:bg-blue-50 active:bg-blue-100',
                  'hover:border-blue-200 border border-transparent',
                  'transition-all duration-200 cursor-pointer group',
                  'touch-manipulation', // Better mobile touch handling
                  'min-h-[44px] sm:min-h-[48px]', // Minimum touch target size
                )}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <span className="text-gray-900 text-xs sm:text-sm leading-relaxed whitespace-normal break-words flex-1 group-hover:text-blue-900">
                    {suggestion.text}
                  </span>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 bg-blue-100 text-blue-700 border-blue-200">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  // Use portal to escape parent containers and stacking contexts (both mobile and desktop)
  // This ensures the dropdown is always visible above all other elements
  if (typeof window !== 'undefined') {
    return createPortal(dropdownContent, document.body);
  }

  return dropdownContent;
}

