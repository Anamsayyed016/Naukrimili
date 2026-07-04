'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Info, Briefcase } from 'lucide-react';
import AISuggestionBox from '@/components/resume-builder/form-inputs/AISuggestionBox';
import TitleSuggestionChips from '@/components/resume-builder/form-inputs/TitleSuggestionChips';
import {
  appendExperienceDescriptionSuggestion,
  finalizeExperienceEntryForBuilder,
  readExperienceEntryForForm,
  stableExperienceEntryId,
} from '@/lib/resume-builder/experience-entry-sync';

interface ExperienceStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

type ExperienceRow = Record<string, unknown>;

function readExperiences(formData: Record<string, unknown>): ExperienceRow[] {
  if ('experience' in formData && Array.isArray(formData.experience)) {
    return formData.experience as ExperienceRow[];
  }
  if (Array.isArray(formData['Work Experience'])) {
    return formData['Work Experience'] as ExperienceRow[];
  }
  return [];
}

export default function ExperienceStep({ formData, updateFormData }: ExperienceStepProps) {
  const experiences = readExperiences(formData);

  const commitExperiences = (
    next: ExperienceRow[],
    options?: { finalize?: boolean }
  ) => {
    if (options?.finalize) {
      updateFormData({
        experience: next,
        _experienceFinalize: true,
      });
      return;
    }
    updateFormData({ experience: next });
  };

  const addExperience = () => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `exp_new_${experiences.length}`;
    commitExperiences([
      ...experiences,
      {
        _id: id,
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        current: false,
      },
    ]);
  };

  const updateExperience = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = experiences.map((entry, i) => {
      if (i !== index) return entry;
      if (field === 'title') {
        return { ...entry, title: value };
      }
      return { ...entry, [field]: value };
    });
    commitExperiences(updated);
  };

  const applyTitleSuggestion = (index: number, suggestion: string) => {
    const updated = experiences.map((entry, i) =>
      i === index ? { ...entry, title: suggestion } : entry
    );
    commitExperiences(updated, { finalize: true });
  };

  const applyDescriptionSuggestion = (index: number, suggestion: string) => {
    const updated = experiences.map((entry, i) => {
      if (i !== index) return entry;
      const withDescription = appendExperienceDescriptionSuggestion(entry, suggestion);
      return finalizeExperienceEntryForBuilder(withDescription, i);
    });
    commitExperiences(updated, { finalize: true });
  };

  const finalizeExperience = (index: number) => {
    const updated = experiences.map((entry, i) =>
      i === index ? finalizeExperienceEntryForBuilder(entry, i) : entry
    );
    commitExperiences(updated, { finalize: true });
  };

  const removeExperience = (index: number) => {
    commitExperiences(
      experiences.filter((_, i) => i !== index),
      { finalize: true }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Work Experience
        </h2>
        <p className="text-sm text-gray-600">
          List your work history, starting with your most recent position.
          Use AI suggestions to create impactful achievement bullet points.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 via-indigo-50/80 to-purple-50/50 border-2 border-blue-200/60 rounded-xl p-4 shadow-md"
      >
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
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence>
          {experiences.map((exp, index) => {
            const row = readExperienceEntryForForm(exp, index);
            const entryId = row.id || stableExperienceEntryId(exp, index);

            return (
              <motion.div
                key={entryId}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl border-2 border-gray-200/60 p-4 sm:p-5 md:p-6 space-y-4 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300/50 w-full max-w-full overflow-x-hidden"
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

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">
                      Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Software Engineer"
                      value={row.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      className="w-full"
                    />
                    <TitleSuggestionChips
                      value={row.title}
                      onApply={(suggestion) => applyTitleSuggestion(index, suggestion)}
                      formData={formData}
                      section="experience"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Tech Company Inc."
                      value={row.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">Location</Label>
                    <Input
                      placeholder="City, State"
                      value={row.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={row.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">
                      End Date{' '}
                      {row.current && (
                        <span className="text-xs text-gray-500 font-normal">
                          (or leave empty if current)
                        </span>
                      )}
                    </Label>
                    <Input
                      type="month"
                      value={row.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      disabled={row.current}
                      className="w-full disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${entryId}`}
                        checked={row.current}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const updated = experiences.map((entry, i) =>
                            i === index
                              ? {
                                  ...entry,
                                  current: checked,
                                  endDate: checked ? '' : String(entry.endDate ?? ''),
                                }
                              : entry
                          );
                          commitExperiences(updated, { finalize: true });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor={`current-${entryId}`} className="text-sm text-gray-700 cursor-pointer">
                        I currently work here
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">Description</Label>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      value={row.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      onBlur={() => finalizeExperience(index)}
                      rows={4}
                      className="w-full resize-y"
                    />
                    {row.description.length >= 10 && (
                      <AISuggestionBox
                        field="experience"
                        currentValue={row.description}
                        formData={{
                          ...formData,
                          experience: experiences.map((entry, i) =>
                            i === index ? { ...entry, description: row.description } : entry
                          ),
                        }}
                        onApply={(suggestion) => applyDescriptionSuggestion(index, suggestion)}
                        autoTrigger={true}
                        debounceMs={600}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <Button variant="outline" onClick={addExperience} className="w-full border-2 border-dashed">
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
    </motion.div>
  );
}
