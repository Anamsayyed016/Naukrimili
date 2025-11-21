'use client';

import { useState, useEffect } from 'react';
import TagsInput from '../form-inputs/TagsInput';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
            toast({
              title: "✨ Skills Added",
              description: `Added ${newSkills.slice(0, 10).length} new skill${newSkills.slice(0, 10).length > 1 ? 's' : ''} to your resume`,
              duration: 3000,
            });
          } else {
            toast({
              title: "No new skills",
              description: "All suggested skills are already in your list",
              duration: 2000,
            });
          }
        } else {
          toast({
            title: "No skills found",
            description: "Try adding a job title for better suggestions",
            duration: 3000,
          });
        }
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch skill suggestions:', error);
      toast({
        title: "⚠️ Error",
        description: "Unable to fetch skill suggestions. Please try again later.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">3</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
            <p className="text-sm text-gray-600 mt-1">Add your technical and soft skills</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">AI-Powered Skill Suggestions</p>
            <p className="text-xs text-gray-600 mt-1">Get relevant skills based on your job title and industry</p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={fetchSkillSuggestions}
            disabled={loading}
            className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating...' : 'Auto-suggest Skills'}
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

