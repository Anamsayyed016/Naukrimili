/**
 * Enhanced React Query Hooks for Resumes
 * Provides real-time resume data fetching with caching and management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { Resume, ResumeAnalysis, ResumeFilters } from '@/types/resume';

// Query keys for consistent caching
export const resumeQueryKeys = {
  all: ['resumes'] as const,
  lists: () => [...resumeQueryKeys.all, 'list'] as const,
  list: (filters: ResumeFilters) => [...resumeQueryKeys.lists(), filters] as const,
  details: () => [...resumeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...resumeQueryKeys.details(), id] as const,
  user: (userId: string) => [...resumeQueryKeys.all, 'user', userId] as const,
  analysis: (resumeId: string) => [...resumeQueryKeys.all, 'analysis', resumeId] as const,
  stats: () => [...resumeQueryKeys.all, 'stats'] as const,
  templates: () => [...resumeQueryKeys.all, 'templates'] as const,
} as const;

// Fetch resumes list with filters
export function useResumes(filters: ResumeFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ resumes: Resume[]; pagination: any }>(
        API_ENDPOINTS.RESUMES,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch resumes');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch single resume by ID
export function useResume(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Resume>(API_ENDPOINTS.RESUME_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch resume');
      }
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    ...options,
  });
}

// Fetch user's resumes
export function useUserResumes(userId: string, filters: ResumeFilters = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.user(userId),
    queryFn: async () => {
      const response = await apiClient.get<{ resumes: Resume[]; pagination: any }>(
        `/users/${userId}/resumes`,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user resumes');
      }
      
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch resume analysis
export function useResumeAnalysis(resumeId: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.analysis(resumeId),
    queryFn: async () => {
      const response = await apiClient.get<ResumeAnalysis>(API_ENDPOINTS.RESUME_ANALYZE);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch resume analysis');
      }
      
      return response.data;
    },
    enabled: !!resumeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    ...options,
  });
}

// Fetch resume statistics
export function useResumeStats(options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/resumes/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch resume stats');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch resume templates
export function useResumeTemplates(options?: UseQueryOptions) {
  return useQuery({
    queryKey: resumeQueryKeys.templates(),
    queryFn: async () => {
      const response = await apiClient.get('/resumes/templates');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch resume templates');
      }
      
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    ...options,
  });
}

// Create new resume
export function useCreateResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resumeData: Partial<Resume>) => {
      const response = await apiClient.post<Resume>(API_ENDPOINTS.RESUMES, resumeData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create resume');
      }
      
      return response.data;
    },
    onSuccess: (newResume) => {
      // Invalidate and refetch resumes lists
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Add new resume to cache
      queryClient.setQueryData(resumeQueryKeys.detail(newResume.id), newResume);
      
      // Update user resumes if userId exists
      if (newResume.userId) {
        queryClient.invalidateQueries({ queryKey: resumeQueryKeys.user(newResume.userId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to create resume:', error);
    },
  });
}

// Update existing resume
export function useUpdateResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Resume> }) => {
      const response = await apiClient.put<Resume>(API_ENDPOINTS.RESUME_DETAILS(id), data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update resume');
      }
      
      return response.data;
    },
    onSuccess: (updatedResume) => {
      // Update resume in cache
      queryClient.setQueryData(resumeQueryKeys.detail(updatedResume.id), updatedResume);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Update user resumes if userId exists
      if (updatedResume.userId) {
        queryClient.invalidateQueries({ queryKey: resumeQueryKeys.user(updatedResume.userId) });
      }
    },
    onError: (error) => {
      console.error('Failed to update resume:', error);
    },
  });
}

// Delete resume
export function useDeleteResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.RESUME_DETAILS(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete resume');
      }
      
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove resume from cache
      queryClient.removeQueries({ queryKey: resumeQueryKeys.detail(deletedId) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to delete resume:', error);
    },
  });
}

// Upload resume file
export function useUploadResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await apiClient.upload<Resume>(API_ENDPOINTS.RESUME_UPLOAD, file);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload resume');
      }
      
      return response.data;
    },
    onSuccess: (uploadedResume) => {
      // Invalidate and refetch resumes lists
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Add new resume to cache
      queryClient.setQueryData(resumeQueryKeys.detail(uploadedResume.id), uploadedResume);
      
      // Update user resumes if userId exists
      if (uploadedResume.userId) {
        queryClient.invalidateQueries({ queryKey: resumeQueryKeys.user(uploadedResume.userId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to upload resume:', error);
    },
  });
}

// Analyze resume
export function useAnalyzeResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await apiClient.post<ResumeAnalysis>(`/resumes/${resumeId}/analyze`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze resume');
      }
      
      return response.data;
    },
    onSuccess: (analysis, resumeId) => {
      // Update resume analysis in cache
      queryClient.setQueryData(resumeQueryKeys.analysis(resumeId), analysis);
      
      // Invalidate resume to refetch with analysis
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) });
    },
    onError: (error) => {
      console.error('Failed to analyze resume:', error);
    },
  });
}

// Generate resume from template
export function useGenerateResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: any }) => {
      const response = await apiClient.post<Resume>(`/resumes/generate/${templateId}`, data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate resume');
      }
      
      return response.data;
    },
    onSuccess: (generatedResume) => {
      // Invalidate and refetch resumes lists
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Add new resume to cache
      queryClient.setQueryData(resumeQueryKeys.detail(generatedResume.id), generatedResume);
      
      // Update user resumes if userId exists
      if (generatedResume.userId) {
        queryClient.invalidateQueries({ queryKey: resumeQueryKeys.user(generatedResume.userId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to generate resume:', error);
    },
  });
}

// Export resume
export function useExportResume() {
  return useMutation({
    mutationFn: async ({ resumeId, format }: { resumeId: string; format: 'pdf' | 'docx' | 'txt' }) => {
      const response = await apiClient.post(`/resumes/${resumeId}/export`, { format });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to export resume');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Handle file download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'resume';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error) => {
      console.error('Failed to export resume:', error);
    },
  });
}

// Duplicate resume
export function useDuplicateResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await apiClient.post<Resume>(`/resumes/${resumeId}/duplicate`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to duplicate resume');
      }
      
      return response.data;
    },
    onSuccess: (duplicatedResume) => {
      // Invalidate and refetch resumes lists
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.lists() });
      
      // Add new resume to cache
      queryClient.setQueryData(resumeQueryKeys.detail(duplicatedResume.id), duplicatedResume);
      
      // Update user resumes if userId exists
      if (duplicatedResume.userId) {
        queryClient.invalidateQueries({ queryKey: resumeQueryKeys.user(duplicatedResume.userId) });
      }
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to duplicate resume:', error);
    },
  });
}

// Set resume as primary
export function useSetPrimaryResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await apiClient.post(`/resumes/${resumeId}/set-primary`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to set resume as primary');
      }
      
      return response.data;
    },
    onSuccess: (_, resumeId) => {
      // Invalidate all resume queries to refetch with updated primary status
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.all });
    },
    onError: (error) => {
      console.error('Failed to set resume as primary:', error);
    },
  });
}
