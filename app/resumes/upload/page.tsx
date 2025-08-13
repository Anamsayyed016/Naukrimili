"use client";
import React, { useMemo, useState } from "react";
import ProfileCompletionForm from "@/components/resume/ProfileCompletionForm";
import { apiClient, API_ENDPOINTS } from "@/lib/api-client";

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [resumeId, setResumeId] = useState<string | undefined>(undefined);
  const [aiData, setAiData] = useState<any | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading...");
    setProgress(10);
    const form = new FormData();
    form.append("file", file);
    try {
      // Prefer the robust upload endpoint if present
      let data: any;
      try {
        const uploadRes = await apiClient.upload(API_ENDPOINTS.RESUME_UPLOAD, file, p=>setProgress(Math.min(90, Math.round(p))));
        if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed');
        data = uploadRes;
      } catch {
        const res = await fetch("/api/upload/resume", { method: "POST", body: form });
        setProgress(90);
        data = await res.json();
        if (!res.ok || data?.success === false) throw new Error(data?.error || 'Upload failed');
      }

      // Capture id if available and attempt AI analyze
      const id = data?.resume?.id || data?.resumeId;
      setResumeId(id);
      try {
        const ai = await apiClient.post(API_ENDPOINTS.RESUME_ANALYZE, { resumeData: data?.parsedData || {}, userId: 'current', resumeId: id });
        if (ai?.success) setAiData((ai as any).enhancedData || (ai as any).analysis?.enhancedData || ai?.data);
      } catch {}
      setProgress(100);
      setStatus("Uploaded successfully");
      setStep(2);
    } catch (err: any) {
      setStatus(err?.message || "Upload failed");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className={step===1? 'font-semibold' : ''}>Step 1 — Upload</span>
        <span>›</span>
        <span className={step===2? 'font-semibold' : ''}>Step 2 — Profile Completion</span>
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-6">Upload Resume</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="block w-full border rounded p-2" required />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
          </form>
          {status && (<p className="mt-4 text-sm text-gray-700">{status} {progress ? `(${progress}%)` : null}</p>)}
        </div>
      )}

      {step === 2 && (
        <ProfileCompletionForm resumeId={resumeId} initialAI={aiData} onClose={()=>{ /* return to dashboard/profile */ }} />
      )}
    </div>
  );
}