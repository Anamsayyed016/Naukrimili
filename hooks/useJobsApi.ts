import { useState, useEffect } from 'react';

export interface Job {
  id?: number;
  title: string;
  description: string;
  location: string;
  // Add other fields as needed
}

export function useJobsApi() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (job: Job): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error('Failed to create');
      await fetchJobs();
    } catch (err) {
      setError('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (id: number, job: Job): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchJobs();
    } catch (err) {
      setError('Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return { jobs, loading, error, fetchJobs, createJob, updateJob, deleteJob };
}
