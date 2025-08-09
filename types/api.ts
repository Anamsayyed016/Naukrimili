// Comprehensive API type definitions

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiResponse<T = unknown> {
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
  details?: Record<string, unknown>;
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
  uploadedAt: string; // ISO
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
      startDate: string; // ISO
      endDate?: string; // ISO
      description: string;
      current: boolean;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string; // ISO
      endDate?: string; // ISO
      gpa?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string; // ISO
      expiryDate?: string; // ISO
    }>;
  };
  atsScore?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
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
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt?: string; // ISO
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
    startDate: string; // ISO
    endDate?: string; // ISO
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
  lastActive: string; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Application types
export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  coverLetter?: string;
  status:
    | 'pending'
    | 'reviewing'
    | 'shortlisted'
    | 'interviewed'
    | 'offered'
    | 'rejected'
    | 'withdrawn';
  appliedAt: string; // ISO
  updatedAt: string; // ISO
  notes?: string;
  feedback?: string;
  interviewScheduled?: {
    date: string; // ISO
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
    date: string; // ISO
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
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string; // ISO
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
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Request/Response type helpers
export type CreateJobRequest = Omit<
  JobData,
  'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount' | 'status'
>;
export type UpdateJobRequest = Partial<CreateJobRequest>;
export type CreateUserRequest = Omit<
  UserProfile,
  'id' | 'createdAt' | 'updatedAt' | 'profileCompletion' | 'isVerified' | 'lastActive'
>;
export type UpdateUserRequest = Partial<CreateUserRequest>;

// API endpoint types (kept minimal for compatibility)
export interface ApiEndpoints {
  [path: string]: unknown;
}