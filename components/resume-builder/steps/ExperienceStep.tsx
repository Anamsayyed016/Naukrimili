'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import AISuggestionBox from '@/components/resume-builder/form-inputs/AISuggestionBox';

interface ExperienceStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

interface Experience {
  title?: string;
  Position?: string;
  company?: string;
  Company?: string;
  location?: string;
  Location?: string;
  startDate?: string;
  endDate?: string;
  Duration?: string;
  description?: string;
  Description?: string;
  current?: boolean;
}

export default function ExperienceStep({ formData, updateFormData }: ExperienceStepProps) {
  const experiences: Experience[] = Array.isArray(formData.experience) 
    ? formData.experience 
    : Array.isArray(formData['Work Experience']) 
    ? formData['Work Experience'] 
    : [];

  const addExperience = () => {
    const newExp: Experience = {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      current: false,
    };
    updateFormData({
      experience: [...experiences, newExp],
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ experience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    updateFormData({ experience: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
        <p className="text-sm text-gray-600">
          List your work history, starting with your most recent position. 
          Use AI suggestions to create impactful achievement bullet points.
        </p>
      </div>

      {/* Guidance Tooltip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-blue-900">Writing Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Use STAR format: Situation/Task → Action → Result</li>
              <li>Include metrics: percentages, dollar amounts, time saved</li>
              <li>Start with action verbs: Led, Developed, Implemented, Optimized</li>
              <li>Focus on achievements, not just responsibilities</li>
              <li>Quantify your impact whenever possible</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, index) => {
          const title = exp.title || exp.Position || '';
          const company = exp.company || exp.Company || '';
          const location = exp.location || exp.Location || '';
          const startDate = exp.startDate || '';
          const endDate = exp.endDate || '';
          const description = exp.description || exp.Description || '';
          const isCurrent = exp.current || false;

          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Experience #{index + 1}
                </h3>
                {experiences.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
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
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Software Engineer"
                    value={title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Company <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Tech Company Inc."
                    value={company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Location</Label>
                  <Input
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="month"
                    value={startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    End Date {isCurrent && <span className="text-xs text-gray-500">(or leave empty if current)</span>}
                  </Label>
                  <Input
                    type="month"
                    value={endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    disabled={isCurrent}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={isCurrent}
                      onChange={(e) => {
                        updateExperience(index, 'current', e.target.checked);
                        if (e.target.checked) {
                          updateExperience(index, 'endDate', '');
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor={`current-${index}`} className="text-sm text-gray-700 cursor-pointer">
                      I currently work here
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-900">Description</Label>
                  <Textarea
                    placeholder="Describe your responsibilities and achievements..."
                    value={description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Use bullet points or paragraphs. Include metrics and achievements when possible.
                  </p>
                  {/* AI Suggestions for Experience Bullets */}
                  {description.length >= 10 && (
                    <div className="mt-2">
                      <AISuggestionBox
                        field="experience"
                        currentValue={description}
                        formData={{
                          ...formData,
                          experience: [{ ...exp, description }],
                        }}
                        onApply={(suggestion) => {
                          // Append or replace based on user preference
                          const currentDesc = description.trim();
                          const newDesc = currentDesc 
                            ? `${currentDesc}\n\n${suggestion}` 
                            : suggestion;
                          updateExperience(index, 'description', newDesc);
                        }}
                        autoTrigger={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {experiences.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No work experience added yet.</p>
          <Button variant="outline" onClick={addExperience}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Experience
          </Button>
        </div>
      )}
    </div>
  );
}

