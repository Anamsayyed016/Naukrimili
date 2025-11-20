'use client';

import { useState, useEffect } from 'react';
import TagsInput from '../form-inputs/TagsInput';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SkillsStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  experienceLevel?: string;
}

export default function SkillsStep({
  formData,
  onFieldChange,
  experienceLevel = 'experienced',
}: SkillsStepProps) {
  const [loading, setLoading] = useState(false);
  const skills = formData.skills || formData['Skills'] || [];

  const fetchSkillSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: formData.jobTitle || formData.position || '',
          industry: formData.industry || '',
          experience_level: experienceLevel,
          skills_input: Array.isArray(skills) ? skills.join(', ') : '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.skills && Array.isArray(data.skills)) {
          // Merge new skills with existing, avoiding duplicates
          const existingSkills = new Set(skills);
          const newSkills = data.skills.filter((skill: string) => !existingSkills.has(skill));
          if (newSkills.length > 0) {
            onFieldChange('skills', [...skills, ...newSkills.slice(0, 10)]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch skill suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
        <p className="text-gray-600">Add your technical and soft skills</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">AI can suggest relevant skills based on your job title</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSkillSuggestions}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Loading...' : 'Auto-suggest Skills'}
          </Button>
        </div>

        <TagsInput
          label="Skills"
          value={skills}
          onChange={(val) => onFieldChange('skills', val)}
          placeholder="Type a skill and press Enter"
          required
        />
      </div>
    </div>
  );
}

