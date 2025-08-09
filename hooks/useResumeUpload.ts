import { useState, useCallback } from 'react';

export interface AIData {
  parsedResume?: Record<string, unknown>;
  atsScore?: number;
  suggestions?: string[];
}

export function useResumeUpload() {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setAiData(null);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/resumes/upload', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.resume) {
          setAiData({
            parsedResume: data.resume.aiData || {},
            atsScore: data.resume.atsScore || 0,
            suggestions: data.resume.suggestions || [
              'Add quantifiable achievements',
              'Include relevant technical keywords',
              'Tailor summary to target role'
            ]
          });
        } else {
            setError(data.message || 'Upload failed');
        }
      } else {
        setError('Upload failed');
      }
    } catch (_) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadResume, loading, aiData, error };
}