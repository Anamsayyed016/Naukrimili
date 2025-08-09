import { useState, useEffect, useCallback } from 'react';

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  isHiring?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompaniesFilters {
  search?: string; industry?: string; size?: string; location?: string; hiring?: boolean; verified?: boolean; page?: number; limit?: number;
}

interface CompaniesListResponse { companies: Company[]; total?: number; page?: number; pageSize?: number }
interface CompanyDetailResponse { company: Company; related?: Company[] }

export function useCompaniesApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = (filters: CompaniesFilters): string => {
    const p = new URLSearchParams();
    if (filters.search) p.append('search', filters.search);
    if (filters.industry) p.append('industry', filters.industry);
    if (filters.size) p.append('size', filters.size);
    if (filters.location) p.append('location', filters.location);
    if (filters.hiring) p.append('hiring', 'true');
    if (filters.verified) p.append('verified', 'true');
    if (filters.page) p.append('page', String(filters.page));
    if (filters.limit) p.append('limit', String(filters.limit));
    return p.toString();
  };

  const fetchCompanies = useCallback(async (filters: CompaniesFilters = {}) => {
    setLoading(true); setError(null);
    try {
      const qs = buildQuery(filters);
      const res = await fetch(`/api/companies?${qs}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const list: CompaniesListResponse = Array.isArray(data) ? { companies: data } : data;
      return list;
    } catch (_) { setError('Failed to fetch companies'); return null; } finally { setLoading(false); }
  }, []);

  const fetchCompany = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/companies/${id}`);
      if (!res.ok) throw new Error('fetch failed');
      const data: CompanyDetailResponse = await res.json();
      return data;
    } catch (_) { setError('Failed to fetch company'); return null; } finally { setLoading(false); }
  }, []);

  const createCompany = useCallback(async (input: Partial<Company>) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error('create failed');
      const data = await res.json();
      return (data.company || data) as Company;
    } catch (_) { setError('Failed to create company'); return null; } finally { setLoading(false); }
  }, []);

  const updateCompany = useCallback(async (id: string, input: Partial<Company>) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error('update failed');
      const data = await res.json();
      return (data.company || data) as Company;
    } catch (_) { setError('Failed to update company'); return null; } finally { setLoading(false); }
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      return true;
    } catch (_) { setError('Failed to delete company'); return false; } finally { setLoading(false); }
  }, []);

  return { loading, error, fetchCompanies, fetchCompany, createCompany, updateCompany, deleteCompany };
}

// Convenience hook for list with auto fetch
export function useCompanies(filters: CompaniesFilters = {}) {
  const { loading, error, fetchCompanies } = useCompaniesApi();
  const [companies, setCompanies] = useState<Company[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchCompanies(filters);
      if (!cancelled && res) setCompanies(res.companies);
    })();
    return () => { cancelled = true; };
  }, [fetchCompanies, filters.search, filters.industry, filters.size, filters.location, filters.hiring, filters.verified, filters.page, filters.limit]);
  return { companies, loading, error };
}

// Single company
export function useCompany(id?: string) {
  const { loading, error, fetchCompany } = useCompaniesApi();
  const [company, setCompany] = useState<Company | null>(null);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetchCompany(id);
      if (!cancelled && res) setCompany(res.company);
    })();
    return () => { cancelled = true; };
  }, [id, fetchCompany]);
  return { company, loading, error };
}