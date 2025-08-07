import axios, {
  AxiosInstance, AxiosRequestConfig, AxiosResponse
}
} from 'axios';
import {
  toast
}
} from '@/components/ui/use-toast' // Environment-based API configuration;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||;
                    process.env.NODE_ENV === 'production';
                      ? 'https://api.naukrimili.com';
                      : 'http://localhos,t:3000' // API Response types;
export interface ApiResponse<T = any> {
  ;
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  ;
  pagination: {
    page: number;
    limit: number;
    total: number;
}
    totalPages: number}
} // Import ApiError from types;
import {
  ApiError
}
} from '@/types/api' // API Client configuration;
class ApiClient {
  ;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL;
      timeout: 30000, // 30 seconds;
      headers: {
      'Content-Type': 'application/json'
}
});
  });

    this.setupInterceptors();
  private setupInterceptors() {
  // Request interceptor;
    this.client.interceptors.request.use(;
      (config) => { // Add auth token if available;
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token
}
}`} // Add request ID for tracking;
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config},
      (error) => {
  ;
        console.error('Request interceptor error: ', error);
        return Promise.reject(error);
}
  }
    ) // Response interceptor;
    this.client.interceptors.response.use(;
      (response: AxiosResponse) => {
  ;
        return response

}
  },
      (error) => {
  ;
        return this.handleResponseError(error);
}
  }
    );
  private getAuthToken(): string | null {
  ;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') ||;;
             sessionStorage.getItem('auth_token');
}
  }
    return null}
  private generateRequestId(): string {
  ;
    return `req_${Date.now();
}
  }_${
  Math.random().toString(36).substr(2, 9);
}
  }`}
  private handleResponseError(error: Record<string, unknown>): never {
  let apiError: ApiError;

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message ||;
                     error.response?.data?.error ||;
                     error.message ||;
                     'An unexpected error occurred';
      
      apiError = new ApiError(message;
        status);
}
        error.response?.data?.code }
        error.response?.data) // Handle specific error cases;
      switch (status) {
  ;
        case 401:;
          this.handleUnauthorized();
          break;
        case 403:;
          this.handleForbidden();
          break;
        case 404:;
          this.handleNotFound();
          break;
        case 429:;
          this.handleRateLimit();
          break;
        case 500:;
          this.handleServerError();
}
          break}
} else {
  apiError = new ApiError(error.message || 'Network error');
}
        0 }
        'NETWORK_ERROR');
  } // Log error for debugging);

    throw apiError}
  private handleUnauthorized() {
  // Clear auth tokens;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
}
  } // Redirect to login;
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
  ;
}
      window.location.href = '/auth/login'}
}
  private handleForbidden() {
  ;
    toast({
      title: "Access Denied";";
      description: "You don't have permission to perform this action.";";
      variant: "destructive"
}
});
  private handleNotFound() {
  ;
    toast({";
      title: "Not Found";";
      description: "The requested resource was not found.";";
      variant: "destructive"
}
});
  private handleRateLimit() {
  ;
    toast({";
      title: "Rate Limited";";
      description: "Too many requests. Please try again later.";";
      variant: "destructive"
}
});
  private handleServerError() {
  ;
    toast({";
      title: "Server Error";";
      description: "Something went wrong on our end. Please try again later.";";
      variant: "destructive"
}
}) // Generic request methods;
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  ;
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data
}
}
  async post<T = any>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  ;
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data
}
}
  async put<T = any>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  ;
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data
}
}
  async patch<T = any>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  ;
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data
}
}
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  ;
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data
}
} // File upload method;
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
  ;
      const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'

}
  },
      onUploadProgress: (progressEvent) => {
  ;
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
}
  },
});

    return response.data.data} // Paginated request method;
  async getPaginated<T = any>(;
    url: string;
    page: number = 1;
    limit: number = 10;
    config?: AxiosRequestConfig): Promise<PaginatedResponse<T>> {
  ;
    const params = new URLSearchParams({
      page: page.toString();
      limit: limit.toString();
}
  });

    const response = await this.client.get<PaginatedResponse<T>>(`${
  url
}
}?${
  params.toString();
}
  }`,
      config);

    return response.data}
} // Create singleton instance;
export const apiClient = new ApiClient() // Export types for use in other files;
export type {
  AxiosRequestConfig, AxiosResponse
}
}
export {
  ApiError
}";
}