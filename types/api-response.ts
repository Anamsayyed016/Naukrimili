import { z } from 'zod';

// Validation schemas
export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'internship',
  'remote'
]);

export const salarySchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string(),
  period: z.enum(['hourly', 'monthly', 'yearly'])
}).optional();

export const jobStatusSchema = z.enum([
  'draft',
  'published',
  'closed',
  'archived'
]);

export const jobSourceSchema = z.enum([
  'direct',
  'api',
  'internal'
]);

// API Response Types with Validation
export interface APIJobResponse {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type: z.infer<typeof jobTypeSchema>;
  salary?: {
    formatted: string;
    details?: z.infer<typeof salarySchema>};
  status: z.infer<typeof jobStatusSchema>;
  source: z.infer<typeof jobSourceSchema>;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  benefits?: string[];
  department?: string;
  industry?: string;
  education?: string;
  posted_date: string;
  closing_date?: string;
  application_count?: number;
  is_remote: boolean;
  is_urgent?: boolean;
  company_logo?: string;
  apply_url?: string}

export interface APIJobSearchResponse {
  jobs: APIJobResponse[];
  total: number;
  page: number;
  total_pages: number;
  has_more: boolean}

export interface APIErrorResponse {
  error: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>}

// Validation function
export function validateJobResponse(data: unknown): APIJobResponse {
  const schema = z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    description: z.string(),
    type: jobTypeSchema,
    salary: z.object({
      formatted: z.string(),
      details: salarySchema
    }).optional(),
    status: jobStatusSchema,
    source: jobSourceSchema,
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    department: z.string().optional(),
    industry: z.string().optional(),
    education: z.string().optional(),
    posted_date: z.string().datetime(),
    closing_date: z.string().datetime().optional(),
    application_count: z.number().int().nonnegative().optional(),
    is_remote: z.boolean(),
    is_urgent: z.boolean().optional(),
    company_logo: z.string().url().optional(),
    apply_url: z.string().url().optional()
  });

  return schema.parse(data)}
