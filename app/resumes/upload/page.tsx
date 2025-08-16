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
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setStatus("Uploading...");
    setProgress(10);
    setError(null);
    
    const form = new FormData();
    form.append("resume", file);
    
    try {
      // Upload resume with analysis
      const res = await fetch("/api/upload/resume", { 
        method: "POST", 
        body: form 
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      setProgress(50);
      setStatus("Analyzing resume...");
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Set resume ID and parsed data
      setResumeId(data.resume.id);
      
      if (data.parsedData) {
        setAiData(data.parsedData);
        setStatus("Analysis complete!");
      } else {
        setStatus("Upload complete, but analysis failed");
      }
      
      setProgress(100);
      
      // Move to profile completion step
      setTimeout(() => {
        setStep(2);
      }, 1000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || "Upload failed");
      setStatus("Upload failed");
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setStatus("");
      setProgress(0);
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus("");
    setProgress(0);
    setError(null);
    setStep(1);
    setResumeId(undefined);
    setAiData(null);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className={step === 1 ? 'font-semibold' : ''}>Step 1 — Upload</span>
        <span>›</span>
        <span className={step === 2 ? 'font-semibold' : ''}>Step 2 — Profile Completion</span>
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-6">Upload Resume</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resume File
              </label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required 
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX (Max size: 10MB)
              </p>
            </div>
            
            <button 
              type="submit" 
              disabled={!file || progress > 0}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {progress > 0 ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </form>
          
          {status && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                {progress > 0 && progress < 100 && (
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
                <p className="text-blue-800">{status}</p>
              </div>
              
              {progress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">{progress}% complete</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="mb-6">
            <button 
              onClick={resetForm}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Upload another resume
            </button>
          </div>
          
          <ProfileCompletionForm 
            resumeId={resumeId} 
            initialData={aiData} 
            onClose={resetForm} 
          />
        </div>
      )}
    </div>
  );
}