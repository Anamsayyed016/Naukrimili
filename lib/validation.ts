import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Basic field schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email address too long')
  .transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .transform((name) => name.trim());

// Sanitizers
export function sanitizeHtml(input: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  // Server-side fallback
  return input.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeString(input: string): string {
  return sanitizeHtml(input).trim().substring(0, 1000);
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().substring(0, 254);
}

export function sanitizeSearchQuery(query: string): string {
  return sanitizeHtml(query).trim().replace(/[^\w\s-.,]/g, '').substring(0, 100);
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_{2,}/g, '_').substring(0, 255);
}

// Job validation schemas
export const jobTitleSchema = z.string().min(3).max(100);
export const companyNameSchema = z.string().min(2).max(100);
export const locationSchema = z.string().min(2).max(100);
export const descriptionSchema = z.string().min(50).max(5000);

export const jobTypeSchema = z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']);
export const experienceLevelSchema = z.enum(['entry', 'mid', 'senior', 'lead', 'executive']);
export const salarySchema = z
  .object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().length(3),
    period: z.enum(['hourly', 'monthly', 'yearly']),
  })
  .refine((data) => data.max >= data.min, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['max'],
  });

// User validation schemas
export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['jobseeker', 'employer', 'admin']).default('jobseeker'),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Job posting validation
export const jobPostingSchema = z.object({
  title: jobTitleSchema,
  company: companyNameSchema,
  location: locationSchema,
  description: descriptionSchema,
  type: jobTypeSchema,
  experienceLevel: experienceLevelSchema,
  salary: salarySchema.optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  isRemote: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
});

// Resume upload validation
export const resumeUploadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().optional(),
  fileName: z.string().min(1),
  fileSize: z.number().max(5 * 1024 * 1024),
  fileType: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
});

// Search validation
export const jobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  type: jobTypeSchema.optional(),
  experienceLevel: experienceLevelSchema.optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  isRemote: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Enhanced validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: string[]; details: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = (error as z.ZodError).issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      });
      return { success: false, errors, details: error as z.ZodError };
    }
    throw error;
  }
}

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
};

// Security utilities
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
}