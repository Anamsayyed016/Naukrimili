/**
 * Validation — reject companies, cities, headings, sentences, contact info.
 */

import {
  isLikelyEducationLine,
  isLikelyLocationFragment,
} from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
  sanitizeSkillEntry,
} from '@/lib/resume-parser/import-sanitize';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /https?:\/\//i;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
const RESPONSIBILITY_RE =
  /\b(responsible for|managed|mentored|developed|implemented|designed|delivered)\b/i;

/** Single past-tense duty verbs mis-extracted from achievement bullets as "skills". */
const DUTY_VERB_SKILL_RE =
  /^(?:led|conducted|managed|maintained|organized|organised|supported|implemented|coordinated|facilitated|handled|optimized|optimised|enhanced|streamlined|prepared|drafted|assisted|performed|executed|achieved|improved|created|built|drove|oversaw|supervised|monitored|tracked|scheduled|trained|hired|recruited)$/i;

const SECTION_HEADING_RE =
  /^(?:skills?|technical\s+skills|core\s+skills|expertise|competencies|technologies|technology|tools|frameworks)$/i;

const KNOWN_TECH_ACRONYMS_RE =
  /^(?:aws|gcp|azure|rest\s+api|api|ci\/cd|html|css|git|sql|nosql|saas|paas|iaas|oauth|jwt|grpc|tcp|udp|http|https|json|xml|yaml|sdk|ide|ui|ux|ml|ai|nlp|ocr|etl|erp|crm|seo|sem|ppc|hris)$/i;

/** Professional competency phrases across industries (not job titles or education lines). */
const PROFESSIONAL_SKILL_PHRASE_RE =
  /\b(?:management|planning|design|care|analysis|auditing|assessment|communication|leadership|marketing|sales|negotiation|compliance|budgeting|reporting|counseling|diagnosis|teaching|training|research|writing|coordination|presentation|curriculum|classroom|patient|pharmacology|surgery|lesson|financial|accounting|taxation|bookkeeping|recruitment|onboarding|payroll|litigation|contract|statutory|governance|procurement|operations|inventory|forecasting|analytics|branding|campaign|content|pipeline|relations)\b/i;

const SOFT_SKILL_SINGLE_RE =
  /^(?:excel|word|tally|sap|gst|emr|quickbooks|auditing|assessment|negotiation|teamwork|adaptability|collaboration|problem solving|critical thinking|time management|seo|crm|hris|payroll|governance|reporting|analytics)$/i;

export { SOFT_SKILL_SINGLE_RE };

/** Common multi-word competencies listed in non-technical skills sections. */
export const MULTI_WORD_SKILL_ALLOW_RE =
  /^(?:public administration|policy analysis|statutory compliance|financial analysis|classroom management|patient care|lesson planning|curriculum design|content marketing|brand management|campaign planning|google analytics|pipeline management|client relations|employee relations|case management|due diligence|contract drafting|legal research|infection control|vital signs|iv therapy|ms office|surgery assistance|lead generation)$/i;

export { KNOWN_TECH_ACRONYMS_RE };

export function isValidSkillCandidate(raw: string): boolean {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  if (KNOWN_TECH_ACRONYMS_RE.test(trimmed)) return true;
  if (MULTI_WORD_SKILL_ALLOW_RE.test(trimmed.toLowerCase())) return true;
  if (SOFT_SKILL_SINGLE_RE.test(trimmed)) return true;

  const cleaned = sanitizeSkillEntry(raw);
  if (!cleaned) return false;
  if (DUTY_VERB_SKILL_RE.test(cleaned)) return false;

  if (MULTI_WORD_SKILL_ALLOW_RE.test(cleaned)) return true;
  if (SOFT_SKILL_SINGLE_RE.test(cleaned)) return true;

  const wordCount = cleaned.split(/\s+/).length;
  if (
    wordCount <= 4 &&
    cleaned.length <= 50 &&
    PROFESSIONAL_SKILL_PHRASE_RE.test(cleaned) &&
    !/[.!?]$/.test(cleaned) &&
    !(RESPONSIBILITY_RE.test(cleaned) && wordCount > 4)
  ) {
    return true;
  }

  if (SECTION_HEADING_RE.test(cleaned)) return false;
  if (isResumeSectionHeadingLine(cleaned)) return false;
  if (EMAIL_RE.test(cleaned) || URL_RE.test(cleaned) || PHONE_RE.test(cleaned)) return false;

  if (isPlausibleExperienceCompany(cleaned) && cleaned.split(/\s+/).length >= 2) {
    return false;
  }
  if (isLikelyLocationFragment(cleaned) && cleaned.split(/\s+/).length <= 3) {
    return false;
  }
  if (isLikelyEducationLine(cleaned) && !/^(java|python|r|go|c|git|aws|css|html)$/i.test(cleaned)) {
    if (!(wordCount <= 4 && PROFESSIONAL_SKILL_PHRASE_RE.test(cleaned))) {
      return false;
    }
  }
  if (looksLikeJobTitleLine(cleaned) && cleaned.split(/\s+/).length >= 2) {
    if (!/^(rest\s+api|machine\s+learning)$/i.test(cleaned)) {
      if (!(wordCount <= 4 && PROFESSIONAL_SKILL_PHRASE_RE.test(cleaned))) {
        return false;
      }
    }
  }

  if (RESPONSIBILITY_RE.test(cleaned) && cleaned.split(/\s+/).length > 4) {
    return false;
  }
  if (/[.!?]$/.test(cleaned) && cleaned.split(/\s+/).length > 5) {
    return false;
  }

  return true;
}

export function filterValidCandidates<T extends { raw: string; source?: string }>(candidates: T[]): {
  valid: T[];
  rejectedCount: number;
} {
  const valid: T[] = [];
  let rejectedCount = 0;

  for (const c of candidates) {
    if (isValidSkillCandidate(c.raw)) {
      valid.push(c);
      continue;
    }
    // Explicit skills-section competency bullets (Strengths & IT Skills, etc.)
    const cleaned = String(c.raw || '')
      .trim()
      .replace(/[.:]+$/g, '')
      .trim();
    if (
      c.source === 'skills_section' &&
      cleaned.length >= 3 &&
      cleaned.length <= 90 &&
      cleaned.split(/\s+/).length <= 12 &&
      /[A-Za-z]/.test(cleaned) &&
      !DUTY_VERB_SKILL_RE.test(cleaned) &&
      !RESPONSIBILITY_RE.test(cleaned)
    ) {
      valid.push({ ...c, raw: cleaned });
      continue;
    }
    rejectedCount += 1;
  }

  return { valid, rejectedCount };
}
