import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import { ApiError } from '@/types/api';

// Prefer same-origin relative calls unless explicitly configured via env
const API_BASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL || undefined,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: attach auth token and request id
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
  const headers = (config.headers ?? {}) as Record<string, any>;
  if (token) headers.Authorization = `Bearer ${token}`;
  headers['X-Request-ID'] = this.generateRequestId();
  config.headers = headers as any;
  return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: unwrap data and normalize errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => this.handleResponseError(error)
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return (
        window.localStorage.getItem('auth_token') || window.sessionStorage.getItem('auth_token')
      );
    }
    return null;
  }

  private generateRequestId(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    return `req_${Date.now()}_${rand}`;
  }

  private handleResponseError(error: any): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const body: any = error.response?.data || {};
      const message = body.message || body.error || error.message || 'Request failed';
      const code = body.code || (status === 0 ? 'NETWORK_ERROR' : undefined);

      // Basic side-effects for some statuses
      if (status === 401 && typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('auth_token');
          window.sessionStorage.removeItem('auth_token');
        } catch {}
      }

      throw new ApiError(message, status || 500, code, body);
    }
    throw new ApiError(error?.message || 'Unknown error', 500, 'UNKNOWN_ERROR');
  }

  // Generic request helpers
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  async post<T = unknown>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  async put<T = unknown>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  async patch<T = unknown>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  // File upload
  async upload<T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          onProgress(pct);
        }
      },
    });
    return (response.data?.data as T) ?? (response.data as unknown as T);
  }

  // Paginated helper (assumes endpoint supports page & limit query params)
  async getPaginated<T = unknown>(
    url: string,
    page: number = 1,
    limit: number = 10,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const sep = url.includes('?') ? '&' : '?';
    const response = await this.client.get<PaginatedResponse<T>>(`${url}${sep}${qs.toString()}` as string, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export type { AxiosRequestConfig, AxiosResponse };