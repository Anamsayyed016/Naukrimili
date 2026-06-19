'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { buildSmartSuggestionContext } from '@/lib/resume-builder/suggestion-context-engine';
import { getProjectTechnologySuggestions } from '@/lib/resume-builder/project-aware-suggestions';
import {
  mergeStringSuggestions,
  pickMergeMode,
  stringsToItems,
} from '@/lib/resume-builder/suggestion-items';

interface ProjectsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (
    updates:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => void;
}

type ProjectSuggestionField = 'name' | 'description' | 'technologies';

type ProjectFieldSuggestions = {
  name?: string[];
  description?: string[];
  technologies?: string[];
};

type ProjectAiSuggestionsMap = Record<string, ProjectFieldSuggestions>;

function mergeTechnologySuggestion(existing: string, suggestion: string): string {
  const parts = existing
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const add = suggestion.trim();
  if (!add) return existing;
  const seen = new Set(parts.map((p) => p.toLowerCase()));
  if (!seen.has(add.toLowerCase())) {
    parts.push(add);
  }
  return parts.join(', ');
}

interface Project {
  _id?: string;
  name?: string;
  description?: string;
  technologies?: string;
  link?: string;
  url?: string;
}

function cloneProjectEntry(item: unknown): Project {
  return item && typeof item === 'object' ? { ...(item as Project) } : {};
}

function withProjectFieldAliases(project: Project, field: keyof Project, value: string): Project {
  const updated: Project = { ...project, [field]: value };
  const rec = updated as Record<string, unknown>;
  if (field === 'description') {
    rec.Description = value;
  }
  if (field === 'name') {
    rec.Name = value;
    rec.title = value;
  }
  if (field === 'technologies') {
    rec.Technologies = value;
  }
  if (field === 'link') {
    rec.url = value;
    rec.Link = value;
  }
  return updated;
}

function cloneProjectsList(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => cloneProjectEntry(item));
}

function resolveProjectsList(data: Record<string, unknown>): Project[] {
  const fromProjects = Array.isArray(data.projects) ? data.projects : null;
  const fromAlias = Array.isArray(data.Projects) ? data.Projects : null;
  const raw =
    (fromProjects && fromProjects.length > 0 && fromProjects) ||
    (fromAlias && fromAlias.length > 0 && fromAlias) ||
    fromProjects ||
    fromAlias ||
    [];
  return cloneProjectsList(raw);
}

function readProjectField(project: Project, keys: string[]): string {
  const rec = project as Record<string, unknown>;
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function readProjectId(project: Project): string {
  const id = (project as Record<string, unknown>)._id;
  return typeof id === 'string' ? id : '';
}

function resolveProjectAiSuggestions(formData: Record<string, unknown>): ProjectAiSuggestionsMap {
  const raw = formData.projectAiSuggestions;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ProjectAiSuggestionsMap;
  }
  return {};
}

function getSuggestionsForProject(
  formData: Record<string, unknown>,
  project: Project
): ProjectFieldSuggestions {
  const id = readProjectId(project);
  if (!id) return {};
  return resolveProjectAiSuggestions(formData)[id] || {};
}

export default function ProjectsStep({ formData, updateFormData }: ProjectsStepProps) {
  const projects: Project[] = resolveProjectsList(formData);
  const [loadingSuggestions, setLoadingSuggestions] = useState<
    Record<string, Partial<Record<ProjectSuggestionField, boolean>>>
  >({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const skipProjectFetchRef = useRef<Record<string, boolean>>({});
  const applyProjectLockUntilRef = useRef<Record<string, number>>({});
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Assign stable _id to legacy projects so suggestions persist per project (not by index).
  useEffect(() => {
    const list = resolveProjectsList(formData);
    if (list.some((project) => !readProjectId(project))) {
      updateFormData((prev) => ({ projects: resolveProjectsList(prev) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProjectSuggestions = (
    projectId: string,
    field: ProjectSuggestionField,
    suggestions: string[]
  ) => {
    if (!projectId) return;
    updateFormData((prev) => {
      const all = { ...resolveProjectAiSuggestions(prev) };
      all[projectId] = { ...(all[projectId] || {}), [field]: suggestions };
      if (process.env.NODE_ENV === 'development') {
        console.log('PROJECT SUGGESTIONS store', { projectId, field, all });
      }
      return { projectAiSuggestions: all };
    });
  };

  const requestProjectSuggestions = async (
    index: number,
    field: ProjectSuggestionField,
    value: string,
    options?: { regenerate?: boolean }
  ) => {
    const latestProjects = resolveProjectsList(formDataRef.current);
    const project = latestProjects[index] || {};
    const projectId = readProjectId(project);
    const projectName = readProjectField(project, ['name', 'Name', 'title', 'Title']);
    const projectDescription = readProjectField(project, ['description', 'Description', 'summary', 'Summary']);
    const techList =
      typeof project.technologies === 'string'
        ? project.technologies.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];
    const exclude = options?.regenerate
      ? getSuggestionsForProject(formDataRef.current, project)[field] || []
      : [];

    const response = await fetch('/api/ai/form-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: field === 'name' ? 'project' : field === 'description' ? 'description' : 'skills',
        value,
        formData: formDataRef.current,
        regenerate: !!options?.regenerate,
        excludeSuggestions: exclude,
        context: buildSmartSuggestionContext({
          formData: formDataRef.current,
          currentSection: 'projects',
          currentField: field,
          projectName,
          projectDescription,
          technologies: techList,
          userInput: value,
          isProjectDescription: field === 'description',
          excludeSuggestions: exclude,
          regenerate: !!options?.regenerate,
          currentProjectIndex: index,
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
    updateFormData((prev) => {
      const current = resolveProjectsList(prev);
      return { projects: [...current, newProject] };
    });
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    updateFormData((prev) => {
      const current = resolveProjectsList(prev);
      return {
        projects: current.map((project, i) =>
          i === index ? withProjectFieldAliases(project, field, value) : project
        ),
      };
    });
  };

  const removeProject = (index: number) => {
    updateFormData((prev) => {
      const current = resolveProjectsList(prev);
      const removedId = readProjectId(current[index] || {});
      const nextProjects = current.filter((_, i) => i !== index);
      const nextSuggestions = { ...resolveProjectAiSuggestions(prev) };
      if (removedId) {
        delete nextSuggestions[removedId];
      }
      return { projects: nextProjects, projectAiSuggestions: nextSuggestions };
    });
    setLoadingSuggestions((prev) => {
      const removedId = readProjectId(projects[index] || {});
      if (!removedId) return prev;
      const next = { ...prev };
      delete next[removedId];
      return next;
    });
  };

  const fetchAISuggestions = async (
    index: number,
    field: ProjectSuggestionField,
    value: string
  ) => {
    const latestProjects = resolveProjectsList(formDataRef.current);
    const project = latestProjects[index] || {};
    const projectId = readProjectId(project);
    if (!projectId) return;

    if (!value || value.trim().length < 1) {
      setProjectSuggestions(projectId, field, []);
      return;
    }

    if (field === 'technologies') {
      const instant = getProjectTechnologySuggestions({
        userInput: value,
        projectName: readProjectField(project, ['name', 'Name', 'title', 'Title']),
        projectDescription: readProjectField(project, ['description', 'Description', 'summary', 'Summary']),
        technologies: value.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
        skills: Array.isArray(formDataRef.current.skills) ? (formDataRef.current.skills as string[]) : [],
      });
      if (instant.length > 0) {
        setProjectSuggestions(projectId, 'technologies', instant);
      }
    }

    const timerKey = `${projectId}-${field}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      if (skipProjectFetchRef.current[timerKey]) {
        skipProjectFetchRef.current[timerKey] = false;
        return;
      }
      if (Date.now() < (applyProjectLockUntilRef.current[timerKey] || 0)) {
        return;
      }

      setLoadingSuggestions((prev) => ({
        ...prev,
        [projectId]: { ...prev[projectId], [field]: true },
      }));

      try {
        const list = await requestProjectSuggestions(index, field, value);
        const latestId = readProjectId(resolveProjectsList(formDataRef.current)[index] || {});
        if (!latestId) return;

        if (list?.length) {
          const current = getSuggestionsForProject(formDataRef.current, project)[field] || [];
          const mode = pickMergeMode(stringsToItems(current), { source: 'auto' });
          const merged = mergeStringSuggestions(current, list, mode);
          setProjectSuggestions(latestId, field, merged);
        } else {
          setProjectSuggestions(latestId, field, []);
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoadingSuggestions((prev) => ({
          ...prev,
          [projectId]: { ...prev[projectId], [field]: false },
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
          const projectId = readProjectId(project) || `project-${index}`;
          const suggestions = getSuggestionsForProject(formData, project);
          const name = readProjectField(project, ['name', 'Name', 'title', 'Title']);
          const description = readProjectField(project, ['description', 'Description', 'summary', 'Summary']);
          const technologies = readProjectField(project, ['technologies', 'Technologies', 'tech_stack']);
          const link = readProjectField(project, ['link', 'Link', 'url']);

          return (
            <div
              key={projectId}
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
                  {suggestions.name && suggestions.name.length > 0 && (
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
                          disabled={loadingSuggestions[projectId]?.name}
                          onClick={async () => {
                            setLoadingSuggestions((p) => ({
                              ...p,
                              [projectId]: { ...p[projectId], name: true },
                            }));
                            const list = await requestProjectSuggestions(index, 'name', name, {
                              regenerate: true,
                            });
                            if (list?.length) {
                              const current = suggestions.name || [];
                              const mode = pickMergeMode(stringsToItems(current), { regenerate: true });
                              setProjectSuggestions(
                                projectId,
                                'name',
                                mergeStringSuggestions(current, list, mode)
                              );
                            }
                            setLoadingSuggestions((p) => ({
                              ...p,
                              [projectId]: { ...p[projectId], name: false },
                            }));
                          }}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.name.slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const key = `${projectId}-name`;
                              skipProjectFetchRef.current[key] = true;
                              applyProjectLockUntilRef.current[key] = Date.now() + 3000;
                              updateProject(index, 'name', suggestion);
                            }}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors border border-blue-100"
                            title="Use suggestion"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[projectId]?.name && (
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
                      if (e.target.value.trim().length >= 3) {
                        fetchAISuggestions(index, 'description', e.target.value);
                      } else if (readProjectId(project)) {
                        setProjectSuggestions(readProjectId(project), 'description', []);
                      }
                    }}
                    rows={4}
                    className="w-full"
                  />
                  {suggestions.description && suggestions.description.length > 0 && (
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
                          disabled={loadingSuggestions[projectId]?.description}
                          onClick={async () => {
                            setLoadingSuggestions((p) => ({
                              ...p,
                              [projectId]: { ...p[projectId], description: true },
                            }));
                            const list = await requestProjectSuggestions(index, 'description', description, {
                              regenerate: true,
                            });
                            if (list?.length) {
                              const current = suggestions.description || [];
                              const mode = pickMergeMode(stringsToItems(current), { regenerate: true });
                              setProjectSuggestions(
                                projectId,
                                'description',
                                mergeStringSuggestions(current, list, mode)
                              );
                            }
                            setLoadingSuggestions((p) => ({
                              ...p,
                              [projectId]: { ...p[projectId], description: false },
                            }));
                          }}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {suggestions.description.slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const key = `${projectId}-description`;
                              skipProjectFetchRef.current[key] = true;
                              applyProjectLockUntilRef.current[key] = Date.now() + 3000;
                              updateProject(index, 'description', suggestion);
                            }}
                            className="block w-full text-left text-xs px-2.5 py-2 bg-white text-gray-800 rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <span className="line-clamp-3">{suggestion}</span>
                            <span className="text-blue-600 font-medium mt-1 inline-block">Use</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loadingSuggestions[projectId]?.description && (
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
                    {suggestions.technologies && suggestions.technologies.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Suggestions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.technologies.slice(0, 4).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const key = `${projectId}-technologies`;
                                skipProjectFetchRef.current[key] = true;
                                applyProjectLockUntilRef.current[key] = Date.now() + 3000;
                                updateProject(
                                  index,
                                  'technologies',
                                  mergeTechnologySuggestion(technologies, suggestion)
                                );
                              }}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {loadingSuggestions[projectId]?.technologies && (
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
