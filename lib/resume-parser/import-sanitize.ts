/**
 * Sanitization for resume import → builder mapping.
 * Rejects parser fallbacks and merged blobs; splits names for contact fields.
 */

import { stripAiCommentaryFromJobDescription } from '@/lib/jobs/clean-job-description';
import { cleanString, cleanMultiline, isSectionLabel, normalizeDate, isPlausibleResumeYear } from './normalize-extracted';
import {
  classifyResumeTextFragment,
  isClassifiedPersonName,
  isEmailOrDomainFragment,
  isFirmOrLocationNamePhrase,
  isLikelyCertificationLine,
  isLikelyCompanyNameFragment,
  isLikelyEducationLine,
  isLikelyJobTitleFragment,
  isLikelyLocationFragment,
  splitClassifiedFullName,
  type ClassifiedText,
} from './field-classification';
import {
  isImportFieldTraceEnabled,
  traceExperienceReconcile,
  traceSanitizeExperienceDropped,
  traceSanitizeProjectDropped,
  traceSkillDecisions,
} from './import-field-trace';
import { looksLikeSentenceNotCompany } from '@/lib/resume-parser/custom/experience-extraction/company';

let _traceReconcileExpIndex = 0;
let _traceSanitizeExpIndex = 0;

const GARBAGE_PATTERNS = [
  /pdf parsing failed/i,
  /please complete your profile manually/i,
  /^resume:\s*.+\.(pdf|docx?|txt)\b/i,
  /not extracted/i,
  /details not extracted/i,
  /institution not specified/i,
  /company not specified/i,
  /experience details not extracted/i,
  /education details not extracted/i,
  /location not specified/i,
  /salary not specified/i,
];

/** Parser/AI fallback lines that must never land in form fields */
export function isGarbageResumeText(value: unknown): boolean {
  if (value == null) return true;
  const s = String(value).replace(/\s+/g, ' ').trim();
  if (s.length < 2) return true;
  if (GARBAGE_PATTERNS.some((p) => p.test(s))) return true;
  if (s.length > 200 && /@/.test(s) && /\b(linkedin|github|phone|email)\b/i.test(s)) {
    return true;
  }
  return false;
}

export function sanitizeFieldText(value: unknown, maxLen = 500): string {
  if (isGarbageResumeText(value)) return '';
  const s = cleanString(value);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

/** Preserve newlines for experience/education descriptions (mapping layer). */
export function sanitizeMultilineFieldText(value: unknown, maxLen = 4000): string {
  if (isGarbageResumeText(value)) return '';
  const s = cleanMultiline(value);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

/** Normalize display names (e.g. KMARIYAM → Kmariyam). */
export function formatDisplayName(value: unknown): string {
  const raw = sanitizeFieldText(value, 120);
  if (!raw) return '';
  if (raw.length > 1 && raw === raw.toUpperCase() && /[A-Z]/.test(raw)) {
    return raw.charAt(0) + raw.slice(1).toLowerCase();
  }
  return raw
    .split(/\s+/)
    .map((part) => {
      if (!part) return '';
      if (part.length > 1 && part === part.toUpperCase()) {
        return part.charAt(0) + part.slice(1).toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

const HONORIFICS = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam']);

/**
 * Split full name → firstName + lastName (handles middle names, single names).
 */
/**
 * True when `name` is almost certainly the email local-part (e.g. kmariyam@gmail.com → "Kmariyam").
 */
export function isEmailDerivedName(name: string, email: string): boolean {
  const n = String(name || '').trim().toLowerCase();
  const e = String(email || '').trim().toLowerCase();
  if (!n || !e.includes('@')) return false;

  const wordCount = n.split(/\s+/).filter(Boolean).length;
  // Multi-word names (e.g. "Maryam Khan") are never email slugs.
  if (wordCount >= 2) return false;

  const local = e.split('@')[0].replace(/\d/g, '');
  if (!local) return false;

  const localNorm = local.replace(/[._-]/g, '');
  const nameNorm = n.replace(/[\s._-]/g, '');
  if (!nameNorm) return false;

  if (nameNorm === localNorm) return true;

  // Single-token blob local part with no separators (e.g. kmariyam@… → "Kmariyam").
  if (!/[._-]/.test(local) && wordCount === 1 && localNorm.startsWith(nameNorm) && nameNorm.length >= 4) {
    return true;
  }

  return false;
}

/**
 * Parse email local-part into first/last only when separators imply real name parts.
 * Returns null for opaque blobs like "kmariyam" (low confidence).
 */
export function parseIntelligentNameFromEmail(
  email: string
): { firstName: string; lastName: string } | null {
  const local = String(email.split('@')[0] || '')
    .replace(/\d/g, '')
    .trim();
  if (!local || local.length < 3) return null;

  if (/[._-]/.test(local)) {
    const parts = local
      .split(/[._-]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2);
    if (parts.length >= 2) {
      return {
        firstName: formatDisplayName(parts[0]),
        lastName: parts
          .slice(1)
          .map((p) => formatDisplayName(p))
          .filter(Boolean)
          .join(' '),
      };
    }
  }

  return null;
}

const NAME_STOPWORDS = new Set([
  'of',
  'the',
  'and',
  'or',
  'around',
  'with',
  'for',
  'to',
  'in',
  'at',
  'from',
  'by',
  'a',
  'an',
  'as',
  'on',
  'per',
  'via',
  'into',
  'over',
  'under',
  'between',
  'within',
  'across',
]);

/** Resume / business vocabulary — never valid in a personal name. */
const NON_NAME_VOCAB =
  /\b(?:turnover|revenue|crores?|lakhs?|millions?|billions?|managed|managing|responsible|experience|years?|team|project|projects|company|companies|clients?|achieved|delivered|implemented|designed|developed|annual|growth|profit|sales|operations|department|division|crore|lakh|achievement|achievements|accomplishment|board|director|chairman|chairperson|secretary|president|executive|officer)\b/i;

const CREDENTIAL_PREFIX_RE = /^(?:mr|mrs|ms|miss|dr|prof|ca|cs|cma|cfa|cpa|mba)\.?\s+/i;

export type NameCandidateSource =
  | 'explicit'
  | 'header_centered'
  | 'near_contact'
  | 'affinda'
  | 'eden'
  | 'text_recovery'
  | 'first_line'
  | 'email_derived';

export interface NameCandidate {
  value: string;
  confidence: number;
  source: NameCandidateSource;
}

/** True when value looks like a job title / designation, not a person name. */
export { isLikelyJobTitleFragment as isLikelyJobTitle } from './field-classification';

/** True when value looks like an organization name. */
export { isLikelyCompanyNameFragment as isLikelyCompanyName } from './field-classification';

export function stripCredentialPrefix(value: string): string {
  return String(value || '')
    .replace(CREDENTIAL_PREFIX_RE, '')
    .trim();
}

/**
 * True when a string looks like a real person name (not a bullet, sentence, or metric).
 */
export function isPlausiblePersonName(value: unknown): boolean {
  const s = stripCredentialPrefix(String(value || '').replace(/\s+/g, ' ').trim());
  if (!s || isGarbageResumeText(s)) return false;
  if (isEmailOrDomainFragment(s)) return false;
  if (/^%PDF|\bresume\b|\bcv\b|\bcurriculum\b|\bvitae\b/i.test(s)) return false;
  return isClassifiedPersonName(s);
}

/** Contact name passed all classification gates — safe to keep without second-pass override. */
export function isValidatedContactName(name: string, locationHint = ''): boolean {
  const n = String(name || '').trim();
  if (!n || !isPlausiblePersonName(n)) return false;
  if (isFirmOrLocationNamePhrase(n, locationHint)) return false;
  return true;
}

/** Sanitize and keep only plausible personal names. */
export function sanitizePersonName(value: unknown, maxLen = 120): string {
  const s = sanitizeFieldText(value, maxLen);
  return isPlausiblePersonName(s) ? s : '';
}

/**
 * Fallback display name from email when parsers return garbage (e.g. anamkhan@gmail.com).
 */
export function deriveDisplayNameFromEmail(email: string): string {
  const local = String(email.split('@')[0] || '')
    .replace(/\d/g, '')
    .trim();
  if (!local || local.length < 3) return '';

  const fromIntel = parseIntelligentNameFromEmail(email);
  if (fromIntel) {
    const combined = [fromIntel.firstName, fromIntel.lastName].filter(Boolean).join(' ');
    if (isPlausiblePersonName(combined)) return combined;
  }

  if (/^[a-zA-Z]{3,24}$/.test(local)) {
    const formatted = formatDisplayName(local);
    if (formatted && !isEmailDerivedName(formatted, email)) return formatted;
    // Single-token local part (anamkhan) — better than an experience sentence.
    if (formatted) return formatted;
  }

  return '';
}

function nameWordCount(name: string): number {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Contact-first: email local-part beats near-contact lines and domain fragments. */
function scoreNameCandidate(candidate: NameCandidate, email: string): number {
  const value = sanitizePersonName(candidate.value);
  if (!value || isEmailOrDomainFragment(value)) return 0;

  let confidence = candidate.confidence;
  const emailDerived = email ? deriveDisplayNameFromEmail(email) : '';

  if (candidate.source === 'email_derived' && emailDerived) {
    confidence = Math.max(confidence, 92);
  } else if (emailDerived && isEmailDerivedName(value, email)) {
    confidence = Math.max(confidence, 92);
  }

  if (candidate.source === 'near_contact' && emailDerived) {
    confidence = Math.min(confidence, 70);
  }
  if (candidate.source === 'first_line' && emailDerived) {
    confidence = Math.min(confidence, 65);
  }

  return confidence;
}

/**
 * Choose the highest-confidence personal name from ranked parser candidates.
 * Affinda/Eden scores apply only when the value passes plausibility checks.
 */
export function pickBestNameFromCandidates(candidates: NameCandidate[], email = ''): string {
  const emailDerived = email ? deriveDisplayNameFromEmail(email) : '';
  const withEmailDerived =
    emailDerived && !candidates.some((c) => c.source === 'email_derived')
      ? [
          ...candidates,
          {
            value: emailDerived,
            confidence: 92,
            source: 'email_derived' as const,
          },
        ]
      : candidates;

  const scored = withEmailDerived
    .map((c) => ({
      ...c,
      value: sanitizePersonName(c.value),
      confidence: scoreNameCandidate(c, email),
    }))
    .filter((c) => c.value && c.confidence > 0);

  if (!scored.length) return '';

  scored.sort((a, b) => b.confidence - a.confidence);
  const topConfidence = scored[0].confidence;
  const tier = scored.filter((c) => c.confidence >= topConfidence - 8);

  let best = '';
  for (const candidate of tier) {
    best = pickRicherFullName(best, candidate.value, email);
  }
  return best;
}

export function pickRicherFullName(primary: string, secondary: string, email = ''): string {
  const a = sanitizePersonName(primary);
  const b = sanitizePersonName(secondary);

  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;

  const aFirm = isFirmOrLocationNamePhrase(a);
  const bFirm = isFirmOrLocationNamePhrase(b);
  if (aFirm && !bFirm) return b;
  if (bFirm && !aFirm) return a;

  const aValid = isValidatedContactName(a);
  const bValid = isValidatedContactName(b);
  if (aValid && !bValid) return a;
  if (bValid && !aValid) return b;

  const aDerived = isEmailDerivedName(a, email);
  const bDerived = isEmailDerivedName(b, email);
  if (aDerived && !bValid) return a;
  if (bDerived && !aValid) return b;
  if (aDerived && bValid && !bDerived) return b;
  if (bDerived && aValid && !aDerived) return a;
  if (aDerived && bFirm) return a;
  if (bDerived && aFirm) return b;

  const aWords = nameWordCount(a);
  const bWords = nameWordCount(b);
  if (aValid && bValid && bWords > aWords) return b;
  if (aValid && bValid && aWords > bWords) return a;
  if (!aValid && !bValid && bWords > aWords) return b;
  if (!aValid && !bValid && aWords > bWords) return a;

  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (bl.startsWith(al) && b.length > a.length) return b;
  if (al.startsWith(bl) && a.length > b.length) return a;

  return a;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const { firstName, lastName } = splitClassifiedFullName(fullName);
  return { firstName, lastName };
}

export function splitFullNameWithRejected(fullName: string): {
  firstName: string;
  lastName: string;
  rejected: ClassifiedText[];
} {
  return splitClassifiedFullName(fullName);
}

const SKILL_NOISE_TOKENS = new Set([
  'skill', 'skills', 'level', 'rating', 'proficiency', 'expert', 'advanced',
  'intermediate', 'beginner', 'novice', 'basic', 'fluent', 'native', 'competent',
]);

/** Personal / metadata / section-heading lines that must not become skills or experience body. */
const RESUME_METADATA_LINE_RE: RegExp[] = [
  /\b(current|expected|present)\s*ctc\b/i,
  /\bctc\s*[:.]?\s*(inr|rs|₹|\$|usd)?/i,
  /\b(salary|package|compensation|remuneration)\b/i,
  /\b(nationality|marital\s+status|date\s+of\s+birth|d\.?o\.?b\.?)\b/i,
  /\b(permanent|present|current)\s+address\b/i,
  /\b(pin\s*code|postal\s+code|zip\s+code)\b/i,
  /^reading\b/i,
  /\blistening\s+(to\s+)?music\b/i,
  /^certif/i,
  /^language(s)?\s*$/i,
  /^skills?\s*$/i,
  /^technical\s+skills?\s*$/i,
  /^core\s+competenc/i,
  /^education\s*$/i,
  /^experience\s*$/i,
  /^employment\s*$/i,
  /^projects?\s*$/i,
  /^achievements?\s*$/i,
];

/** True when a line is a section heading or personal metadata — not job content or a skill. */
export function isResumeSectionHeadingLine(line: string): boolean {
  const t = line.trim().replace(/[:|\-_=•]+$/g, '').trim();
  if (!t || t.length > 72) return false;
  if (isSectionLabel(t)) return true;
  if (RESUME_METADATA_LINE_RE.some((re) => re.test(t))) return true;
  const classified = classifyResumeTextFragment(t);
  if (classified.kind === 'SECTION_HEADER') return true;
  return false;
}

/** Strip parser/AI artefacts from a single resume body line. */
function stripParserArtifactLine(line: string): string {
  const t = line.trim();
  if (!t) return '';
  if (/^```/.test(t) || /^```\s*json/i.test(t)) return '';
  if (/^\{[\s"]/.test(t) || /^\[[\s"]/.test(t)) return '';
  if (/^"?(company|position|description|experience|achievements|skills)"?\s*:/i.test(t)) return '';
  if (/^(here is|below is|the following is|as an ai|as a language model)/i.test(t)) return '';
  return line;
}

/** Remove AI meta-commentary, markdown fences, and JSON prompt bleed from experience bodies. */
export function stripResumeBodyNoise(text: string): string {
  const stripped = stripAiCommentaryFromJobDescription(text);
  const lines = stripped.split('\n');
  const kept: string[] = [];
  for (const raw of lines) {
    const cleaned = stripParserArtifactLine(raw);
    if (!cleaned.trim()) {
      if (kept.length > 0 && kept[kept.length - 1] !== '') kept.push('');
      continue;
    }
    kept.push(cleaned);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Strip section bleed and misplaced lines from experience description / bullets. */
export function pruneExperienceBodyFields(
  description: string,
  achievements: string[]
): { description: string; achievements: string[] } {
  const keptAchievements: string[] = [];
  for (const raw of achievements) {
    const line = stripResumeBodyNoise(String(raw || '').trim());
    if (!line) continue;
    if (isResumeSectionHeadingLine(line)) break;
    if (isLikelyEducationLine(line) || isLikelyCertificationLine(line)) continue;
    if (RESUME_METADATA_LINE_RE.some((re) => re.test(line))) continue;
    keptAchievements.push(line);
  }

  const descLines: string[] = [];
  for (const rawLine of stripResumeBodyNoise(String(description || '')).split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (descLines.length > 0) descLines.push('');
      continue;
    }
    if (isResumeSectionHeadingLine(line)) break;
    if (isLikelyEducationLine(line) || isLikelyCertificationLine(line)) continue;
    if (RESUME_METADATA_LINE_RE.some((re) => re.test(line))) continue;
    descLines.push(line);
  }

  return {
    description: descLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    achievements: keptAchievements,
  };
}

/** Known tech tokens validated by the custom parser — never strip at mapping time. */
const PARSER_VALIDATED_SKILL_RE =
  /^(?:aws|gcp|azure|rest\s+api|api|ci\/cd|html|css|git|sql|nosql|express\.?js|node\.?js|next\.?js|tailwind\s+css|tailwind|firebase|mongodb|postgresql|mysql|react|reactjs|javascript|typescript|python|django|flask|docker|kubernetes|graphql|redis|kafka|terraform|vue\.?js|angular)$/i;

export function sanitizeSkillEntry(skill: unknown): string {
  if (skill == null) return '';

  // Object form — pull name, drop level/rating/score (those produce the "percentage garbage")
  if (typeof skill !== 'string') {
    if (typeof skill === 'object') {
      const rec = skill as Record<string, unknown>;
      const name = rec.name ?? rec.Name ?? rec.skill ?? rec.label ?? rec.title;
      if (name != null) return sanitizeSkillEntry(String(name));
    }
    return '';
  }

  // Strip trailing percentage / rating / score regardless of whitespace
  let s = skill
    .replace(/[\u2022\u00b7\u25aa\u2023]/g, ' ')           // bullets → space
    .replace(/\s+\d{1,3}\s*%/g, '')                          // " 80 %" / " 80%"
    .replace(/[:\-–—]\s*\d{1,3}\s*%?\s*$/i, '')              // ": 80%" / "- 80"
    .replace(/\(\s*(?:[a-z]+\s*)?\d{1,3}\s*%?\s*\)/gi, '')   // "(80%)" / "(advanced 90)"
    .replace(/\s{2,}/g, ' ')
    .trim();

  s = sanitizeFieldText(s, 80);
  if (!s) return '';

  if (PARSER_VALIDATED_SKILL_RE.test(s)) {
    return canonicalizeSkillName(s) || s;
  }

  if (isResumeSectionHeadingLine(s)) return '';
  if (RESUME_METADATA_LINE_RE.some((re) => re.test(s))) return '';
  if (/@/.test(s) || /\b\d{7,}\b/.test(s)) return '';
  if (isLikelyCertificationLine(s)) return '';
  if (isLikelyEducationLine(s) && s.length < 120) return '';

  const classified = classifyResumeTextFragment(s);
  const skillWords = s.split(/\s+/).filter(Boolean).length;
  if (classified.kind === 'SECTION_HEADER') return '';
  if (classified.kind === 'EDUCATION' || classified.kind === 'CERTIFICATION') return '';
  if (classified.kind === 'LOCATION') return '';
  if (classified.kind === 'COMPANY_NAME' && skillWords >= 2) return '';
  if (classified.kind === 'DESIGNATION' && skillWords >= 2) return '';
  if (classified.kind === 'PERSON_NAME' && skillWords >= 2 && isClassifiedPersonName(s, 70)) {
    return '';
  }
  if (isLikelyCompanyNameFragment(s) && s.length > 18) return '';

  // Reject pure-numeric, percentage-only, or noise tokens
  if (/^\d+\.?\d*\s*%?$/.test(s)) return '';
  if (SKILL_NOISE_TOKENS.has(s.toLowerCase())) return '';

  // Reject CSV/sentence blobs (multiple commas or newlines)
  if (s.includes('\n')) return '';
  if ((s.match(/,/g) || []).length > 2) return '';
  if (s.length > 60 && /\s\w+\s\w+\s\w+/.test(s)) return ''; // a sentence

  return s;
}

/** Canonical display names for common skill aliases (dedupe JS / Javascript / Java Script). */
const SKILL_CANONICAL_ALIASES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  'java script': 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  'type script': 'TypeScript',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node js': 'Node.js',
  'node.js': 'Node.js',
  reactjs: 'React',
  'react.js': 'React',
  react: 'React',
  vuejs: 'Vue.js',
  'vue.js': 'Vue.js',
  vue: 'Vue.js',
  angularjs: 'Angular',
  angular: 'Angular',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  docker: 'Docker',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  nosql: 'NoSQL',
  'rest api': 'REST API',
  restapi: 'REST API',
  graphql: 'GraphQL',
  'c#': 'C#',
  'c++': 'C++',
  '.net': '.NET',
  dotnet: '.NET',
  python: 'Python',
  django: 'Django',
  flask: 'Flask',
  java: 'Java',
  spring: 'Spring',
  'spring boot': 'Spring Boot',
  php: 'PHP',
  laravel: 'Laravel',
  ruby: 'Ruby',
  rails: 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  go: 'Go',
  golang: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  excel: 'Excel',
  powerbi: 'Power BI',
  'power bi': 'Power BI',
  tableau: 'Tableau',
  jira: 'Jira',
  confluence: 'Confluence',
  figma: 'Figma',
  photoshop: 'Photoshop',
  communication: 'Communication',
  leadership: 'Leadership',
  teamwork: 'Teamwork',
};

const SOFT_SKILL_PHRASES = new Set([
  'communication',
  'leadership',
  'teamwork',
  'problem solving',
  'critical thinking',
  'time management',
  'adaptability',
  'collaboration',
  'interpersonal skills',
  'presentation skills',
  'negotiation',
  'decision making',
]);

const LANGUAGE_SKILL_RE =
  /^(english|hindi|tamil|telugu|bengali|marathi|gujarati|kannada|malayalam|punjabi|urdu|french|spanish|german|arabic|mandarin|cantonese)(?:\s*\(.*\))?$/i;

export const SKILL_CONFIDENCE_THRESHOLD = 40;
export const MAX_RESUME_SKILLS = 20;

export function canonicalizeSkillName(skill: string): string {
  const cleaned = skill.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const key = cleaned.toLowerCase();
  if (SKILL_CANONICAL_ALIASES[key]) return SKILL_CANONICAL_ALIASES[key];
  if (/^[A-Z0-9+#.]{2,8}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^[a-z0-9+#.]{2,8}$/.test(cleaned)) return cleaned.toUpperCase();
  return cleaned
    .split(/\s+/)
    .map((part) => {
      if (/^[A-Z0-9+#.]{2,}$/.test(part)) return part;
      if (part.length <= 3) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

/** Confidence score 0–100 for skill quality filtering (higher = keep). */
export function scoreSkillConfidence(skill: string): number {
  const cleaned = sanitizeSkillEntry(skill);
  if (!cleaned) return 0;

  const lower = cleaned.toLowerCase().replace(/\s+/g, ' ').trim();
  if (RESUME_METADATA_LINE_RE.some((re) => re.test(lower))) return 0;
  if (/@/.test(lower) || /\b\d{7,}\b/.test(lower)) return 0;
  if (LANGUAGE_SKILL_RE.test(lower)) return 5;
  if (isLikelyCertificationLine(cleaned)) return 5;
  if (isLikelyEducationLine(cleaned)) return 8;

  if (SOFT_SKILL_PHRASES.has(lower)) return 48;
  if (SKILL_CANONICAL_ALIASES[lower]) return 96;

  if (
    /^(react|angular|vue|python|django|flask|docker|kubernetes|terraform|ansible|jenkins|redis|kafka|spark|hadoop|tableau|jira|figma|salesforce|sap|oracle|mysql|mongodb|postgresql|javascript|typescript|java|kotlin|swift|ruby|php|laravel|express|nextjs|next\.js|html|css|git|aws|azure|gcp|linux|nginx|graphql|fastapi|pandas|numpy|scikit-learn|tensorflow|pytorch)$/i.test(
      lower
    )
  ) {
    return 94;
  }
  if (/\.(js|ts|py|rb|go)$/i.test(lower)) return 90;
  if (/^[a-z0-9+#.]{2,10}$/i.test(cleaned)) return 88;

  if (isLikelyCompanyNameFragment(cleaned)) return 5;
  if (isLikelyJobTitleFragment(cleaned) && cleaned.split(/\s+/).length <= 4) return 12;
  const words = lower.split(/\s+/).filter(Boolean);
  const classified = classifyResumeTextFragment(cleaned);
  if (classified.kind === 'LOCATION') return 4;
  if (classified.kind === 'COMPANY_NAME') return 6;
  if (classified.kind === 'DESIGNATION' && words.length >= 2) return 10;

  if (words.length > 5 || cleaned.length > 52) return 18;
  if (words.length >= 3 && /\b(and|with|using|including|responsible|developed|managed)\b/i.test(lower)) {
    return 15;
  }

  if (words.length === 1 && cleaned.length <= 24) return 82;
  if (words.length === 2) return 76;

  return 62;
}

/** Quality score 0–100 for experience bullets at render time (higher = show first). */
export function scoreBulletQuality(bullet: string): number {
  const line = String(bullet || '')
    .replace(/^[\s\u2022\u25aa\u2023*\-–—•·]+/, '')
    .trim();
  if (!line || line.length < 6) return 4;

  const lower = line.toLowerCase();
  let score = 48;

  if (/\d+[%xX]?|\$\d|₹|\bcrore|\bmillion|\bbillion|\bk\+|\b\d+\s*(users|clients|customers|team|engineers|people)\b/i.test(line)) {
    score += 30;
  }
  if (/\b\d{1,3}%/.test(line)) score += 12;

  if (
    /\b(led|managed|delivered|achieved|increased|reduced|improved|optimized|launched|scaled|generated|saved|grew|decreased|accelerated|spearheaded|established|implemented|architected|migrated|automated|streamlined)\b/i.test(
      line
    )
  ) {
    score += 16;
  }

  if (
    /\b(responsible for|duties included|worked on|helped with|involved in|assisted with|participated in|tasked with)\b/i.test(
      lower
    )
  ) {
    score -= 24;
  }
  if (/\b(various|multiple|several|different)\b/i.test(lower) && !/\d/.test(line)) {
    score -= 10;
  }

  if (line.length > 240) score -= 18;
  if (line.length < 22) score -= 6;
  if (/^(experience|education|skills|summary|objective|employment)\b/i.test(lower)) score -= 45;

  return Math.max(0, Math.min(100, score));
}

function expandSkillInputTokens(skills: unknown[]): string[] {
  const tokens: string[] = [];
  for (const raw of skills) {
    if (typeof raw === 'string') {
      const parts = raw.split(/[,;|•\n]+/).map((p) => p.trim()).filter(Boolean);
      tokens.push(...(parts.length > 0 ? parts : [raw.trim()]));
    } else if (raw && typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      const name = rec.name ?? rec.Name ?? rec.skill ?? rec.Skill ?? rec.label;
      if (name != null) tokens.push(String(name));
    }
  }
  return tokens;
}

const MIN_TARGET_RESUME_SKILLS = 10;

function normalizeSkillsListAtThreshold(skills: unknown[], minConfidence: number): string[] {
  const ranked = new Map<string, { name: string; score: number }>();

  for (const token of expandSkillInputTokens(skills)) {
    const cleaned = sanitizeSkillEntry(token);
    if (!cleaned || isSectionLabel(cleaned)) continue;
    const score = scoreSkillConfidence(cleaned);
    if (score < minConfidence) continue;
    const name = canonicalizeSkillName(cleaned);
    if (!name) continue;
    const key = name.toLowerCase();
    const prev = ranked.get(key);
    if (!prev || score > prev.score) {
      ranked.set(key, { name, score });
    }
  }

  return [...ranked.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((entry) => entry.name)
    .slice(0, MAX_RESUME_SKILLS);
}

/** Preserve custom-parser skill output with light dedupe/canonicalization only. */
export function normalizeCustomParserSkillsList(skills: unknown[]): string[] {
  const ranked = new Map<string, { name: string; score: number }>();

  for (const token of expandSkillInputTokens(skills)) {
    const trimmed = String(token || '').trim();
    if (!trimmed || trimmed.length < 2) continue;
    if (isResumeSectionHeadingLine(trimmed)) continue;
    if (/@/.test(trimmed) || trimmed.includes('\n')) continue;

    let cleaned = trimmed
      .replace(/\s+\d{1,3}\s*%/g, '')
      .replace(/[:\-–—]\s*\d{1,3}\s*%?\s*$/i, '')
      .trim();
    if (PARSER_VALIDATED_SKILL_RE.test(cleaned)) {
      cleaned = canonicalizeSkillName(cleaned) || cleaned;
    } else {
      cleaned = sanitizeFieldText(cleaned, 80);
      if (!cleaned || isSectionLabel(cleaned)) continue;
      if (cleaned.length > 60 && /\s\w+\s\w+\s\w+/.test(cleaned)) continue;
      cleaned = canonicalizeSkillName(cleaned) || cleaned;
    }
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    const score = scoreSkillConfidence(cleaned) || (PARSER_VALIDATED_SKILL_RE.test(cleaned) ? 72 : 60);
    const prev = ranked.get(key);
    if (!prev || score > prev.score) {
      ranked.set(key, { name: cleaned, score });
    }
  }

  return [...ranked.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((entry) => entry.name)
    .slice(0, MAX_RESUME_SKILLS);
}

/** Sanitize, score, canonicalize, dedupe, and rank skills for form state. */
export function normalizeSkillsList(
  skills: unknown[],
  minConfidence: number = SKILL_CONFIDENCE_THRESHOLD
): string[] {
  const primary = normalizeSkillsListAtThreshold(skills, minConfidence);
  const output =
    primary.length >= MIN_TARGET_RESUME_SKILLS
      ? primary
      : (() => {
          const relaxed = normalizeSkillsListAtThreshold(skills, Math.max(28, minConfidence - 12));
          return relaxed.length > primary.length ? relaxed : primary;
        })();
  if (isImportFieldTraceEnabled()) {
    traceSkillDecisions(skills, output, scoreSkillConfidence, minConfidence, 'normalize-skills');
  }
  return output;
}

/**
 * Achievement: returns a clean string (form step expects string[]).
 * Accepts strings or objects { title, description, name, achievement }.
 */
export function sanitizeAchievementEntry(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    return sanitizeFieldText(value.replace(/^[\s\u2022\u25aa\u2023*\-]+/, ''), 280);
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const candidate =
      rec.title ?? rec.Title ?? rec.name ?? rec.achievement ?? rec.description ?? rec.text;
    if (candidate != null) {
      return sanitizeAchievementEntry(String(candidate));
    }
  }
  return '';
}

/**
 * Language → { name, language, proficiency } so LanguagesStep (reads `language`)
 * and templates (read `name`) both work.
 */
export function sanitizeLanguageEntry(
  value: unknown
): { name: string; language: string; proficiency: string } | null {
  if (value == null) return null;

  let name = '';
  let proficiency = '';

  const splitLangText = (raw: string): { name: string; proficiency: string } => {
    const s = raw.trim();
    if (!s) return { name: '', proficiency: '' };
    // "English (Fluent)" — parenthetical proficiency
    const paren = s.match(/^([^()]+?)\s*\(([^)]+)\)\s*\.?$/);
    if (paren) {
      return { name: paren[1].trim(), proficiency: paren[2].trim() };
    }
    // "English - Fluent" / "English: Fluent" / "English | Fluent"
    const sep = s.match(/^(.+?)\s*[:\-–—|]\s*(.+?)\s*\.?$/);
    if (sep) {
      return { name: sep[1].trim(), proficiency: sep[2].trim() };
    }
    return { name: s, proficiency: '' };
  };

  if (typeof value === 'string') {
    const parsed = splitLangText(value);
    name = sanitizeFieldText(parsed.name, 60);
    proficiency = sanitizeFieldText(parsed.proficiency, 40);
  } else if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    name = sanitizeFieldText(
      (rec.name ?? rec.language ?? rec.Language ?? rec.title ?? '') as string,
      60
    );
    proficiency = sanitizeFieldText(
      (rec.proficiency ?? rec.level ?? rec.fluency ?? rec.Proficiency ?? '') as string,
      40
    );
    // If the name still contains parenthetical/separator proficiency, split it
    if (name && !proficiency) {
      const parsed = splitLangText(name);
      name = parsed.name;
      proficiency = parsed.proficiency;
    }
  }

  if (!name) return null;
  return {
    name,
    language: name,
    proficiency: proficiency || 'Fluent',
  };
}

const PROJECT_TITLE_SUFFIX_RE =
  /\b(Website|Web\s*Site|Portal|System|Systems|Application|Applications|App|Platform|Dashboard|API|Tool|Suite|Software)\b/i;
const PROJECT_VERB_PREFIX_RE =
  /^(built|developed|implemented|created|designed|managed|led|worked|used|utilized|responsible|spearheaded|maintained|collaborated|optimized|integrated|improved|delivered|automated)\b/i;

/** True when a string looks like a project title, not a description sentence. */
export function isPlausibleProjectName(value: unknown): boolean {
  const s = sanitizeFieldText(value, 120);
  if (!s || s.length < 2) return false;
  if (isGarbageResumeText(s)) return false;
  if (s.length > 90) return false;

  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 12) return false;
  if (PROJECT_VERB_PREFIX_RE.test(s)) return false;
  // Job titles misclassified as projects (e.g. "Full Stack Python Developer").
  if (looksLikeJobTitleLine(s) && !PROJECT_TITLE_SUFFIX_RE.test(s)) return false;
  if (isLikelyJobTitleFragment(s) && !PROJECT_TITLE_SUFFIX_RE.test(s)) return false;

  const stopCount = words.filter((w) => NAME_STOPWORDS.has(w.toLowerCase())).length;
  if (words.length >= 4 && stopCount >= 2) return false;
  if (words.length >= 5 && /\b(the|with|and|for|using|built|developed|implemented|designed|responsible)\b/i.test(s)) {
    return false;
  }

  return true;
}

/** Detect a standalone project title line (not a sentence/bullet). */
export function isEmbeddedProjectTitleLine(line: string): boolean {
  const raw = line.replace(/^[•\-\*\u2022]\s+/, '').trim();
  if (!raw || raw.length < 4 || raw.length > 100) return false;
  if (PROJECT_VERB_PREFIX_RE.test(raw)) return false;

  const titlePart = raw.split(/\s+[-–—:]\s+/)[0]?.trim() || raw;
  if (titlePart.length < 4 || titlePart.length > 100) return false;
  if (PROJECT_TITLE_SUFFIX_RE.test(titlePart)) return true;
  if (/^[A-Z][A-Za-z0-9 &/'".-]{2,}$/.test(titlePart) && titlePart.split(/\s+/).length <= 8) {
    return !/[.!?]/.test(titlePart);
  }
  return false;
}

function mergeTechnologyStrings(existing: string, extra: string): string {
  const parts = `${existing || ''},${extra || ''}`
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out.join(', ');
}

/** Move leading comma-separated technology lists out of description. */
export function peelTechnologiesFromProjectDescription(description: string): {
  description: string;
  technologies: string;
} {
  const trimmed = description.trim();
  if (!trimmed) return { description: '', technologies: '' };

  const lines = trimmed.split('\n');
  const first = lines[0].replace(/^[•\-\*\u2022]\s+/, '').trim();
  const commaParts = first.split(',').map((s) => s.trim()).filter(Boolean);

  if (commaParts.length >= 2 && first.length < 180 && !/\b(the|with|and|for|using|built|developed)\b/i.test(first)) {
    const techLike = commaParts.every(
      (p) => p.length <= 45 && /^[A-Za-z0-9.#+\s/()-]+$/.test(p)
    );
    if (techLike) {
      return {
        description: lines.slice(1).join('\n').trim(),
        technologies: commaParts.join(', '),
      };
    }
  }

  return { description: trimmed, technologies: '' };
}

function splitDescriptionIntoProjects(
  primaryName: string,
  description: string,
  baseTechnologies: string
): Array<{ name: string; description: string; technologies: string }> {
  const peeled = peelTechnologiesFromProjectDescription(description);
  let body = peeled.description;
  let sharedTech = mergeTechnologyStrings(baseTechnologies, peeled.technologies);

  const lines = body.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const titleIndices = lines
    .map((line, index) => (isEmbeddedProjectTitleLine(line) ? index : -1))
    .filter((index) => index >= 0);

  if (titleIndices.length === 0) {
    return [{ name: primaryName, description: body, technologies: sharedTech }];
  }

  const segments: Array<{ name: string; description: string; technologies: string }> = [];
  let currentName = primaryName;
  let currentDesc: string[] = [];

  const flushSegment = () => {
    const desc = currentDesc.join('\n').trim();
    const segPeel = peelTechnologiesFromProjectDescription(desc);
    segments.push({
      name: currentName,
      description: segPeel.description,
      technologies: mergeTechnologyStrings(
        segments.length === 0 ? sharedTech : '',
        segPeel.technologies
      ),
    });
    currentDesc = [];
  };

  for (const line of lines) {
    if (isEmbeddedProjectTitleLine(line)) {
      const dashSplit = line.replace(/^[•\-\*\u2022]\s+/, '').split(/\s+[-–—:]\s+/);
      const nextName = (dashSplit[0] || line).trim();
      if (currentDesc.length > 0 || segments.length > 0) {
        flushSegment();
      } else if (
        segments.length === 0 &&
        currentName &&
        nextName.toLowerCase() !== currentName.toLowerCase()
      ) {
        segments.push({
          name: currentName,
          description: '',
          technologies: sharedTech,
        });
        sharedTech = '';
      }
      currentName = nextName;
      const inlineDesc = dashSplit.slice(1).join(' - ').trim();
      currentDesc = inlineDesc ? [inlineDesc] : [];
      continue;
    }
    currentDesc.push(line);
  }
  flushSegment();

  if (segments.length <= 1) {
    return [{ name: primaryName, description: body, technologies: sharedTech }];
  }

  return segments.filter((seg) => seg.name || seg.description.trim());
}

/**
 * When parsers return one project blob, split embedded title lines into separate projects.
 */
export function splitMergedProjectEntries(
  projects: unknown[]
): Array<Record<string, unknown>> {
  if (!Array.isArray(projects)) return [];

  const expanded: Array<Record<string, unknown>> = [];
  for (const raw of projects) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const name = String(rec.name ?? rec.title ?? rec.projectName ?? '').trim();
    const description = String(rec.description ?? rec.summary ?? rec.Description ?? '').trim();
    const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack ?? rec.Technologies;
    const baseTech = Array.isArray(techRaw)
      ? techRaw.map((t) => String(t ?? '').trim()).filter(Boolean).join(', ')
      : String(techRaw || '').trim();

    const parts = splitDescriptionIntoProjects(name, description, baseTech);
    for (const part of parts) {
      expanded.push({
        ...rec,
        name: part.name,
        title: part.name,
        description: part.description,
        summary: part.description,
        technologies: part.technologies,
        tech_stack: part.technologies,
      });
    }
  }
  return expanded;
}

export function logRawProjects(projects: unknown[], label = 'RAW PROJECTS'): void {
  console.log(label, JSON.stringify(projects, null, 2));
  console.log('projects.length', Array.isArray(projects) ? projects.length : 0);
  if (!Array.isArray(projects)) return;
  projects.forEach((p, index) => {
    const rec = p && typeof p === 'object' ? (p as Record<string, unknown>) : {};
    const desc = String(rec.description ?? rec.summary ?? '');
    console.log(`project[${index}]`, {
      name: rec.name ?? rec.title ?? '',
      descriptionPreview: desc.slice(0, 300),
      technologies: rec.technologies ?? rec.tech_stack ?? '',
    });
  });
  if (projects.length === 1) {
    const rec = projects[0] as Record<string, unknown>;
    const desc = String(rec.description ?? rec.summary ?? '');
    const titleHits = (desc.match(/\b(Project|Website|Portal|System|Application)\b/gi) || []).length;
    if (titleHits >= 2) {
      console.warn(
        'PROJECT SPLIT VALIDATION: single project description contains multiple project-like titles — boundaries likely lost upstream'
      );
    }
  }
}

/** Resolve a display name from any common project field alias; infer when content exists. */
export function resolveProjectName(
  rec: Record<string, unknown>,
  index: number
): string {
  const rawName = sanitizeFieldText(
    String(
      rec.name ??
        rec.title ??
        rec.projectName ??
        rec.project_title ??
        rec.ProjectName ??
        rec.ProjectTitle ??
        rec.Title ??
        ''
    ),
    120
  );
  if (rawName && isPlausibleProjectName(rawName)) return rawName;
  // Keep parser-provided project titles even without description (e.g. "Cafe Website").
  if (
    rawName &&
    rawName.length >= 2 &&
    rawName.length <= 90 &&
    !looksLikeJobTitleLine(rawName) &&
    !isLikelyJobTitleFragment(rawName)
  ) {
    return rawName;
  }

  const description = sanitizeFieldText(
    String(rec.description ?? rec.summary ?? rec.Description ?? ''),
    1500
  );
  const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack ?? rec.tech ?? rec.Technologies;
  const hasTech = Array.isArray(techRaw)
    ? techRaw.length > 0
    : sanitizeFieldText(String(techRaw ?? ''), 300).length > 0;

  if (description || hasTech) {
    return index === 0 ? 'Software Project' : `Project ${index + 1}`;
  }

  return '';
}

/**
 * Project — normalizes technologies to a comma-separated string (matches form input).
 * Emits both `url` and `link` for back-compat with ProjectsStep (writes `link`).
 */
export function sanitizeProjectEntry(
  value: unknown,
  index = 0
): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const name = sanitizeFieldText(value, 120);
    if (!name) return null;
    return { name, title: name, description: '', technologies: '', url: '', link: '' };
  }
  if (typeof value !== 'object') return null;

  const rec = value as Record<string, unknown>;
  const name = resolveProjectName(rec, index);
  if (!name) {
    console.log('REMOVED PROJECT', value, 'reason', 'no name/title and no description or technologies');
    if (isImportFieldTraceEnabled()) {
      traceSanitizeProjectDropped(index, value, 'no name/title and no description or technologies', 'sanitize-project');
    }
    return null;
  }

  let description = sanitizeFieldText(
    (rec.description ?? rec.summary ?? rec.Description ?? '') as string,
    1500
  );

  const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack ?? rec.tech ?? rec.Technologies;
  let technologies = '';
  if (Array.isArray(techRaw)) {
    technologies = techRaw
      .map((t) => sanitizeFieldText(String(t ?? ''), 60))
      .filter(Boolean)
      .join(', ');
  } else if (typeof techRaw === 'string') {
    technologies = sanitizeFieldText(techRaw, 300);
  }

  const peeled = peelTechnologiesFromProjectDescription(description);
  description = sanitizeFieldText(peeled.description, 1500);
  technologies = mergeTechnologyStrings(technologies, peeled.technologies);

  const url = sanitizeFieldText(
    (rec.url ?? rec.link ?? rec.projectUrl ?? rec.Link ?? '') as string,
    300
  );

  return {
    name,
    title: name,
    description,
    Description: description,
    technologies,
    Technologies: technologies,
    url,
    link: url,
    startDate: (rec.startDate ?? rec.start_date ?? '') as string,
    endDate: (rec.endDate ?? rec.end_date ?? '') as string,
  };
}

/**
 * Certification — emits both `url` and `link`.
 * Rejects education/degree lines misclassified as certifications (e.g. MBA blocks).
 */
export function isPlausibleCertificationEntry(name: string, issuer = ''): boolean {
  const n = sanitizeFieldText(name, 200);
  if (!n || n.length < 3) return false;
  const combined = sanitizeFieldText(`${n} ${issuer || ''}`.trim(), 240);
  if (isLikelyEducationLine(n) || isLikelyEducationLine(combined)) return false;
  if (isLikelyCertificationLine(n) || isLikelyCertificationLine(combined)) return true;
  if (
    /\b(?:bachelor|master|mba|m\.?\s*a\.?|b\.?\s*tech|m\.?\s*tech|ph\.?d|doctorate|university|college|institute|school|degree|graduation|matriculation|hsc|ssc)\b/i.test(
      combined
    )
  ) {
    return false;
  }
  return true;
}

export function sanitizeCertificationEntry(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const name = sanitizeFieldText(value, 200);
    if (!name || !isPlausibleCertificationEntry(name)) return null;
    return { name, Name: name, issuer: '', date: '', url: '', link: '' };
  }
  if (typeof value !== 'object') return null;

  const rec = value as Record<string, unknown>;
  const name = sanitizeFieldText(
    (rec.name ?? rec.title ?? rec.certification ?? rec.Name ?? '') as string,
    200
  );
  if (!name) return null;

  const issuer = sanitizeFieldText(
    (rec.issuer ?? rec.organization ?? rec.issuingOrganization ?? rec.Issuer ?? '') as string,
    160
  );
  if (!isPlausibleCertificationEntry(name, issuer)) return null;
  const date = sanitizeFieldText(
    (rec.date ?? rec.issued_date ?? rec.issuedDate ?? rec.year ?? rec.Date ?? '') as string,
    40
  );
  const url = sanitizeFieldText(
    (rec.url ?? rec.link ?? rec.credentialUrl ?? rec.Link ?? '') as string,
    300
  );

  return {
    name,
    Name: name,
    issuer,
    Issuer: issuer,
    date,
    Date: date,
    url,
    link: url,
    expiryDate: sanitizeFieldText((rec.expiryDate ?? rec.expiry_date ?? '') as string, 40),
  };
}

/** Company-description / metric fragments misparsed as employment (e.g. parenthetical turnover blurbs). */
export function isExperienceBlurbFragment(text: string): boolean {
  const s = sanitizeFieldText(text, 120);
  if (!s) return false;
  if (/\b(?:turnover|crores?|lakhs?|millions?|billions?|revenue)\b/i.test(s)) return true;
  if (/^\([^)]*$/.test(s)) return true;
  if (/^[^()]*\)\s*$/.test(s) && !s.includes('(')) return true;
  if (/^\(.*\bwith\s*$/i.test(s)) return true;
  return false;
}

type ExperienceLike = {
  company?: string;
  position?: string;
  title?: string;
  job_title?: string;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description?: string;
  achievements?: string[];
  current?: boolean;
};

/** Company-name heuristics for header reconciliation (mapping layer only). */
const COMPANY_NAME_HINT_RE =
  /\b(?:inc\.?|ltd\.?|llc|corp(?:oration)?|pvt\.?\s*ltd\.?|private\s+limited|gmbh|llp|group|enterprises|solutions|technologies|technology|tech|systems|labs|software|digital|consulting|services|networks|company|co\.?)\b/i;

const WELL_KNOWN_EMPLOYER_RE =
  /^(?:google|microsoft|amazon|apple|meta|facebook|netflix|uber|airbnb|stripe|salesforce|oracle|ibm|accenture|deloitte|pwc|kpmg|ey|ernst|infosys|tcs|tata consultancy services|wipro|hcl|cognizant|capgemini|tech mahindra|larsen|flipkart|swiggy|zomato|startup|adobe|sap|nokia|reliance|hdfc|icici|sbi|mphasis|mindtree|lti)$/i;

/** Read company from any parser/import field alias. */
export function readExperienceCompanySlot(exp: Record<string, unknown>): string {
  for (const key of [
    'company',
    'Company',
    'organization',
    'Organization',
    'employer',
    'Employer',
    'companyName',
    'CompanyName',
  ]) {
    const value = sanitizeFieldText(exp[key], 160);
    if (value) return value;
  }
  return '';
}

/** Read designation/title from any parser/import field alias. */
export function readExperiencePositionSlot(exp: Record<string, unknown>): string {
  for (const key of [
    'position',
    'Position',
    'title',
    'Title',
    'job_title',
    'jobTitle',
    'JobTitle',
    'role',
    'Role',
    'designation',
    'Designation',
  ]) {
    const value = sanitizeFieldText(exp[key], 120);
    if (value) return value;
  }
  return '';
}

const SPECIAL_EMPLOYER_RE =
  /^(?:self[- ]?employed|freelance|freelancer|confidential|independent contractor|contract(?:or)?|government(?: of)?)$/i;

/** Normalize and validate employment dates — returns '' when confidence is low. */
export function sanitizeExperienceDateValue(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const norm = normalizeDate(value);
  if (!norm) return '';
  if (/^present$/i.test(norm)) return 'Present';
  const yearMatch = norm.match(/\b((?:19|20)\d{2})\b/);
  if (yearMatch && !isPlausibleResumeYear(parseInt(yearMatch[1], 10), raw)) return '';
  return norm;
}

const JOB_TITLE_HINT_RE =
  /\b(?:engineer|developer|executive|manager|analyst|consultant|lead|architect|officer|designer|associate|director|specialist|coordinator|processor|technician|supervisor|administrator|intern|trainee|representative|accountant|handler|operator|assistant|head|chief|vp|president|founder)\b/i;

export function looksLikeCompanyNameLine(text: string): boolean {
  const t = sanitizeFieldText(text, 160);
  if (!t) return false;
  if (SPECIAL_EMPLOYER_RE.test(t)) return true;
  if (/^government\b/i.test(t)) return true;
  if (COMPANY_NAME_HINT_RE.test(t)) return true;
  const core = t.replace(/\s+(limited|ltd\.?|inc\.?|pvt\.?\s*ltd\.?)$/i, '').trim();
  if (WELL_KNOWN_EMPLOYER_RE.test(core)) return true;
  const classified = classifyResumeTextFragment(t);
  if (classified.kind === 'COMPANY_NAME') return true;
  if (classified.kind === 'DESIGNATION' || classified.kind === 'LOCATION') return false;
  if (isLikelyCompanyNameFragment(t)) return true;
  // Multi-word lines that read as job titles are not companies (e.g. "Senior Software Engineer").
  if (JOB_TITLE_HINT_RE.test(t)) return false;
  if (looksLikeSentenceNotCompany(t)) return false;
  return t.length >= 22 && /\s/.test(t);
}

export function looksLikeJobTitleLine(text: string): boolean {
  const t = sanitizeFieldText(text, 120);
  if (!t) return false;
  if (looksLikeCompanyNameLine(t)) return false;
  if (JOB_TITLE_HINT_RE.test(t)) return true;
  return false;
}

export function looksLikeStandaloneLocationLine(text: string): boolean {
  const t = sanitizeFieldText(text, 80);
  if (!t || t.length > 60) return false;
  if (looksLikeJobTitleLine(t)) return false;
  if (/\b(19|20)\d{2}\b/.test(t)) return false;
  if (looksLikeCompanyNameLine(t)) return false;
  if (isLikelyLocationFragment(t)) return true;
  return false;
}

const TECH_SKILL_AS_COMPANY_RE =
  /^(python3?|django|flask|fastapi|react(?:\.?js)?|node\.?js|javascript|typescript|java|kotlin|swift|ruby|php|laravel|express|next\.?js|vue\.?js|angular|sql|mysql|postgresql|mongodb|redis|docker|kubernetes|aws|azure|gcp|html5?|css3?|git|go|golang|rust|c\+\+|c#|\.net)$/i;

/** Split "Technoart | Bhopal" or "Acme / San Francisco" into company + location. */
export function splitCompanyLocationPipe(text: string): { company: string; location: string } | null {
  const t = sanitizeFieldText(text, 160);
  if (!t) return null;
  const match = t.match(/^(.+?)\s*[|/]\s+(.+)$/);
  if (!match) return null;
  const left = match[1].trim();
  const right = match[2].trim();
  if (!left || !right || left.length > 120 || right.length > 80) return null;
  const rightIsLocation =
    looksLikeStandaloneLocationLine(right) || isLikelyLocationFragment(right);
  const leftIsCompany = isPlausibleExperienceCompany(left);
  if (!leftIsCompany && rightIsLocation) {
    return { company: '', location: right };
  }
  if (looksLikeJobTitleLine(left) && !looksLikeCompanyNameLine(left)) return null;
  if (rightIsLocation && leftIsCompany) {
    return { company: left, location: right };
  }
  return null;
}

function wouldDuplicateTitleMerge(position: string, companyPart: string, merged: string): boolean {
  const pos = position.toLowerCase().trim();
  const comp = companyPart.toLowerCase().trim();
  const m = merged.toLowerCase().trim();
  if (!comp) return false;
  if (pos.includes(comp)) return true;
  if (comp.includes(pos) && comp.length > pos.length) return true;
  if (m.endsWith(` ${comp}`) && pos.split(/\s+/).length >= 3) return true;
  const words = m.split(/\s+/);
  if (words.length >= 4) {
    for (let len = 1; len <= Math.floor(words.length / 2); len++) {
      const tail = words.slice(-len).join(' ');
      const before = words.slice(0, -len).join(' ');
      if (tail && before.endsWith(tail)) return true;
    }
  }
  return false;
}

function recoverCompanyFromExperienceText(
  description: string,
  position: string
): string {
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 3)) {
    const atMatch = line.match(/\bat\s+(.+?)(?:\s*[,;|(]|$)/i);
    if (atMatch) {
      const candidate = sanitizeFieldText(atMatch[1].replace(/[.,;:!?]+$/, '').trim(), 120);
      if (
        candidate &&
        candidate !== position &&
        looksLikeCompanyNameLine(candidate) &&
        !looksLikeJobTitleLine(candidate)
      ) {
        return candidate;
      }
    }
    if (
      looksLikeCompanyNameLine(line) &&
      !looksLikeJobTitleLine(line) &&
      !looksLikeSentenceNotCompany(line) &&
      line !== position &&
      line.length <= 80
    ) {
      return line;
    }
  }
  return '';
}

/**
 * Fix swapped/misplaced title, company, and location before Builder mapping.
 * Example: title=Food Processor, company=Pranav Food Processors India Pvt Ltd, location=Bhopal
 */
export function reconcileExperienceHeaderFields(
  exp: Record<string, unknown>
): Record<string, unknown> {
  const traceInput = { ...exp };
  const traceIndex = _traceReconcileExpIndex++;
  const slotCompany = readExperienceCompanySlot(exp);
  const slotOrg = sanitizeFieldText(
    exp.organization ||
      exp.Organization ||
      exp.employer ||
      exp.Employer ||
      exp.companyName ||
      exp.CompanyName,
    160
  );

  let company = slotCompany || (slotOrg && slotOrg !== slotCompany ? slotOrg : '');
  let position = readExperiencePositionSlot(exp);
  let location = sanitizeFieldText(exp.location || exp.Location, 120);

  if (company) {
    const pipeSplit = splitCompanyLocationPipe(company);
    if (pipeSplit) {
      company = pipeSplit.company;
      if (!location) location = pipeSplit.location;
    }
  }
  if (!company && slotOrg) {
    const orgSplit = splitCompanyLocationPipe(slotOrg);
    if (orgSplit) {
      company = orgSplit.company;
      if (!location) location = orgSplit.location;
    }
  }

  if (
    slotCompany &&
    slotOrg &&
    slotCompany !== slotOrg &&
    looksLikeJobTitleLine(slotCompany) &&
    !looksLikeCompanyNameLine(slotCompany) &&
    !looksLikeJobTitleLine(slotOrg)
  ) {
    company = slotOrg;
    if (!position) position = slotCompany;
  }

  if (location && looksLikeJobTitleLine(location) && !position) {
    position = location;
    location = '';
  }

  // Company slot holds a job title (e.g. "Food Processor") — never keep as company.
  if (company && looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) {
    if (!position) {
      position = company;
      company = '';
    } else if (looksLikeCompanyNameLine(position)) {
      const hold = company;
      company = position;
      position = hold;
    } else if (looksLikeJobTitleLine(position)) {
      // Apilayer sometimes splits "Full Stack Developer" → position "Full" + company "Stack Developer"
      const posLower = position.toLowerCase().trim();
      const compLower = company.toLowerCase().trim();
      if (posLower.includes(compLower) || (compLower.includes(posLower) && compLower.length > posLower.length)) {
        position = posLower.length >= compLower.length ? position : company;
      } else {
        const posWords = position.split(/\s+/).filter(Boolean);
        if (posWords.length <= 2) {
          const merged = `${position} ${company}`.replace(/\s+/g, ' ').trim();
          if (!wouldDuplicateTitleMerge(position, company, merged)) {
            position = merged;
          }
        }
      }
      company = '';
    }
  }

  // Title slot holds a company name (e.g. "Pranav Food Processors India Pvt Ltd").
  if (position && looksLikeCompanyNameLine(position) && !looksLikeJobTitleLine(position)) {
    if (!company) {
      company = position;
      position = '';
    } else if (looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) {
      const hold = company;
      company = position;
      position = hold;
    }
  }

  if (location && !company && isPlausibleExperienceCompany(location)) {
    company = location;
    location = '';
  } else if (location && looksLikeCompanyNameLine(location) && !company) {
    company = location;
    location = '';
  }

  if (company && looksLikeStandaloneLocationLine(company) && !location) {
    const companyClass = classifyResumeTextFragment(company);
    if (companyClass.kind === 'LOCATION' && companyClass.confidence >= 70) {
      location = company;
      company =
        [slotCompany, slotOrg].find(
          (candidate) =>
            candidate &&
            candidate !== location &&
            (looksLikeCompanyNameLine(candidate) ||
              classifyResumeTextFragment(candidate).kind === 'COMPANY_NAME')
        ) || '';
    }
  }

  if (company && !position && looksLikeJobTitleLine(company) && company.length <= 60) {
    position = company;
    company = '';
  }

  if (position && looksLikeCompanyNameLine(position) && (!company || !looksLikeCompanyNameLine(company))) {
    if (company && !looksLikeCompanyNameLine(company)) {
      const titleHold = company;
      company = position;
      position = titleHold;
    } else if (!company) {
      company = position;
      position = '';
    }
  }

  if (isResumeSectionHeadingLine(company) || isLikelyEducationLine(company)) {
    if (!looksLikeCompanyNameLine(company)) company = '';
  }
  if (isResumeSectionHeadingLine(position) || isLikelyEducationLine(position)) {
    if (!looksLikeJobTitleLine(position)) position = '';
  }

  if (!company) {
    const orgFallback = slotOrg || sanitizeFieldText(exp.employer || exp.Employer, 160);
    if (
      orgFallback &&
      orgFallback !== position &&
      !looksLikeJobTitleLine(orgFallback) &&
      !looksLikeStandaloneLocationLine(orgFallback) &&
      !isLikelyLocationFragment(orgFallback) &&
      !isResumeSectionHeadingLine(orgFallback) &&
      !isLikelyEducationLine(orgFallback)
    ) {
      company = orgFallback;
    }
  }

  const body = collectExperienceBodyFields(exp);
  const pruned = pruneExperienceBodyFields(
    body.description || String(exp.description || exp.Description || ''),
    body.achievements.length > 0
      ? body.achievements
      : Array.isArray(exp.achievements)
        ? (exp.achievements as unknown[]).map((a) => String(a)).filter(Boolean)
        : []
  );
  let deduped = dedupeExperienceBodyLines(pruned.description, pruned.achievements);

  if (!company && position && SPECIAL_EMPLOYER_RE.test(position)) {
    company = position;
  }

  if (!company && position) {
    const headerCandidates = [
      sanitizeFieldText(exp.companyName || exp.CompanyName, 160),
      sanitizeFieldText(exp.employer || exp.Employer, 160),
    ].filter(Boolean);
    for (const candidate of headerCandidates) {
      if (looksLikeCompanyNameLine(candidate) && candidate !== position) {
        company = candidate;
        break;
      }
    }
  }

  if (!company && deduped.description) {
    const recovered = recoverCompanyFromExperienceText(deduped.description, position);
    if (recovered && !looksLikeSentenceNotCompany(recovered) && isPlausibleExperienceCompany(recovered)) {
      company = recovered;
      const descLines = deduped.description.split('\n').map((l) => l.trim()).filter(Boolean);
      const remaining = descLines.filter((l) => l !== recovered).join('\n').trim();
      if (remaining !== deduped.description) {
        deduped = dedupeExperienceBodyLines(remaining, deduped.achievements);
      }
    }
  }

  if (!company && deduped.description) {
    const descLines = deduped.description.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of descLines.slice(0, 2)) {
      if (looksLikeSentenceNotCompany(line)) continue;
      if (looksLikeCompanyNameLine(line) && !looksLikeJobTitleLine(line) && line !== position) {
        company = line;
        if (descLines.length > 1) {
          const remaining = descLines.filter((l) => l !== line).join('\n').trim();
          deduped = dedupeExperienceBodyLines(remaining, deduped.achievements);
        }
        break;
      }
      const classified = classifyResumeTextFragment(line);
      if (
        classified.kind === 'COMPANY_NAME' &&
        !looksLikeJobTitleLine(line) &&
        line !== position &&
        line.length <= 120
      ) {
        company = line;
        if (descLines.length > 1) {
          const remaining = descLines.filter((l) => l !== line).join('\n').trim();
          deduped = dedupeExperienceBodyLines(remaining, deduped.achievements);
        }
        break;
      }
    }
  }

  if (!company) {
    const nerCandidates = [
      slotCompany,
      slotOrg,
      sanitizeFieldText(exp.employer || exp.Employer, 160),
      sanitizeFieldText(exp.companyName || exp.CompanyName, 160),
    ].filter((c) => c && c !== position && !isResumeSectionHeadingLine(c));
    for (const candidate of nerCandidates) {
      const classified = classifyResumeTextFragment(candidate);
      if (
        (classified.kind === 'COMPANY_NAME' && classified.confidence >= 70) ||
        (looksLikeCompanyNameLine(candidate) && !looksLikeJobTitleLine(candidate))
      ) {
        company = candidate;
        break;
      }
    }
  }

  if (!company && position) {
    const positionClass = classifyResumeTextFragment(position);
    if (positionClass.kind === 'COMPANY_NAME' && positionClass.confidence >= 75) {
      company = position;
      position = '';
    }
  }

  const startDate = sanitizeExperienceDateValue(exp.startDate || exp.start_date);
  const endDateRaw = sanitizeExperienceDateValue(exp.endDate || exp.end_date);
  const endDate = /^present$/i.test(endDateRaw) ? '' : endDateRaw;
  const isCurrent =
    exp.current === true ||
    /^present$/i.test(endDateRaw) ||
    /^(present|current|now|ongoing|running|till date)$/i.test(
      String(exp.endDate || exp.end_date || '').trim()
    );

  if (
    company &&
    (looksLikeSentenceNotCompany(company) ||
      (!isPlausibleExperienceCompany(company) && !looksLikeCompanyNameLine(company)))
  ) {
    if (
      (looksLikeStandaloneLocationLine(company) || isLikelyLocationFragment(company)) &&
      !location
    ) {
      location = company;
    }
    company = '';
  }

  if (!company && position) {
    const recovered = recoverCompanyFromExperienceText(deduped.description, position);
    if (recovered && isPlausibleExperienceCompany(recovered)) {
      company = recovered;
    }
  }

  const result = {
    ...exp,
    company,
    Company: company,
    organization: company,
    position,
    title: position,
    job_title: position,
    location,
    Location: location,
    startDate,
    start_date: startDate,
    endDate: isCurrent ? '' : endDate,
    end_date: isCurrent ? '' : endDate,
    current: isCurrent,
    description: deduped.description,
    Description: deduped.description,
    achievements: deduped.achievements,
  };
  if (isImportFieldTraceEnabled()) {
    traceExperienceReconcile(traceIndex, traceInput, result, 'reconcile');
  }
  return result;
}

function isExperienceDateOnlyStub(exp: ExperienceLike): boolean {
  const company = sanitizeFieldText(exp.company, 120);
  const position = sanitizeFieldText(exp.position, 120);
  const desc = sanitizeFieldText(exp.description, 2000);
  const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];
  const startDate = sanitizeFieldText(exp.startDate || exp.start_date, 40);
  const endDate = sanitizeFieldText(exp.endDate || exp.end_date, 40);
  return (
    !company &&
    !position &&
    !desc &&
    achievements.length === 0 &&
    !!(startDate || endDate || exp.current)
  );
}

function mergeDateStubIntoEntry<T extends ExperienceLike>(target: T, stub: ExperienceLike): T {
  const out = { ...target };
  const stubStart = sanitizeFieldText(stub.startDate || stub.start_date, 40);
  const stubEnd = sanitizeFieldText(stub.endDate || stub.end_date, 40);
  if (stubStart && !sanitizeFieldText(out.startDate || out.start_date, 40)) {
    out.startDate = stubStart;
    out.start_date = stubStart;
  }
  if (stubEnd && !sanitizeFieldText(out.endDate || out.end_date, 40)) {
    out.endDate = stubEnd;
    out.end_date = stubEnd;
  }
  if (stub.current === true) out.current = true;
  const stubLoc = sanitizeFieldText(stub.location, 120);
  if (stubLoc && !sanitizeFieldText(out.location, 120)) out.location = stubLoc;
  return out;
}

function experienceRichnessScore(exp: ExperienceLike): number {
  let score = 0;
  const company = sanitizeFieldText(exp.company, 120);
  const position = sanitizeFieldText(exp.position || exp.title, 120);
  const desc = sanitizeMultilineFieldText(exp.description, 2000);
  const achievements = Array.isArray(exp.achievements) ? exp.achievements.length : 0;
  if (company && isPlausibleExperienceCompany(company)) score += 5;
  if (position) score += 2;
  if (desc.length > 20) score += 4;
  if (achievements > 0) score += 3;
  if (exp.startDate || exp.endDate || exp.start_date || exp.end_date) score += 3;
  if (exp.location) score += 1;
  return score;
}

function normalizeExperienceTitleKey(value: unknown): string {
  return sanitizeFieldText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function experienceTitlesOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = a.split(/\s+/).filter((w) => w.length >= 3);
  const bWords = b.split(/\s+/).filter((w) => w.length >= 3);
  if (!aWords.length || !bWords.length) return false;
  const shared = aWords.filter((w) => bWords.includes(w));
  return shared.length >= Math.min(2, Math.min(aWords.length, bWords.length));
}

function experiencesAreStrictDuplicates(a: ExperienceLike, b: ExperienceLike): boolean {
  const headerA = experienceEntryFingerprint(a);
  const headerB = experienceEntryFingerprint(b);
  if (!headerA.replace(/\|/g, '') || headerA !== headerB) return false;
  return experienceBodyFingerprint(a) === experienceBodyFingerprint(b);
}

/** Collapse only true duplicates — same company, title, dates, and description. */
function collapseShadowExperienceEntries<T extends ExperienceLike>(entries: T[]): T[] {
  if (entries.length < 2) return entries;
  const out: T[] = [];
  for (const entry of entries) {
    const reconciled = reconcileExperienceHeaderFields(entry as Record<string, unknown>) as T;
    const dupIdx = out.findIndex((prev) => experiencesAreStrictDuplicates(prev, reconciled));
    if (dupIdx >= 0) {
      out[dupIdx] = mergeDuplicateExperienceEntries(out[dupIdx], reconciled);
    } else {
      out.push(reconciled);
    }
  }
  return out.length > 0 ? out : entries;
}

function hasExperienceBodyContent(exp: ExperienceLike): boolean {
  const desc = sanitizeMultilineFieldText(exp.description, 2000);
  const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];
  return !!(desc || achievements.length > 0);
}

/** Pair company-only + title-only parser fragments into one experience row. */
function pairHeaderFragmentOrphans<T extends ExperienceLike>(entries: T[]): T[] {
  if (entries.length < 2) return entries;
  const out: T[] = [];
  let i = 0;
  while (i < entries.length) {
    const cur = entries[i];
    const next = entries[i + 1];
    const company = sanitizeFieldText(cur.company, 120);
    const position = sanitizeFieldText(cur.position || cur.title, 120);
    if (next) {
      const nextCompany = sanitizeFieldText(next.company, 120);
      const nextPosition = sanitizeFieldText(next.position || next.title, 120);
      if (
        !hasExperienceBodyContent(cur) &&
        company &&
        !position &&
        nextPosition &&
        !nextCompany
      ) {
        out.push(
          reconcileExperienceHeaderFields({
            ...(next as Record<string, unknown>),
            ...(cur as Record<string, unknown>),
            company,
            position: nextPosition,
            title: nextPosition,
          }) as T
        );
        i += 2;
        continue;
      }
      if (
        !hasExperienceBodyContent(cur) &&
        position &&
        !company &&
        nextCompany &&
        !nextPosition
      ) {
        out.push(
          reconcileExperienceHeaderFields({
            ...(next as Record<string, unknown>),
            ...(cur as Record<string, unknown>),
            company: nextCompany,
            position,
            title: position,
          }) as T
        );
        i += 2;
        continue;
      }
    }
    out.push(cur);
    i += 1;
  }
  return out;
}

/**
 * When one parser row embeds multiple jobs in description, split before orphan merge.
 * Preserves block integrity: header lines + dates stay with their bullets.
 */
export function splitExperienceEntriesWithEmbeddedJobs(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const splits = splitSingleExperienceOnEmbeddedJobs(entry);
    result.push(...splits);
  }
  return result;
}

function splitSingleExperienceOnEmbeddedJobs(
  entry: Record<string, unknown>
): Record<string, unknown>[] {
  const headerCompany = sanitizeFieldText(entry.company || entry.Company, 120);
  const headerTitle = sanitizeFieldText(entry.position || entry.title, 120);
  const body = collectExperienceBodyFields(entry);
  const lines = body.description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 3) return [entry];

  const splitAt: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!EXPERIENCE_DATE_RANGE_RE.test(line)) continue;
    const prev = lines[i - 1] || '';
    const prev2 = lines[i - 2] || '';
    const headerLike =
      looksLikeJobTitleLine(prev) ||
      looksLikeCompanyNameLine(prev) ||
      looksLikeJobTitleLine(prev2) ||
      looksLikeCompanyNameLine(prev2);
    if (headerLike) splitAt.push(i - (looksLikeJobTitleLine(prev2) || looksLikeCompanyNameLine(prev2) ? 2 : 1));
  }

  const uniqueSplits = [...new Set(splitAt.filter((n) => n > 0))].sort((a, b) => a - b);
  if (uniqueSplits.length === 0) return [entry];

  const segments: string[][] = [];
  let start = 0;
  for (const idx of uniqueSplits) {
    if (idx > start) segments.push(lines.slice(start, idx));
    start = idx;
  }
  if (start < lines.length) segments.push(lines.slice(start));

  if (segments.length <= 1) return [entry];

  const out: Record<string, unknown>[] = [];
  segments.forEach((segLines, segIndex) => {
    if (segLines.length === 0) return;
    let segCompany = '';
    let segTitle = '';
    let segLocation = '';
    let segStart = '';
    let segEnd = '';
    let segCurrent = false;
    const bodyLines: string[] = [];

    for (const line of segLines) {
      if (!segTitle && looksLikeJobTitleLine(line) && !EXPERIENCE_DATE_RANGE_RE.test(line)) {
        segTitle = line;
        continue;
      }
      if (!segCompany && looksLikeCompanyNameLine(line) && line !== segTitle) {
        segCompany = line;
        continue;
      }
      if (!segLocation && looksLikeStandaloneLocationLine(line)) {
        segLocation = line;
        continue;
      }
      if (EXPERIENCE_DATE_RANGE_RE.test(line)) {
        const dates = line.match(EXPERIENCE_DATE_RANGE_RE);
        if (dates) {
          segStart = sanitizeExperienceDateValue(dates[1]) || segStart;
          const endPart = dates[2] || '';
          if (/present|current|now|ongoing/i.test(endPart)) segCurrent = true;
          else segEnd = sanitizeExperienceDateValue(endPart) || segEnd;
        }
        continue;
      }
      bodyLines.push(line);
    }

    const peeled = peelExperienceBodyLines(bodyLines.join('\n'), body.achievements);
    out.push(
      reconcileExperienceHeaderFields({
        ...entry,
        company: segCompany || (segIndex === 0 ? headerCompany : ''),
        position: segTitle || (segIndex === 0 ? headerTitle : ''),
        title: segTitle || (segIndex === 0 ? headerTitle : ''),
        location: segLocation || (segIndex === 0 ? entry.location : ''),
        startDate: segStart || (segIndex === 0 ? entry.startDate : ''),
        endDate: segEnd || (segIndex === 0 ? entry.endDate : ''),
        current: segCurrent || (segIndex === 0 ? entry.current : false),
        description: peeled.description,
        achievements: peeled.achievements,
      })
    );
  });

  return out.length > 0 ? out : [entry];
}

function peelExperienceBodyLines(
  description: string,
  achievements: string[]
): { description: string; achievements: string[] } {
  return dedupeExperienceBodyLines(description, achievements);
}

/** Merge date/location-only stubs into the preceding experience entry. */
export function mergeOrphanExperienceEntries<T extends ExperienceLike>(entries: T[]): T[] {
  if (entries.length === 0) return entries;
  if (entries.length === 1) {
    return [reconcileExperienceHeaderFields(entries[0] as Record<string, unknown>) as T];
  }
  const out: T[] = [];
  for (const exp of entries) {
    const company = sanitizeFieldText(exp.company, 120);
    const position = sanitizeFieldText(exp.position, 120);
    const startDate = sanitizeFieldText(exp.startDate || exp.start_date, 40);
    const endDate = sanitizeFieldText(exp.endDate || exp.end_date, 40);
    const desc = sanitizeMultilineFieldText(exp.description, 8000);
    const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];
    const location = sanitizeFieldText(exp.location, 120);
    const hasDates = !!(startDate || endDate);
    const endOnly = sanitizeFieldText(exp.endDate || exp.end_date, 40);
    const isPresentOnly =
      !company &&
      !position &&
      !desc &&
      achievements.length === 0 &&
      /^(present|current|now|ongoing)$/i.test(endOnly);
    const isDateOrLocationOnly =
      !company &&
      !position &&
      !desc &&
      achievements.length === 0 &&
      (hasDates || !!location);
    const isDescriptionOnlyOrphan =
      !company &&
      !position &&
      !hasDates &&
      !location &&
      (!!desc || achievements.length > 0);

    if ((isDateOrLocationOnly || isPresentOnly) && out.length > 0) {
      const prev = { ...out[out.length - 1] };
      if (startDate && !sanitizeFieldText(prev.startDate || prev.start_date, 40)) {
        prev.startDate = startDate;
        prev.start_date = startDate;
      }
      if (endDate && !sanitizeFieldText(prev.endDate || prev.end_date, 40)) {
        prev.endDate = endDate;
        prev.end_date = endDate;
      }
      if (location && !sanitizeFieldText(prev.location, 120)) prev.location = location;
      if (exp.current === true) prev.current = true;
      out[out.length - 1] = prev;
      continue;
    }
    if (isDescriptionOnlyOrphan && out.length > 0) {
      const combinedText = [desc, ...achievements].join('\n');
      const mustKeepSeparate =
        looksLikeSeparateEmploymentBlock(exp) ||
        EXPERIENCE_DATE_RANGE_RE.test(combinedText) ||
        achievements.length >= 2 ||
        combinedText.split('\n').filter((l) => l.trim()).length >= 4;
      if (mustKeepSeparate) {
        out.push({ ...exp });
        continue;
      }
      const prev = { ...out[out.length - 1] };
      const prevDesc = sanitizeMultilineFieldText(prev.description, 8000);
      const mergedDesc = [prevDesc, desc, ...achievements].filter(Boolean).join('\n').trim();
      if (mergedDesc) prev.description = mergedDesc;
      const prevAch = Array.isArray(prev.achievements) ? [...prev.achievements] : [];
      prev.achievements = [...prevAch, ...achievements];
      if (desc && !achievements.length) {
        prev.achievements = [...prevAch, ...desc.split('\n').map((l) => l.trim()).filter(Boolean)];
      }
      out[out.length - 1] = prev;
      continue;
    }
    out.push({ ...exp });
  }

  // Forward-merge: date-only stub before the next real entry (common OCR layout).
  const forward: T[] = [];
  let pendingDate: T | null = null;
  for (const exp of out) {
    if (isExperienceDateOnlyStub(exp)) {
      pendingDate = exp;
      continue;
    }
    if (pendingDate) {
      forward.push(reconcileExperienceHeaderFields(mergeDateStubIntoEntry(exp, pendingDate)) as T);
      pendingDate = null;
      continue;
    }
    forward.push(exp);
  }
  if (pendingDate && forward.length > 0) {
    forward[0] = reconcileExperienceHeaderFields(
      mergeDateStubIntoEntry(forward[0], pendingDate)
    ) as T;
  } else if (pendingDate) {
    forward.push(pendingDate);
  }

  return forward.map((e) => reconcileExperienceHeaderFields(e as Record<string, unknown>) as T);
}

type EducationLike = {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string;
  endDate?: string;
  startDate?: string;
  gpa?: string;
  description?: string;
};

/** Merge degree-only / institution-only stubs into adjacent education entry. */
export function mergeOrphanEducationEntries<T extends EducationLike>(entries: T[]): T[] {
  if (entries.length < 2) return entries;
  const out: T[] = [];
  for (const edu of entries) {
    const institution = sanitizeFieldText(edu.institution, 160);
    const degree = sanitizeFieldText(edu.degree, 160);
    const year = sanitizeFieldText(edu.endDate || edu.year, 40);
    const isPartial = (!institution && !!degree) || (!!institution && !degree);
    const isYearOnly =
      !institution && !degree && !!year && /^(19|20)\d{2}$/.test(year);
    const isFieldOnly =
      !institution && !degree && !year && !!sanitizeFieldText(edu.field, 120);

    if ((isPartial || isYearOnly || isFieldOnly) && out.length > 0) {
      const prev = { ...out[out.length - 1] };
      const prevInst = sanitizeFieldText(prev.institution, 160);
      const prevDeg = sanitizeFieldText(prev.degree, 160);
      if (!prevInst && institution) prev.institution = institution;
      if (!prevDeg && degree) prev.degree = degree;
      if (!sanitizeFieldText(prev.field, 120) && edu.field) prev.field = edu.field;
      if (year && !sanitizeFieldText(prev.endDate || prev.year, 40)) {
        prev.endDate = year;
        prev.year = year;
      }
      if (sanitizeFieldText(prev.institution, 160) || sanitizeFieldText(prev.degree, 160)) {
        out[out.length - 1] = prev;
        continue;
      }
    }
    out.push({ ...edu });
  }
  return out;
}

/** Collect description + bullet text from common parser field aliases. */
export function collectExperienceBodyFields(exp: Record<string, unknown>): {
  description: string;
  achievements: string[];
} {
  const achievements: string[] = [];
  for (const key of ['achievements', 'bullets', 'highlights', 'responsibilities', 'duties']) {
    const val = exp[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string' && item.trim()) achievements.push(item.trim());
        else if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const s = String(rec.title ?? rec.description ?? rec.text ?? '').trim();
          if (s) achievements.push(s);
        }
      }
    } else if (typeof val === 'string' && val.trim()) {
      achievements.push(val.trim());
    }
  }
  const description = String(
    exp.description ??
      exp.Description ??
      exp.summary ??
      exp.Summary ??
      exp.responsibilities ??
      exp.duties ??
      ''
  ).trim();
  return { description, achievements };
}

/** Union experience body text — never drop bullets or description lines from either source. */
export function unionExperienceBodyFields(
  primary: { description: string; achievements: string[] },
  secondary: { description: string; achievements: string[] }
): { description: string; achievements: string[] } {
  const achievements = [...primary.achievements];
  const seen = new Set(achievements.map((a) => a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 48)));
  for (const item of secondary.achievements) {
    const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 48);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    achievements.push(item);
  }

  let description = sanitizeMultilineFieldText(primary.description, 8000);
  const secondaryDesc = sanitizeMultilineFieldText(secondary.description, 8000);
  const secondaryIsDateOnly =
    secondaryDesc.length > 0 &&
    secondaryDesc.length <= 40 &&
    EXPERIENCE_DATE_RANGE_RE.test(secondaryDesc);
  if (!description) description = secondaryDesc;
  else if (
    secondaryDesc.length > description.length &&
    !secondaryIsDateOnly
  ) {
    description = secondaryDesc;
  } else if (secondaryDesc && !description.includes(secondaryDesc.slice(0, Math.min(48, secondaryDesc.length)))) {
    description = sanitizeMultilineFieldText(`${description}\n${secondaryDesc}`, 8000);
  }

  if (!description && achievements.length > 0) {
    description = achievements.join('\n');
  }

  return { description, achievements };
}

const EXPERIENCE_DATE_RANGE_RE =
  /((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2})\s*[-–—to]+\s*((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2}|present|current|now|ongoing)/i;

function experienceFingerprintPart(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function experienceBodyLineKey(line: string): string {
  return line.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 96);
}

/** Remove repeated bullets/sentences inside one experience without rewriting content. */
export function dedupeExperienceBodyLines(
  description: string,
  achievements: string[]
): { description: string; achievements: string[] } {
  const seen = new Set<string>();
  const keptAchievements: string[] = [];
  for (const raw of achievements) {
    const line = String(raw || '').trim();
    if (!line) continue;
    const key = experienceBodyLineKey(line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keptAchievements.push(line);
  }

  const descLines: string[] = [];
  for (const rawLine of String(description || '').split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (descLines.length > 0 && descLines[descLines.length - 1] !== '') descLines.push('');
      continue;
    }
    const key = experienceBodyLineKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    descLines.push(line);
  }

  let finalDescription = descLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!finalDescription && keptAchievements.length > 0) {
    finalDescription = keptAchievements.join('\n');
  }

  return { description: finalDescription, achievements: keptAchievements };
}

function experienceEntryFingerprint(exp: ExperienceLike): string {
  const company = experienceFingerprintPart(
    sanitizeFieldText(exp.company || exp.Company || exp.organization, 120)
  );
  const position = experienceFingerprintPart(
    sanitizeFieldText(exp.position || exp.Position || exp.title || exp.job_title, 120)
  );
  const start = experienceFingerprintPart(sanitizeFieldText(exp.startDate || exp.start_date, 40));
  const end = experienceFingerprintPart(sanitizeFieldText(exp.endDate || exp.end_date, 40));
  return `${company}|${position}|${start}|${end}`;
}

function experienceBodyFingerprint(exp: ExperienceLike): string {
  const body = collectExperienceBodyFields(exp as Record<string, unknown>);
  return [body.description, ...body.achievements]
    .join('\n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 160);
}

function employmentBlockSignalsInText(text: string): number {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  let signals = 0;
  for (const line of lines) {
    if (EXPERIENCE_DATE_RANGE_RE.test(line)) signals += 2;
    if (looksLikeCompanyNameLine(line)) signals += 1;
    if (looksLikeJobTitleLine(line)) signals += 1;
  }
  return signals;
}

/** True when a headerless block likely belongs to a separate job, not the previous entry. */
function looksLikeSeparateEmploymentBlock(exp: ExperienceLike): boolean {
  const desc = sanitizeMultilineFieldText(exp.description, 1200);
  const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];
  const combined = [desc, ...achievements.map((a) => String(a))].filter(Boolean).join('\n');
  if (!combined) return false;
  if (employmentBlockSignalsInText(combined) >= 2) return true;
  const firstLine = combined.split('\n').map((l) => l.trim()).find(Boolean) || '';
  if (firstLine && looksLikeCompanyNameLine(firstLine) && combined.split('\n').filter((l) => l.trim()).length >= 2) {
    return true;
  }
  if (
    firstLine &&
    (looksLikeJobTitleLine(firstLine) || /^(self[- ]?employed|freelance|confidential|independent contractor)$/i.test(firstLine)) &&
    combined.split('\n').some((l) => EXPERIENCE_DATE_RANGE_RE.test(l))
  ) {
    return true;
  }
  return false;
}

function experiencesAreExactDuplicates(a: ExperienceLike, b: ExperienceLike): boolean {
  const fpA = experienceEntryFingerprint(a);
  const fpB = experienceEntryFingerprint(b);
  const hasHeader = fpA.replace(/\|/g, '').length > 0 && fpB.replace(/\|/g, '').length > 0;
  if (hasHeader && fpA === fpB) return true;

  const companyA = experienceFingerprintPart(a.company);
  const companyB = experienceFingerprintPart(b.company);
  const positionA = experienceFingerprintPart(a.position || a.title);
  const positionB = experienceFingerprintPart(b.position || b.title);
  if (!companyA || companyA !== companyB) return false;
  if (positionA !== positionB) return false;

  const bodyA = experienceBodyFingerprint(a);
  const bodyB = experienceBodyFingerprint(b);
  return bodyA.length >= 12 && bodyA === bodyB;
}

function mergeDuplicateExperienceEntries<T extends ExperienceLike>(target: T, duplicate: T): T {
  const targetBody = collectExperienceBodyFields(target as Record<string, unknown>);
  const dupBody = collectExperienceBodyFields(duplicate as Record<string, unknown>);
  const united = unionExperienceBodyFields(targetBody, dupBody);
  const deduped = dedupeExperienceBodyLines(united.description, united.achievements);
  return reconcileExperienceHeaderFields({
    ...(target as Record<string, unknown>),
    description: deduped.description,
    achievements: deduped.achievements,
  }) as T;
}

/** Collapse adjacent identical experience rows; dedupe bullets inside each row. */
export function dedupeAdjacentExperienceEntries<T extends ExperienceLike>(entries: T[]): T[] {
  if (entries.length === 0) return entries;
  const out: T[] = [];

  for (const raw of entries) {
    const exp = reconcileExperienceHeaderFields(raw as Record<string, unknown>) as T;
    const body = collectExperienceBodyFields(exp as Record<string, unknown>);
    const dedupedBody = dedupeExperienceBodyLines(body.description, body.achievements);
    const cleaned = {
      ...exp,
      description: dedupedBody.description,
      achievements: dedupedBody.achievements,
    } as T;

    const prev = out[out.length - 1];
    if (prev && experiencesAreExactDuplicates(prev, cleaned)) {
      out[out.length - 1] = mergeDuplicateExperienceEntries(prev, cleaned);
      continue;
    }
    out.push(cleaned);
  }

  return out;
}

/** Custom-parser import — preserve structured rows; reconcile headers only. */
export function finalizeExperienceListForCustomParserImport(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const deduped = dedupeAdjacentExperienceEntries(entries as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  return deduped.map((e) => reconcileExperienceHeaderFields(e));
}

/** Final binding pass before Builder state — orphan merge + semantic header reconciliation. */
export function finalizeExperienceListForBuilder(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const collapsed = collapseShadowExperienceEntries(entries as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  const split = splitExperienceEntriesWithEmbeddedJobs(
    collapsed.filter((e) => e && typeof e === 'object') as Record<string, unknown>[]
  );
  const paired = pairHeaderFragmentOrphans(split as ExperienceLike[]) as Record<string, unknown>[];
  const merged = mergeOrphanExperienceEntries(paired as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  const deduped = dedupeAdjacentExperienceEntries(merged as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  return deduped.map((e) => reconcileExperienceHeaderFields(e));
}

/** Final education binding — keep degree / institution / year on one object. */
export function finalizeEducationListForBuilder(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const merged = mergeOrphanEducationEntries(entries as EducationLike[]) as Record<
    string,
    unknown
  >[];
  return mergeOrphanEducationEntries(merged as EducationLike[]) as Record<string, unknown>[];
}

/** Custom-parser import — preserve each education row; drop exact duplicates only. */
export function finalizeEducationListForCustomParserImport(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const out: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const edu of entries) {
    if (!edu || typeof edu !== 'object') continue;
    const sanitized = sanitizeEducationEntry(edu);
    if (!sanitized) continue;
    const key = [
      sanitizeFieldText(sanitized.institution, 160),
      sanitizeFieldText(sanitized.degree, 160),
      sanitizeFieldText(sanitized.field, 120),
      sanitizeFieldText(sanitized.endDate || sanitized.year, 40),
    ]
      .join('|')
      .toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sanitized);
  }

  return out;
}

/** Reject random text blocks that lack employment structure. */
export function isValidExperienceEntry(exp: {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}): boolean {
  const company = sanitizeFieldText(exp.company, 120);
  const position = sanitizeFieldText(exp.position, 120);
  const startDate = sanitizeFieldText(exp.startDate, 40);
  const endDate = sanitizeFieldText(exp.endDate, 40);
  const hasDates = !!(startDate || endDate);

  if (isExperienceBlurbFragment(company) || isExperienceBlurbFragment(position)) return false;

  if (company && position) return true;
  if (hasDates && (company || position)) return true;

  if (!company && !position) return false;

  if (position && isLikelyJobTitleFragment(position) && !company) return hasDates;
  if (company && !position) {
    if (
      looksLikeCompanyNameLine(company) ||
      isLikelyCompanyNameFragment(company) ||
      classifyResumeTextFragment(company).kind === 'COMPANY_NAME'
    ) {
      return true;
    }
    return hasDates;
  }
  if (company && isLikelyCompanyNameFragment(company) && !position) return hasDates;

  return false;
}

/** True when company field is a real employer, not a title or location mis-assignment. */
export function isPlausibleExperienceCompany(value: unknown): boolean {
  const company = sanitizeFieldText(value, 160);
  if (!company) return false;
  if (isResumeSectionHeadingLine(company) || isLikelyEducationLine(company)) return false;
  if (looksLikeCompanyNameLine(company)) return true;
  if (looksLikeStandaloneLocationLine(company) || isLikelyLocationFragment(company)) return false;
  const lower = company.toLowerCase().replace(/\s+/g, ' ').trim();
  if (TECH_SKILL_AS_COMPANY_RE.test(lower)) return false;
  if (looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) return false;
  const classified = classifyResumeTextFragment(company);
  if (classified.kind === 'DESIGNATION' && classified.confidence >= 70) return false;
  if (classified.kind === 'LOCATION' && classified.confidence >= 70) return false;
  if (classified.kind === 'COMPANY_NAME' && classified.confidence >= 70) {
    if (TECH_SKILL_AS_COMPANY_RE.test(lower) || looksLikeJobTitleLine(company)) return false;
    return true;
  }
  if (looksLikeCompanyNameLine(company)) return true;
  return company.length >= 18 && /\s/.test(company);
}

export function countPlausibleExperienceCompanies(list: unknown[]): number {
  if (!Array.isArray(list)) return 0;
  return list.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const exp = entry as Record<string, unknown>;
    const company =
      exp.company ||
      exp.Company ||
      exp.organization ||
      exp.Organization ||
      exp.employer ||
      exp.Employer;
    return isPlausibleExperienceCompany(company);
  }).length;
}

export function countPlausibleProjects(list: unknown[]): number {
  if (!Array.isArray(list)) return 0;
  return list.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const rec = entry as Record<string, unknown>;
    const name = sanitizeFieldText(
      String(rec.name ?? rec.title ?? rec.projectName ?? rec.ProjectName ?? ''),
      120
    );
    return !!name && isPlausibleProjectName(name);
  }).length;
}

export function sanitizeExperienceEntry(exp: Record<string, unknown>): Record<string, unknown> | null {
  const traceIndex = _traceSanitizeExpIndex++;
  const traceInput = { ...exp };
  const reconciled = reconcileExperienceHeaderFields(exp);
  const company = readExperienceCompanySlot(reconciled);
  let position = readExperiencePositionSlot(reconciled);
  if (
    company &&
    position &&
    position.toLowerCase() === company.toLowerCase()
  ) {
    position = '';
  }
  let safeCompany = isResumeSectionHeadingLine(company) ? '' : company;
  if (
    safeCompany &&
    !isPlausibleExperienceCompany(safeCompany) &&
    !looksLikeCompanyNameLine(safeCompany)
  ) {
    safeCompany = '';
  }
  let safePosition = isResumeSectionHeadingLine(position) ? '' : position;
  const description = sanitizeMultilineFieldText(
    reconciled.description || reconciled.Description,
    8000
  );
  if (!safeCompany && !safePosition && !description) {
    if (isImportFieldTraceEnabled()) {
      traceSanitizeExperienceDropped(traceIndex, traceInput, 'no company, position, or description', 'sanitize-experience');
    }
    return null;
  }
  if (isGarbageResumeText(safeCompany) && isGarbageResumeText(safePosition) && !description) {
    if (isImportFieldTraceEnabled()) {
      traceSanitizeExperienceDropped(traceIndex, traceInput, 'garbage company and position with no description', 'sanitize-experience');
    }
    return null;
  }
  const rawAchievements = Array.isArray(reconciled.achievements)
    ? (reconciled.achievements as unknown[]).map((a) =>
        typeof a === 'string' ? a : String((a as Record<string, unknown>)?.title ?? (a as Record<string, unknown>)?.description ?? '')
      ).filter(Boolean)
    : [];
  const pruned = pruneExperienceBodyFields(description, rawAchievements);
  const deduped = dedupeExperienceBodyLines(pruned.description, pruned.achievements);
  const finalDescription = deduped.description;
  const finalAchievements = deduped.achievements;

  if (
    !isValidExperienceEntry({
      company: safeCompany,
      position: safePosition,
      startDate: String(reconciled.startDate || ''),
      endDate: String(reconciled.endDate || ''),
      description: finalDescription || finalAchievements.join('\n'),
    })
  ) {
    if (isImportFieldTraceEnabled()) {
      traceSanitizeExperienceDropped(traceIndex, traceInput, 'isValidExperienceEntry failed', 'sanitize-experience');
    }
    return null;
  }

  return {
    ...reconciled,
    company: safeCompany,
    Company: safeCompany,
    organization: safeCompany,
    position: safePosition,
    Position: safePosition,
    title: safePosition,
    designation: safePosition,
    description: finalDescription,
    Description: finalDescription,
    achievements: finalAchievements,
    location: sanitizeFieldText(reconciled.location || reconciled.Location, 120),
    startDate: reconciled.startDate || reconciled.start_date || '',
    endDate: reconciled.endDate || reconciled.end_date || '',
  };
}

export function sanitizeEducationEntry(edu: Record<string, unknown>): Record<string, unknown> | null {
  const institution = sanitizeFieldText(
    edu.institution ||
      edu.Institution ||
      edu.school ||
      edu.School ||
      edu.organization ||
      edu.university,
    160
  );
  const degree = sanitizeFieldText(edu.degree || edu.Degree || edu.qualification, 160);
  const field = sanitizeFieldText(edu.field || edu.Field || edu.major, 120);
  if (!institution && !degree) return null;
  if (isGarbageResumeText(degree) && isGarbageResumeText(institution)) return null;

  return {
    ...edu,
    institution,
    degree,
    field,
    description: sanitizeMultilineFieldText(edu.description || edu.Description, 2000),
    location: sanitizeFieldText(edu.location || edu.Location, 120),
    year: edu.year || edu.endDate || '',
    startDate: edu.startDate || edu.start_date || '',
    endDate: edu.endDate || edu.end_date || edu.year || '',
    gpa: sanitizeFieldText(edu.gpa || edu.GPA, 20),
  };
}
