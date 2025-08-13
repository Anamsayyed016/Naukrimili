"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useProfileMutation, type ProfileFormData } from "@/hooks/useProfileMutation";
import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

type ResumeAIData = any;

interface Props {
  resumeId?: string;
  initialAI?: ResumeAIData | null;
  onClose?: () => void;
}

const STORAGE_KEY = "profile_completion_draft";

export default function ProfileCompletionForm({ resumeId, initialAI = null, onClose }: Props) {
  const { mutateAsync, isPending } = useProfileMutation();
  const { toast } = useToast?.() || { toast: () => {} } as any;
  const [aiData, setAiData] = useState<ResumeAIData | null>(initialAI);
  const [loadingAI, setLoadingAI] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialAI ? "Generated from your resume" : null);

  const empty: ProfileFormData = useMemo(() => ({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    jobTitle: "",
    skills: [],
    education: [],
    experience: [],
    preferredJobType: "",
    expectedSalary: "",
    linkedin: "",
    portfolio: "",
  }), []);

  const [form, setForm] = useState<ProfileFormData>(empty);

  // Merge AI data into form
  useEffect(() => {
    if (!aiData) return;
    const merged: ProfileFormData = {
      fullName: aiData.fullName || aiData.personal_info?.full_name || "",
      email: aiData.contact?.email || aiData.personal_info?.email || "",
      phone: aiData.contact?.phone || aiData.personal_info?.phone || "",
      location: aiData.personal_info?.location || "",
      jobTitle: aiData.personal_info?.title || aiData.currentPosition || "",
      skills: aiData.skills || [],
      education: (aiData.education || []).map((e: any) => ({
        school: e.institution || e.school || "",
        degree: e.degree || "",
        startYear: e.startYear || e.start || "",
        endYear: e.endYear || e.end || "",
      })),
      experience: (aiData.experience || aiData.workExperience || []).map((w: any) => ({
        company: w.company || "",
        role: w.title || w.role || "",
        startDate: w.startDate || w.start || "",
        endDate: w.endDate || w.end || "",
        description: Array.isArray(w.description) ? w.description.join("\n") : (w.description || ""),
      })),
      preferredJobType: aiData.preferences?.jobType || "",
      expectedSalary: aiData.preferences?.salary || "",
      linkedin: aiData.personal_info?.linkedin || "",
      portfolio: aiData.personal_info?.portfolio || aiData.personal_info?.website || "",
    };
    setForm(prev => ({ ...prev, ...merged }));
  }, [aiData]);

  // Restore draft
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setForm(prev => ({ ...prev, ...(JSON.parse(raw) as ProfileFormData) }));
    } catch {}
  }, []);

  // Autosave draft
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  const onChange = (name: keyof ProfileFormData, value: any) => setForm(prev => ({ ...prev, [name]: value }));

  const reRunAI = async () => {
    if (!resumeId) return;
    setLoadingAI(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESUME_ANALYZE, { resumeData: aiData || {}, userId: "current", resumeId });
      if (!res.success) throw new Error(res.error || "Failed to analyze");
      const ai = (res as any).analysis?.enhancedData || (res as any).enhancedData || (res as any).data || res;
      setAiData(ai);
      setNotice("Generated from your resume");
    } catch (e: any) {
      setNotice("Couldn’t re-run AI. You can edit manually.");
    } finally {
      setLoadingAI(false);
    }
  };

  const clearManual = () => { setForm(empty); setNotice(null); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Minimal required validation
    if (!form.fullName || !form.email) {
      alert("Full Name and Email are required");
      return;
    }
    const payload: ProfileFormData = { ...form };
    await mutateAsync(payload);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    toast?.({ title: "Profile saved", description: "Your profile has been updated." });
    onClose?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Complete your profile</h2>
        <div className="flex gap-2">
          <button type="button" onClick={reRunAI} className="text-sm px-3 py-1 rounded border">
            {loadingAI ? 'Analyzing...' : 'Re-run AI extraction'}
          </button>
          <button type="button" onClick={clearManual} className="text-sm px-3 py-1 rounded border">Clear & Fill Manually</button>
        </div>
      </div>
      {notice && <p className="text-xs text-gray-600">{notice}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border rounded p-2" placeholder="Full Name" value={form.fullName || ''} onChange={e=>onChange('fullName', e.target.value)} required />
        <input className="border rounded p-2" placeholder="Email" type="email" value={form.email || ''} onChange={e=>onChange('email', e.target.value)} required />
        <input className="border rounded p-2" placeholder="Phone" value={form.phone || ''} onChange={e=>onChange('phone', e.target.value)} />
        <input className="border rounded p-2" placeholder="Location (city/state/country)" value={form.location || ''} onChange={e=>onChange('location', e.target.value)} />
        <input className="border rounded p-2" placeholder="Job Title / Current Position" value={form.jobTitle || ''} onChange={e=>onChange('jobTitle', e.target.value)} />
        <input className="border rounded p-2" placeholder="LinkedIn URL" value={form.linkedin || ''} onChange={e=>onChange('linkedin', e.target.value)} />
        <input className="border rounded p-2" placeholder="Portfolio URL" value={form.portfolio || ''} onChange={e=>onChange('portfolio', e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
        <input className="w-full border rounded p-2" value={(form.skills || []).join(', ')} onChange={e=>onChange('skills', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Work experience</label>
        {(form.experience || []).map((exp, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input className="border rounded p-2" placeholder="Company" value={exp.company || ''} onChange={e=>{
              const arr=[...(form.experience||[])]; arr[idx]={...arr[idx], company:e.target.value}; onChange('experience', arr);
            }} />
            <input className="border rounded p-2" placeholder="Role" value={exp.role || ''} onChange={e=>{ const arr=[...(form.experience||[])]; arr[idx]={...arr[idx], role:e.target.value}; onChange('experience', arr); }} />
            <input className="border rounded p-2" placeholder="Start date" value={exp.startDate || ''} onChange={e=>{ const arr=[...(form.experience||[])]; arr[idx]={...arr[idx], startDate:e.target.value}; onChange('experience', arr); }} />
            <input className="border rounded p-2" placeholder="End date" value={exp.endDate || ''} onChange={e=>{ const arr=[...(form.experience||[])]; arr[idx]={...arr[idx], endDate:e.target.value}; onChange('experience', arr); }} />
            <textarea className="md:col-span-2 border rounded p-2" placeholder="Description" value={exp.description || ''} onChange={e=>{ const arr=[...(form.experience||[])]; arr[idx]={...arr[idx], description:e.target.value}; onChange('experience', arr); }} />
          </div>
        ))}
        <button type="button" className="text-sm px-3 py-1 rounded border" onClick={()=>onChange('experience', [ ...(form.experience||[]), { company:'', role:'', startDate:'', endDate:'', description:'' }])}>Add experience</button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Education</label>
        {(form.education || []).map((ed, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input className="border rounded p-2" placeholder="School" value={ed.school || ''} onChange={e=>{ const arr=[...(form.education||[])]; arr[idx]={...arr[idx], school:e.target.value}; onChange('education', arr); }} />
            <input className="border rounded p-2" placeholder="Degree" value={ed.degree || ''} onChange={e=>{ const arr=[...(form.education||[])]; arr[idx]={...arr[idx], degree:e.target.value}; onChange('education', arr); }} />
            <input className="border rounded p-2" placeholder="Start year" value={ed.startYear || ''} onChange={e=>{ const arr=[...(form.education||[])]; arr[idx]={...arr[idx], startYear:e.target.value}; onChange('education', arr); }} />
            <input className="border rounded p-2" placeholder="End year" value={ed.endYear || ''} onChange={e=>{ const arr=[...(form.education||[])]; arr[idx]={...arr[idx], endYear:e.target.value}; onChange('education', arr); }} />
          </div>
        ))}
        <button type="button" className="text-sm px-3 py-1 rounded border" onClick={()=>onChange('education', [ ...(form.education||[]), { school:'', degree:'', startYear:'', endYear:'' }])}>Add education</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border rounded p-2" placeholder="Preferred job type" value={form.preferredJobType || ''} onChange={e=>onChange('preferredJobType', e.target.value)} />
        <input className="border rounded p-2" placeholder="Expected salary range" value={form.expectedSalary || ''} onChange={e=>onChange('expectedSalary', e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Skip</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={isPending}>{isPending ? 'Saving...' : 'Save profile'}</button>
      </div>
    </form>
  );
}


