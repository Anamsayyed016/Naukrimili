/**
 * Enhanced API Client for Dynamic Data Integration
 * Handles authentication, error handling, caching, and request/response transformation
 */

import { getSession } from 'next-auth/react';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication headers for protected routes
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const headers = { ...this.defaultHeaders };
    
    if (session?.user) {
      headers['Authorization'] = `Bearer ${session.user.id}`;
    }
    
    return headers;
  }

  /**
   * Handle API errors consistently
   */
  private handleError(response: Response): ApiError {
    const error: ApiError = {
      status: response.status,
      message: response.statusText,
    };

    try {
      const errorData = response.json();
      if (errorData.error) {
        error.message = errorData.error;
        error.code = errorData.code;
        error.details = errorData.details;
      }
    } catch {
      // If error response is not JSON, use status text
    }

    return error;
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => url.searchParams.append(key, v.toString()));
            } else {
              url.searchParams.append(key, value.toString());
            }
          }
        });
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Make authenticated PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      delete headers['Content-Type']; // Let browser set multipart boundary

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              resolve({
                success: true,
                data: xhr.responseText,
              });
            }
          } else {
            reject(this.handleError({
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve({}),
            } as Response));
          }
        });

        xhr.addEventListener('error', () => {
          reject({
            success: false,
            error: 'Upload failed',
          });
        });

        xhr.open('POST', `${this.baseUrl}${endpoint}`);
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        xhr.send(formData);
      });
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Upload failed',
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export specific API endpoints
export const API_ENDPOINTS = {
  // Jobs
  JOBS: '/jobs',
  JOB_DETAILS: (id: string | number) => `/jobs/${id}`,
  JOB_SEARCH: '/jobs/search',
  JOB_CATEGORIES: '/jobs/categories',
  JOB_STATS: '/jobs/stats',
  
  // Users
  USERS: '/users',
  USER_PROFILE: (id: string) => `/users/${id}`,
  USER_STATS: (id: string) => `/users/${id}/stats`,
  
  // Companies
  COMPANIES: '/companies',
  COMPANY_DETAILS: (id: string) => `/companies/${id}`,
  COMPANY_JOBS: (id: string) => `/companies/${id}/jobs`,
  
  // Applications
  APPLICATIONS: '/applications',
  APPLICATION_DETAILS: (id: string) => `/applications/${id}`,
  
  // Resumes
  RESUMES: '/resumes',
  RESUME_DETAILS: (id: string) => `/resumes/${id}`,
  RESUME_UPLOAD: '/resumes/upload',
  RESUME_ANALYZE: '/resumes/analyze',
  
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_PROFILE: '/auth/profile',
  
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_STATS: '/admin/stats',
  
  // Search
  SEARCH_SUGGESTIONS: '/search-suggestions',
  SEARCH_JOBS: '/search/jobs',
  SEARCH_COMPANIES: '/search/companies',
  
  // Uploads
  UPLOAD_RESUME: '/upload/resume',
  UPLOAD_LOGO: '/upload/logo',
} as const;