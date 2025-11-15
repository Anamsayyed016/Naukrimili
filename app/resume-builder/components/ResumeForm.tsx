'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X, Sparkles, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumeBuilderData, TemplateStyle, ExperienceLevel } from '../types';
import AISuggestions from './AISuggestions';
import CompactTemplateSelector from './CompactTemplateSelector';
import { generateId } from '../utils/idGenerator';
import { getKeywordSuggestions, KeywordSuggestion } from '../utils/keywordSuggestions';

interface ResumeFormProps {
  data: ResumeBuilderData;
  onDataChange: (data: ResumeBuilderData) => void;
}

export default function ResumeForm({ data, onDataChange }: ResumeFormProps) {
  const [activeAIField, setActiveAIField] = useState<{ field: string; type: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship' } | null>(null);
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([]);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [activeFieldForKeywords, setActiveFieldForKeywords] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const experienceLevel = data.experienceLevel || 'mid';

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

      {/* Personal Information */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Personal Information</span>
            {data.personalInfo.fullName && data.personalInfo.email && data.personalInfo.summary && (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                className="mt-1"
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
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone || ''}
                onChange={(e) => updateField(['personalInfo', 'phone'], e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                value={data.personalInfo.location || ''}
                onChange={(e) => updateField(['personalInfo', 'location'], e.target.value)}
                placeholder="City, Country"
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</Label>
              <Input
                id="linkedin"
                value={data.personalInfo.linkedin || ''}
                onChange={(e) => updateField(['personalInfo', 'linkedin'], e.target.value)}
                placeholder="linkedin.com/in/username"
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="portfolio" className="text-sm font-medium">Portfolio</Label>
              <Input
                id="portfolio"
                value={data.personalInfo.portfolio || ''}
                onChange={(e) => updateField(['personalInfo', 'portfolio'], e.target.value)}
                placeholder="yourwebsite.com"
                className="mt-1"
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
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your current or desired job title (appears on resume header)
              </p>
            </div>
          </div>
          <div className="mt-4 relative">
            <Label htmlFor="summary" className="text-sm font-medium">
              Professional Summary <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="summary"
                value={data.personalInfo.summary}
                onChange={(e) => {
                  const newValue = e.target.value;
                  updateField(['personalInfo', 'summary'], newValue);
                  // Always keep AI field active when typing (2+ chars)
                  if (newValue.length >= 2) {
                    setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                    setActiveFieldForKeywords('personalInfo.summary');
                  } else if (newValue.length === 0) {
                    setActiveAIField(null);
                    setActiveFieldForKeywords(null);
                  }
                }}
                placeholder="A brief summary of your professional background and key achievements..."
                rows={4}
                className="mt-1"
                onFocus={() => {
                  if (data.personalInfo.summary.length >= 2) {
                    setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                    setActiveFieldForKeywords('personalInfo.summary');
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
                    // Don't clear activeAIField on blur if there's content
                    if (!data.personalInfo.summary || data.personalInfo.summary.trim().length === 0) {
                      setActiveAIField(null);
                    }
                  }, 300);
                }}
              />
              {showKeywordSuggestions && activeFieldForKeywords === 'personalInfo.summary' && keywordSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                    <Sparkles className="w-3 h-3" />
                    Suggested Keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywordSuggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
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
              {activeAIField?.field === 'personalInfo.summary' && data.personalInfo.summary.length >= 2 && (
                <AISuggestions
                  fieldValue={data.personalInfo.summary}
                  fieldType="summary"
                  onSuggestionSelect={(suggestion) => {
                    // Apply the suggestion
                    updateField(['personalInfo', 'summary'], suggestion);
                    // Clear active field after applying
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
            <p className="text-xs text-gray-500 mt-1">
              {data.personalInfo.summary.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Skills</span>
              {data.skills.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="relative z-50"
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.skills.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No skills added yet</p>
              <p className="text-xs text-gray-500">Add skills relevant to your experience level</p>
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

      {/* Work Experience */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Work Experience</span>
              {data.experience.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.experience.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No work experience added yet</p>
              <p className="text-xs text-gray-500">Add your professional work experience</p>
            </div>
          ) : (
            data.experience.map((exp, index) => (
              <Card key={exp.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Experience #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['experience'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateField(['experience', index, 'company'], e.target.value)}
                        placeholder="Company Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateField(['experience', index, 'position'], e.target.value)}
                        placeholder="Job Title"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <Input
                        value={exp.location || ''}
                        onChange={(e) => updateField(['experience', index, 'location'], e.target.value)}
                        placeholder="City, Country"
                        className="mt-1"
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
                        className="mt-1"
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

      {/* Education */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Education</span>
              {data.education.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No education added yet</p>
              <p className="text-xs text-gray-500">Add your educational background</p>
            </div>
          ) : (
            data.education.map((edu, index) => (
              <Card key={edu.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['education'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        className="mt-1"
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

      {/* Projects */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Projects</span>
              {data.projects.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
                  oneLineDescription: '',
                  technologies: [],
                  achievements: [],
                  url: '',
                  startDate: '',
                  endDate: '',
                });
              }}
              className="relative z-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.projects.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No projects added yet</p>
              <p className="text-xs text-gray-500">Add your projects to showcase your work</p>
            </div>
          ) : (
            data.projects.map((project, index) => (
              <Card key={project.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Project #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['projects'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Label className="text-sm font-medium">
                        Project Name <span className="text-red-500">*</span>
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
                        className="mt-1"
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
                    <div className="relative">
                      <Label className="text-sm font-medium">One-Line Description</Label>
                      <Input
                        value={project.oneLineDescription || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateField(['projects', index, 'oneLineDescription'], newValue);
                          if (newValue.length >= 2) {
                            setActiveAIField({ field: `projects.${index}.oneLineDescription`, type: 'description' });
                            setActiveFieldForKeywords(`projects.${index}.oneLineDescription`);
                          }
                        }}
                        placeholder="Brief description of the project"
                        className="mt-1"
                      />
                      {activeAIField?.field === `projects.${index}.oneLineDescription` && (project.oneLineDescription || '').length >= 2 && (
                        <AISuggestions
                          fieldValue={project.oneLineDescription || ''}
                          fieldType="description"
                          onSuggestionSelect={(suggestion) => {
                            updateField(['projects', index, 'oneLineDescription'], suggestion);
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
                        placeholder="Describe your project, technologies used, and key features..."
                        rows={3}
                        className="mt-1"
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
                          }}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Project URL</Label>
                        <Input
                          value={project.url || ''}
                          onChange={(e) => updateField(['projects', index, 'url'], e.target.value)}
                          placeholder="https://project-url.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Technologies Used</Label>
                        <Input
                          value={project.technologies.join(', ')}
                          onChange={(e) => {
                            const techs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                            updateField(['projects', index, 'technologies'], techs);
                          }}
                          placeholder="React, Node.js, MongoDB (comma-separated)"
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

      {/* Certifications */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Certifications</span>
              {data.certifications.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="relative z-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.certifications.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No certifications added yet</p>
              <p className="text-xs text-gray-500">Add relevant certifications to strengthen your profile</p>
            </div>
          ) : (
            data.certifications.map((cert, index) => (
              <Card key={cert.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Certification #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['certifications'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Languages */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Languages</span>
              {data.languages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="relative z-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Language
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.languages.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No languages added yet</p>
              <p className="text-xs text-gray-500">Add languages you speak</p>
            </div>
          ) : (
            data.languages.map((lang, index) => (
              <Card key={lang.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Language #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['languages'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Achievements & Awards */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Achievements & Awards</span>
              {data.achievements.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="relative z-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.achievements.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No achievements added yet</p>
              <p className="text-xs text-gray-500">Add your achievements and awards</p>
            </div>
          ) : (
            data.achievements.map((achievement, index) => (
              <Card key={achievement.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Achievement #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['achievements'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Internships */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Internships</span>
              {data.internships.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="relative z-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Internship
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.internships.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">No internships added yet</p>
              <p className="text-xs text-gray-500">Add your internship experiences</p>
            </div>
          ) : (
            data.internships.map((internship, index) => (
              <Card key={internship.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Internship #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['internships'], index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}
