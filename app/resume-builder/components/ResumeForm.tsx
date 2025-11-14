'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumeBuilderData, TemplateStyle } from '../types';
import AISuggestions from './AISuggestions';
import CompactTemplateSelector from './CompactTemplateSelector';
import { generateId } from '../utils/idGenerator';

interface ResumeFormProps {
  data: ResumeBuilderData;
  onDataChange: (data: ResumeBuilderData) => void;
}

export default function ResumeForm({ data, onDataChange }: ResumeFormProps) {
  const [activeAIField, setActiveAIField] = useState<{ field: string; type: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const updateField = (path: string[], value: any) => {
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
      // e.g., "personalInfo.summary" or "skills.0.name"
      const [section, indexOrField, fieldOrEmpty] = parts;
      const index = parseInt(indexOrField);
      
      if (!isNaN(index) && fieldOrEmpty) {
        // Array item with field: "skills.0.name"
        const path = [section, index, fieldOrEmpty];
        updateField(path, suggestion);
      } else {
        // Nested object: "personalInfo.summary"
        const path = [section, indexOrField];
        updateField(path, suggestion);
      }
    } else if (parts.length === 2) {
      // e.g., "personalInfo.summary"
      const [section, field] = parts;
      const path = [section, field];
      updateField(path, suggestion);
    }
    
    setActiveAIField(null);
  };

  return (
    <div ref={formRef} className="space-y-6">
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
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={data.personalInfo.fullName}
                onChange={(e) => updateField(['personalInfo', 'fullName'], e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="relative">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updateField(['personalInfo', 'email'], e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="relative">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone || ''}
                onChange={(e) => updateField(['personalInfo', 'phone'], e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="relative">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={data.personalInfo.location || ''}
                onChange={(e) => updateField(['personalInfo', 'location'], e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div className="relative">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={data.personalInfo.linkedin || ''}
                onChange={(e) => updateField(['personalInfo', 'linkedin'], e.target.value)}
                placeholder="linkedin.com/in/username"
              />
            </div>
            <div className="relative">
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input
                id="portfolio"
                value={data.personalInfo.portfolio || ''}
                onChange={(e) => updateField(['personalInfo', 'portfolio'], e.target.value)}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>
          <div className="mt-4 relative">
            <Label htmlFor="summary">Professional Summary *</Label>
            <Textarea
              id="summary"
              value={data.personalInfo.summary}
              onChange={(e) => {
                updateField(['personalInfo', 'summary'], e.target.value);
                if (e.target.value.length > 2) {
                  setActiveAIField({ field: 'personalInfo.summary', type: 'summary' });
                }
              }}
              placeholder="A brief summary of your professional background and key achievements..."
              rows={4}
              onFocus={() => setActiveAIField({ field: 'personalInfo.summary', type: 'summary' })}
            />
            {activeAIField?.field === 'personalInfo.summary' && (
              <AISuggestions
                fieldValue={data.personalInfo.summary}
                fieldType="summary"
                onSuggestionSelect={handleAISuggestion}
                className="top-full mt-1"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(['skills'], { id: generateId(), name: '', level: 'intermediate' })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
          <div className="space-y-3">
            {data.skills.map((skill, index) => (
              <div key={skill.id} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={skill.name}
                    onChange={(e) => {
                      updateField(['skills', index, 'name'], e.target.value);
                      if (e.target.value.length > 1) {
                        setActiveAIField({ field: `skills.${index}.name`, type: 'skill' });
                      }
                    }}
                    placeholder="e.g., JavaScript, React, Python"
                    onFocus={() => setActiveAIField({ field: `skills.${index}.name`, type: 'skill' })}
                  />
                  {activeAIField?.field === `skills.${index}.name` && (
                    <AISuggestions
                      fieldValue={skill.name}
                      fieldType="skill"
                      onSuggestionSelect={(suggestion) => {
                        updateField(['skills', index, 'name'], suggestion);
                        setActiveAIField(null);
                      }}
                      className="top-full mt-1"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(['skills'], index)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
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
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <Card key={exp.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Experience #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['experience'], index)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateField(['experience', index, 'company'], e.target.value)}
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <Label>Position *</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateField(['experience', index, 'position'], e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={exp.location || ''}
                        onChange={(e) => updateField(['experience', index, 'location'], e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <Label>Start Date *</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateField(['experience', index, 'startDate'], e.target.value)}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate || ''}
                        onChange={(e) => updateField(['experience', index, 'endDate'], e.target.value)}
                        placeholder="MM/YYYY or Present"
                        disabled={exp.current}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateField(['experience', index, 'current'], e.target.checked)}
                        className="mr-2"
                      />
                      <Label>Currently working here</Label>
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description || ''}
                      onChange={(e) => {
                        updateField(['experience', index, 'description'], e.target.value);
                        if (e.target.value.length > 2) {
                          setActiveAIField({ field: `experience.${index}.description`, type: 'description' });
                        }
                      }}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={3}
                      onFocus={() => setActiveAIField({ field: `experience.${index}.description`, type: 'description' })}
                    />
                    {activeAIField?.field === `experience.${index}.description` && (
                      <AISuggestions
                        fieldValue={exp.description || ''}
                        fieldType="description"
                        onSuggestionSelect={(suggestion) => {
                          updateField(['experience', index, 'description'], suggestion);
                          setActiveAIField(null);
                        }}
                        className="top-full mt-1"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Education</h2>
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
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <Card key={edu.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['education'], index)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Institution *</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateField(['education', index, 'institution'], e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <Label>Degree *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateField(['education', index, 'degree'], e.target.value)}
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                    <div>
                      <Label>Field of Study *</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateField(['education', index, 'field'], e.target.value)}
                        placeholder="Computer Science, Business, etc."
                      />
                    </div>
                    <div>
                      <Label>GPA</Label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateField(['education', index, 'gpa'], e.target.value)}
                        placeholder="3.8/4.0"
                      />
                    </div>
                    <div>
                      <Label>Start Date *</Label>
                      <Input
                        value={edu.startDate}
                        onChange={(e) => updateField(['education', index, 'startDate'], e.target.value)}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        value={edu.endDate || ''}
                        onChange={(e) => updateField(['education', index, 'endDate'], e.target.value)}
                        placeholder="MM/YYYY"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

