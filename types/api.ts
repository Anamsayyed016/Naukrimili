// Comprehensive API type definitions

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  code?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    timestamp: string;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  code: string;
  details?: any;
}

// File upload types
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  sanitizedFileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  uploadedBy: string;
  jobId?: string;
  uploadedAt: string;
  filePath: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
}

// Resume types
export interface ResumeData {
  id: string;
  userId: string;
  jobId?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  parsedData?: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
      linkedin?: string;
      github?: string;
    };
    summary?: string;
    skills: string[];
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description: string;
      current: boolean;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
      gpa?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
      expiryDate?: string;
    }>;
  };
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

// Job types
export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  skills: string[];
  isRemote: boolean;
  isUrgent: boolean;
  status: 'active' | 'paused' | 'closed' | 'draft';
  postedBy: string;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  profileCompletion: number;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
  }>;
  preferences?: {
    jobTypes: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    remoteWork: boolean;
  };
  isVerified: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

// Application types
export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn';
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  feedback?: string;
  interviewScheduled?: {
    date: string;
    type: 'phone' | 'video' | 'in-person';
    location?: string;
    meetingLink?: string;
  };
}

// Search types
export interface SearchFilters {
  query?: string;
  location?: string;
  type?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  skills?: string[];
  company?: string;
  postedWithin?: '1d' | '3d' | '7d' | '30d';
}

export interface SearchParams extends SearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'salary' | 'company';
  sortOrder?: 'asc' | 'desc';
}

// Analytics types
export interface AnalyticsData {
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
  totalCompanies: number;
  recentActivity: Array<{
    type: 'job_posted' | 'application_submitted' | 'user_registered';
    count: number;
    date: string;
  }>;
  topSkills: Array<{
    skill: string;
    count: number;
  }>;
  topLocations: Array<{
    location: string;
    count: number;
  }>;
  salaryTrends: Array<{
    period: string;
    average: number;
    median: number;
  }>;
}

// Notification types
export interface NotificationData {
  id: string;
  userId: string;
  type: 'job_match' | 'application_update' | 'interview_scheduled' | 'system_update';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Company types
export interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  website?: string;
  logo?: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location: string;
  founded?: number;
  benefits?: string[];
  culture?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  isVerified: boolean;
  jobsCount: number;
  followersCount: number;
  createdAt: string;
  updatedAt: string;
}

// Request/Response type helpers
export type CreateJobRequest = Omit<JobData, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount' | 'status'>;
export type UpdateJobRequest = Partial<CreateJobRequest>;
export type CreateUserRequest = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'profileCompletion' | 'isVerified' | 'lastActive'>;
export type UpdateUserRequest = Partial<CreateUserRequest>;

// API endpoint types
export interface ApiEndpoints {
  // Auth
  '/api/auth/login': {
    POST: {
      body: { email: string; password: string };
      response: ApiResponse<{ user: UserProfile; token: string }>;
    };
  };
  '/api/auth/register': {
    POST: {
      body: CreateUserRequest & { password: string };
      response: ApiResponse<{ user: UserProfile; token: string }>;
    };
  };
  
  // Jobs
  '/api/jobs': {
    GET: {
      query: SearchParams;
      response: PaginatedResponse<JobData>;
    };
    POST: {
      body: CreateJobRequest;
      response: ApiResponse<JobData>;
    };
  };
  '/api/jobs/[id]': {
    GET: {
      response: ApiResponse<JobData>;
    };
    PUT: {
      body: UpdateJobRequest;
      response: ApiResponse<JobData>;
    };
    DELETE: {
      response: ApiResponse<{ message: string }>;
    };
  };
  
  // Resumes
  '/api/resumes/upload': {
    POST: {
      body: FormData;
      response: ApiResponse<FileUploadResponse>;
    };
  };
  '/api/resumes/[id]': {
    GET: {
      response: ApiResponse<ResumeData>;
    };
    PUT: {
      body: Partial<ResumeData>;
      response: ApiResponse<ResumeData>;
    };
    DELETE: {
      response: ApiResponse<{ message: string }>;
    };
  };
  
  // Applications
  '/api/applications': {
    GET: {
      query: { userId?: string; jobId?: string; status?: string };
      response: PaginatedResponse<JobApplication>;
    };
    POST: {
      body: { jobId: string; resumeId: string; coverLetter?: string };
      response: ApiResponse<JobApplication>;
    };
  };
}