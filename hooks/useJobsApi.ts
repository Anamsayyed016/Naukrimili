import { useState, useEffect, useCallback } from 'react';

export interface Job {
  id?: number | string;
  title: string;
  description: string;
  location: string;
}

export function useJobsApi() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : data.jobs || []);
      } else {
        setJobs([]);
      }
    } catch (_) {
      setError('Failed to fetch jobs');
    } finally { setLoading(false); }
  }, []);

  const createJob = useCallback(async (job: Job) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) });
      if (!res.ok) throw new Error('create failed');
      await fetchJobs();
    } catch (_) { setError('Failed to create job'); } finally { setLoading(false); }
  }, [fetchJobs]);

  const updateJob = useCallback(async (id: number | string, job: Job) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) });
      if (!res.ok) throw new Error('update failed');
      await fetchJobs();
    } catch (_) { setError('Failed to update job'); } finally { setLoading(false); }
  }, [fetchJobs]);

  const deleteJob = useCallback(async (id: number | string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      await fetchJobs();
    } catch (_) { setError('Failed to delete job'); } finally { setLoading(false); }
  }, [fetchJobs]);

  useEffect(() => { 
    let isMounted = true;
    
    const loadJobs = async () => {
      if (isMounted) {
        await fetchJobs();
      }
    };
    
    loadJobs();
    
    return () => {
      isMounted = false;
    };
  }, [fetchJobs]);

  return { jobs, loading, error, fetchJobs, createJob, updateJob, deleteJob };
}
