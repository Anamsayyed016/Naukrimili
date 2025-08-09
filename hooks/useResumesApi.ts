import { useState, useEffect, useCallback } from 'react';

export interface Resume {
  id?: number | string;
  userId: number | string;
  fileUrl: string;
  name?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export function useResumesApi() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const data = await res.json();
        setResumes(Array.isArray(data) ? data : data.resumes || []);
      } else {
        setResumes([]);
      }
    } catch (_) {
      setError('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  const createResume = useCallback(async (resume: Resume) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume)
      });
      if (!res.ok) throw new Error('create failed');
      await fetchResumes();
    } catch (_) {
      setError('Failed to create resume');
    } finally {
      setLoading(false);
    }
  }, [fetchResumes]);

  const updateResume = useCallback(async (id: number | string, resume: Resume) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume)
      });
      if (!res.ok) throw new Error('update failed');
      await fetchResumes();
    } catch (_) {
      setError('Failed to update resume');
    } finally {
      setLoading(false);
    }
  }, [fetchResumes]);

  const deleteResume = useCallback(async (id: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      await fetchResumes();
    } catch (_) {
      setError('Failed to delete resume');
    } finally {
      setLoading(false);
    }
  }, [fetchResumes]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  return { resumes, loading, error, fetchResumes, createResume, updateResume, deleteResume };
}