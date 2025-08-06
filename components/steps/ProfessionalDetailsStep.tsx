import React from 'react';

interface ProfessionalDetailsStepProps {
  data: {
    title: string;
    experience: number;
    skills: string[];
    education: {
      degree: string;
      institution: string;
      year: number}[]};
  onUpdate: (updates: Partial<ProfessionalDetailsStepProps['data']>) => void}

export function ProfessionalDetailsStep({ data, onUpdate }: ProfessionalDetailsStepProps) {
  const addEducation = () => {
    onUpdate({
      education: [
        ...data.education,
        { degree: '', institution: '', year: new Date().getFullYear() }
      ]
    })};

  const updateEducation = (index: number, updates: Partial<ProfessionalDetailsStepProps['data']['education'][0]>) => {
    const newEducation = [...data.education];
    newEducation[index] = { ...newEducation[index], ...updates };
    onUpdate({ education: newEducation })};

  const removeEducation = (index: number) => {
    onUpdate({
      education: data.education.filter((_, i) => i !== index)
    })};

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">💼 Professional Details</h2>
      
      <div>
        <label className="block text-white text-sm font-medium mb-2">Job Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
          placeholder="e.g. Software Engineer"
        />
      </div>
      
      <div>
        <label className="block text-white text-sm font-medium mb-2">Years of Experience</label>
        <input
          type="number"
          value={data.experience}
          onChange={(e) => onUpdate({ experience: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
        />
      </div>
      
      <div>
        <label className="block text-white text-sm font-medium mb-2">Skills (comma-separated)</label>
        <input
          type="text"
          value={data.skills.join(', ')}
          onChange={(e) => onUpdate({ skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
          placeholder="e.g. React, TypeScript, Node.js"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-white text-sm font-medium">Education</label>
          <button
            onClick={addEducation}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
          >
            + Add Education
          </button>
        </div>
        
        {data.education.map((edu, index) => (
          <div key={index} className="p-4 bg-white/5 rounded-lg space-y-4">
            <div className="flex justify-between">
              <h4 className="text-white font-medium">Education #{index + 1}</h4>
              <button
                onClick={() => removeEducation(index)}
                className="text-red-400 hover:text-red-300 transition-all"
              >
                Remove
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, { degree: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Bachelor's in Computer Science"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Institution</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, { institution: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. University Name"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Year</label>
                <input
                  type="number"
                  value={edu.year}
                  onChange={(e) => updateEducation(index, { year: parseInt(e.target.value) || new Date().getFullYear() })}
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>)}
