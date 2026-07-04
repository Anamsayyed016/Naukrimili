/**
 * Semantic company detection with confidence scoring.
 */

import {
  classifyResumeTextFragment,
  isLikelyCompanyNameFragment,
} from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
  splitCompanyLocationPipe,
} from '@/lib/resume-parser/import-sanitize';

import { TECH_SKILL_AS_COMPANY_RE } from './constants';

export interface CompanyDetection {
  company: string;
  confidence: number;
}

const COMPANY_SUFFIX_RE =
  /\b(?:private\s+limited|pvt\.?\s*ltd\.?|ltd\.?|llp|inc\.?|incorporated|corporation|corp\.?|technologies?|solutions|systems|software|labs|healthcare|university|government|startup|freelance|self[- ]?employed)\b/i;

const PROPRIETARY_NAME_SUFFIX_RE =
  /\b[A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+)*\s+(?:Technology|Technologies|Solutions|Systems|Software|Labs|Digital|Infotech|Consulting|Services)\b/;

const FALSE_COMPANY_RE =
  /^(python|react|node\.?js|javascript|typescript|java|django|flask|aws|docker|redis|kafka|postgresql|mongodb|bhopal|mumbai|delhi|bangalore|hyderabad|pune|chennai|remote|hybrid|onsite|wfh)$/i;

const SENTENCE_VERB_RE =
  /\b(led|built|designed|developed|wrote|managed|created|implemented|integrated|responsible|delivered|achieved|maintained|optimized|collaborated)\b/i;

/** Short employer references common in government, academic, and agency resumes. */
const SHORT_ORG_RE =
  /^(?:org|dept|department|unit|branch|office|agency|division|bureau|firm|group|ministry|directorate)\s+[\w\d.-]+$/i;

/** Compact employer labels such as "Org 4", "Unit 12", "Branch 3". */
const COMPACT_EMPLOYER_RE = /^[A-Z][A-Za-z]{1,24}(?:\s+[A-Z][A-Za-z]{1,24})?\s+\d{1,4}$/;

/** Government and institutional employer patterns. */
const INSTITUTIONAL_EMPLOYER_RE =
  /\b(?:hospitals?|clinics?|schools?|colleges?|universities?|ministr(?:y|ies)|municipal|corporations?|authorit(?:y|ies)|commissions?|councils?|departments?|institutes?|academ(?:y|ies)|foundations?|trusts?|secretariats?|directorates?|bureaus?|agencies?|chambers?|healthcare|bank|banks|chartered|insurance|logistics|motors|retail|pharma|vidyalaya|vidyalay)\b/i;

export function looksLikeInstitutionalEmployer(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4) return false;
  return INSTITUTIONAL_EMPLOYER_RE.test(trimmed) || SHORT_ORG_RE.test(trimmed);
}

/** Reject bullet sentences and long prose misclassified as company names. */
export function looksLikeSentenceNotCompany(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (COMPANY_SUFFIX_RE.test(trimmed) && trimmed.length <= 120) return false;
  if (/\b(improv(?:ed|ing)|optimiz(?:ed|ing)|reduc(?:ed|ing)|increas(?:ed|ing)|develop(?:ed|ing)|design(?:ed|ing)|mentor(?:ed|ing)|administer(?:ed|ing))\b/i.test(trimmed)) {
    return true;
  }
  if (/\d+\s*%/.test(trimmed)) return true;
  if (trimmed.length > 55) return true;
  if (trimmed.length > 30 && SENTENCE_VERB_RE.test(trimmed)) return true;
  if (/^[a-z]/.test(trimmed) && trimmed.length > 25) return true;
  if (/[.!?]$/.test(trimmed) && trimmed.length > 20) return true;
  if (trimmed.split(/\s+/).length > 8) return true;
  return false;
}

export function scoreCompanyCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return 0;
  if (looksLikeSentenceNotCompany(trimmed)) return 0;
  if (FALSE_COMPANY_RE.test(trimmed)) return 0;
  if (TECH_SKILL_AS_COMPANY_RE.test(trimmed.toLowerCase())) return 0;
  if (looksLikeJobTitleLine(trimmed) && !looksLikeCompanyNameLine(trimmed)) return 0;

  let score = 0;
  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'COMPANY_NAME') score += classified.confidence * 0.85;
  if (isLikelyCompanyNameFragment(trimmed)) score += 28;
  if (looksLikeCompanyNameLine(trimmed)) score += 32;
  if (COMPANY_SUFFIX_RE.test(trimmed)) score += 22;
  if (PROPRIETARY_NAME_SUFFIX_RE.test(trimmed)) score += 38;
  if (SHORT_ORG_RE.test(trimmed)) score += 48;
  if (COMPACT_EMPLOYER_RE.test(trimmed)) score += 44;
  if (INSTITUTIONAL_EMPLOYER_RE.test(trimmed)) score += 36;
  if (looksLikeInstitutionalEmployer(trimmed)) score += 32;
  if (/\b[A-Z][a-z]+\s+(?:Sons|Bros|Brothers|Holdings|Group|Industries|Enterprises|Motors|Retail)\b/.test(trimmed)) {
    score += 42;
  }
  if (/\b\w+\s+(?:Asia|Partners|Associates|Healthcare|Diagnostics|Pathlabs?|Pharma)\b/i.test(trimmed)) {
    score += 40;
  }
  if (/\s&\s+Co\.?$/i.test(trimmed)) score += 44;
  if (isPlausibleExperienceCompany(trimmed)) score += 18;
  if (trimmed.length >= 3 && trimmed.length <= 40 && /^[A-Z]/.test(trimmed) && !looksLikeJobTitleLine(trimmed)) {
    score += 10;
  }
  if (trimmed.length >= 4 && trimmed.length <= 80 && /\s/.test(trimmed)) score += 8;
  if (/^[A-Z][A-Za-z0-9&.,'()\- ]{2,}$/.test(trimmed) && !/[.!?]$/.test(trimmed)) score += 6;

  return Math.min(100, Math.round(score));
}

export function detectCompanyFromLine(text: string): CompanyDetection {
  const trimmed = text.trim();
  if (!trimmed) return { company: '', confidence: 0 };

  const pipeSplit = splitCompanyLocationPipe(trimmed);
  if (pipeSplit?.company) {
    const conf = scoreCompanyCandidate(pipeSplit.company);
    if (conf >= 40) {
      return { company: pipeSplit.company, confidence: conf };
    }
  }

  const atMatch = trimmed.match(/\bat\s+([A-Z][A-Za-z0-9&.,'()\- ]{2,60})/);
  if (atMatch) {
    const conf = scoreCompanyCandidate(atMatch[1]);
    if (conf >= 45) {
      return { company: atMatch[1].trim(), confidence: conf };
    }
  }

  const conf = scoreCompanyCandidate(trimmed);
  if (conf >= 38) {
    return { company: trimmed, confidence: conf };
  }

  return { company: '', confidence: 0 };
}
