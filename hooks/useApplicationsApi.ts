import { useState, useEffect, useCallback } from 'react';

export interface Application { id?: number | string; jobId: number | string; userId: number | string; status: string }

export function useApplicationsApi() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : data.applications || []);
      } else setApplications([]);
    } catch (_) { setError('Failed to fetch applications'); } finally { setLoading(false); }
  }, []);

  const createApplication = useCallback(async (application: Application) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(application) });
      if (!res.ok) throw new Error('create failed');
      await fetchApplications();
    } catch (_) { setError('Failed to create application'); } finally { setLoading(false); }
  }, [fetchApplications]);

  const updateApplication = useCallback(async (id: number | string, application: Application) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(application) });
      if (!res.ok) throw new Error('update failed');
      await fetchApplications();
    } catch (_) { setError('Failed to update application'); } finally { setLoading(false); }
  }, [fetchApplications]);

  const deleteApplication = useCallback(async (id: number | string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      await fetchApplications();
    } catch (_) { setError('Failed to delete application'); } finally { setLoading(false); }
  }, [fetchApplications]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  return { applications, loading, error, fetchApplications, createApplication, updateApplication, deleteApplication };
}