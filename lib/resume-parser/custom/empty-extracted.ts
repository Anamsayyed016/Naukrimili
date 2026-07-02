/**
 * Canonical empty ExtractedResumeData skeleton for the custom parser.
 * Mirrors the shape used by text-recovery and merge-resume-data entry points.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export function createEmptyExtractedResumeData(rawText = ''): ExtractedResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    hobbies: [],
    achievements: [],
    confidence: 0,
    rawText,
  };
}
