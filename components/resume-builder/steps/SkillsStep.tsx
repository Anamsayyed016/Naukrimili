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
      const jobTitle = formData.jobTitle || formData.position || formData.desiredJobTitle || '';
      const industry = formData.industry || '';
      
      // Validate that we have enough context
      if (!jobTitle && !industry) {
        toast({
          title: "⚠️ Missing Information",
          description: "Please add a job title or industry in the Personal Info section for better skill suggestions",
          variant: "default",
          duration: 4000,
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          industry: industry,
          experience_level: experienceLevel,
          skills_input: Array.isArray(skills) ? skills.join(', ') : (skills || ''),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Skills API Response:', { skills: data.skills, count: data.skills?.length });
        
        if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
          // Merge new skills with existing, avoiding duplicates (case-insensitive)
          const existingSkillsLower = new Set(skills.map(s => s.toLowerCase()));
          const newSkills = data.skills.filter((skill: string) => {
            if (!skill || typeof skill !== 'string') return false;
            return !existingSkillsLower.has(skill.toLowerCase());
          });
          
          if (newSkills.length > 0) {
            // Add up to 15 new skills (increased from 10)
            const skillsToAdd = newSkills.slice(0, 15);
            onFieldChange('skills', [...skills, ...skillsToAdd]);
            toast({
              title: "✨ Skills Added",
              description: `Added ${skillsToAdd.length} new skill${skillsToAdd.length > 1 ? 's' : ''} to your resume`,
              duration: 3000,
            });
          } else {
            toast({
              title: "No new skills",
              description: "All suggested skills are already in your list. Try adding more context for different suggestions.",
              duration: 3000,
            });
          }
        } else {
          console.warn('No skills in API response:', data);
          toast({
            title: "No skills found",
            description: jobTitle 
              ? "AI couldn't generate skills. Using fallback suggestions based on your job title."
              : "Try adding a job title for better suggestions",
            variant: "default",
            duration: 4000,
          });
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('API Error:', response.status, errorText);
        throw new Error(`API returned status ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.error('Failed to fetch skill suggestions:', error);
      toast({
        title: "⚠️ Error",
        description: error.message?.includes('fetch') 
          ? "Network error. Please check your connection and try again."
          : `Unable to fetch skill suggestions: ${error.message || 'Unknown error'}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">3</span>
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
          placeholder="Type a skill and press Enter or click Add"
          required
        />
      </div>
    </div>
  );
}

