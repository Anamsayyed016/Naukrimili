import { useState } from 'react';

interface AIData {
  parsedResume?: any;
  atsScore?: number;
  suggestions?: string[];
}

export function useResumeUpload() {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = async (file: File) => {
    setLoading(true);
    setError(null);
    setAiData(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAiData({
          parsedResume: data.resume.aiData,
          atsScore: data.resume.atsScore,
          suggestions: [
            'Add more specific technical skills',
            'Include quantifiable achievements',
            'Optimize keywords for ATS systems'
          ]
        });
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadResume,
    loading,
    aiData,
    error
  };
}