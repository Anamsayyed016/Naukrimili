"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      if (resume) form.append("file", resume);
      form.append("jobId", jobId);
      const res = await fetch(`/api/applications`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to apply");
      setStatus("Application submitted");
      setTimeout(() => router.push(`/jobs/${jobId}`), 800);
    } catch (err: any) {
      setStatus(err?.message || "Failed to apply");
    }
  };

  const handleResumeChange = async (file: File | null) => {
    setResume(file);
    if (!file) return;
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/resumes/autofill', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data?.success && data?.profile) {
        if (data.profile.fullName) setName(data.profile.fullName);
        if (data.profile.email) setEmail(data.profile.email);
        // In the future, extend form with phone/skills/experience/education as needed
      }
    } catch (err) {
      // Silently ignore; user can fill manually
    }
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Apply to Job #{jobId}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="file" accept=".pdf,.doc,.docx" onChange={e=>handleResumeChange(e.target.files?.[0]||null)} className="block w-full border rounded p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}


