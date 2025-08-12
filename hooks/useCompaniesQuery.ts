/**
 * Enhanced React Query Hooks for Companies
 * Provides real-time company data fetching with caching and management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { Company, CompanyProfile, CompanyStats } from '@/types/company';

// Query keys for consistent caching
export const companyQueryKeys = {
  all: ['companies'] as const,
  lists: () => [...companyQueryKeys.all, 'list'] as const,
  list: (filters: any) => [...companyQueryKeys.lists(), filters] as const,
  details: () => [...companyQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyQueryKeys.details(), id] as const,
  profile: () => [...companyQueryKeys.all, 'profile'] as const,
  stats: () => [...companyQueryKeys.all, 'stats'] as const,
  current: () => [...companyQueryKeys.all, 'current'] as const,
  search: (query: string) => [...companyQueryKeys.all, 'search', query] as const,
  jobs: (companyId: string) => [...companyQueryKeys.all, 'jobs', companyId] as const,
} as const;

// Fetch companies list
export function useCompanies(filters: any = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ companies: Company[]; pagination: any }>(
        API_ENDPOINTS.COMPANIES,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch companies');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch single company by ID
export function useCompany(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Company>(API_ENDPOINTS.COMPANY_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch company');
      }
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    ...options,
  });
}

// Fetch current company profile (for employers)
export function useCurrentCompany(options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.current(),
    queryFn: async () => {
      const response = await apiClient.get<CompanyProfile>('/companies/current');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch company profile');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch company statistics
export function useCompanyStats(companyId: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get<CompanyStats>(`/companies/${companyId}/stats`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch company stats');
      }
      
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch company jobs
export function useCompanyJobs(companyId: string, filters: any = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.jobs(companyId),
    queryFn: async () => {
      const response = await apiClient.get<{ jobs: any[]; pagination: any }>(
        API_ENDPOINTS.COMPANY_JOBS(companyId),
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch company jobs');
      }
      
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Search companies
export function useCompanySearch(query: string, filters: any = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: companyQueryKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<{ companies: Company[]; pagination: any }>(
        API_ENDPOINTS.SEARCH_COMPANIES,
        { q: query, ...filters }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to search companies');
      }
      
      return response.data;
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Create new company
export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      const response = await apiClient.post<Company>(API_ENDPOINTS.COMPANIES, companyData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create company');
      }
      
      return response.data;
    },
    onSuccess: (newCompany) => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.lists() });
      
      // Add new company to cache
      queryClient.setQueryData(companyQueryKeys.detail(newCompany.id), newCompany);
    },
    onError: (error) => {
      console.error('Failed to create company:', error);
    },
  });
}

// Update existing company
export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      const response = await apiClient.put<Company>(API_ENDPOINTS.COMPANY_DETAILS(id), data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update company');
      }
      
      return response.data;
    },
    onSuccess: (updatedCompany) => {
      // Update company in cache
      queryClient.setQueryData(companyQueryKeys.detail(updatedCompany.id), updatedCompany);
      
      // Update current company if it's the same company
      queryClient.setQueryData(companyQueryKeys.current(), updatedCompany);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update company:', error);
    },
  });
}

// Delete company
export function useDeleteCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.COMPANY_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete company');
      }
      
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove company from cache
      queryClient.removeQueries({ queryKey: companyQueryKeys.detail(deletedId) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete company:', error);
    },
  });
}

// Update current company profile
export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: Partial<CompanyProfile>) => {
      const response = await apiClient.put<CompanyProfile>('/companies/current', profileData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update company profile');
      }
      
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      // Update current company in cache
      queryClient.setQueryData(companyQueryKeys.current(), updatedProfile);
      
      // Update company detail if exists
      if (updatedProfile.id) {
        queryClient.setQueryData(companyQueryKeys.detail(updatedProfile.id), updatedProfile);
      }
    },
    onError: (error) => {
      console.error('Failed to update company profile:', error);
    },
  });
}

// Upload company logo
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await apiClient.upload<{ logoUrl: string }>('/upload/logo', file);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload company logo');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Update current company with new logo URL
      queryClient.setQueryData(companyQueryKeys.current(), (old: CompanyProfile | undefined) => {
        if (old) {
          return { ...old, logo: data.logoUrl };
        }
        return old;
      });
    },
    onError: (error) => {
      console.error('Failed to upload company logo:', error);
    },
  });
}

// Company verification
export function useVerifyCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (verificationData: any) => {
      const response = await apiClient.post('/companies/verify', verificationData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to verify company');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate current company to refetch with verified status
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.current() });
    },
    onError: (error) => {
      console.error('Failed to verify company:', error);
    },
  });
}
