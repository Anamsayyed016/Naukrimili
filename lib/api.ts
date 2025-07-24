import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const applyForJob = async (jobId: string) => {
  try {
    const response = await api.post('/apply', { job_id: jobId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getJobs = async () => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postJob = async (jobData: any) => {
  try {
    const response = await api.post('/jobs', jobData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
