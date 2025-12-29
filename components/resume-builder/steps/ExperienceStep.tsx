'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CheckCircle2, Info, Briefcase } from 'lucide-react';
import AISuggestionBox from '@/components/resume-builder/form-inputs/AISuggestionBox';

interface ExperienceStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
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

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ experience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    updateFormData({ experience: updated });
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

      {/* Guidance Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 via-indigo-50/80 to-purple-50/50 border-2 border-blue-200/60 rounded-xl p-4 shadow-md"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          </motion.div>
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
            const title = exp.title || exp.Position || '';
            const company = exp.company || exp.Company || '';
            const location = exp.location || exp.Location || '';
            const startDate = exp.startDate || '';
            const endDate = exp.endDate || '';
            const description = exp.description || exp.Description || '';
            const isCurrent = exp.current || false;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl border-2 border-gray-200/60 p-6 space-y-4 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300/50"
              >
              <div className="flex items-center justify-between mb-4">
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg font-semibold text-gray-900"
                >
                  Experience #{index + 1}
                </motion.h3>
                {experiences.length > 1 && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span>Job Title</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    placeholder="Software Engineer"
                    value={title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span>Company</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    placeholder="Tech Company Inc."
                    value={company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800">Location</Label>
                  <Input
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span>Start Date</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    type="month"
                    value={startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800">
                    End Date {isCurrent && <span className="text-xs text-gray-500 font-normal">(or leave empty if current)</span>}
                  </Label>
                  <Input
                    type="month"
                    value={endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    disabled={isCurrent}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={isCurrent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const updated = [...experiences];
                        updated[index] = { 
                          ...updated[index], 
                          current: checked,
                          endDate: checked ? '' : updated[index].endDate
                        };
                        updateFormData({ experience: updated });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor={`current-${index}`} className="text-sm text-gray-700 cursor-pointer">
                      I currently work here
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-800">Description</Label>
                  <Textarea
                    placeholder="Describe your responsibilities and achievements..."
                    value={description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    rows={4}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 hover:border-gray-400 resize-y"
                  />
                  <p className="text-xs text-gray-500 italic">
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
                        autoTrigger={true}
                        debounceMs={600}
                      />
                    </div>
                  )}
                </div>
              </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            onClick={addExperience}
            className="w-full border-2 border-dashed hover:border-solid hover:bg-blue-50 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {experiences.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 text-gray-500"
          >
            <p className="mb-4">No work experience added yet.</p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" onClick={addExperience}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Experience
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

