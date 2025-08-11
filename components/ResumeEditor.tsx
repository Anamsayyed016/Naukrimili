'use client';

import React, { useState } from 'react';

interface ResumeData {
  full_name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
}

interface ResumeEditorProps {
  initialValues?: ResumeData;
  onSave: (data: ResumeData) => void;
}

export default function ResumeEditor({ 
  initialValues = {}, 
  onSave 
}: ResumeEditorProps) {
  const [form, setForm] = useState<ResumeData>(initialValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const updateField = (field: keyof ResumeData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Editor</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={form.full_name || ''}
          onChange={(e) => updateField('full_name', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          value={form.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone
        </label>
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={form.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Summary
        </label>
        <textarea
          placeholder="Brief professional summary"
          value={form.summary || ''}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience
        </label>
        <textarea
          placeholder="Work experience"
          value={form.experience || ''}
          onChange={(e) => updateField('experience', e.target.value)}
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education
        </label>
        <textarea
          placeholder="Educational background"
          value={form.education || ''}
          onChange={(e) => updateField('education', e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills
        </label>
        <textarea
          placeholder="Key skills and competencies"
          value={form.skills || ''}
          onChange={(e) => updateField('skills', e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
      >
        Save Resume
      </button>
    </form>
  );
}