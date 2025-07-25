export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
}

// Job API Types
export interface CreateJobRequest {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string;
}

// Application API Types
export interface SubmitApplicationRequest {
  jobId: string;
  resumeUrl: string;
  coverLetter?: string;
  additionalDocuments?: {
    name: string;
    url: string;
  }[];
}

// Resume API Types
export interface UploadResumeRequest {
  file: File;
  type: 'pdf' | 'doc' | 'docx';
  isDefault?: boolean;
}

// Profile API Types
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
}
