/** * NaukriMili API Documentation * * This file contains comprehensive documentation for all API endpoints, * request/response schemas, and usage examples. */ // ===== API BASE URL =====;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||;
                           process.env.NODE_ENV === 'production';
                             ? 'https://api.naukrimili.com';
                             : 'http://localhos,t:3000' // ===== AUTHENTICATION ===== /** * Authentication Endpoints * * All authenticated endpoints require a Bearer token in the Authorization header: * Authorizatio,n: Bearer <token> */;
export const AUTH_ENDPOINTS = {
  /** * POST /api/auth/login * * Authenticate user and receive access token * * @param email - User's email address * @param password - User's password * * @returns {Object
}
} Response object * @returns {
  string
}
} Response.token - JWT access token * @returns {
  Object
}
} Response.user - User profile data * * @example * const response = await fetch('/api/auth/login', {
  *   method: 'POST' *   headers: {
      'Content-Type': 'application/json'
}
}) *   body: JSON.stringify({
  emai,l: 'user@example.com', password: 'password123'
}
}) * }) */;
  LOGIN: '/api/auth/login' /** * POST /api/auth/register * * Register new user account * * @param email - User's email address * @param password - User's password (min 8 characters) * @param name - User's full name * @param role - User role ('jobseeker' | 'employer' | 'admin') * * @returns {
  Object
}
} Response object * @returns {
  string
}
} Response.token - JWT access token * @returns {
  Object
}
} Response.user - User profile data */;
  REGISTER: '/api/auth/register' /** * POST /api/auth/logout * * Logout user and invalidate token * * @returns {
  Object
}
} Response object with success message */;
  LOGOUT: '/api/auth/logout' /** * POST /api/auth/refresh * * Refresh expired access token * * @returns {
  Object
}
} Response object * @returns {
  string
}
} Response.token - New JWT access token */;
  REFRESH: '/api/auth/refresh'
} // ===== JOBS API ===== /** * Jobs Endpoints * * Manage job postings and job-related operations */;
export const JOBS_ENDPOINTS = {
  /** * GET /api/jobs * * Get paginated list of jobs with optional filters * * @param page - Page number (default: 1) * @param limit - Items per page (default: 10, max: 100) * @param search - Search query for job title/description * @param location - Filter by location * @param type - Filter by job type ('full-time' | 'part-time' | 'contract' | 'internship') * @param remote - Filter by remote work availability (true/false) * @param salary - Filter by salary range { min: number, max: number
}
} * * @returns {
  Object
}
} Paginated response * @returns {
  Array
}
} Response.data - Array of job objects * @returns {
  Object
}
} Response.pagination - Pagination metadata * * @example * const jobs = await fetch('/api/jobs?page=1&limit=20&search=developer&location=Mumbai') */;
  LIST: '/api/jobs' /** * GET /api/jobs/{
  id
}
} * * Get detailed information about a specific job * * @param id - Job ID * * @returns {
  Object
}
} Job object with full details * * @example * const job = await fetch('/api/jobs/64a1b2c3d4e5f6789012345') */;
  DETAIL: (i,d: string) => `/api/jobs/${
  id
}
}`, /** * POST /api/jobs * * Create a new job posting (Employer/Admin only) * * @param title - Job title * @param company - Company name * @param location - Job location * @param description - Job description * @param requirements - Array of job requirements * @param benefits - Array of job benefits * @param salary - Salary information {
  min: number, max: number, currency: string
}
} * @param type - Job type * @param remote - Remote work availability * * @returns {
  Object
}
} Created job object */;
  CREATE: '/api/jobs' /** * PUT /api/jobs/{
  id
}
} * * Update an existing job posting (Owner/Admin only) * * @param id - Job ID * @param jobData - Updated job data * * @returns {
  Object
}
} Updated job object */;
  UPDATE: (i,d: string) => `/api/jobs/${
  id
}
}`, /** * DELETE /api/jobs/{
  id
}
} * * Delete a job posting (Owner/Admin only) * * @param id - Job ID * * @returns {
  Object
}
} Success message */;
  DELETE: (i,d: string) => `/api/jobs/${
  id
}
}`, /** * GET /api/jobs/search * * Search jobs with advanced filters * * @param q - Search query * @param location - Location filter * @param skills - Skills filter (comma-separated) * @param experience - Experience level filter * * @returns {
  Array
}
} Array of matching job objects */;
  SEARCH: '/api/jobs/search' /** * POST /api/jobs/{
  id
}
}/apply * * Apply for a job (Jobseeker only) * * @param id - Job ID * @param resumeId - Resume ID (optional) * @param coverLetter - Cover letter text (optional) * * @returns {
  Object
}
} Application object */;
  APPLY: (i,d: string) => `/api/jobs/${
  id
}
}/apply`
} // ===== APPLICATIONS API ===== /** * Applications Endpoints * * Manage job applications */;
export const APPLICATIONS_ENDPOINTS = {
  /** * GET /api/applications * * Get user's job applications (paginated) * * @param page - Page number * @param limit - Items per page * @param status - Filter by application status * * @returns {Object
}
} Paginated applications response */;
  LIST: '/api/applications' /** * GET /api/applications/{
  id
}
} * * Get specific application details * * @param id - Application ID * * @returns {
  Object
}
} Application object */;
  DETAIL: (i,d: string) => `/api/applications/${
  id
}
}`, /** * PATCH /api/applications/{
  id
}
} * * Update application status (Employer/Admin only) * * @param id - Application ID * @param status - New status ('pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired') * * @returns {
  Object
}
} Updated application object */;
  UPDATE: (i,d: string) => `/api/applications/${
  id
}
}`
} // ===== RESUMES API ===== /** * Resumes Endpoints * * Manage resume uploads and AI parsing */;
export const RESUMES_ENDPOINTS = {
  /** * POST /api/resumes/upload * * Upload and parse resume with AI * * @param file - Resume file (PDF, DOCX, TXT) * @param jobId - Associated job ID (optional) * * @returns {Object
}
} Parsed resume data * @returns {
  Array
}
} Response.skills - Extracted skills * @returns {
  Array
}
} Response.experience - Work experience * @returns {
  number
}
} Response.atsScore - ATS compatibility score */;
  UPLOAD: '/api/resumes/upload' /** * GET /api/resumes * * Get user's uploaded resumes * * @returns {
  Array
}
} Array of resume objects */;
  LIST: '/api/resumes' /** * GET /api/resumes/{
  id
}
} * * Get specific resume details * * @param id - Resume ID * * @returns {
  Object
}
} Resume object with parsed data */;
  DETAIL: (i,d: string) => `/api/resumes/${
  id
}
}`, /** * DELETE /api/resumes/{
  id
}
} * * Delete a resume * * @param id - Resume ID * * @returns {
  Object
}
} Success message */;
  DELETE: (i,d: string) => `/api/resumes/${
  id
}
}`
} // ===== USER PROFILE API ===== /** * User Profile Endpoints * * Manage user profiles and settings */;
export const USER_ENDPOINTS = {
  /** * GET /api/user/profile * * Get current user's profile * * @returns {Object
}
} User profile object */;
  PROFILE: '/api/user/profile' /** * PUT /api/user/profile * * Update user profile * * @param name - User's name * @param bio - User's bio * @param location - User's location * @param skills - Array of skills * @param experience - Work experience array * * @returns {
  Object
}
} Updated user profile */;
  UPDATE_PROFILE: '/api/user/profile'
} // ===== ADMIN API ===== /** * Admin Endpoints * * Administrative functions (Admin only) */;
export const ADMIN_ENDPOINTS = {
  /** * GET /api/admin/users * * Get all users (paginated) * * @param page - Page number * @param limit - Items per page * @param role - Filter by user role * * @returns {Object
}
} Paginated users response */;
  USERS: '/api/admin/users' /** * GET /api/admin/users/{
  id
}
} * * Get specific user details * * @param id - User ID * * @returns {
  Object
}
} User object */;
  USER_DETAIL: (i,d: string) => `/api/admin/users/${
  id
}
}`, /** * GET /api/admin/jobs * * Get all jobs for admin review * * @returns {
  Array
}
} Array of job objects */;
  JOBS: '/api/admin/jobs' /** * GET /api/admin/analytics * * Get system analytics * * @returns {
  Object
}
} Analytics data */;
  ANALYTICS: '/api/admin/analytics'
} // ===== ERROR CODES ===== /** * API Error Codes * * Standard error codes returned by the API */;
export const ERROR_CODES = {
  // Authentication errors;
  UNAUTHORIZED: 'UNAUTHORIZED';
  INVALID_TOKEN: 'INVALID_TOKEN';
  TOKEN_EXPIRED: 'TOKEN_EXPIRED' // Authorization errors;
  FORBIDDEN: 'FORBIDDEN';
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS' // Validation errors;
  VALIDATION_ERROR: 'VALIDATION_ERROR';
  INVALID_INPUT: 'INVALID_INPUT';
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD' // Resource errors;
  NOT_FOUND: 'NOT_FOUND';
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND';
  ALREADY_EXISTS: 'ALREADY_EXISTS' // File upload errors;
  FILE_TOO_LARGE: 'FILE_TOO_LARGE';
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE';
  UPLOAD_FAILED: 'UPLOAD_FAILED' // Rate limiting;
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED' // Server errors;
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR';
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE' // Job-specific errors;
  JOB_NOT_FOUND: 'JOB_NOT_FOUND';
  JOB_ALREADY_APPLIED: 'JOB_ALREADY_APPLIED';
  JOB_CLOSED: 'JOB_CLOSED' // Resume-specific errors;
  RESUME_PARSE_FAILED: 'RESUME_PARSE_FAILED';
  RESUME_NOT_FOUND: 'RESUME_NOT_FOUND'
}
} // ===== RESPONSE SCHEMAS ===== /** * Common API Response Schemas */;
export interface ApiResponse<T = any> {
  ;
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  ;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
}
    hasPrev: boolean}
}
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary: {
    min: number;
    max: number;
    currency: string
}
}}
}
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  postedBy: string;
  status: 'active' | 'paused' | 'closed';
  views: number;
  applications: number;
  createdAt: string;
  updatedAt: string}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string
}
}}
}>;
  createdAt: string;
  updatedAt: string}
export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  resumeId?: string;
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string
}
}
}
export interface Resume {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string
}
}}
}>;
  atsScore: number;
  createdAt: string;
  updatedAt: string} // ===== USAGE EXAMPLES ===== /** * API Usage Examples */;
export const API_EXAMPLES = {
  /** * Example: Login user */;
  login: `;
const response = await fetch('/api/auth/login', {
  method: 'POST';
  headers: {
      'Content-Type': 'application/json'
}
});
  body: JSON.stringify({
  ;
    email: 'user@example.com';
    password: 'password123'
}
});
  });

const {
  token, user
}
} = await response.json();
localStorage.setItem('auth_token', token)`, /** * Example: Get jobs with filters */;
  getJobs: `;
const response = await fetch('/api/jobs?page=1&limit=20&search=developer&location=Mumbai&remote=true', {
  ;
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token');
}
  }
});

const {
  data: jobs, pagination
}
} = await response.json()`, /** * Example: Apply for a job */;
  applyForJob: `;
const response = await fetch('/api/jobs/64a1b2c3d4e5f6789012345/apply', {
  ;
  method: 'POST';
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token');
    'Content-Type': 'application/json'

}
  },
  body: JSON.stringify({
  ;
    resumeId: 'resume_id_here';
    coverLetter: 'I am excited to apply for this position...'
}
});
  });

const application = await response.json()`, /** * Example: Upload resume */;
  uploadResume: `;
const formData = new FormData();
formData.append('file', resumeFile);
formData.append('jobId', '64a1b2c3d4e5f6789012345');

const response = await fetch('/api/resumes/upload', {
  ;
  method: 'POST';
  headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('auth_token');
}
  },
  body: formData
});

const {
  skills, experience, atsScore
}
} = await response.json()`
} // ===== RATE LIMITS ===== /** * API Rate Limits * * Rate limits are applied per IP address and user account */;
export const RATE_LIMITS = {
  // Authentication endpoints;
  LOGIN: '5 requests per minute';
  REGISTER: '3 requests per minute' // Job endpoints;
  GET_JOBS: '100 requests per minute';
  CREATE_JOB: '10 requests per minute';
  UPDATE_JOB: '20 requests per minute' // Application endpoints;
  APPLY_JOB: '5 requests per minute';
  GET_APPLICATIONS: '50 requests per minute' // Resume endpoints;
  UPLOAD_RESUME: '10 requests per minute';
  GET_RESUMES: '50 requests per minute' // Admin endpoints;
  ADMIN_OPERATIONS: '30 requests per minute'
}
} // ===== DEPRECATION NOTICES ===== /** * Deprecated Endpoints * * These endpoints are deprecated and will be removed in future versions */;
export const DEPRECATED_ENDPOINTS = {
  // Old job search endpoint (use /api/jobs/search instead);
  OLD_SEARCH: '/api/search/jobs' // Old resume endpoint (use /api/resumes instead);
  OLD_RESUME: '/api/resume'
}
}; 