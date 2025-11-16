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
  fieldType: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship' | 'company' | 'position';
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
  const justAppliedRef = useRef(false);
  const lastAppliedValueRef = useRef<string>('');

  // Fetch suggestions with debounce - CRITICAL: This runs on every fieldValue change
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If suggestion was just applied, don't show suggestions again immediately
    if (justAppliedRef.current && fieldValue === lastAppliedValueRef.current) {
      setShowDropdown(false);
      setSuggestions([]);
      setLoading(false);
      justAppliedRef.current = false;
      return;
    }

    // If field is empty, hide suggestions
    if (!fieldValue || fieldValue.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      justAppliedRef.current = false;
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
          'company': 'title',
          'position': 'title',
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
                // Mark that we just applied a suggestion
                justAppliedRef.current = true;
                lastAppliedValueRef.current = suggestion.text;
                // Close dropdown immediately to prevent blocking other UI
                setShowDropdown(false);
                setSuggestions([]);
                // Apply the suggestion
                onSuggestionSelect(suggestion.text);
                // Reset flag after a delay to allow new suggestions if user continues typing
                setTimeout(() => {
                  justAppliedRef.current = false;
                  lastAppliedValueRef.current = '';
                }, 1000);
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

