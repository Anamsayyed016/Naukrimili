/**
 * Enhanced React Query Hooks for Job Applications
 * Provides real-time application data fetching with caching and management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { JobApplication, ApplicationStatus, ApplicationFilters } from '@/types/application';

// Query keys for consistent caching
export const applicationQueryKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationQueryKeys.all, 'list'] as const,
  list: (filters: ApplicationFilters) => [...applicationQueryKeys.lists(), filters] as const,
  details: () => [...applicationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationQueryKeys.details(), id] as const,
  user: (userId: string) => [...applicationQueryKeys.all, 'user', userId] as const,
  job: (jobId: string | number) => [...applicationQueryKeys.all, 'job', jobId] as const,
  company: (companyId: string) => [...applicationQueryKeys.all, 'company', companyId] as const,
  stats: () => [...applicationQueryKeys.all, 'stats'] as const,
} as const;

// Fetch applications list with filters
export function useApplications(filters: ApplicationFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ applications: JobApplication[]; pagination: any }>(
        API_ENDPOINTS.APPLICATIONS,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch applications');
      }
      
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch single application by ID
export function useApplication(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<JobApplication>(API_ENDPOINTS.APPLICATION_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch application');
      }
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch user's applications
export function useUserApplications(userId: string, filters: ApplicationFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.user(userId),
    queryFn: async () => {
      const response = await apiClient.get<{ applications: JobApplication[]; pagination: any }>(
        `/users/${userId}/applications`,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user applications');
      }
      
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch job applications (for employers)
export function useJobApplications(jobId: string | number, filters: ApplicationFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.job(jobId),
    queryFn: async () => {
      const response = await apiClient.get<{ applications: JobApplication[]; pagination: any }>(
        `/jobs/${jobId}/applications`,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch job applications');
      }
      
      return response.data;
    },
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch company applications (for employers)
export function useCompanyApplications(companyId: string, filters: ApplicationFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.company(companyId),
    queryFn: async () => {
      const response = await apiClient.get<{ applications: JobApplication[]; pagination: any }>(
        `/companies/${companyId}/applications`,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch company applications');
      }
      
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch application statistics
export function useApplicationStats(options?: UseQueryOptions) {
  return useQuery({
    queryKey: applicationQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/applications/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch application stats');
      }
      
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Create new application
export function useCreateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationData: Partial<JobApplication>) => {
      const response = await apiClient.post<JobApplication>('/applications', applicationData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create application');
      }
      
      return response.data;
    },
    onSuccess: (newApplication) => {
      // Invalidate and refetch applications lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      
      // Add new application to cache
      queryClient.setQueryData(applicationQueryKeys.detail(newApplication.id), newApplication);
      
      // Update related queries
      if (newApplication.userId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.user(newApplication.userId) });
      }
      if (newApplication.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.job(newApplication.jobId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to create application:', error);
    },
  });
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ApplicationStatus; notes?: string }) => {
      const response = await apiClient.put<JobApplication>(`/applications/${id}/status`, {
        status,
        notes,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update application status');
      }
      
      return response.data;
    },
    onSuccess: (updatedApplication) => {
      // Update application in cache
      queryClient.setQueryData(applicationQueryKeys.detail(updatedApplication.id), updatedApplication);
      
      // Invalidate related lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      
      if (updatedApplication.userId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.user(updatedApplication.userId) });
      }
      if (updatedApplication.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.job(updatedApplication.jobId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to update application status:', error);
    },
  });
}

// Update application
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobApplication> }) => {
      const response = await apiClient.put<JobApplication>(API_ENDPOINTS.APPLICATION_DETAILS(id), data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update application');
      }
      
      return response.data;
    },
    onSuccess: (updatedApplication) => {
      // Update application in cache
      queryClient.setQueryData(applicationQueryKeys.detail(updatedApplication.id), updatedApplication);
      
      // Invalidate related lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      
      if (updatedApplication.userId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.user(updatedApplication.userId) });
      }
      if (updatedApplication.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.job(updatedApplication.jobId) });
      }
    },
    onError: (error) => {
      console.error('Failed to update application:', error);
    },
  });
}

// Delete application
export function useDeleteApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.APPLICATION_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete application');
      }
      
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove application from cache
      queryClient.removeQueries({ queryKey: applicationQueryKeys.detail(deletedId) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to delete application:', error);
    },
  });
}

// Withdraw application
export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/applications/${id}/withdraw`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to withdraw application');
      }
      
      return response.data;
    },
    onSuccess: (withdrawnApplication) => {
      // Update application in cache
      queryClient.setQueryData(applicationQueryKeys.detail(withdrawnApplication.id), withdrawnApplication);
      
      // Invalidate related lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      
      if (withdrawnApplication.userId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.user(withdrawnApplication.userId) });
      }
      if (withdrawnApplication.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.job(withdrawnApplication.jobId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to withdraw application:', error);
    },
  });
}

// Send application message
export function useSendApplicationMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId, message }: { applicationId: string; message: string }) => {
      const response = await apiClient.post(`/applications/${applicationId}/message`, { message });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
      
      return response.data;
    },
    onSuccess: (_, { applicationId }) => {
      // Invalidate application to refetch with new message
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.detail(applicationId) });
    },
    onError: (error) => {
      console.error('Failed to send application message:', error);
    },
  });
}

// Bulk update application statuses
export function useBulkUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationIds, status, notes }: { 
      applicationIds: string[]; 
      status: ApplicationStatus; 
      notes?: string 
    }) => {
      const response = await apiClient.post('/applications/bulk-update-status', {
        applicationIds,
        status,
        notes,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to bulk update application statuses');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all application queries
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.all });
    },
    onError: (error) => {
      console.error('Failed to bulk update application statuses:', error);
    },
  });
}
