import React, { useState } from "react";

export default function ResumeEditor({ initialValues }: { initialValues: Record<string, unknown> }) {// Debug log
  
  // Ensure we have valid initial values with defaults
  const defaultValues = {
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      location: { city: '', country: '' },
      linkedin: null,
      portfolio: null
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      certifications: []
    },
    total_experience_years: 0,
    summary: ''
  };

  const [form, setForm] = useState({
    ...defaultValues,
    ...initialValues
  });// Debug log

  const handleChange = (section: string, key: string, value: Record<string, unknown>, idx?: number) => {
    setForm((prev: Record<string, unknown>) => {
      const updated = { ...prev };
      if (Array.isArray(updated[section]) && typeof idx === 'number') {
        updated[section][idx][key] = value} else if (section in updated) {
        updated[section][key] = value} else {
        updated[section] = value}
      return updated})};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send form data to backendalert("Resume saved! (see console)")};

  return (
    <form className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Edit Resume</h2>
      {/* Personal Info */}
      <div>
        <h3 className="font-semibold mb-2">Personal Info</h3>
        <input className="input" placeholder="Full Name" value={form.personal_info?.full_name || ''} onChange={e => handleChange('personal_info', 'full_name', e.target.value)} />
        <input className="input" placeholder="Email" value={form.personal_info?.email || ''} onChange={e => handleChange('personal_info', 'email', e.target.value)} />
        <input className="input" placeholder="Phone" value={form.personal_info?.phone || ''} onChange={e => handleChange('personal_info', 'phone', e.target.value)} />
        <input className="input" placeholder="City" value={form.personal_info?.location?.city || ''} onChange={e => handleChange('personal_info', 'location', { ...form.personal_info?.location, city: e.target.value })} />
        <input className="input" placeholder="Country" value={form.personal_info?.location?.country || ''} onChange={e => handleChange('personal_info', 'location', { ...form.personal_info?.location, country: e.target.value })} />
        <input className="input" placeholder="LinkedIn" value={form.personal_info?.linkedin || ''} onChange={e => handleChange('personal_info', 'linkedin', e.target.value)} />
        <input className="input" placeholder="Portfolio" value={form.personal_info?.portfolio || ''} onChange={e => handleChange('personal_info', 'portfolio', e.target.value)} />
      </div>
      {/* Experience */}
      <div>
        <h3 className="font-semibold mb-2">Experience</h3>
        {(form.experience || []).map((exp: Record<string, unknown>, idx: number) => (
          <div key={idx} className="border p-3 rounded mb-2">
            <input className="input" placeholder="Job Title" value={exp.job_title || ''} onChange={e => handleChange('experience', 'job_title', e.target.value, idx)} />
            <input className="input" placeholder="Company" value={exp.company || ''} onChange={e => handleChange('experience', 'company', e.target.value, idx)} />
            <input className="input" placeholder="Start Date" value={exp.start_date || ''} onChange={e => handleChange('experience', 'start_date', e.target.value, idx)} />
            <input className="input" placeholder="End Date" value={exp.end_date || ''} onChange={e => handleChange('experience', 'end_date', e.target.value, idx)} />
            <input className="input" placeholder="Current" type="checkbox" checked={exp.current || false} onChange={e => handleChange('experience', 'current', e.target.checked, idx)} /> Current
            <textarea className="input" placeholder="Description (comma separated)" value={(exp.description || []).join(', ')} onChange={e => handleChange('experience', 'description', e.target.value.split(','), idx)} />
          </div>
        ))}
      </div>
      {/* Education */}
      <div>
        <h3 className="font-semibold mb-2">Education</h3>
        {(form.education || []).map((edu: Record<string, unknown>, idx: number) => (
          <div key={idx} className="border p-3 rounded mb-2">
            <input className="input" placeholder="Degree" value={edu.degree || ''} onChange={e => handleChange('education', 'degree', e.target.value, idx)} />
            <input className="input" placeholder="Institution" value={edu.institution || ''} onChange={e => handleChange('education', 'institution', e.target.value, idx)} />
            <input className="input" placeholder="Field of Study" value={edu.field_of_study || ''} onChange={e => handleChange('education', 'field_of_study', e.target.value, idx)} />
            <input className="input" placeholder="Graduation Year" value={edu.graduation_year || ''} onChange={e => handleChange('education', 'graduation_year', e.target.value, idx)} />
          </div>
        ))}
      </div>
      {/* Skills */}
      <div>
        <h3 className="font-semibold mb-2">Skills</h3>
        <input className="input" placeholder="Technical Skills (comma separated)" value={(form.skills?.technical || []).join(', ')} onChange={e => handleChange('skills', 'technical', e.target.value.split(','))} />
        <input className="input" placeholder="Soft Skills (comma separated)" value={(form.skills?.soft || []).join(', ')} onChange={e => handleChange('skills', 'soft', e.target.value.split(','))} />
        <input className="input" placeholder="Certifications (comma separated)" value={(form.skills?.certifications || []).join(', ')} onChange={e => handleChange('skills', 'certifications', e.target.value.split(','))} />
      </div>
      {/* Total Experience & Summary */}
      <div>
        <input className="input" placeholder="Total Experience (years)" value={form.total_experience_years || 0} onChange={e => handleChange('', 'total_experience_years', e.target.value)} />
        <textarea className="input" placeholder="Summary" value={form.summary || ''} onChange={e => handleChange('', 'summary', e.target.value)} />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">Save Resume</button>
    </form>
  );
} 