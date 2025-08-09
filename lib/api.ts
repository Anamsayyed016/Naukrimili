import { apiClient } from './api-client';
import { ApiError } from '@/types/api';
import type { Job } from '@/types/job';
import type { User } from '@/types/user';
import type { JobApplication as Application } from '@/types/job-application';
import type { Resume } from '@/types/resume';
import type { PaginatedResponse } from '@/types/api';

// ===== JOB API METHODS =====
export const jobApi = {
  // Get all jobs with pagination and filters
  async getJobs(params: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    type?: string;
    remote?: boolean;
    salary?: { min?: number; max?: number };
  } = {}): Promise<PaginatedResponse<Job>> {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      const value: any = (filters as any)[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') queryParams.append(key, JSON.stringify(value));
        else queryParams.append(key, String(value));
      }
    });

    const sep = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.getPaginated<Job>(`/api/jobs${sep}`, page, limit);
  },

  // Get single job by ID
  async getJob(id: string): Promise<Job> {
    return apiClient.get<Job>(`/api/jobs/${encodeURIComponent(id)}`);
  },

  // Create new job
  async createJob(jobData: Record<string, unknown>): Promise<Job> {
    return apiClient.post<Job>('/api/jobs', jobData);
  },

  // Update job
  async updateJob(id: string, jobData: Record<string, unknown>): Promise<Job> {
    return apiClient.put<Job>(`/api/jobs/${encodeURIComponent(id)}`, jobData);
  },

  // Delete job
  async deleteJob(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/jobs/${encodeURIComponent(id)}`);
  },

  // Search jobs
  async searchJobs(query: string, location?: string): Promise<Job[]> {
    const params = new URLSearchParams({ q: query });
    if (location) params.append('location', location);
    return apiClient.get<Job[]>(`/api/jobs/search?${params.toString()}`);
  },
};

// ===== USER API METHODS =====
export const userApi = {
  // Get current user profile
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/api/user/profile');
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    return apiClient.put<User>('/api/user/profile', userData as any);
  },

  // Get user by ID (admin only)
  async getUser(id: string): Promise<User> {
    return apiClient.get<User>(`/api/admin/users/${encodeURIComponent(id)}`);
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
    return apiClient.post<Application>(`/api/jobs/${encodeURIComponent(jobId)}/apply`, applicationData);
  },

  // Get user's applications
  async getUserApplications(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Application>> {
    const { page = 1, limit = 10 } = params;
    return apiClient.getPaginated<Application>('/api/applications', page, limit);
  },

  // Get application by ID
  async getApplication(id: string): Promise<Application> {
    return apiClient.get<Application>(`/api/applications/${encodeURIComponent(id)}`);
  },

  // Update application status
  async updateApplication(id: string, status: string): Promise<Application> {
    return apiClient.patch<Application>(`/api/applications/${encodeURIComponent(id)}`, { status });
  },
};

// ===== RESUME API METHODS =====
export const resumeApi = {
  // Upload resume
  async uploadResume(file: File, onProgress?: (progress: number) => void): Promise<Resume> {
    return apiClient.upload<Resume>('/api/resumes/upload', file, onProgress);
  },

  // Get user's resumes
  async getUserResumes(): Promise<Resume[]> {
    return apiClient.get<Resume[]>('/api/resumes');
  },

  // Get resume by ID
  async getResume(id: string): Promise<Resume> {
    return apiClient.get<Resume>(`/api/resumes/${encodeURIComponent(id)}`);
  },

  // Delete resume
  async deleteResume(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/resumes/${encodeURIComponent(id)}`);
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
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.token);
      } catch {}
    }
    return response;
  },

  // Register
  async register(userData: { email: string; password: string; name: string; role: string }): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<{ token: string; user: User }>(
      '/api/auth/register',
      userData
    );
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.token);
      } catch {}
    }
    return response;
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
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('auth_token', response.token);
      } catch {}
    }
    return response;
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
