/**
 * Enhanced React Query Hooks for Jobs
 * Provides real-time data fetching with caching, optimistic updates, and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { Job, JobFilters, JobSummary } from '@/types/job';

// Query keys for consistent caching
export const jobQueryKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobQueryKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobQueryKeys.lists(), filters] as const,
  details: () => [...jobQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...jobQueryKeys.details(), id] as const,
  categories: () => [...jobQueryKeys.all, 'categories'] as const,
  stats: () => [...jobQueryKeys.all, 'stats'] as const,
  search: (query: string) => [...jobQueryKeys.all, 'search', query] as const,
} as const;

// Fetch jobs with filters and pagination
export function useJobs(filters: JobFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: jobQueryKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ jobs: JobSummary[]; pagination: any }>(
        API_ENDPOINTS.JOBS,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch jobs');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    ...options,
  });
}

// Fetch single job by ID
export function useJob(id: string | number, options?: UseQueryOptions) {
  return useQuery({
    queryKey: jobQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Job>(API_ENDPOINTS.JOB_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch job');
      }
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    ...options,
  });
}

// Fetch job categories
export function useJobCategories(options?: UseQueryOptions) {
  return useQuery({
    queryKey: jobQueryKeys.categories(),
    queryFn: async () => {
      const response = await apiClient.get<{ categories: Array<{ id: string; name: string }> }>(
        API_ENDPOINTS.JOB_CATEGORIES
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch categories');
      }
      
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    ...options,
  });
}

// Fetch job statistics
export function useJobStats(options?: UseQueryOptions) {
  return useQuery({
    queryKey: jobQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.JOB_STATS);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch job stats');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Search jobs with query
export function useJobSearch(query: string, filters: JobFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: jobQueryKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<{ jobs: JobSummary[]; pagination: any }>(
        API_ENDPOINTS.JOB_SEARCH,
        { q: query, ...filters }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to search jobs');
      }
      
      return response.data;
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Create new job
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jobData: Partial<Job>) => {
      const response = await apiClient.post<Job>(API_ENDPOINTS.JOBS, jobData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create job');
      }
      
      return response.data;
    },
    onSuccess: (newJob) => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      
      // Add new job to cache
      queryClient.setQueryData(jobQueryKeys.detail(newJob.id), newJob);
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to create job:', error);
    },
  });
}

// Update existing job
export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Job> }) => {
      const response = await apiClient.put<Job>(API_ENDPOINTS.JOB_DETAILS(id), data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update job');
      }
      
      return response.data;
    },
    onSuccess: (updatedJob) => {
      // Update job in cache
      queryClient.setQueryData(jobQueryKeys.detail(updatedJob.id), updatedJob);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to update job:', error);
    },
  });
}

// Delete job
export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiClient.delete(API_ENDPOINTS.JOB_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete job');
      }
      
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove job from cache
      queryClient.removeQueries({ queryKey: jobQueryKeys.detail(deletedId) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to delete job:', error);
    },
  });
}

// Bookmark/unbookmark job
export function useToggleJobBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ jobId, bookmarked }: { jobId: string | number; bookmarked: boolean }) => {
      const endpoint = bookmarked ? `/jobs/${jobId}/bookmark` : `/jobs/${jobId}/unbookmark`;
      const response = await apiClient.post(endpoint);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle bookmark');
      }
      
      return response.data;
    },
    onSuccess: (_, { jobId, bookmarked }) => {
      // Optimistically update job in cache
      queryClient.setQueryData(jobQueryKeys.detail(jobId), (old: Job | undefined) => {
        if (old) {
          return { ...old, isBookmarked: bookmarked };
        }
        return old;
      });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to toggle bookmark:', error);
    },
  });
}

// Apply to job
export function useApplyToJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ jobId, applicationData }: { jobId: string | number; applicationData: any }) => {
      const response = await apiClient.post(`/jobs/${jobId}/apply`, applicationData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply to job');
      }
      
      return response.data;
    },
    onSuccess: (_, { jobId }) => {
      // Update job applications count
      queryClient.setQueryData(jobQueryKeys.detail(jobId), (old: Job | undefined) => {
        if (old) {
          return { ...old, applications: (old.applications || 0) + 1 };
        }
        return old;
      });
      
      // Invalidate user applications
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => {
      console.error('Failed to apply to job:', error);
    },
  });
}
