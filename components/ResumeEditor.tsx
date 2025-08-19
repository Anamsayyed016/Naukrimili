'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResumeAI, ResumeData, ResumeAnalysis } from '@/lib/resume-ai';
import { PlusIcon, TrashIcon, SparklesIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ResumeEditorProps {
  initialValues?: Partial<ResumeData>;
  onSave: (data: ResumeData) => void;
  enableAIAssist?: boolean;
}

export default function ResumeEditor({ 
  initialValues = {}, 
  onSave,
  enableAIAssist = true
}: ResumeEditorProps) {
  const [form, setForm] = useState<ResumeData>({
    fullName: '',
    contact: { email: '', phone: '' },
    summary: '',
    skills: [],
    education: [],
    workExperience: [],
    certifications: [],
    projects: [],
    ...initialValues
  } as ResumeData);

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-analyze resume when form changes
  useEffect(() => {
    if (enableAIAssist) {
      const timer = setTimeout(() => {
        const newAnalysis = ResumeAI.analyzeResume(form);
        setAnalysis(newAnalysis);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [form, enableAIAssist]);

  const handleAIGenerate = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generated = ResumeAI.generateResume(form);
      setForm(generated);
      setShowAIPanel(false);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = ResumeAI.validateResume(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors([]);
    onSave(form);
  };

  const updateField = (field: keyof ResumeData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '', details: '' }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addWorkExperience = () => {
    setForm(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        jobTitle: '', company: '', startDate: '', endDate: '', responsibilities: ['']
      }]
    }));
  };

  const updateWorkExperience = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (index: number) => {
    setForm(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setForm(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', technologies: [] }]
    }));
  };

  const updateProject = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  const removeProject = (index: number) => {
    setForm(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !form.skills.includes(skill.trim())) {
      setForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (index: number) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* AI Assistant Panel */}
      {enableAIAssist && (
        <motion.div
          className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">AI Resume Assistant</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="text-purple-600 hover:text-purple-800"
            >
              {showAIPanel ? 'Hide' : 'Show'} Analysis
            </button>
          </div>

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${analysis.completeness >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                  {analysis.completeness}%
                </div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.suggestions.length}</div>
                <div className="text-sm text-gray-600">Suggestions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{analysis.issues.length}</div>
                <div className="text-sm text-gray-600">Issues</div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={isAnalyzing}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Generating...' : 'AI Enhance Resume'}
          </button>

          <AnimatePresence>
            {showAIPanel && analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                {analysis.suggestions.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Suggestions</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.missingFields.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Missing Fields</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      {analysis.missingFields.map((field, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Please fix the following errors:</h4>
          <ul className="text-sm text-red-800 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Resume Editor</h2>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.contact.email}
              onChange={(e) => updateField('contact', { ...form.contact, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={form.contact.phone}
              onChange={(e) => updateField('contact', { ...form.contact, phone: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Professional Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Summary *
          </label>
          <textarea
            placeholder="Brief professional summary highlighting your key strengths and career objectives"
            value={form.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Skills Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills *
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-md">
              {form.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a skill and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Education Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Education</label>
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Education
            </button>
          </div>
          <div className="space-y-4">
            {form.education.map((edu, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Year (YYYY)"
                    value={edu.year}
                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Additional details"
                    value={edu.details}
                    onChange={(e) => updateEducation(index, 'details', e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Experience Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Work Experience</label>
            <button
              type="button"
              onClick={addWorkExperience}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Experience
            </button>
          </div>
          <div className="space-y-4">
            {form.workExperience.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeWorkExperience(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.jobTitle}
                    onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Start Date (YYYY-MM)"
                    value={exp.startDate}
                    onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="End Date (YYYY-MM or Present)"
                    value={exp.endDate}
                    onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Key responsibilities and achievements (one per line)"
                  value={exp.responsibilities.join('\n')}
                  onChange={(e) => updateWorkExperience(index, 'responsibilities', e.target.value.split('\n').filter(r => r.trim()))}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Projects</label>
            <button
              type="button"
              onClick={addProject}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Project
            </button>
          </div>
          <div className="space-y-4">
            {form.projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Project Description"
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Technologies (comma-separated)"
                    value={project.technologies.join(', ')}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certifications
          </label>
          <textarea
            placeholder="List your certifications (one per line)"
            value={form.certifications.join('\n')}
            onChange={(e) => updateField('certifications', e.target.value.split('\n').filter(c => c.trim()))}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-6">
          <button 
            type="submit" 
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Save Resume
          </button>
          
          <button
            type="button"
            onClick={() => {
              const dataStr = JSON.stringify(form, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${form.fullName.replace(/\s+/g, '_')}_resume.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </form>
    </div>
  );
}
