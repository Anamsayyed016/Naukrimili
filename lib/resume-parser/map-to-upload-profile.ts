/**
 * Maps standard ExtractedResumeData → ultimate-upload parsedData shape.
 * Single mapper reused by Affinda, Enhanced AI, and upload route.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';
import { isFirmOrLocationNamePhrase } from '@/lib/resume-parser/field-classification';
import {
  isExperienceBlurbFragment,
  isPlausiblePersonName,
  sanitizePersonName,
} from '@/lib/resume-parser/import-sanitize';

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

/** Board profile / cover-letter / corporate intro text mis-mapped as summary. */
export function isSuspectSummary(summary: string | undefined): boolean {
  const s = String(summary || '').replace(/\s+/g, ' ').trim();
  if (!s || s.length < 50) return false;
  if (/\b(dear\s+(sir|madam|hiring)|i am writing to apply|to whom it may concern)\b/i.test(s)) {
    return true;
  }
  if (
    /\b(board\s+of\s+directors|corporate\s+profile|company\s+profile|about\s+(?:the\s+)?company|executive\s+biography|group\s+overview)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (/\b(turnover|crores?|lakhs?|listed\s+on\s+(?:nse|bse))\b/i.test(s) && s.length > 100) {
    return true;
  }
  // Section boundary lost on long/multi-column PDFs — education/experience/skills embedded in summary.
  if (s.length > 1800) return true;
  if (
    /\b(work\s+experience|professional\s+experience|employment\s+history|education|academic\s+background|technical\s+skills|key\s+skills|core\s+competenc)/i.test(
      s
    ) &&
    s.length > 350
  ) {
    return true;
  }
  return false;
}

function isAffindaExperienceStub(
  exp: ExtractedResumeData['experience'][number] | undefined
): boolean {
  if (!exp) return true;
  const company = String(exp.company || '').trim();
  const position = String(exp.position || '').trim();
  const startDate = String(exp.startDate || '').trim();
  const endDate = String(exp.endDate || '').trim();
  const description = String(exp.description || '').trim();
  const achievements = exp.achievements?.length ?? 0;
  if (isExperienceBlurbFragment(position) || isExperienceBlurbFragment(company)) return true;
  return !!position && !company && !startDate && !endDate && !description && achievements === 0;
}

function isPartialEducationEntry(
  edu: ExtractedResumeData['education'][number] | undefined
): boolean {
  if (!edu) return true;
  const degree = String(edu.degree || '').trim();
  const institution = String(edu.institution || '').trim();
  return !!(degree || institution) && (!degree || !institution);
}

/**
 * Low-quality Affinda parses should fall through to Hybrid even when structurally "usable".
 * Root cause: isUsableExtraction() only checks presence, not correctness.
 */
export function shouldPreferHybridOverAffinda(
  extracted: ExtractedResumeData,
  layout: ResumeDocumentProfile | null | undefined
): { prefer: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const signals = layout?.signals;

  if (signals?.executiveLayout) reasons.push('executive_layout');
  if (signals?.multiColumnLikely) reasons.push('multi_column');
  if (signals?.sidebarLikely) reasons.push('sidebar');
  if (signals?.coverLetterDetected) reasons.push('cover_letter');

  const name = String(extracted.fullName || '').trim();
  if (name && !isPlausiblePersonName(name)) reasons.push('invalid_name');
  if (name && isFirmOrLocationNamePhrase(name)) reasons.push('firm_or_location_name');

  if (isSuspectSummary(extracted.summary)) reasons.push('suspect_summary');

  const exps = extracted.experience || [];
  if (exps.length > 0 && exps.every(isAffindaExperienceStub)) reasons.push('all_stub_experience');

  const edus = extracted.education || [];
  if (edus.length > 0 && edus.every(isPartialEducationEntry)) reasons.push('partial_education');

  return { prefer: reasons.length > 0, reasons };
}

const LAYOUT_ONLY_HYBRID_REASONS = new Set([
  'executive_layout',
  'multi_column',
  'sidebar',
  'cover_letter',
]);

/**
 * Document parsers (Affinda/Eden) may return good data on executive layouts where
 * OpenAI would be preferred — accept when sections are populated without content defects.
 */
export function isDocumentParserAcceptable(extracted: ExtractedResumeData): boolean {
  if (!isUsableExtraction(extracted)) return false;
  const quality = shouldPreferHybridOverAffinda(extracted, undefined);
  const contentReasons = quality.reasons.filter((r) => !LAYOUT_ONLY_HYBRID_REASONS.has(r));
  return contentReasons.length === 0;
}

/** True when autofill has enough data to populate the builder meaningfully. */
export function hasAutofillPayload(extracted: ExtractedResumeData): boolean {
  if (isUsableExtraction(extracted)) return true;

  const hasIdentity = !!(extracted.fullName || extracted.email || extracted.phone);
  const exp = extracted.experience?.length ?? 0;
  const edu = extracted.education?.length ?? 0;
  const skills = extracted.skills?.length ?? 0;

  if (hasIdentity && (exp > 0 || edu > 0 || skills > 0)) return true;
  if (hasIdentity) return true;
  if (exp > 0 && edu > 0) return true;
  if (exp >= 2 || edu >= 2 || skills >= 3) return true;

  return false;
}

/** Looser gate for text-recovery / partial parser merges — any real field is worth keeping. */
export function hasMinimalAutofillPayload(extracted: ExtractedResumeData): boolean {
  if (hasAutofillPayload(extracted)) return true;
  if (extracted.fullName || extracted.email || extracted.phone) return true;
  if ((extracted.experience?.length ?? 0) > 0) return true;
  if ((extracted.education?.length ?? 0) > 0) return true;
  if ((extracted.skills?.length ?? 0) > 0) return true;
  if ((extracted.summary || '').trim().length > 40) return true;
  return false;
}

export function isAffindaPrimaryAcceptable(
  extracted: ExtractedResumeData,
  layout: ResumeDocumentProfile | null | undefined
): boolean {
  if (!isUsableExtraction(extracted)) return false;
  return !shouldPreferHybridOverAffinda(extracted, layout).prefer;
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
