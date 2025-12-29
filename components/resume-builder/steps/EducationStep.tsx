'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface EducationStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

interface Education {
  degree?: string;
  Degree?: string;
  school?: string;
  institution?: string;
  Institution?: string;
  field?: string;
  Field?: string;
  year?: string;
  Year?: string;
  graduationDate?: string;
  cgpa?: string;
  CGPA?: string;
}

export default function EducationStep({ formData, updateFormData }: EducationStepProps) {
  const education: Education[] = Array.isArray(formData.education)
    ? formData.education
    : Array.isArray(formData.Education)
    ? formData.Education
    : [];
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: { degree?: string[]; field?: string[] } }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: number]: { degree?: boolean; field?: boolean } }>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const addEducation = () => {
    const newEdu: Education = {
      degree: '',
      school: '',
      field: '',
      year: '',
    };
    updateFormData({
      education: [...education, newEdu],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ education: updated });
  };

  const removeEducation = (index: number) => {
    const updated = education.filter((_, i) => i !== index);
    updateFormData({ education: updated });
    setAiSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[index];
      return newSuggestions;
    });
  };

  const fetchAISuggestions = async (index: number, field: 'degree' | 'field', value: string) => {
    if (!value || value.trim().length < 2) {
      setAiSuggestions(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: [] }
      }));
      return;
    }

    const timerKey = `${index}-${field}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setLoadingSuggestions(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: true }
      }));

      try {
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: field === 'degree' ? 'education' : 'education',
            value,
            context: {
              jobTitle: formData.jobTitle || '',
              skills: Array.isArray(formData.skills) ? formData.skills : [],
              experienceLevel: formData.experienceLevel || 'mid-level',
              industry: formData.industry || ''
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suggestions) {
            setAiSuggestions(prev => ({
              ...prev,
              [index]: { ...prev[index], [field]: data.suggestions }
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoadingSuggestions(prev => ({
          ...prev,
          [index]: { ...prev[index], [field]: false }
        }));
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
        <p className="text-sm text-gray-600">
          Add your educational background and qualifications.
        </p>
      </div>

      <div className="space-y-6">
        {education.map((edu, index) => {
          const degree = edu.degree || edu.Degree || '';
          const school = edu.school || edu.institution || edu.Institution || '';
          const field = edu.field || edu.Field || '';
          const year = edu.year || edu.Year || edu.graduationDate || '';
          const cgpa = edu.cgpa || edu.CGPA || '';

          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Education #{index + 1}
                </h3>
                {education.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Degree <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Bachelor's Degree"
                    value={degree}
                    onChange={(e) => {
                      updateEducation(index, 'degree', e.target.value);
                      fetchAISuggestions(index, 'degree', e.target.value);
                    }}
                    className="w-full"
                  />
                  {aiSuggestions[index]?.degree && aiSuggestions[index].degree!.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Suggestions:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions[index].degree!.slice(0, 3).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateEducation(index, 'degree', suggestion)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[index]?.degree && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Getting AI suggestions...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    School/Institution <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="University Name"
                    value={school}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Field of Study</Label>
                  <Input
                    placeholder="Computer Science"
                    value={field}
                    onChange={(e) => {
                      updateEducation(index, 'field', e.target.value);
                      fetchAISuggestions(index, 'field', e.target.value);
                    }}
                    className="w-full"
                  />
                  {aiSuggestions[index]?.field && aiSuggestions[index].field!.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Suggestions:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions[index].field!.slice(0, 3).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateEducation(index, 'field', suggestion)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[index]?.field && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Getting AI suggestions...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Graduation Year</Label>
                  <Input
                    type="number"
                    placeholder="2020"
                    value={year}
                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-900">CGPA/GPA (Optional)</Label>
                  <Input
                    placeholder="3.8"
                    value={cgpa}
                    onChange={(e) => updateEducation(index, 'cgpa', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={addEducation}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>

      {education.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No education added yet.</p>
          <Button variant="outline" onClick={addEducation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Education
          </Button>
        </div>
      )}
    </div>
  );
}

