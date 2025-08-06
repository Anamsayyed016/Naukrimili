import { apiClient, ApiError } from './api-client';
import type { Job } from '@/types/job';
import type { User } from '@/types/user';
import type { JobApplication as Application } from '@/types/job-application';
import type { Resume } from '@/types/resume';

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
    salary?: { min?: number; max?: number }} = {}) {
    try {
      const { page = 1, limit = 10, ...filters } = params;
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value))} else {
            queryParams.append(key, String(value))}
        }
      });

      return await apiClient.getPaginated<Job>(`/api/jobs?${queryParams.toString()}`, page, limit)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch jobs',
        500,
        'JOBS_FETCH_ERROR'
      )}
  },

  // Get single job by ID
  async getJob(id: string): Promise<Job> {
    try {
      return await apiClient.get<Job>(`/api/jobs/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch job',
        500,
        'JOB_FETCH_ERROR'
      )}
  },

  // Create new job
  async createJob(jobData: Partial<Job>): Promise<Job> {
    try {
      return await apiClient.post<Job>('/api/jobs', jobData)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to create job',
        500,
        'JOB_CREATE_ERROR'
      )}
  },

  // Update job
  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    try {
      return await apiClient.put<Job>(`/api/jobs/${id}`, jobData)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to update job',
        500,
        'JOB_UPDATE_ERROR'
      )}
  },

  // Delete job
  async deleteJob(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/jobs/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to delete job',
        500,
        'JOB_DELETE_ERROR'
      )}
  },

  // Search jobs
  async searchJobs(query: string, location?: string): Promise<Job[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (location) params.append('location', location);
      
      return await apiClient.get<Job[]>(`/api/jobs/search?${params.toString()}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to search jobs',
        500,
        'JOB_SEARCH_ERROR'
      )}
  }
};

// ===== USER API METHODS =====
export const userApi = {
  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      return await apiClient.get<User>('/api/user/profile')} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch profile',
        500,
        'PROFILE_FETCH_ERROR'
      )}
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      return await apiClient.put<User>('/api/user/profile', userData)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to update profile',
        500,
        'PROFILE_UPDATE_ERROR'
      )}
  },

  // Get user by ID (admin only)
  async getUser(id: string): Promise<User> {
    try {
      return await apiClient.get<User>(`/api/admin/users/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch user',
        500,
        'USER_FETCH_ERROR'
      )}
  },

  // Get all users (admin only)
  async getUsers(params: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = params;
      return await apiClient.getPaginated<User>('/api/admin/users', page, limit)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch users',
        500,
        'USERS_FETCH_ERROR'
      )}
  }
};

// ===== APPLICATION API METHODS =====
export const applicationApi = {
  // Apply for a job
  async applyForJob(jobId: string, applicationData: Partial<Application>): Promise<Application> {
    try {
      return await apiClient.post<Application>(`/api/jobs/${jobId}/apply`, applicationData)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to apply for job',
        500,
        'APPLICATION_CREATE_ERROR'
      )}
  },

  // Get user's applications
  async getUserApplications(params: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = params;
      return await apiClient.getPaginated<Application>('/api/applications', page, limit)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch applications',
        500,
        'APPLICATIONS_FETCH_ERROR'
      )}
  },

  // Get application by ID
  async getApplication(id: string): Promise<Application> {
    try {
      return await apiClient.get<Application>(`/api/applications/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch application',
        500,
        'APPLICATION_FETCH_ERROR'
      )}
  },

  // Update application status
  async updateApplication(id: string, status: string): Promise<Application> {
    try {
      return await apiClient.patch<Application>(`/api/applications/${id}`, { status })} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to update application',
        500,
        'APPLICATION_UPDATE_ERROR'
      )}
  }
};

// ===== RESUME API METHODS =====
export const resumeApi = {
  // Upload resume
  async uploadResume(file: File, onProgress?: (progress: number) => void): Promise<Resume> {
    try {
      return await apiClient.upload<Resume>('/api/resumes/upload', file, onProgress)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to upload resume',
        500,
        'RESUME_UPLOAD_ERROR'
      )}
  },

  // Get user's resumes
  async getUserResumes(): Promise<Resume[]> {
    try {
      return await apiClient.get<Resume[]>('/api/resumes')} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch resumes',
        500,
        'RESUMES_FETCH_ERROR'
      )}
  },

  // Get resume by ID
  async getResume(id: string): Promise<Resume> {
    try {
      return await apiClient.get<Resume>(`/api/resumes/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch resume',
        500,
        'RESUME_FETCH_ERROR'
      )}
  },

  // Delete resume
  async deleteResume(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/resumes/${id}`)} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to delete resume',
        500,
        'RESUME_DELETE_ERROR'
      )}
  }
};

// ===== AUTH API METHODS =====
export const authApi = {
  // Login
  async login(email: string, password: string) {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password
      });
      
      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token)}
      
      return response} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Login failed',
        401,
        'LOGIN_ERROR'
      )}
  },

  // Register
  async register(userData: { email: string; password: string; name: string; role: string }) {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/api/auth/register', userData);
      
      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token)}
      
      return response} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Registration failed',
        400,
        'REGISTER_ERROR'
      )}
  },

  // Logout
  async logout() {
    try {
      await apiClient.post('/api/auth/logout')} catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('Logout error:', error)} finally {
      // Clear token regardless of API call success
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token')}
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiClient.post<{ token: string }>('/api/auth/refresh');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token)}
      
      return response} catch (error) {
    console.error("Error:", error);
    throw error}
      throw new ApiError(
        error instanceof Error ? error.message : 'Token refresh failed',
        401,
        'REFRESH_ERROR'
      )}
  }
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
