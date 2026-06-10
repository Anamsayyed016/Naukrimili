/**
 * Maps standard ExtractedResumeData → ultimate-upload parsedData shape.
 * Single mapper reused by Affinda, Enhanced AI, and upload route.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { sanitizePersonName } from '@/lib/resume-parser/import-sanitize';

export function mapExtractedToUploadProfile(
  extracted: ExtractedResumeData,
  options?: { aiProvider?: string }
): Record<string, any> {
  const fullName = sanitizePersonName(extracted.fullName) || '';
  return {
    name: fullName,
    fullName,
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
    education: (extracted.education || []).map((edu) => {
      const institution = edu.institution || '';
      return {
        institution,
        school: institution,
        Institution: institution,
        degree: edu.degree || '',
        Degree: edu.degree || '',
        field: edu.field || '',
        Field: edu.field || '',
        year: edu.endDate || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || '',
        description: edu.description || '',
      };
    }),
    projects: extracted.projects || [],
    certifications: extracted.certifications || [],
    // Forward languages as objects to preserve proficiency; downstream code
    // (normalizeUploadProfile + route mapper) handles both strings and objects.
    languages: (extracted.languages || []).map((l) => {
      if (typeof l === 'string') return l;
      return { name: l.name || '', proficiency: l.proficiency || '' };
    }),
    summary: extracted.summary || '',
    achievements: extracted.achievements || [],
    hobbies: extracted.hobbies || [],
    confidence: extracted.confidence ?? 75,
    _aiProvider: options?.aiProvider || 'extracted',
  };
}

export function isUsableExtraction(extracted: ExtractedResumeData): boolean {
  const skills = extracted.skills?.length ?? 0;
  const experience = extracted.experience?.length ?? 0;
  const education = extracted.education?.length ?? 0;
  const rawLen = (extracted.rawText || '').replace(/\s+/g, ' ').trim().length;

  const hasIdentity = !!(extracted.fullName || extracted.email || extracted.phone);
  const hasCoreSections = experience >= 1 || education >= 1 || skills >= 2;
  const hasRichText = rawLen >= 200;

  // Rich document with at least one substantive resume section.
  if (hasRichText && hasCoreSections) {
    return true;
  }

  // Identity + core sections — accept even when rawText is short (DOCX edge cases).
  if (hasIdentity && hasCoreSections) {
    return true;
  }

  return false;
}
