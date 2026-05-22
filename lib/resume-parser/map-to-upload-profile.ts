/**
 * Maps standard ExtractedResumeData → ultimate-upload parsedData shape.
 * Single mapper reused by Affinda, Enhanced AI, and upload route.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export function mapExtractedToUploadProfile(
  extracted: ExtractedResumeData,
  options?: { aiProvider?: string }
): Record<string, any> {
  return {
    name: extracted.fullName || '',
    fullName: extracted.fullName || '',
    email: extracted.email || '',
    phone: extracted.phone || '',
    address: extracted.location || '',
    location: extracted.location || '',
    linkedin: extracted.linkedin || '',
    portfolio: extracted.portfolio || '',
    skills: extracted.skills || [],
    experience: (extracted.experience || []).map((exp) => ({
      company: exp.company || '',
      position: exp.position || '',
      job_title: exp.position || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      start_date: exp.startDate || '',
      end_date: exp.endDate || '',
      description: exp.description || '',
      achievements: exp.achievements || [],
      current: exp.current || false,
      location: exp.location || '',
    })),
    education: (extracted.education || []).map((edu) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      year: edu.endDate || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
      description: edu.description || '',
    })),
    projects: extracted.projects || [],
    certifications: extracted.certifications || [],
    languages: extracted.languages || [],
    summary: extracted.summary || '',
    confidence: extracted.confidence ?? 75,
    _aiProvider: options?.aiProvider || 'extracted',
  };
}

export function isUsableExtraction(extracted: ExtractedResumeData): boolean {
  const hasIdentity = !!(extracted.fullName || extracted.email);
  const hasContent =
    (extracted.skills?.length ?? 0) > 0 ||
    (extracted.experience?.length ?? 0) > 0 ||
    (extracted.education?.length ?? 0) > 0;
  return hasIdentity && (hasContent || (extracted.confidence ?? 0) >= 40);
}
