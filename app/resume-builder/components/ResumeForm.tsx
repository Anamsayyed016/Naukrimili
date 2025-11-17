'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X, Sparkles, Lightbulb, CheckCircle2, AlertCircle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumeBuilderData, TemplateStyle, ExperienceLevel } from '../types';
import AISuggestions from './AISuggestions';
import CompactTemplateSelector from './CompactTemplateSelector';
import { generateId } from '../utils/idGenerator';
import { getKeywordSuggestions, KeywordSuggestion } from '../utils/keywordSuggestions';
import DraggableSectionsContainer, { SectionId } from './DraggableSectionsContainer';
import DraggableSection from './DraggableSection';

interface ResumeFormProps {
  data: ResumeBuilderData;
  onDataChange: (data: ResumeBuilderData) => void;
}

export default function ResumeForm({ data, onDataChange }: ResumeFormProps) {
  const [activeAIField, setActiveAIField] = useState<{ field: string; type: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship' | 'company' | 'position' } | null>(null);
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([]);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [activeFieldForKeywords, setActiveFieldForKeywords] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const experienceLevel = data.experienceLevel || 'mid';
  const hasInitializedRef = useRef(false);
  
  // Auto-activate AI suggestions for fields with content on mount (fixes reload glitch)
  useEffect(() => {
    // Only initialize once when data is available
    if (hasInitializedRef.current) return;
    
    // Check if summary has content and activate immediately
    const summaryContent = data.personalInfo.summary?.trim() || '';
    console.log('[ResumeForm] Auto-activate check on mount', {
      summaryLength: summaryContent.length,
      summaryValue: summaryContent.substring(0, 30),
      hasInitialized: hasInitializedRef.current,
    });
    
    if (summaryContent.length >= 2) {
      hasInitializedRef.current = true;
      // CRITICAL: Set activeAIField immediately (no timeout) to ensure component mounts
      // This fixes the issue where suggestions don't show on page reload
      console.log('[ResumeForm] Auto-activating AI field for summary on mount');
      setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
    }
  }, [data.personalInfo.summary]); // Run when summary data is loaded
  
  // Default section order if not set
  const defaultSectionOrder: SectionId[] = [
    'personalInfo',
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'internships',
  ];
  
  const sectionOrder = (data.sectionOrder || defaultSectionOrder) as SectionId[];
  
  const handleSectionOrderChange = (newOrder: SectionId[]) => {
    updateField(['sectionOrder'], newOrder);
  };

  const updateField = (path: (string | number)[], value: any) => {
    const newData = { ...data };
    let current: any = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    onDataChange(newData);
  };

  const addArrayItem = (path: string[], item: any) => {
    const newData = { ...data };
    let current: any = newData;
    
    for (const key of path) {
      current = current[key];
    }
    current.push(item);
    
    onDataChange(newData);
  };

  const removeArrayItem = (path: string[], index: number) => {
    const newData = { ...data };
    let current: any = newData;
    
    for (const key of path) {
      current = current[key];
    }
    current.splice(index, 1);
    
    onDataChange(newData);
  };

  const handleAISuggestion = (suggestion: string) => {
    if (!activeAIField) return;
    
    const parts = activeAIField.field.split('.');
    
    if (parts.length === 3) {
      const [section, indexOrField, fieldOrEmpty] = parts;
      const index = parseInt(indexOrField);
      
      if (!isNaN(index) && fieldOrEmpty) {
        const path = [section, index, fieldOrEmpty];
        updateField(path, suggestion);
      } else {
        const path = [section, indexOrField];
        updateField(path, suggestion);
      }
    } else if (parts.length === 2) {
      const [section, field] = parts;
      const path = [section, field];
      updateField(path, suggestion);
    }
    
    setActiveAIField(null);
  };

  // Real-time keyword suggestions
  useEffect(() => {
    if (!activeFieldForKeywords) {
      setKeywordSuggestions([]);
      setShowKeywordSuggestions(false);
      return;
    }

    const fieldParts = activeFieldForKeywords.split('.');
    let currentValue = '';

    if (fieldParts.length === 3) {
      const [section, index, field] = fieldParts;
      const sectionData = (data as any)[section];
      if (Array.isArray(sectionData) && sectionData[parseInt(index)]) {
        currentValue = sectionData[parseInt(index)][field] || '';
      }
    } else if (fieldParts.length === 2) {
      const [section, field] = fieldParts;
      currentValue = (data as any)[section]?.[field] || '';
    }

    const fieldType = activeFieldForKeywords.includes('summary') ? 'summary' :
                     activeFieldForKeywords.includes('skill') ? 'skill' :
                     activeFieldForKeywords.includes('description') ? 'description' : 'skill';

    const suggestions = getKeywordSuggestions(
      experienceLevel as ExperienceLevel,
      fieldType as 'skill' | 'summary' | 'description' | 'achievement',
      currentValue,
      8,
      data.personalInfo.jobTitle // Pass job title for context-aware suggestions
    );

    setKeywordSuggestions(suggestions);
    setShowKeywordSuggestions(suggestions.length > 0);
  }, [activeFieldForKeywords, data, experienceLevel]);

  const handleKeywordClick = (keyword: string) => {
    if (!activeFieldForKeywords) return;

    const fieldParts = activeFieldForKeywords.split('.');
    let currentValue = '';

    if (fieldParts.length === 3) {
      const [section, index, field] = fieldParts;
      const sectionData = (data as any)[section];
      if (Array.isArray(sectionData) && sectionData[parseInt(index)]) {
        currentValue = sectionData[parseInt(index)][field] || '';
      }
    } else if (fieldParts.length === 2) {
      const [section, field] = fieldParts;
      currentValue = (data as any)[section]?.[field] || '';
    }

    const newValue = currentValue ? `${currentValue}, ${keyword}` : keyword;

    if (fieldParts.length === 3) {
      const [section, index, field] = fieldParts;
      updateField([section, parseInt(index), field], newValue);
    } else if (fieldParts.length === 2) {
      const [section, field] = fieldParts;
      updateField([section, field], newValue);
    }

    setShowKeywordSuggestions(false);
  };

  // Calculate completeness
  const calculateCompleteness = () => {
    let score = 0;
    const total = 7;

    if (data.personalInfo.fullName) score++;
    if (data.personalInfo.email) score++;
    if (data.personalInfo.summary && data.personalInfo.summary.length > 50) score++;
    if (data.skills.length > 0) score++;
    if (data.experience.length > 0) score++;
    if (data.education.length > 0) score++;
    if (data.personalInfo.phone) score++;

    return Math.round((score / total) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div ref={formRef} className="space-y-6">
      {/* Progress Indicator */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn(
                "w-5 h-5",
                completeness >= 80 ? "text-green-600" : completeness >= 50 ? "text-yellow-600" : "text-gray-400"
              )} />
              <span className="text-sm font-medium text-gray-700">Resume Completeness</span>
            </div>
            <Badge variant={completeness >= 80 ? "default" : "secondary"} className="font-semibold">
              {completeness}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                completeness >= 80 ? "bg-green-600" : completeness >= 50 ? "bg-yellow-600" : "bg-gray-400"
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 80 && (
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Complete all sections to improve your ATS score
            </p>
          )}
        </CardContent>
      </Card>

      {/* Template & Style Selector */}
      <CompactTemplateSelector
        selectedTemplate={data.template.style}
        onTemplateSelect={(template) =>
          updateField(['template', 'style'], template)
        }
        selectedColorScheme={data.template.colorScheme}
        onColorSchemeChange={(color) =>
          updateField(['template', 'colorScheme'], color)
        }
      />

      {/* Draggable Sections Container */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Drag sections to reorder</span>
          </div>
        </div>
        <DraggableSectionsContainer
          sectionOrder={sectionOrder}
          onSectionOrderChange={handleSectionOrderChange}
        >
          {/* Personal Information */}
          <DraggableSection id="personalInfo" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white overflow-visible">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <span>Personal Information</span>
            {data.personalInfo.fullName && data.personalInfo.email && data.personalInfo.summary && (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={data.personalInfo.fullName}
                onChange={(e) => updateField(['personalInfo', 'fullName'], e.target.value)}
                placeholder="John Doe"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updateField(['personalInfo', 'email'], e.target.value)}
                placeholder="john@example.com"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone || ''}
                onChange={(e) => updateField(['personalInfo', 'phone'], e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                value={data.personalInfo.location || ''}
                onChange={(e) => updateField(['personalInfo', 'location'], e.target.value)}
                placeholder="City, Country"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative">
              <Label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</Label>
              <Input
                id="linkedin"
                value={data.personalInfo.linkedin || ''}
                onChange={(e) => updateField(['personalInfo', 'linkedin'], e.target.value)}
                placeholder="linkedin.com/in/username"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative">
              <Label htmlFor="portfolio" className="text-sm font-medium">Portfolio</Label>
              <Input
                id="portfolio"
                value={data.personalInfo.portfolio || ''}
                onChange={(e) => updateField(['personalInfo', 'portfolio'], e.target.value)}
                placeholder="yourwebsite.com"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
            </div>
            <div className="relative md:col-span-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium">
                Job Title / Professional Title
              </Label>
              <Input
                id="jobTitle"
                value={data.personalInfo.jobTitle || ''}
                onChange={(e) => updateField(['personalInfo', 'jobTitle'], e.target.value)}
                placeholder="e.g., Software Developer, Marketing Manager, Teacher"
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your current or desired job title (appears on resume header)
              </p>
            </div>
          </div>
          <div className="mt-4 relative overflow-visible">
            <Label htmlFor="summary" className="text-sm font-medium">
              Professional Summary <span className="text-red-500">*</span>
            </Label>
            <div className="relative overflow-visible">
              <Textarea
                id="summary"
                value={data.personalInfo.summary}
                onChange={(e) => {
                  const newValue = e.target.value;
                  updateField(['personalInfo', 'summary'], newValue);
                  // Always keep AI field active when typing (2+ chars)
                  // NOTE: Summary should NOT show keyword suggestions, only full summary suggestions
                  if (newValue.length >= 2) {
                    // CRITICAL: Always set activeAIField to ensure component renders
                    setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                    // Don't set activeFieldForKeywords for summary - we want full summaries, not keywords
                    setActiveFieldForKeywords(null);
                    setShowKeywordSuggestions(false);
                  } else if (newValue.length === 0) {
                    setActiveAIField(null);
                    setActiveFieldForKeywords(null);
                    setShowKeywordSuggestions(false);
                  }
                }}
                placeholder="A brief summary of your professional background and key achievements..."
                rows={8}
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 resize-y min-h-[200px]"
                onFocus={() => {
                  // CRITICAL: Always activate AI field on focus if there's content
                  // This ensures suggestions show immediately when user focuses
                  if (data.personalInfo.summary.length >= 2) {
                    setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                    // Don't show keyword suggestions for summary
                    setActiveFieldForKeywords(null);
                    setShowKeywordSuggestions(false);
                  } else if (data.personalInfo.summary.length > 0) {
                    // Even for 1 char, activate for immediate feedback
                    setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                    setActiveFieldForKeywords(null);
                    setShowKeywordSuggestions(false);
                  }
                }}
                onBlur={(e) => {
                  // Don't hide if clicking on suggestions dropdown
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget && (
                    relatedTarget.closest('.ai-suggestions-dropdown') ||
                    relatedTarget.closest('[data-suggestion]') ||
                    relatedTarget.tagName === 'BUTTON'
                  )) {
                    return;
                  }
                  // Delay hiding to allow clicking on suggestions
                  setTimeout(() => {
                    setShowKeywordSuggestions(false);
                    // Clear activeAIField on blur to hide suggestions
                    // User can focus again to see suggestions if needed
                    setActiveAIField(null);
                    setActiveFieldForKeywords(null);
                  }, 200);
                }}
              />
              {/* Keyword suggestions removed for summary - only show full AI summary suggestions */}
              {(() => {
                const shouldRender = activeAIField?.field === 'personalInfo.summary' && data.personalInfo.summary.length >= 2;
                console.log('[ResumeForm] Checking if AISuggestions should render for summary', {
                  activeAIField: activeAIField?.field,
                  summaryLength: data.personalInfo.summary.length,
                  shouldRender,
                });
                return shouldRender;
              })() && (
                <AISuggestions
                  fieldValue={data.personalInfo.summary}
                  fieldType="summary"
                  // @ts-ignore - TypeScript cache issue, inputElementId is defined in AISuggestionsProps
                  inputElementId="summary"
                  onSuggestionSelect={(suggestion: string) => {
                    // Apply the suggestion
                    updateField(['personalInfo', 'summary'], suggestion);
                    // Clear active field immediately to hide suggestions
                    setActiveAIField(null);
                    setActiveFieldForKeywords(null);
                    setShowKeywordSuggestions(false);
                  }}
                  className="top-full mt-1"
                  context={{
                    jobTitle: data.personalInfo.jobTitle || '',
                    experienceLevel: experienceLevel,
                    skills: data.skills.map(s => s.name),
                    industry: '',
                  }}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.personalInfo.summary.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Skills */}
        <DraggableSection id="skills" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
              <span>Skills</span>
              {data.skills.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                  {data.skills.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Clear any active AI field before adding new skill
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['skills'], { id: generateId(), name: '', level: 'intermediate' });
              }}
              className="relative z-50 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.skills.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/30 hover:border-purple-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No skills added yet</p>
              <p className="text-xs text-gray-500">Add skills relevant to your experience level to highlight your expertise</p>
            </div>
          ) : (
            data.skills.map((skill, index) => (
              <div key={skill.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="relative flex-1">
                  <Input
                    value={skill.name}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      updateField(['skills', index, 'name'], newValue);
                      // Show AI suggestions when typing (2+ chars)
                      if (newValue.length >= 2) {
                        setActiveAIField({ field: `skills.${index}.name`, type: 'skill' });
                        setActiveFieldForKeywords(`skills.${index}.name`);
                      } else if (newValue.length === 0) {
                        // Hide suggestions when field is cleared
                        setActiveAIField(null);
                        setActiveFieldForKeywords(null);
                      }
                    }}
                    placeholder="e.g., JavaScript, React, Python"
                    onFocus={() => {
                      if (skill.name.length >= 2) {
                        setActiveAIField({ field: `skills.${index}.name`, type: 'skill' });
                        setActiveFieldForKeywords(`skills.${index}.name`);
                      }
                    }}
                    onBlur={(e) => {
                      // Don't hide if clicking on suggestions dropdown
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (relatedTarget && (
                        relatedTarget.closest('.ai-suggestions-dropdown') ||
                        relatedTarget.closest('[data-suggestion]') ||
                        relatedTarget.tagName === 'BUTTON'
                      )) {
                        return;
                      }
                      // Delay hiding to allow clicking on suggestions
                      setTimeout(() => {
                        setShowKeywordSuggestions(false);
                        // Only clear activeAIField if field is empty
                        if (!skill.name || skill.name.trim().length === 0) {
                          setActiveAIField(null);
                        }
                      }, 300);
                    }}
                  />
                  {showKeywordSuggestions && activeFieldForKeywords === `skills.${index}.name` && keywordSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                        <Sparkles className="w-3 h-3" />
                        Suggested Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {keywordSuggestions.map((suggestion, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={cn(
                              "cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors",
                              suggestion.category === 'technical' && "border-blue-200",
                              suggestion.category === 'soft' && "border-green-200"
                            )}
                            onClick={() => handleKeywordClick(suggestion.keyword)}
                          >
                            {suggestion.keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeAIField?.field === `skills.${index}.name` && skill.name.length >= 2 && (
                    <AISuggestions
                      fieldValue={skill.name}
                      fieldType="skill"
                      onSuggestionSelect={(suggestion) => {
                        // Apply the suggestion immediately
                        updateField(['skills', index, 'name'], suggestion);
                        // Clear active field immediately to close dropdown
                        setActiveAIField(null);
                        setActiveFieldForKeywords(null);
                      }}
                      className="top-full mt-1"
                      context={{
                        jobTitle: data.personalInfo.jobTitle || '',
                        experienceLevel: experienceLevel,
                        skills: data.skills.map(s => s.name),
                        industry: '',
                      }}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(['skills'], index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Work Experience */}
        <DraggableSection id="experience" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded-full"></span>
              <span>Work Experience</span>
              {data.experience.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                  {data.experience.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(['experience'], {
                id: generateId(),
                company: '',
                position: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
                achievements: [],
                technologies: [],
              })}
              className="relative z-50 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.experience.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-green-200 rounded-lg bg-green-50/30 hover:border-green-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No work experience added yet</p>
              <p className="text-xs text-gray-500">Add your professional work experience to build your career profile</p>
            </div>
          ) : (
            data.experience.map((exp, index) => (
              <Card key={exp.id} className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      Experience #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['experience'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['experience', index, 'company'], newValue);
                          // Show AI suggestions when typing (2+ chars)
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `experience.${index}.company`, type: 'company' });
                          } else if (newValue.length === 0) {
                            setActiveAIField(null);
                          }
                        }}
                        onFocus={() => {
                          if ((exp.company || '').length >= 2) {
                            setActiveAIField({ field: `experience.${index}.company`, type: 'company' });
                          }
                        }}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget && (
                            relatedTarget.closest('.ai-suggestions-dropdown') ||
                            relatedTarget.closest('[data-suggestion]')
                          )) {
                            return;
                          }
                          setTimeout(() => {
                            if (!data.experience[index]?.company || data.experience[index].company.trim().length === 0) {
                              setActiveAIField(null);
                            }
                          }, 300);
                        }}
                        placeholder="Company Name"
                        className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                      />
                      {activeAIField?.field === `experience.${index}.company` && (exp.company || '').length >= 2 && (
                        <AISuggestions
                          fieldValue={exp.company || ''}
                          fieldType="company"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['experience', index, 'company'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['experience', index, 'position'], newValue);
                          // Show AI suggestions when typing (2+ chars)
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `experience.${index}.position`, type: 'position' });
                          } else if (newValue.length === 0) {
                            setActiveAIField(null);
                          }
                        }}
                        onFocus={() => {
                          if ((exp.position || '').length >= 2) {
                            setActiveAIField({ field: `experience.${index}.position`, type: 'position' });
                          }
                        }}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget && (
                            relatedTarget.closest('.ai-suggestions-dropdown') ||
                            relatedTarget.closest('[data-suggestion]')
                          )) {
                            return;
                          }
                          setTimeout(() => {
                            if (!data.experience[index]?.position || data.experience[index].position.trim().length === 0) {
                              setActiveAIField(null);
                            }
                          }, 300);
                        }}
                        placeholder="Job Title"
                        className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                      />
                      {activeAIField?.field === `experience.${index}.position` && (exp.position || '').length >= 2 && (
                        <AISuggestions
                          fieldValue={exp.position || ''}
                          fieldType="position"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['experience', index, 'position'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || exp.position || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <Input
                        value={exp.location || ''}
                        onChange={(e) => updateField(['experience', index, 'location'], e.target.value)}
                        placeholder="City, Country"
                        className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateField(['experience', index, 'startDate'], e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <Input
                        value={exp.endDate || ''}
                        onChange={(e) => updateField(['experience', index, 'endDate'], e.target.value)}
                        placeholder="MM/YYYY or Present"
                        disabled={exp.current}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateField(['experience', index, 'current'], e.target.checked)}
                        className="mr-2"
                      />
                      <Label className="text-sm">Currently working here</Label>
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={exp.description || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        updateField(['experience', index, 'description'], newValue);
                        // Show AI suggestions when typing (2+ chars)
                        if (newValue.length >= 2) {
                          setActiveAIField({ field: `experience.${index}.description`, type: 'description' });
                          setActiveFieldForKeywords(`experience.${index}.description`);
                        } else if (newValue.length === 0) {
                          setActiveAIField(null);
                          setActiveFieldForKeywords(null);
                        }
                      }}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={3}
                      className="mt-1"
                      onFocus={() => {
                        if ((exp.description || '').length >= 2) {
                          setActiveAIField({ field: `experience.${index}.description`, type: 'description' });
                          setActiveFieldForKeywords(`experience.${index}.description`);
                        }
                      }}
                      onBlur={(e) => {
                        // Don't hide if clicking on suggestions dropdown
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (relatedTarget && (
                          relatedTarget.closest('.ai-suggestions-dropdown') ||
                          relatedTarget.closest('[data-suggestion]') ||
                          relatedTarget.tagName === 'BUTTON'
                        )) {
                          return;
                        }
                        setTimeout(() => {
                          setShowKeywordSuggestions(false);
                          // Don't clear activeAIField on blur if there's content
                          if (!data.experience[index]?.description || data.experience[index].description.trim().length === 0) {
                            setActiveAIField(null);
                          }
                        }, 300);
                      }}
                    />
                    {showKeywordSuggestions && activeFieldForKeywords === `experience.${index}.description` && keywordSuggestions.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                          <Sparkles className="w-3 h-3" />
                          Action Verbs & Keywords
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {keywordSuggestions.map((suggestion, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              onClick={() => handleKeywordClick(suggestion.keyword)}
                            >
                              {suggestion.keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeAIField?.field === `experience.${index}.description` && (exp.description || '').length >= 2 && (
                      <AISuggestions
                        fieldValue={exp.description || ''}
                        fieldType="description"
                        onSuggestionSelect={(suggestion) => {
                          // Apply the suggestion
                          updateField(['experience', index, 'description'], suggestion);
                          // Clear active field after applying
                          setTimeout(() => {
                            setActiveAIField(null);
                          }, 100);
                        }}
                        className="top-full mt-1"
                        context={{
                          jobTitle: data.personalInfo.jobTitle || exp.position || '',
                          experienceLevel: experienceLevel,
                          skills: data.skills.map(s => s.name),
                          industry: '',
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Education */}
        <DraggableSection id="education" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
              <span>Education</span>
              {data.education.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  {data.education.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(['education'], {
                id: generateId(),
                institution: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: '',
                gpa: '',
                description: '',
                isCurrent: false,
              })}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-amber-200 rounded-lg bg-amber-50/30 hover:border-amber-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No education added yet</p>
              <p className="text-xs text-gray-500">Add your educational background to showcase your qualifications</p>
            </div>
          ) : (
            data.education.map((edu, index) => (
              <Card key={edu.id} className="border-2 border-gray-200 hover:border-amber-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                      Education #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['education'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Institution <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateField(['education', index, 'institution'], e.target.value)}
                        placeholder="University Name"
                        className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Degree <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateField(['education', index, 'degree'], e.target.value)}
                        placeholder="Bachelor's, Master's, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Field of Study <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateField(['education', index, 'field'], e.target.value)}
                        placeholder="Computer Science, Business, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">GPA</Label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateField(['education', index, 'gpa'], e.target.value)}
                        placeholder="3.8/4.0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={edu.startDate}
                        onChange={(e) => updateField(['education', index, 'startDate'], e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <Input
                        value={edu.endDate || ''}
                        onChange={(e) => updateField(['education', index, 'endDate'], e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Projects */}
        <DraggableSection id="projects" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
              <span>Projects</span>
              {data.projects.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                  {data.projects.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['projects'], {
                  id: generateId(),
                  name: '',
                  description: '',
                  technologies: [],
                  achievements: [],
                  url: '',
                  startDate: '',
                  endDate: '',
                });
              }}
              className="relative z-50 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.projects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/30 hover:border-indigo-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No projects added yet</p>
              <p className="text-xs text-gray-500">Add your projects to showcase your work and technical skills</p>
            </div>
          ) : (
            data.projects.map((project, index) => (
              <Card key={project.id} className="border-2 border-gray-200 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      Project #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['projects'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {/* Project Title */}
                    <div className="relative">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        Project Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={project.name}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['projects', index, 'name'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `projects.${index}.name`, type: 'project' });
                            setActiveFieldForKeywords(`projects.${index}.name`);
                          }
                        }}
                        placeholder="e.g., E-Commerce Platform, Task Management App"
                        className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onFocus={() => {
                          if (project.name.length >= 2) {
                            setActiveAIField({ field: `projects.${index}.name`, type: 'project' });
                            setActiveFieldForKeywords(`projects.${index}.name`);
                          }
                        }}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget && (
                            relatedTarget.closest('.ai-suggestions-dropdown') ||
                            relatedTarget.closest('[data-suggestion]') ||
                            relatedTarget.tagName === 'BUTTON'
                          )) {
                            return;
                          }
                          setTimeout(() => {
                            setShowKeywordSuggestions(false);
                            if (!project.name || project.name.trim().length === 0) {
                              setActiveAIField(null);
                            }
                          }, 300);
                        }}
                      />
                      {activeAIField?.field === `projects.${index}.name` && project.name.length >= 2 && (
                        <AISuggestions
                          fieldValue={project.name}
                          fieldType="project"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['projects', index, 'name'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div className="relative">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['projects', index, 'description'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `projects.${index}.description`, type: 'description' });
                            setActiveFieldForKeywords(`projects.${index}.description`);
                          }
                        }}
                        placeholder="Describe your project, technologies used, key features, and your role in the project..."
                        rows={4}
                        className="mt-1 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onFocus={() => {
                          if (project.description.length >= 2) {
                            setActiveAIField({ field: `projects.${index}.description`, type: 'description' });
                            setActiveFieldForKeywords(`projects.${index}.description`);
                          }
                        }}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget && (
                            relatedTarget.closest('.ai-suggestions-dropdown') ||
                            relatedTarget.closest('[data-suggestion]') ||
                            relatedTarget.tagName === 'BUTTON'
                          )) {
                            return;
                          }
                          setTimeout(() => {
                            setShowKeywordSuggestions(false);
                            if (!project.description || project.description.trim().length === 0) {
                              setActiveAIField(null);
                            }
                          }, 300);
                        }}
                      />
                      {activeAIField?.field === `projects.${index}.description` && project.description.length >= 2 && (
                        <AISuggestions
                          fieldValue={project.description}
                          fieldType="description"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['projects', index, 'description'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                            isProjectDescription: true, // Flag to indicate this is a project description
                          } as { jobTitle?: string; experienceLevel?: string; skills?: string[]; industry?: string; isProjectDescription?: boolean }}
                        />
                      )}
                    </div>

                    {/* Tech Stack */}
                    <div className="relative">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        Tech Stack
                      </Label>
                      <div className="mt-1 space-y-2">
                        <Input
                          value={project.technologies.join(', ')}
                          onChange={(e) => {
                            const techs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                            updateField(['projects', index, 'technologies'], techs);
                          }}
                          placeholder="React, Node.js, MongoDB, TypeScript (comma-separated)"
                          className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const techs = input.value.split(',').map(t => t.trim()).filter(t => t);
                              if (techs.length > 0) {
                                updateField(['projects', index, 'technologies'], techs);
                              }
                            }
                          }}
                        />
                        {project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge
                                key={techIndex}
                                variant="secondary"
                                className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 transition-colors px-2 py-1 text-xs font-medium"
                              >
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTechs = project.technologies.filter((_, i) => i !== techIndex);
                                    updateField(['projects', index, 'technologies'], newTechs);
                                  }}
                                  className="ml-1.5 hover:text-indigo-900 focus:outline-none"
                                  aria-label={`Remove ${tech}`}
                                >
                                  <X className="w-3 h-3 inline" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Link (GitHub / Live Demo) */}
                    <div className="relative">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        Link (GitHub / Live Demo)
                      </Label>
                      <Input
                        value={project.url || ''}
                        onChange={(e) => updateField(['projects', index, 'url'], e.target.value)}
                        placeholder="https://github.com/username/project or https://project-demo.com"
                        className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        type="url"
                      />
                      {project.url && (
                        <div className="mt-1.5">
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                          >
                            <span>🔗</span>
                            <span>Open link</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Certifications */}
        <DraggableSection id="certifications" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-600 rounded-full"></span>
              <span>Certifications</span>
              {data.certifications.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700 border-teal-200">
                  {data.certifications.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['certifications'], {
                  id: generateId(),
                  name: '',
                  issuer: '',
                  date: '',
                  url: '',
                  description: '',
                });
              }}
              className="relative z-50 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.certifications.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-teal-200 rounded-lg bg-teal-50/30 hover:border-teal-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No certifications added yet</p>
              <p className="text-xs text-gray-500">Add relevant certifications to strengthen your profile</p>
            </div>
          ) : (
            data.certifications.map((cert, index) => (
              <Card key={cert.id} className="border-2 border-gray-200 hover:border-teal-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                      Certification #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['certifications'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Certification Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['certifications', index, 'name'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `certifications.${index}.name`, type: 'certification' });
                            setActiveFieldForKeywords(`certifications.${index}.name`);
                          }
                        }}
                        placeholder="e.g., AWS Certified Solutions Architect"
                        className="mt-1"
                      />
                      {activeAIField?.field === `certifications.${index}.name` && cert.name.length >= 2 && (
                        <AISuggestions
                          fieldValue={cert.name}
                          fieldType="certification"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['certifications', index, 'name'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Issuer <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateField(['certifications', index, 'issuer'], e.target.value)}
                        placeholder="e.g., Amazon Web Services"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={cert.date}
                        onChange={(e) => updateField(['certifications', index, 'date'], e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Certificate URL</Label>
                      <Input
                        value={cert.url || ''}
                        onChange={(e) => updateField(['certifications', index, 'url'], e.target.value)}
                        placeholder="https://certificate-url.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Languages */}
        <DraggableSection id="languages" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-rose-600 rounded-full"></span>
              <span>Languages</span>
              {data.languages.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700 border-rose-200">
                  {data.languages.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['languages'], {
                  id: generateId(),
                  name: '',
                  proficiency: 'fluent',
                });
              }}
              className="relative z-50 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Language
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.languages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-rose-200 rounded-lg bg-rose-50/30 hover:border-rose-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No languages added yet</p>
              <p className="text-xs text-gray-500">Add languages you speak to highlight your communication skills</p>
            </div>
          ) : (
            data.languages.map((lang, index) => (
              <Card key={lang.id} className="border-2 border-gray-200 hover:border-rose-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                      Language #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['languages'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Language <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={lang.name}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['languages', index, 'name'], newValue);
                          if (newValue.length >= 1) {
                            setActiveAIField({ field: `languages.${index}.name`, type: 'language' });
                            setActiveFieldForKeywords(`languages.${index}.name`);
                          }
                        }}
                        placeholder="e.g., English, Spanish, French"
                        className="mt-1"
                      />
                      {activeAIField?.field === `languages.${index}.name` && lang.name.length >= 1 && (
                        <AISuggestions
                          fieldValue={lang.name}
                          fieldType="language"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['languages', index, 'name'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Proficiency</Label>
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateField(['languages', index, 'proficiency'], e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="basic">Basic</option>
                        <option value="conversational">Conversational</option>
                        <option value="fluent">Fluent</option>
                        <option value="native">Native</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Achievements & Awards */}
        <DraggableSection id="achievements" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-yellow-600 rounded-full"></span>
              <span>Achievements & Awards</span>
              {data.achievements.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                  {data.achievements.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['achievements'], {
                  id: generateId(),
                  title: '',
                  description: '',
                  date: '',
                  issuer: '',
                });
              }}
              className="relative z-50 border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.achievements.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-yellow-200 rounded-lg bg-yellow-50/30 hover:border-yellow-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No achievements added yet</p>
              <p className="text-xs text-gray-500">Add your achievements and awards to stand out</p>
            </div>
          ) : (
            data.achievements.map((achievement, index) => (
              <Card key={achievement.id} className="border-2 border-gray-200 hover:border-yellow-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                      Achievement #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['achievements'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={achievement.title}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['achievements', index, 'title'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `achievements.${index}.title`, type: 'achievement' });
                            setActiveFieldForKeywords(`achievements.${index}.title`);
                          }
                        }}
                        placeholder="e.g., Best Employee of the Year"
                        className="mt-1"
                      />
                      {activeAIField?.field === `achievements.${index}.title` && achievement.title.length >= 2 && (
                        <AISuggestions
                          fieldValue={achievement.title}
                          fieldType="achievement"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['achievements', index, 'title'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div className="relative">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={achievement.description || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['achievements', index, 'description'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `achievements.${index}.description`, type: 'description' });
                            setActiveFieldForKeywords(`achievements.${index}.description`);
                          }
                        }}
                        placeholder="Describe the achievement..."
                        rows={2}
                        className="mt-1"
                      />
                      {activeAIField?.field === `achievements.${index}.description` && (achievement.description || '').length >= 2 && (
                        <AISuggestions
                          fieldValue={achievement.description || ''}
                          fieldType="description"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['achievements', index, 'description'], suggestion);
                            setTimeout(() => {
                              setActiveAIField(null);
                            }, 100);
                          }}
                          className="top-full mt-1"
                          context={{
                            jobTitle: data.personalInfo.jobTitle || '',
                            experienceLevel: experienceLevel,
                            skills: data.skills.map(s => s.name),
                            industry: '',
                          }}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <Input
                          value={achievement.date || ''}
                          onChange={(e) => updateField(['achievements', index, 'date'], e.target.value)}
                          placeholder="MM/YYYY"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Issuer</Label>
                        <Input
                          value={achievement.issuer || ''}
                          onChange={(e) => updateField(['achievements', index, 'issuer'], e.target.value)}
                          placeholder="Organization or company name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>

        {/* Internships */}
        <DraggableSection id="internships" className="pl-10">
          <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
              <span>Internships</span>
              {data.internships.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 border-violet-200">
                  {data.internships.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveAIField(null);
                setActiveFieldForKeywords(null);
                addArrayItem(['internships'], {
                  id: generateId(),
                  company: '',
                  position: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                  description: '',
                  technologies: [],
                });
              }}
              className="relative z-50 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Internship
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.internships.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-violet-200 rounded-lg bg-violet-50/30 hover:border-violet-300 transition-colors duration-200">
              <Lightbulb className="w-10 h-10 text-violet-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">No internships added yet</p>
              <p className="text-xs text-gray-500">Add your internship experiences to showcase your early career</p>
            </div>
          ) : (
            data.internships.map((internship, index) => (
              <Card key={internship.id} className="border-2 border-gray-200 hover:border-violet-300 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 bg-violet-600 rounded-full"></span>
                      Internship #{index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['internships'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={internship.company}
                        onChange={(e) => updateField(['internships', index, 'company'], e.target.value)}
                        placeholder="Company Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={internship.position}
                        onChange={(e) => updateField(['internships', index, 'position'], e.target.value)}
                        placeholder="Intern Position"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <Input
                        value={internship.location || ''}
                        onChange={(e) => updateField(['internships', index, 'location'], e.target.value)}
                        placeholder="City, Country"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={internship.startDate}
                        onChange={(e) => updateField(['internships', index, 'startDate'], e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <Input
                        value={internship.endDate || ''}
                        onChange={(e) => updateField(['internships', index, 'endDate'], e.target.value)}
                        placeholder="MM/YYYY or Present"
                        disabled={internship.current}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={internship.current}
                        onChange={(e) => updateField(['internships', index, 'current'], e.target.checked)}
                        className="mr-2"
                      />
                      <Label className="text-sm">Currently interning here</Label>
                    </div>
                  </div>
                  <div className="relative">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={internship.description || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        updateField(['internships', index, 'description'], newValue);
                        if (newValue.length >= 2) {
                          setActiveAIField({ field: `internships.${index}.description`, type: 'internship' });
                          setActiveFieldForKeywords(`internships.${index}.description`);
                        }
                      }}
                      placeholder="Describe your internship responsibilities and learnings..."
                      rows={3}
                      className="mt-1"
                      onFocus={() => {
                        if ((internship.description || '').length >= 2) {
                          setActiveAIField({ field: `internships.${index}.description`, type: 'internship' });
                          setActiveFieldForKeywords(`internships.${index}.description`);
                        }
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (relatedTarget && (
                          relatedTarget.closest('.ai-suggestions-dropdown') ||
                          relatedTarget.closest('[data-suggestion]') ||
                          relatedTarget.tagName === 'BUTTON'
                        )) {
                          return;
                        }
                        setTimeout(() => {
                          setShowKeywordSuggestions(false);
                          if (!internship.description || internship.description.trim().length === 0) {
                            setActiveAIField(null);
                          }
                        }, 300);
                      }}
                    />
                    {activeAIField?.field === `internships.${index}.description` && (internship.description || '').length >= 2 && (
                      <AISuggestions
                        fieldValue={internship.description || ''}
                        fieldType="internship"
                        onSuggestionSelect={(suggestion) => {
                          updateField(['internships', index, 'description'], suggestion);
                          setTimeout(() => {
                            setActiveAIField(null);
                          }, 100);
                        }}
                        className="top-full mt-1"
                        context={{
                          jobTitle: data.personalInfo.jobTitle || '',
                          experienceLevel: experienceLevel,
                          skills: data.skills.map(s => s.name),
                          industry: '',
                        }}
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Technologies Used</Label>
                    <Input
                      value={internship.technologies.join(', ')}
                      onChange={(e) => {
                        const techs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        updateField(['internships', index, 'technologies'], techs);
                      }}
                      placeholder="React, Python, SQL (comma-separated)"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
        </DraggableSection>
        </DraggableSectionsContainer>
      </div>
    </div>
  );
}
