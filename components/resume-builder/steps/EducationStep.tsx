'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface EducationStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function EducationStep({ formData, onFieldChange }: EducationStepProps) {
  const education = formData.education || formData['Education'] || [];

  const addEducation = () => {
    const newEdu = {
      degree: '',
      institution: '',
      year: '',
      cgpa: '',
      location: '',
    };
    onFieldChange('education', [...education, newEdu]);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onFieldChange('education', updated);
  };

  const removeEducation = (index: number) => {
    const updated = education.filter((_: any, i: number) => i !== index);
    onFieldChange('education', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
        <p className="text-gray-600">
          Add your educational background, including degrees and certifications.
        </p>
      </div>

      <div className="space-y-6">
        {education.map((edu: any, index: number) => (
          <div
            key={index}
            className="p-6 border border-gray-200 rounded-lg space-y-4 bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
              {education.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree / Qualification</Label>
                <Input
                  value={edu.degree || ''}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={edu.institution || ''}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="e.g. University of California"
                />
              </div>
              <div className="space-y-2">
                <Label>Year / Duration</Label>
                <Input
                  value={edu.year || ''}
                  onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  placeholder="e.g. 2017-2020"
                />
              </div>
              <div className="space-y-2">
                <Label>CGPA / GPA (Optional)</Label>
                <Input
                  value={edu.cgpa || ''}
                  onChange={(e) => updateEducation(index, 'cgpa', e.target.value)}
                  placeholder="e.g. 3.8"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addEducation}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    </div>
  );
}

