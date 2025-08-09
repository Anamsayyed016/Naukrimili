/** Minimal API docs constants stub to avoid compilation errors during cleanup */

export const API_BASE_URL: string = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
} as const;

export const JOBS_ENDPOINTS = {
  LIST: '/api/jobs',
  DETAIL: (id: string) => `/api/jobs/${id}`,
  CREATE: '/api/jobs',
  UPDATE: (id: string) => `/api/jobs/${id}`,
  DELETE: (id: string) => `/api/jobs/${id}`,
  SEARCH: '/api/jobs/search',
  APPLY: (id: string) => `/api/jobs/${id}/apply`,
} as const;

export const APPLICATIONS_ENDPOINTS = {
  LIST: '/api/applications',
  DETAIL: (id: string) => `/api/applications/${id}`,
  UPDATE: (id: string) => `/api/applications/${id}`,
} as const;

export const RESUMES_ENDPOINTS = {
  UPLOAD: '/api/resumes/upload',
  LIST: '/api/resumes',
  DETAIL: (id: string) => `/api/resumes/${id}`,
  DELETE: (id: string) => `/api/resumes/${id}`,
} as const;

export const USER_ENDPOINTS = {
  PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/profile',
} as const;

export const ADMIN_ENDPOINTS = {
  USERS: '/api/admin/users',
  USER_DETAIL: (id: string) => `/api/admin/users/${id}`,
  JOBS: '/api/admin/jobs',
  ANALYTICS: '/api/admin/analytics',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_ALREADY_APPLIED: 'JOB_ALREADY_APPLIED',
  JOB_CLOSED: 'JOB_CLOSED',
  RESUME_PARSE_FAILED: 'RESUME_PARSE_FAILED',
  RESUME_NOT_FOUND: 'RESUME_NOT_FOUND',
} as const;

export const RATE_LIMITS = {
  LOGIN: '5/m',
  REGISTER: '3/m',
  GET_JOBS: '100/m',
  CREATE_JOB: '10/m',
  UPDATE_JOB: '20/m',
  APPLY_JOB: '5/m',
  GET_APPLICATIONS: '50/m',
  UPLOAD_RESUME: '10/m',
  GET_RESUMES: '50/m',
  ADMIN_OPERATIONS: '30/m',
} as const;

export const DEPRECATED_ENDPOINTS = {
  OLD_SEARCH: '/api/search/jobs',
  OLD_RESUME: '/api/resume',
} as const;