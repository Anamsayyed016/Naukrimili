import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface JobData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface ApiError {
  message: string;
  status: number;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Error handler
const handleApiError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500
    };
    throw apiError;
  }
  throw new Error('Unknown API error');
};

// API functions
export const applyForJob = async (jobId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/apply', { job_id: jobId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/login', { email, password });
    const { token } = response.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getJobs = async (): Promise<any[]> => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const postJob = async (jobData: JobData): Promise<{ id: string; message: string }> => {
  try {
    const response = await api.post('/jobs', jobData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default api;
