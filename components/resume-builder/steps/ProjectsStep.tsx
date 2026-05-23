'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { buildSmartSuggestionContext } from '@/lib/resume-builder/suggestion-context-engine';

interface ProjectsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

interface Project {
  name?: string;
  description?: string;
  technologies?: string;
  link?: string;
  url?: string;
}

export default function ProjectsStep({ formData, updateFormData }: ProjectsStepProps) {
  const projects: Project[] = Array.isArray(formData.projects) ? formData.projects : [];
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: { name?: string[]; description?: string[]; technologies?: string[] } }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: number]: { name?: boolean; description?: boolean; technologies?: boolean } }>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const requestProjectSuggestions = async (
    index: number,
    field: 'name' | 'description' | 'technologies',
    value: string,
    options?: { regenerate?: boolean }
  ) => {
    const projectName = projects[index]?.name || '';
    const techList =
      typeof projects[index]?.technologies === 'string'
        ? projects[index]!.technologies!.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];
    const exclude = options?.regenerate ? aiSuggestions[index]?.[field] || [] : [];

    const response = await fetch('/api/ai/form-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: field === 'name' ? 'project' : field === 'description' ? 'description' : 'skills',
        value,
        formData,
        regenerate: !!options?.regenerate,
        excludeSuggestions: exclude,
        context: buildSmartSuggestionContext({
          formData,
          currentSection: 'projects',
          currentField: field,
          projectName: field === 'description' ? projectName : value,
          technologies: techList,
          userInput: value,
          isProjectDescription: field === 'description',
          excludeSuggestions: exclude,
          regenerate: !!options?.regenerate,
        }),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data.success && Array.isArray(data.suggestions)) return data.suggestions as string[];
    return null;
  };

  const addProject = () => {
    const newProject: Project = {
      name: '',
      description: '',
      technologies: '',
      link: '',
    };
    updateFormData({
      projects: [...projects, newProject],
    });
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ projects: updated });
  };

  const removeProject = (index: number) => {
    const updated = projects.filter((_, i) => i !== index);
    updateFormData({ projects: updated });
    // Clear suggestions for removed project
    setAiSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[index];
      return newSuggestions;
    });
  };

  // Fetch AI suggestions dynamically
  const fetchAISuggestions = async (index: number, field: 'name' | 'description' | 'technologies', value: string) => {
    // Reduced minimum length to 1 character for faster, more dynamic suggestions
    if (!value || value.trim().length < 1) {
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
        const list = await requestProjectSuggestions(index, field, value);
        if (list?.length) {
          setAiSuggestions((prev) => ({
            ...prev,
            [index]: { ...prev[index], [field]: list },
          }));
        } else {
          setAiSuggestions((prev) => ({
            ...prev,
            [index]: { ...prev[index], [field]: [] },
          }));
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
        <p className="text-sm text-gray-600">
          Showcase your notable projects and achievements.
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((project, index) => {
          const name = project.name || '';
          const description = project.description || '';
          const technologies = project.technologies || '';
          const link = project.link || project.url || '';

          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Project #{index + 1}
                </h3>
                {projects.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Project Name</Label>
                  <Input
                    placeholder="E-commerce Platform"
                    value={name}
                    onChange={(e) => {
                      updateProject(index, 'name', e.target.value);
                      fetchAISuggestions(index, 'name', e.target.value);
                    }}
                    className="w-full"
                  />
                  {aiSuggestions[index]?.name && aiSuggestions[index].name!.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Sparkles className="w-3 h-3" />
                          <span>Suggested titles</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={loadingSuggestions[index]?.name}
                          onClick={async () => {
                            setLoadingSuggestions((p) => ({ ...p, [index]: { ...p[index], name: true } }));
                            const list = await requestProjectSuggestions(index, 'name', name, { regenerate: true });
                            if (list?.length) {
                              setAiSuggestions((p) => ({ ...p, [index]: { ...p[index], name: list } }));
                            }
                            setLoadingSuggestions((p) => ({ ...p, [index]: { ...p[index], name: false } }));
                          }}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions[index].name!.slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => updateProject(index, 'name', suggestion)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors border border-blue-100"
                            title="Use suggestion"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[index]?.name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Getting AI suggestions...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Description</Label>
                  <Textarea
                    placeholder="Describe the project, your role, and key achievements..."
                    value={description}
                    onChange={(e) => {
                      updateProject(index, 'description', e.target.value);
                      // Trigger suggestions dynamically as user types (reduced threshold to 3 characters)
                      if (e.target.value.trim().length >= 3) {
                        fetchAISuggestions(index, 'description', e.target.value);
                      } else {
                        // Clear suggestions if input is too short
                        setAiSuggestions(prev => ({
                          ...prev,
                          [index]: { ...prev[index], description: [] }
                        }));
                      }
                    }}
                    rows={4}
                    className="w-full"
                  />
                  {aiSuggestions[index]?.description && aiSuggestions[index].description!.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span>Project descriptions</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={loadingSuggestions[index]?.description}
                          onClick={async () => {
                            setLoadingSuggestions((p) => ({ ...p, [index]: { ...p[index], description: true } }));
                            const list = await requestProjectSuggestions(index, 'description', description, { regenerate: true });
                            if (list?.length) {
                              setAiSuggestions((p) => ({ ...p, [index]: { ...p[index], description: list } }));
                            }
                            setLoadingSuggestions((p) => ({ ...p, [index]: { ...p[index], description: false } }));
                          }}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {aiSuggestions[index].description!.slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => updateProject(index, 'description', suggestion)}
                            className="block w-full text-left text-xs px-2.5 py-2 bg-white text-gray-800 rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <span className="line-clamp-3">{suggestion}</span>
                            <span className="text-blue-600 font-medium mt-1 inline-block">Use</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[index]?.description && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Getting AI suggestions...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Technologies</Label>
                    <Input
                      placeholder="React, Node.js, MongoDB"
                      value={technologies}
                      onChange={(e) => {
                        updateProject(index, 'technologies', e.target.value);
                        fetchAISuggestions(index, 'technologies', e.target.value);
                      }}
                      className="w-full"
                    />
                    {aiSuggestions[index]?.technologies && aiSuggestions[index].technologies!.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Suggestions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions[index].technologies!.slice(0, 4).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => updateProject(index, 'technologies', suggestion)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {loadingSuggestions[index]?.technologies && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Getting AI suggestions...</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Project Link (Optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => updateProject(index, 'link', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={addProject}
          className="w-full border-2 border-dashed hover:border-solid hover:bg-blue-50 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No projects added yet.</p>
          <Button variant="outline" onClick={addProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Project
          </Button>
        </div>
      )}
    </div>
  );
}

