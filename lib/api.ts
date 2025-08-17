import { apiClient } from './api-client';
import type { Job, User, Application, Resume, Company } from '@/types';
import type { PaginatedResponse } from '@/types';

// ===== JOB API METHODS =====
export const jobApi = {
  // Get all jobs with pagination
  async getJobs(params: { page?: number; limit?: number; query?: string; location?: string } = {}): Promise<PaginatedResponse<Job>> {
    const { page = 1, limit = 10, query, location } = params;
    const queryParams = new URLSearchParams();
    
    if (query) queryParams.append('q', query);
    if (location) queryParams.append('location', location);
    if (page > 1) queryParams.append('page', page.toString());
    if (limit !== 10) queryParams.append('limit', limit.toString());

    const sep = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.getPaginated<Job>(`/api/jobs${sep}`, page, limit);
  },

  // Get single job by ID
  async getJob(id: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/api/jobs/${encodeURIComponent(id)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch job');
    }
    return response.data;
  },

  // Create new job
  async createJob(jobData: Record<string, unknown>): Promise<Job> {
    const response = await apiClient.post<Job>('/api/jobs', jobData);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create job');
    }
    return response.data;
  },

  // Update job
  async updateJob(id: string, jobData: Record<string, unknown>): Promise<Job> {
    const response = await apiClient.put<Job>(`/api/jobs/${encodeURIComponent(id)}`, jobData);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update job');
    }
    return response.data;
  },

  // Delete job
  async deleteJob(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/api/jobs/${encodeURIComponent(id)}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete job');
    }
    return response.data || { success: true };
  },

  // Search jobs
  async searchJobs(query: string, location?: string): Promise<Job[]> {
    const params = new URLSearchParams({ q: query });
    if (location) params.append('location', location);
    const response = await apiClient.get<Job[]>(`/api/jobs/search?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search jobs');
    }
    return response.data;
  },
};

// ===== USER API METHODS =====
export const userApi = {
  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/api/user/profile');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch profile');
    }
    return response.data;
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/api/user/profile', userData as any);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update profile');
    }
    return response.data;
  },

  // Get user by ID (admin only)
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/api/admin/users/${encodeURIComponent(id)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    return response.data;
  },

  // Get all users (admin only)
  async getUsers(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = params;
    return apiClient.getPaginated<User>('/api/admin/users', page, limit);
  },
};

// ===== APPLICATION API METHODS =====
export const applicationApi = {
  // Apply for a job
  async applyForJob(jobId: string, applicationData: Partial<Application>): Promise<Application> {
    const response = await apiClient.post<Application>(`/api/jobs/${encodeURIComponent(jobId)}/apply`, applicationData);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to apply for job');
    }
    return response.data;
  },

  // Get user's applications
  async getUserApplications(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Application>> {
    const { page = 1, limit = 10 } = params;
    return apiClient.getPaginated<Application>('/api/applications', page, limit);
  },

  // Get application by ID
  async getApplication(id: string): Promise<Application> {
    const response = await apiClient.get<Application>(`/api/applications/${encodeURIComponent(id)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch application');
    }
    return response.data;
  },

  // Update application status
  async updateApplication(id: string, status: string): Promise<Application> {
    const response = await apiClient.patch<Application>(`/api/applications/${encodeURIComponent(id)}`, { status });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update application');
    }
    return response.data;
  },
};

// ===== RESUME API METHODS =====
export const resumeApi = {
  // Upload resume
  async uploadResume(file: File, onProgress?: (progress: number) => void): Promise<Resume> {
    const response = await apiClient.upload<Resume>('/api/upload/resume', file, onProgress);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to upload resume');
    }
    return response.data;
  },

  // Get user's resumes
  async getUserResumes(): Promise<Resume[]> {
    const response = await apiClient.get<Resume[]>('/api/resumes');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch resumes');
    }
    return response.data;
  },

  // Get resume by ID
  async getResume(id: string): Promise<Resume> {
    const response = await apiClient.get<Resume>(`/api/resumes/${encodeURIComponent(id)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch resume');
    }
    return response.data;
  },

  // Delete resume
  async deleteResume(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/api/resumes/${encodeURIComponent(id)}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete resume');
    }
    return response.data || { success: true };
  },
};

// ===== AUTH API METHODS =====
export const authApi = {
  // Login
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<{ token: string; user: User }>(
      '/api/auth/login',
      { email, password }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to login');
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.data.token);
      } catch {}
    }
    return response.data;
  },

  // Register
  async register(userData: { email: string; password: string; name: string; role: string }): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<{ token: string; user: User }>(
      '/api/auth/register',
      userData
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to register');
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.data.token);
      } catch {}
    }
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      // non-fatal
    } finally {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('auth_token');
          window.sessionStorage.removeItem('auth_token');
        } catch {}
      }
    }
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>('/api/auth/refresh');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to refresh token');
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.data.token);
      } catch {}
    }
    return response.data;
  },
};

// ===== LEGACY COMPATIBILITY =====
// Keep the old function names for backward compatibility
export const applyForJob = applicationApi.applyForJob;
export const getJobs = jobApi.getJobs;
export const getJob = jobApi.getJob;
export const createJob = jobApi.createJob;
export const updateJob = jobApi.updateJob;
export const deleteJob = jobApi.deleteJob;
export const searchJobs = jobApi.searchJobs;
export const getProfile = userApi.getProfile;
export const updateProfile = userApi.updateProfile;
export const uploadResume = resumeApi.uploadResume;
export const getUserResumes = resumeApi.getUserResumes;
