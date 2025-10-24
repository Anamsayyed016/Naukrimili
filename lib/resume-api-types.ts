// Resume API Types and Schemas
import { z } from 'zod';

// Core Resume Data Schema
export const ResumeDataSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  contact: z.object({
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    linkedin: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  summary: z.string().min(10, 'Professional summary must be at least 10 characters'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string(),
    gpa: z.string().optional(),
    details: z.string().optional(),
  })),
  workExperience: z.array(z.object({
    jobTitle: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibilities: z.array(z.string()),
    achievements: z.array(z.string()).optional(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().url().optional(),
    achievements: z.array(z.string()).optional(),
  })),
  certifications: z.array(z.string()),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Native']),
  })).optional(),
  awards: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }).optional(),
  preferences: z.object({
    workStyle: z.string().optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
    remote: z.boolean().optional(),
  }).optional(),
});

export interface ResumeData {
  skills?: string[];
  education?: {
    details?: string;
    year?: string;
    degree?: string;
    institution?: string;
    gpa?: string;
  }[];
  fullName?: string;
  summary?: string; // Add missing summary property
  contact?: {
    linkedin?: string;
    phone?: string;
    email?: string;
    portfolio?: string;
    address?: string;
  };
  experience?: {
    company?: string;
    position?: string;
    duration?: string;
    description?: string;
    achievements?: string[];
  }[];
  workExperience?: { // Add workExperience as alias for experience
    company?: string;
    position?: string;
    duration?: string;
    description?: string;
    achievements?: string[];
  }[];
  projects?: {
    name?: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
    url?: string;
  }[];
  certifications?: string[];
  languages?: string[];
  awards?: string[];
  interests?: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  preferences?: {
    workStyle?: string;
    location?: string;
    salary?: string;
    remote?: boolean;
    expectedSalary?: string; // Add missing property
    preferredJobType?: string; // Add missing property
    preferredLocation?: string; // Add missing property
  };
}

// API Request/Response Types
export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordMatch: {
    matched: string[];
    missing: string[];
    score: number;
  };
  completeness: {
    overall: number;
    sections: Record<string, number>;
  };
  aiInsights: {
    summary: string;
    recommendations: string[];
    industryFit: string[];
  };
  analysis: {
    completeness: number;
    atsScore: number;
    issues: string[];
    suggestions: string[];
    missingFields: string[];
    strengthAreas: string[];
    weaknessAreas: string[];
    duplicateContent: string[];
    conflicts: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeAnalysisRequest {
  resumeData?: ResumeData;
  resumeText?: string;
  userId?: string;
}

export interface ResumeAnalysisResponse {
  success: boolean;
  analysis: {
    completeness: number;
    atsScore: number;
    issues: string[];
    suggestions: string[];
    missingFields: string[];
    strengthAreas: string[];
    weaknessAreas: string[];
    duplicateContent: string[];
    conflicts: string[];
  };
  enhancedData?: ResumeData;
}

export interface ResumeGenerationRequest {
  jobDescription?: string;
  industryType?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  targetRole?: string;
  existingData?: Partial<ResumeData>;
  preferences?: {
    tone: 'professional' | 'creative' | 'technical';
    length: 'concise' | 'detailed';
    focus: 'skills' | 'experience' | 'education' | 'projects';
  };
  userId?: string;
}

export interface ResumeGenerationResponse {
  success: boolean;
  resumeData: ResumeData;
  suggestions: string[];
  atsOptimizations: string[];
  alternativeVersions?: {
    [key: string]: ResumeData;
  };
}

export interface ResumeUploadRequest {
  fileType: 'pdf' | 'docx' | 'txt';
  userId?: string;
}

export interface ResumeUploadResponse {
  success: boolean;
  extractedText: string;
  parsedData: ResumeData;
  confidence: number;
  issues: string[];
  resumeId: string;
}

export interface ResumeRetrievalResponse {
  success: boolean;
  resume: {
    id: string;
    userId: string;
    data: ResumeData;
    createdAt: string;
    updatedAt: string;
    version: number;
    metadata: {
      atsScore: number;
      completeness: number;
      lastAnalyzed: string;
    };
  };
}

export interface ResumeUpdateRequest {
  data: ResumeData;
  changeNotes?: string;
  reanalyze?: boolean;
}

export interface ResumeUpdateResponse {
  success: boolean;
  resume: ResumeRetrievalResponse['resume'];
  changes: {
    fieldsModified: string[];
    previousVersion: number;
    newVersion: number;
  };
  analysis?: ResumeAnalysisResponse['analysis'];
}

export interface ResumeExportRequest {
  format: 'pdf' | 'json' | 'docx' | 'txt';
  template?: string;
  customizations?: {
    theme: string;
    layout: string;
    sections: string[];
  };
}

export interface ResumeExportResponse {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

// Database Models
export interface ResumeRecord {
  id: string;
  userId: string;
  data: ResumeData;
  metadata: {
    atsScore: number;
    completeness: number;
    lastAnalyzed: string;
    analysisHistory: Array<{
      date: string;
      score: number;
      issues: string[];
      suggestions: string[];
    }>;
  };
  versions: Array<{
    version: number;
    data: ResumeData;
    timestamp: string;
    changeNotes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Error Types
export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
    field?: string;
  };
  timestamp: string;
}

// Validation Schemas for API Endpoints
export const AnalyzeRequestSchema = z.object({
  resumeData: ResumeDataSchema.optional(),
  resumeText: z.string().optional(),
  userId: z.string().optional(),
}).refine(data => data.resumeData || data.resumeText, {
  message: "Either resumeData or resumeText must be provided"
});

export const GenerateRequestSchema = z.object({
  jobDescription: z.string().optional(),
  industryType: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  targetRole: z.string().optional(),
  existingData: ResumeDataSchema.partial().optional(),
  preferences: z.object({
    tone: z.enum(['professional', 'creative', 'technical']).default('professional'),
    length: z.enum(['concise', 'detailed']).default('detailed'),
    focus: z.enum(['skills', 'experience', 'education', 'projects']).default('experience'),
  }).optional(),
  userId: z.string().optional(),
});

export const UpdateRequestSchema = z.object({
  data: ResumeDataSchema,
  changeNotes: z.string().optional(),
  reanalyze: z.boolean().default(true),
});

export const ExportRequestSchema = z.object({
  format: z.enum(['pdf', 'json', 'docx', 'txt']),
  template: z.string().optional(),
  customizations: z.object({
    theme: z.string().optional(),
    layout: z.string().optional(),
    sections: z.array(z.string()).optional(),
  }).optional(),
});

// Utility Types
export type APIResponse<T> = T | APIError;
