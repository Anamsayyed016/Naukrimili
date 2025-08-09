import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CountryCode } from './useLocationDetection';

export interface JobSearchFilters {
  query: string;
  location: string;
  country: CountryCode;
  jobType: string;
  experienceLevel: string;
  companyType: string;
  category: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy: 'relevance' | 'date' | 'salary';
  remote: boolean;
  datePosted: '24h' | '3d' | '7d' | '14d' | '30d' | 'any';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryFormatted?: string;
  timeAgo: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType: string;
  skills?: string[];
  benefits?: string[];
  companyLogo?: string;
}

interface UseRealTimeJobSearchOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useRealTimeJobSearch(initialFilters: Partial<JobSearchFilters>, options: UseRealTimeJobSearchOptions = {}) {
  const { debounceMs = 400, enabled = true } = options;

  const [filters, setFilters] = useState<JobSearchFilters>({
    query: '',
    location: '',
    country: 'US',
    jobType: '',
    experienceLevel: '',
    companyType: '',
    category: '',
    sortBy: 'relevance',
    remote: false,
    datePosted: 'any',
    ...initialFilters
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), debounceMs);
    return () => clearTimeout(t);
  }, [filters, debounceMs]);

  const searchParams = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedFilters.query.trim()) p.append('q', debouncedFilters.query.trim());
    if (debouncedFilters.location.trim()) p.append('location', debouncedFilters.location.trim());
    if (debouncedFilters.country) p.append('country', debouncedFilters.country);
    if (debouncedFilters.jobType) p.append('job_type', debouncedFilters.jobType);
    if (debouncedFilters.experienceLevel) p.append('experience_level', debouncedFilters.experienceLevel);
    if (debouncedFilters.category) p.append('category', debouncedFilters.category);
    if (debouncedFilters.remote) p.append('remote', 'true');
    if (debouncedFilters.datePosted !== 'any') p.append('date_posted', debouncedFilters.datePosted);
    if (debouncedFilters.salaryMin) p.append('salary_min', String(debouncedFilters.salaryMin));
    if (debouncedFilters.salaryMax) p.append('salary_max', String(debouncedFilters.salaryMax));
    p.append('num', '50');
    return p.toString();
  }, [debouncedFilters]);

  const generateMockJobs = useCallback((f: JobSearchFilters): Job[] => {
    const base: Job[] = [
      {
        id: 'mock-1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc',
        location: f.country === 'IN' ? 'Mumbai, India' : f.country === 'GB' ? 'London, UK' : f.country === 'AE' ? 'Dubai, UAE' : 'San Francisco, CA',
        description: 'Build next‑generation software solutions.',
        salaryFormatted: '$120-180k',
        timeAgo: '2 hours ago',
        redirect_url: '/jobs/mock-1',
        isUrgent: true,
        isRemote: f.remote,
        jobType: f.jobType || 'Full-time',
        skills: ['React', 'TypeScript'],
        benefits: ['Health', '401k']
      },
      {
        id: 'mock-2',
        title: 'Product Manager',
        company: 'Innovation Labs',
        location: f.country === 'IN' ? 'Bengaluru, India' : f.country === 'GB' ? 'Manchester, UK' : f.country === 'AE' ? 'Abu Dhabi, UAE' : 'New York, NY',
        description: 'Lead product strategy and execution.',
        salaryFormatted: '$130-190k',
        timeAgo: '4 hours ago',
        redirect_url: '/jobs/mock-2',
        isRemote: f.remote,
        jobType: f.jobType || 'Full-time',
        skills: ['Product', 'Agile'],
        benefits: ['PTO']
      }
    ];
    if (!f.query) return base;
    const q = f.query.toLowerCase();
    return base.filter(j => [j.title, j.company, j.description].some(v => v.toLowerCase().includes(q)) || j.skills?.some(s => s.toLowerCase().includes(q)));
  }, []);

  const fetchJobs = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const backend = process.env.NEXT_PUBLIC_API_URL;
      const primaryUrl = backend ? `${backend.replace(/\/$/, '')}/api/jobs/search?${searchParams}` : '';
      let success = false;
      if (primaryUrl) {
        try {
          const res = await fetch(primaryUrl, { headers: { Accept: 'application/json' } });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.jobs)) {
              setJobs(
                data.jobs.map((j: any): Job => ({
                  id: j.id || `job-${Math.random().toString(36).slice(2, 9)}`,
                  title: j.title || 'Untitled',
                  company: j.company || 'Company',
                  location: j.location || 'Remote',
                  description: j.description || '',
                  salaryFormatted: j.salary_formatted || j.salaryFormatted,
                  timeAgo: j.time_ago || j.timeAgo || 'Recently posted',
                  redirect_url: j.redirect_url || j.apply_url || '/jobs/' + (j.id || 'unknown'),
                  isUrgent: !!(j.is_urgent || j.isUrgent),
                  isRemote: !!(j.is_remote || j.isRemote),
                  jobType: j.job_type || j.jobType || 'Full-time',
                  skills: j.skills || [],
                  benefits: j.benefits || [],
                  companyLogo: j.company_logo || j.companyLogo
                }))
              );
              success = true;
            }
          }
        } catch (_) { /* fall through */ }
      }
      if (!success) {
        // Try legacy endpoint
        try {
          const res2 = await fetch(`/api/jobs?${searchParams}`);
          if (res2.ok) {
            const data2 = await res2.json();
            if (Array.isArray(data2.jobs)) {
              setJobs(
                data2.jobs.map((j: any): Job => ({
                  id: j.id || `job-${Math.random().toString(36).slice(2, 9)}`,
                  title: j.title || 'Untitled',
                  company: j.company || 'Company',
                  location: j.location || 'Remote',
                  description: j.description || '',
                  salaryFormatted: j.salaryFormatted,
                  timeAgo: j.timeAgo || 'Recently posted',
                  redirect_url: j.redirect_url || '/jobs/' + (j.id || 'unknown'),
                  isUrgent: !!j.isUrgent,
                  isRemote: !!j.isRemote,
                  jobType: j.jobType || 'Full-time',
                  skills: j.skills || [],
                  benefits: j.benefits || [],
                  companyLogo: j.companyLogo
                }))
              );
              success = true;
            }
          }
        } catch (_) { /* fall through */ }
      }
      if (!success) {
        setJobs(generateMockJobs(debouncedFilters));
      }
    } catch (_) {
      setError('Job search failed');
      setJobs(generateMockJobs(debouncedFilters));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, searchParams, generateMockJobs, debouncedFilters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const updateFilter = useCallback(<K extends keyof JobSearchFilters>(key: K, value: JobSearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'query' && typeof value === 'string' && value.trim()) {
      setSearchHistory(prev => {
        const v = value.trim();
        const next = [v, ...prev.filter(p => p !== v)];
        return next.slice(0, 10);
      });
    }
  }, []);

  const updateFilters = useCallback((nf: Partial<JobSearchFilters>) => setFilters(prev => ({ ...prev, ...nf })), []);
  const resetFilters = useCallback(() => setFilters(f => ({ ...f, query: '', location: '', jobType: '', experienceLevel: '', companyType: '', category: '', remote: false, datePosted: 'any', sortBy: 'relevance' })), []);
  const clearSearch = useCallback(() => setFilters(prev => ({ ...prev, query: '' })), []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(debouncedFilters).some(([k, v]) => {
      if (k === 'query' || k === 'location') return !!String(v).trim();
      if (k === 'remote') return !!v;
      if (k === 'datePosted') return v !== 'any';
      if (k === 'sortBy') return v !== 'relevance';
      return v !== '' && v != null;
    });
  }, [debouncedFilters]);

  return {
    jobs,
    filters,
    debouncedFilters,
    searchHistory,
    isLoading,
    error,
    updateFilter,
    updateFilters,
    resetFilters,
    clearSearch,
    refetch: fetchJobs,
    searchParams,
    hasActiveFilters
  };
}