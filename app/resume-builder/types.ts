/**
 * Resume Builder Types
 * Safe types for Resume Builder module
 */

import { z } from 'zod';

export type TemplateStyle = 'modern' | 'minimal' | 'corporate' | 'creative' | 'fresher-friendly' | 'executive';
export type ExperienceLevel = 'fresher' | 'entry' | 'mid' | 'senior' | 'executive';

export const ResumeBuilderDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
    jobTitle: z.string().optional(),
    summary: z.string().min(10, 'Professional summary must be at least 10 characters'),
    profilePhoto: z.string().optional(),
  }),
  experience: z.array(z.object({
    id: z.string(),
    company: z.string().min(1),
    position: z.string().min(1),
    location: z.string().optional(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
  })).default([]),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string().min(1),
    degree: z.string().min(1),
    field: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
    description: z.string().optional(),
    isCurrent: z.boolean().default(false),
  })).default([]),
  skills: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
    category: z.string().optional(),
  })).default([]),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().min(10),
    technologies: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    url: z.string().url().optional().or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).default([]),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    issuer: z.string().min(1),
    date: z.string().min(1),
    url: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
  })).default([]),
  languages: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']).default('fluent'),
  })).default([]),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    date: z.string().optional(),
    issuer: z.string().optional(),
  })).default([]),
  internships: z.array(z.object({
    id: z.string(),
    company: z.string().min(1),
    position: z.string().min(1),
    location: z.string().optional(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
    technologies: z.array(z.string()).default([]),
  })).default([]),
  template: z.object({
    style: z.enum(['modern', 'minimal', 'corporate', 'creative', 'fresher-friendly', 'executive']).default('modern'),
    colorScheme: z.string().default('blue'),
  }),
  experienceLevel: z.enum(['fresher', 'entry', 'mid', 'senior', 'executive']).optional(),
  metadata: z.object({
    atsScore: z.number().min(0).max(100).default(0),
    completeness: z.number().min(0).max(100).default(0),
  }).optional(),
  sectionOrder: z.array(z.string()).optional(),
});

export type ResumeBuilderData = z.infer<typeof ResumeBuilderDataSchema>;

export interface AISuggestion {
  text: string;
  type: 'keyword' | 'bullet' | 'description' | 'summary' | 'skill' | 'project' | 'certification' | 'language' | 'achievement' | 'internship';
  confidence: number;
}

export interface ATSScore {
  score: number;
  suggestions: string[];
  missingKeywords: string[];
  improvements: string[];
  actionVerbs: string[];
  formattingIssues: string[];
}

