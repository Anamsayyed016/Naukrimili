'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperienceStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function ExperienceStep({ formData, onFieldChange }: ExperienceStepProps) {
  const experiences = formData.experience || formData['Work Experience'] || [];

  const addExperience = () => {
    const newExp = {
      company: '',
      position: '',
      duration: '',
      description: '',
      location: '',
    };
    onFieldChange('experience', [...experiences, newExp]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onFieldChange('experience', updated);
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_: any, i: number) => i !== index);
    onFieldChange('experience', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience</h2>
        <p className="text-gray-600">
          List your work experience, starting with your most recent position.
        </p>
      </div>

      <div className="space-y-6">
        {experiences.map((exp: any, index: number) => (
          <div
            key={index}
            className="p-6 border border-gray-200 rounded-lg space-y-4 bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Experience #{index + 1}</h3>
              {experiences.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position / Job Title</Label>
                <Input
                  value={exp.position || ''}
                  onChange={(e) => updateExperience(index, 'position', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={exp.company || ''}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="e.g. Tech Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={exp.duration || ''}
                  onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  placeholder="e.g. Sep 2017 - May 2020"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description / Responsibilities</Label>
              <Textarea
                value={exp.description || ''}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                placeholder="Describe your key responsibilities and achievements..."
                rows={4}
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
    </div>
  );
}

