'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Info } from 'lucide-react';
import AISuggestionBox from '@/components/resume-builder/form-inputs/AISuggestionBox';
import KeywordsDisplay from '@/components/resume-builder/form-inputs/KeywordsDisplay';

interface SkillsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

export default function SkillsStep({ formData, updateFormData }: SkillsStepProps) {
  const [newSkill, setNewSkill] = useState('');
  const skills: string[] = Array.isArray(formData.skills) ? formData.skills : [];
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Extract keywords from AI suggestions
  useEffect(() => {
    if (formData.ats_keywords && Array.isArray(formData.ats_keywords)) {
      setKeywords(formData.ats_keywords);
    }
  }, [formData.ats_keywords]);

  const addSkill = (skillToAdd?: string) => {
    const skill = skillToAdd || newSkill.trim();
    if (skill && !skills.includes(skill)) {
      updateFormData({
        skills: [...skills, skill],
      });
      if (!skillToAdd) {
        setNewSkill('');
      }
    }
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    updateFormData({ skills: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    // For skills, suggestions might be comma-separated
    const skillList = suggestion.split(',').map(s => s.trim()).filter(s => s);
    skillList.forEach(skill => addSkill(skill));
  };

  const handleApplyMultiple = (suggestions: string[]) => {
    suggestions.forEach(skill => {
      if (skill && !skills.includes(skill)) {
        addSkill(skill);
      }
    });
  };

  const handleKeywordSelect = (keyword: string) => {
    if (!selectedKeywords.includes(keyword) && !skills.includes(keyword)) {
      addSkill(keyword);
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    // Optionally remove from skills if it exists
    const skillIndex = skills.indexOf(keyword);
    if (skillIndex !== -1) {
      removeSkill(skillIndex);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
        <p className="text-sm text-gray-600">
          List your key skills and competencies. Add as many as you&apos;d like. 
          Use AI suggestions to discover relevant skills for your role.
        </p>
      </div>

      {/* Guidance Tooltip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-blue-900">Skills Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Include 8-14 relevant skills for your target role</li>
              <li>Mix technical skills, tools, and soft skills</li>
              <li>Prioritize skills mentioned in job descriptions</li>
              <li>Use industry-standard terminology</li>
              <li>Keep skills current and relevant to your experience level</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., JavaScript, Python, Project Management"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={() => addSkill()} type="button">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* AI Suggestions */}
        <AISuggestionBox
          field="skills"
          currentValue={newSkill}
          formData={formData}
          onApply={handleApplySuggestion}
          onApplyMultiple={handleApplyMultiple}
          autoTrigger={true}
          debounceMs={800}
        />

        {skills.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Your Skills ({skills.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(index)}
                    className="hover:bg-blue-100 rounded p-0.5 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No skills added yet. Start adding your skills above or use AI suggestions.</p>
          </div>
        )}
      </div>

      {/* ATS Keywords Display */}
      {keywords.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <KeywordsDisplay
            keywords={keywords}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={handleKeywordSelect}
            onKeywordRemove={handleKeywordRemove}
          />
        </div>
      )}
    </div>
  );
}

