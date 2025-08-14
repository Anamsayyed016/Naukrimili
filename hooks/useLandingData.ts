/**
 * Custom hooks for landing page data fetching
 */

import { useState, useEffect } from 'react';

interface Stats {
  activeJobs: number;
  companies: number;
  jobSeekers: number;
  lastUpdated?: string;
}

interface FeaturedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  isRemote: boolean;
  isUrgent: boolean;
  posted: string;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    activeJobs: 50000,
    companies: 15000,
    jobSeekers: 1000000
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useFeaturedJobs(limit = 6) {
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch(`/api/featured-jobs?limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to fetch featured jobs:', err);
        setError('Failed to load featured jobs');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [limit]);

  return { jobs, loading, error };
}
