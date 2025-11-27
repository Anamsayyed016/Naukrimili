'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface ProjectsStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
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

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ projects: updated });
  };

  const removeProject = (index: number) => {
    const updated = projects.filter((_, i) => i !== index);
    updateFormData({ projects: updated });
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
              className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-4"
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
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Description</Label>
                  <Textarea
                    placeholder="Describe the project, your role, and key achievements..."
                    value={description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Technologies</Label>
                    <Input
                      placeholder="React, Node.js, MongoDB"
                      value={technologies}
                      onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                      className="w-full"
                    />
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
          className="w-full border-dashed"
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

