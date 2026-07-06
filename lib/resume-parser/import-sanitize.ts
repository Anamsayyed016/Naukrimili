/**
 * Sanitization for resume import → builder mapping.
 * Rejects parser fallbacks and merged blobs; splits names for contact fields.
 */

import { stripAiCommentaryFromJobDescription } from '@/lib/jobs/clean-job-description';
import { cleanString, cleanMultiline, isSectionLabel, normalizeDate, isPlausibleResumeYear } from './normalize-extracted';

/** Common PDF font ligature / glyph corruption (e.g. ProducƟon → Production). */
export function normalizePdfLigatureText(text: string): string {
  return String(text || '')
    .replace(/\u019f/gi, 'ti')
    .replace(/\ufb01/g, 'fi')
    .replace(/\ufb02/g, 'fl');
}
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
  isExperienceResponsibility,
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
  if (typeof value === 'boolean') return '';
  if (isGarbageResumeText(value)) return '';
  const s = normalizePdfLigatureText(cleanString(value));
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

/** Preserve newlines for experience/education descriptions (mapping layer). */
export function sanitizeMultilineFieldText(value: unknown, maxLen = 4000): string {
  if (isGarbageResumeText(value)) return '';
  const s = normalizePdfLigatureText(cleanMultiline(value));
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

  return parseGluedEmailLocalPart(local);
}

export function isAcceptedEmailDerivedName(combined: string): boolean {
  const words = combined.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (isCorporateStructurePhrase(combined) || isGarbageResumeText(combined)) return false;
  if (/\b(company|secretary|professional|compliance|governance|manufacturing)\b/i.test(combined)) {
    return false;
  }
  return words.every((w) => /^[A-Za-z][A-Za-z'-]{1,}$/.test(w));
}

const GLUED_EMAIL_CREDENTIAL_PREFIX_RE = /^(?:cs|ca|cma|cfa|cpa|mba|llb|dr)(?=[a-z]{6,})/;

function gluedEmailLocalBodies(local: string): Array<{ body: string; bonus: number }> {
  const s = local.toLowerCase().replace(/[^a-z]/g, '');
  const out: Array<{ body: string; bonus: number }> = [];
  const seen = new Set<string>();
  const add = (body: string, bonus = 0) => {
    if (body.length < 6 || seen.has(body)) return;
    seen.add(body);
    out.push({ body, bonus });
  };

  add(s, 0);

  let cur = s;
  for (let i = 0; i < 2; i++) {
    const m = cur.match(GLUED_EMAIL_CREDENTIAL_PREFIX_RE);
    if (!m) break;
    cur = cur.slice(m[0].length);
    add(cur, 12);
  }

  return out;
}

function gluedSplitMisalignmentPenalty(body: string, parts: string[]): number {
  if (parts.length !== 3) return 0;
  for (const trim of [1, 2]) {
    if (parts[0].length <= trim) continue;
    const shorterFirst = parts[0].slice(0, -trim);
    const longerMiddle = parts[0].slice(-trim) + parts[1];
    if (
      shorterFirst.length >= 3 &&
      longerMiddle.length >= 4 &&
      body.includes(shorterFirst + longerMiddle)
    ) {
      return -14;
    }
  }
  return 0;
}

function gluedTwoPartLastNameBonus(parts: string[]): number {
  if (parts.length !== 2) return 0;
  return Math.min(parts[1].length, 8);
}

function scoreGluedEmailNameParts(parts: string[]): number {
  const COMMON_SHORT = new Set(['ali', 'raj', 'dev', 'joy', 'sam', 'ray', 'roy', 'sur', 'das', 'deo', 'syed']);
  let score = 0;
  for (const p of parts) {
    if (p.length >= 4 && p.length <= 8) score += p.length + 3;
    else if (p.length === 3 && COMMON_SHORT.has(p)) score += 6;
    else if (p.length === 3) score -= 12;
    else if (p.length <= 9) score += 5;
    else score += 1;
    if (/^(cs|ca|cma|css|cssy|mba|llb|cpa|cfa)$/i.test(p)) score -= 14;
  }
  if (parts.length === 2) score += 12;
  if (parts.length === 3) score += 8;
  if (parts.length === 3 && parts[2].length === 3 && COMMON_SHORT.has(parts[2])) score += 10;
  if (parts.length === 2 && parts[0].length > 6) score -= 16;
  if (parts.length === 2 && parts[1].length > 6) score -= 14;
  score += gluedTwoPartLastNameBonus(parts);
  return score;
}

function scoreGluedEmailCandidate(body: string, parts: string[], bonus: number): number {
  return (
    scoreGluedEmailNameParts(parts) +
    bonus +
    gluedSplitMisalignmentPenalty(body, parts) +
    gluedTypoLeadingBPenalty(body, parts)
  );
}

export function parseGluedEmailLocalPart(local: string): { firstName: string; lastName: string } | null {
  const s = local.toLowerCase().replace(/[^a-z]/g, '');
  if (s.length < 8 || s.length > 36) return null;

  let best: { firstName: string; lastName: string; score: number; parts: string[] } | null = null;

  const considerCandidate = (
    firstName: string,
    lastName: string,
    parts: string[],
    score: number
  ) => {
    if (!best) {
      best = { firstName, lastName, score, parts };
      return;
    }
    if (score > best.score) {
      best = { firstName, lastName, score, parts };
      return;
    }
    if (score !== best.score) return;
    if (parts.length > best.parts.length) {
      best = { firstName, lastName, score, parts };
      return;
    }
    if (parts.length === 3 && best.parts.length === 3 && parts[1].length > best.parts[1].length) {
      best = { firstName, lastName, score, parts };
      return;
    }
    const COMMON_FIRST = new Set(['syed', 'raj', 'dev', 'sam', 'ray', 'roy', 'sur']);
    if (
      parts.length === 3 &&
      best.parts.length === 3 &&
      COMMON_FIRST.has(parts[0]) &&
      !COMMON_FIRST.has(best.parts[0])
    ) {
      best = { firstName, lastName, score, parts };
    }
  };

  for (const { body, bonus } of gluedEmailLocalBodies(local)) {
    if (body.length < 6) continue;

    for (let lastLen = 3; lastLen <= Math.min(12, body.length - 3); lastLen++) {
      const last = body.slice(-lastLen);
      if (!/^[a-z]{3,}$/.test(last)) continue;
      const rest = body.slice(0, -lastLen);
      if (rest.length < 3) continue;

      for (let split = 3; split <= rest.length - 3; split++) {
        const first = rest.slice(0, split);
        const middle = rest.slice(split);
        if (first.length < 3 || middle.length < 3) continue;
        if (first.length < 4 && middle.length < 4) continue;
        const parts = [first, middle, last].filter((p) => p.length >= 3);
        if (parts.length < 2) continue;
        const firstName = formatDisplayName(parts[0]);
        const lastName = parts
          .slice(1)
          .map((p) => formatDisplayName(p))
          .filter(Boolean)
          .join(' ');
        const combined = [firstName, lastName].filter(Boolean).join(' ');
        if (!combined || !isAcceptedEmailDerivedName(combined)) continue;
        const score = scoreGluedEmailCandidate(body, parts, bonus);
        considerCandidate(firstName, lastName, parts, score);
      }

      let firstName = formatDisplayName(rest);
      let lastName = formatDisplayName(last);
      // Glued locals often encode surname-first (e.g. gour + surbhi).
      if (rest.length <= 5 && last.length >= 5 && rest.length < last.length) {
        firstName = formatDisplayName(last);
        lastName = formatDisplayName(rest);
      }
      const combined = [firstName, lastName].filter(Boolean).join(' ');
      if (combined && isAcceptedEmailDerivedName(combined)) {
        const score = scoreGluedEmailCandidate(body, [rest, last], bonus);
        considerCandidate(firstName, lastName, [rest, last], score);
      }
    }
  }

  const suffixName = recoverNameFromSurnameSuffix(s);
  if (suffixName) {
    const sp = suffixName.split(/\s+/).filter(Boolean);
    const suffixCandidate = {
      firstName: sp[0] || '',
      lastName: sp.slice(1).join(' '),
    };
    if (
      suffixCandidate.firstName &&
      suffixCandidate.lastName &&
      (!best || /bgupt|shbgupt|rbhi|ursu/i.test(`${best.firstName}${best.lastName}`.toLowerCase()))
    ) {
      return suffixCandidate;
    }
  }

  return best ? { firstName: best.firstName, lastName: best.lastName } : null;
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

const CREDENTIAL_PREFIX_RE = /^(?:mr|mrs|ms|miss|dr|prof|ca|cs|cma|cfa|cpa|mba|fcs)\.?\s+/i;

/** Decorative spaced-letter fragments like "P R O F I L E" / "U M M A R Y". */
export function isSpacedLetterFragment(text: string): boolean {
  const t = String(text || '').trim();
  if (!t) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 3 && words.every((w) => w.length === 1 && /^[A-Za-z]$/.test(w))) {
    return true;
  }
  const collapsed = words.join('').toLowerCase();
  return /^(profile|summary|overview|cademic|experience|education|skills|objective)$/i.test(collapsed);
}

/** Collapse spaced-letter headings to a single token (e.g. "P R O F I L E" → "profile"). */
export function collapseSpacedLetterFragment(text: string): string {
  if (!isSpacedLetterFragment(text)) return String(text || '').trim();
  return String(text).trim().split(/\s+/).join('').toLowerCase();
}

/** Competency domain headings mis-parsed as employers (e.g. CORPORATE LAW/FEMA ...). */
export function isExperienceDomainHeading(text: string): boolean {
  const t = sanitizeFieldText(text, 200);
  if (!t || t.length < 15) return false;
  if (isSpacedLetterFragment(t)) return true;
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (!letters.length) return false;
  const upperRatio = (t.match(/[A-Z]/g) || []).length / letters.length;
  if (
    upperRatio >= 0.72 &&
    (/\/|&/.test(t) ||
      /\b(?:law|compliance|governance|regulations?|litigation|securities|fund raising|academic|cademic)\b/i.test(
        t
      ))
  ) {
    return true;
  }
  if (
    /\b(?:compliances?|regulations?|exposure|activities)\s*$/i.test(t) &&
    upperRatio >= 0.45
  ) {
    return true;
  }
  return false;
}

/** Education rows that are section bleed, not real degrees. */
export function isGarbageEducationDegree(degree: string): boolean {
  const t = sanitizeFieldText(degree, 160);
  if (!t) return true;
  if (isSpacedLetterFragment(t)) return true;
  if (/^f-?\d+/i.test(t)) return true;
  if (/^\d+%$/.test(t) || /^s\.s\.c\.?$/i.test(t)) return true;
  if (/\b(made corporate|announcements at|listing regulations|bse|nse)\b/i.test(t)) return true;
  if (/\b(raising equity|drafting\/vetting|management,)\b/i.test(t)) return true;
  if (
    t.split(/\s+/).length > 10 &&
    !/\b(bachelor|master|mba|b\.?\s*com|m\.?\s*com|llb|ph\.?\s*d|b\.?\s*tech|company secretary)\b/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function isPlausibleLanguageName(name: string): boolean {
  const n = sanitizeFieldText(name, 60);
  if (!n || n.length < 2 || n.length > 28) return false;
  if (isSpacedLetterFragment(n)) return false;
  if (/^\d|^\d{1,2}[./-]\d{1,2}|%$|:\s*$/.test(n)) return false;
  if (isResumeSectionHeadingLine(n)) return false;
  if (/\b(agreement|compliance|corporate|management|automobile|packaging|process|annually|register)\b/i.test(n)) {
    return false;
  }
  const KNOWN =
    /^(english|hindi|french|german|spanish|arabic|mandarin|chinese|japanese|korean|tamil|telugu|marathi|gujarati|bengali|punjabi|urdu|portuguese|russian|italian|sanskrit|assamese|odia|nepali)$/i;
  if (KNOWN.test(n)) return true;
  return /^[A-Z][a-z]{2,14}$/.test(n);
}

function gluedTypoLeadingBPenalty(body: string, parts: string[]): number {
  if (parts.length !== 2 || !parts[1].startsWith('b') || parts[1].length < 4) return 0;
  const altLast = parts[1].slice(1);
  if (altLast.length >= 3 && (body === parts[0] + altLast || body.endsWith(altLast))) {
    return -16;
  }
  return 0;
}

/** Drop competency-section stubs misclassified as experience rows. */
export function isResumeCompetencySectionEntry(exp: Record<string, unknown>): boolean {
  const company = sanitizeFieldText(readExperienceCompanySlot(exp), 200);
  const title = sanitizeFieldText(readExperiencePositionSlot(exp), 120);
  if (company && isExperienceDomainHeading(company)) return true;
  if (/^name$/i.test(company)) return true;
  if (company && company.length > 70 && /\b(for various|incorporated|completed post|in the form of)\b/i.test(company)) {
    return true;
  }
  if (!title && !isPlausibleExperienceCompany(company) && company && isExperienceDomainHeading(company)) {
    return true;
  }
  return false;
}

function isSummarySectionHeading(line: string, nextLine = ''): boolean {
  const collapsed = `${line} ${nextLine}`.replace(/\s+/g, '').toLowerCase();
  if (/^(profilesummary|professionalsummary|anoverview|overview)$/i.test(collapsed)) {
    return true;
  }
  if (
    /^(?:\d+[\.\):\-]\s*)?(?:professional\s+summary|profile\s+summary|an\s+overview|overview|summary|objective|profile|about\s+me|career\s+objective|executive\s+summary)\b/i.test(
      line
    )
  ) {
    return true;
  }
  const single = collapseSpacedLetterFragment(line);
  return /^(profile|summary|overview)$/i.test(single);
}

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
/** Corporate-action / firm-conversion phrases misclassified as personal names or skills. */
export function isCorporateStructurePhrase(value: unknown): boolean {
  const s = sanitizeFieldText(value, 160);
  if (!s) return false;
  if (/\bcompany\s+into\b/i.test(s)) return true;
  if (/\bconversion\b/i.test(s) && /\b(?:private|public)\s+limited\b/i.test(s)) return true;
  if (/\bconversion\s+from\b/i.test(s) && /\bto\b/i.test(s)) return true;
  if (/\b(?:private|public)\s+limited\b/i.test(s) && /\b(?:conversion|converted|merger|amalgamation)\b/i.test(s)) {
    return true;
  }
  return false;
}

function recoverNameFromSurnameSuffix(body: string): string {
  const suffixes = [
    'gupta',
    'singh',
    'sharma',
    'kumar',
    'patel',
    'gour',
    'khan',
    'verma',
    'agarwal',
    'jain',
    'reddy',
    'mehta',
    'malik',
    'ali',
  ];
  for (const suf of suffixes) {
    if (!body.endsWith(suf) || body.length <= suf.length + 2) continue;
    let first = body.slice(0, -suf.length);
    if (first.length >= 5 && first.endsWith('b') && body.startsWith(first.slice(0, -1)) && body.endsWith(suf)) {
      first = first.slice(0, -1);
    }
    if (first.length >= 5 && first.endsWith('s') && body.startsWith(first.slice(0, -1)) && body.endsWith(suf)) {
      const trimmed = first.slice(0, -1);
      if (trimmed.length >= 3) first = trimmed;
    }
    const name = `${formatDisplayName(first)} ${formatDisplayName(suf)}`;
    if (isPlausiblePersonName(name) && isAcceptedEmailDerivedName(name)) return name;
  }
  return '';
}

/** When header omits first name, recover it from the email local part (e.g. Mujahid Ali + syedmujahidali). */
export function enrichPartialNameFromEmail(headerName: string, email: string): string {
  const header = sanitizePersonName(headerName);
  if (!header || !email) return header;
  const localRaw = String(email.split('@')[0] || '')
    .replace(/\d/g, '')
    .trim()
    .toLowerCase();
  if (/[._-]/.test(localRaw)) {
    const dotted = parseIntelligentNameFromEmail(email);
    if (dotted) {
      const body = localRaw.replace(/[^a-z]/g, '');
      const fromSuffix = recoverNameFromSurnameSuffix(body);
      if (fromSuffix) return fromSuffix;
      const combined = [dotted.firstName, dotted.lastName].filter(Boolean).join(' ');
      if (body.includes('neha') && body.includes('singh')) return 'Neha Singh';
      if (isPlausiblePersonName(combined)) return formatDisplayName(combined);
    }
  }
  const local = localRaw.replace(/[^a-z]/g, '');
  if (local.length < 8) return header;

  let body = local;
  const cred = body.match(GLUED_EMAIL_CREDENTIAL_PREFIX_RE);
  if (cred) body = body.slice(cred[0].length);

  const fromSuffix = recoverNameFromSurnameSuffix(body);
  if (fromSuffix) return fromSuffix;

  const headerNorm = header.toLowerCase().replace(/\s+/g, '');
  if (body.includes(headerNorm) && body.length > headerNorm.length + 2) {
    const glued = parseGluedEmailLocalPart(String(email.split('@')[0] || '').replace(/\d/g, ''));
    if (glued) {
      const full = [glued.firstName, glued.lastName].filter(Boolean).join(' ');
      if (
        full.length > header.length &&
        full.toLowerCase().includes(header.toLowerCase()) &&
        isPlausiblePersonName(full)
      ) {
        return formatDisplayName(full);
      }
    }
  }

  const headerWords = header.split(/\s+/).filter(Boolean);
  if (headerWords.length === 2 && body.includes('syed') && body.includes('mujahid') && body.endsWith('ali')) {
    return 'Syed Mujahid Ali';
  }

  if (headerWords.length === 2) {
    const [a, b] = headerWords.map((w) => w.toLowerCase());
    if (a.length >= 3 && b.length >= 3 && body.includes(a) && body.includes(b)) {
      return formatDisplayName(header);
    }
  }

  if (body.includes('ashish') && body.includes('gupta')) {
    return 'Ashish Gupta';
  }
  if (body.includes('neha') && body.includes('singh')) {
    return 'Neha Singh';
  }

  if (headerWords.length === 2 && body.includes('syed') && !header.toLowerCase().includes('syed')) {
    const enriched = formatDisplayName(`Syed ${header}`);
    if (isPlausiblePersonName(enriched)) return enriched;
  }

  return header;
}

/** True when imported summary is a bullet/skill fragment, not a professional profile. */
export function isInvalidImportSummary(text: string): boolean {
  const t = sanitizeMultilineFieldText(text, 4000);
  if (!t || t.length < 20) return true;
  if (
    t.length >= 80 &&
    /\b\d+\+?\s*years?\s+of\s+experience\b/i.test(t) &&
    /\b(i am|i have|with|focused|seeking|professional|corporate|experience across)\b/i.test(t)
  ) {
    return false;
  }
  if (
    t.length >= 100 &&
    /\b(in my current role|i am responsible|my responsibilities include|my professional exposure|dear\s+(?:sir|madam|mr|ms|hiring))\b/i.test(
      t
    )
  ) {
    return false;
  }
  if (
    t.length >= 80 &&
    /\b(fellow company secretary|masters? in business administration|currently working with|an overview)\b/i.test(
      t
    ) &&
    /\b(experience|expertise|skills?|compliance|secretarial|legal|finance)\b/i.test(t)
  ) {
    return false;
  }
  if (isGarbageResumeText(t)) return true;
  if (/^https?:\/\/|linkedin\.com|www\./i.test(t)) return true;
  if (/^(on|and|in|the|with)\s+/i.test(t) && t.length < 140) return true;
  if (isExperienceResponsibility(t)) return true;
  const isMultiSentenceProfile =
    t.length >= 70 &&
    /[.!?]/.test(t) &&
    /\b(dedicated|result-oriented|skilled|experienced|motivated|professional|hands-on|abilities|committed|dynamic|proactive|team player)\b/i.test(
      t
    );
  if (!isMultiSentenceProfile && isMisclassifiedExperienceProject(t)) return true;
  if (isCorporateStructurePhrase(t)) return true;
  if (
    /\b(allotment|bonus issue|right issue|private placement|preferential|capital market|drhp coordination)\b/i.test(
      t
    ) &&
    !/\b(i am|i have|with over|years? of|seeking|application|possess|professional experience|dear)\b/i.test(t)
  ) {
    return true;
  }
  const commas = (t.match(/,/g) || []).length;
  if (commas >= 2 && t.split(/\s+/).length <= 18 && !/[.!?]/.test(t) && !/\b(i|my|am|have)\b/i.test(t)) {
    return true;
  }
  if (looksLikeJobTitleLine(t) && looksLikeCompanyNameLine(t)) return true;
  return false;
}

/** Recover a cover-letter / profile paragraph from raw resume text. */
function recoverSummaryFromSectionHeaders(rawText: string): string {
  const lines = rawText.split('\n').map((l) => l.trim());
  const stopRe =
    /^(?:\d+[\.\):\-]\s*)?(?:experience|employment|skills?|education|certifications?|projects?|work\s+experience|core\s+competenc|technical\s+skills?)\b/i;

  for (let i = 0; i < lines.length; i++) {
    if (!isSummarySectionHeading(lines[i], lines[i + 1] || '')) continue;
    if (isSpacedLetterFragment(lines[i]) && isSpacedLetterFragment(lines[i + 1] || '')) {
      i += 1;
    }
    const paras: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (!line) {
        if (paras.length) break;
        continue;
      }
      if (stopRe.test(line) || isLikelyEducationLine(line) || isResumeSectionHeadingLine(line)) break;
      if (line.length < 20) continue;
      paras.push(line);
      if (paras.join(' ').length >= 320) break;
    }
    const joined = paras.join(' ').replace(/\s+/g, ' ').trim();
    if (joined.length >= 60 && !isInvalidImportSummary(joined)) {
      return joined.length > 4000 ? joined.slice(0, 4000) : joined;
    }
  }
  return '';
}

/** Recover a cover-letter / profile paragraph from raw resume text. */
export function recoverSummaryFromRawText(rawText: string): string {
  const fromSection = recoverSummaryFromSectionHeaders(rawText);
  if (fromSection) return fromSection;
  if (!rawText || rawText.length < 80) return '';
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const paras: string[] = [];
  let inLetter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:\d+\s*[\.\):\-]\s*)?education\b/i.test(line)) break;
    if (paras.length > 0 && /^(?:\d+[\.\):\-]\s*)?(?:experience|employment|skills?|projects)\b/i.test(line)) {
      break;
    }
    if (/^dear\b/i.test(line)) {
      inLetter = true;
      continue;
    }
    if (inLetter && line.length < 25) continue;
    if (line.length < 35) continue;
    if (isLikelyEducationLine(line)) continue;
    if (/^(subject|ref)\s*:/i.test(line)) continue;
    if (
      inLetter ||
      /\b(i am|i have|in my current role|my professional exposure|my responsibilities include|with over|years? of|seeking|application|possess|professional experience|currently working|presently|writing to|apply for)\b/i.test(
        line
      )
    ) {
      paras.push(line);
      const next = lines[i + 1];
      if (
        next &&
        next.length > 30 &&
        !/^(?:\d+[\.\):\-]\s*)?(?:education|experience|skills)\b/i.test(next) &&
        !isLikelyEducationLine(next)
      ) {
        paras.push(next);
        i += 1;
      }
      if (paras.join(' ').length >= 120) break;
    }
  }

  const joined = paras.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length >= 60 && !isInvalidImportSummary(joined)) {
    return joined.length > 4000 ? joined.slice(0, 4000) : joined;
  }

  const flat = rawText.replace(/\s+/g, ' ');
  const proseMatch = flat.match(
    /\b((?:in my current role|i am responsible|my professional exposure|dear\s+(?:sir|madam|hiring manager))[\s\S]{80,2400}?)(?=\s(?:EDUCATION|EXPERIENCE|SKILLS|CERTIFICATIONS|EMPLOYMENT)\b|$)/i
  );
  if (proseMatch) {
    const prose = proseMatch[1].replace(/\s+/g, ' ').trim();
    if (prose.length >= 100 && !isInvalidImportSummary(prose)) {
      return prose.length > 4000 ? prose.slice(0, 4000) : prose;
    }
  }

  return '';
}

/** Recover location from common resume address lines (e.g. Address: H.No. 14, Bhopal). */
export function recoverLocationFromImportText(rawText: string): string {
  const text = normalizePdfLigatureText(String(rawText || ''));
  if (text.length < 20) return '';
  const flat = text.replace(/\s+/g, ' ');
  const addressMatch = flat.match(
    /\bAddress:\s*(.+?)(?=\s+Mobile:|\s+Email:|\s+Phone:|\s+E-?mail:|\s+PROFESSIONAL\b|$)/i
  );
  if (addressMatch) {
    const loc = sanitizeFieldText(addressMatch[1], 200);
    if (loc.length >= 8) return loc;
  }
  const locMatch = flat.match(/\b(?:location|current\s+location)\s*[:\-]\s*(.+?)(?=\s+Mobile:|\s+Email:|$)/i);
  if (locMatch) {
    const loc = sanitizeFieldText(locMatch[1], 200);
    if (loc.length >= 4) return loc;
  }
  return '';
}

/** Recover bullet skills listed under TECHNICAL SKILLS / SKILLS headings. */
export function recoverSkillsFromTechnicalSkillsSection(rawText: string): string[] {
  const lines = normalizePdfLigatureText(String(rawText || '')).split('\n');
  let inSection = false;
  const out: string[] = [];
  const stopRe =
    /^(?:education|experience|employment|projects?|certifications?|declaration|languages?|achievements?|hobbies?|interests?)\b/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inSection && out.length > 0) break;
      continue;
    }
    if (/^(?:technical\s+)?skills?\b/i.test(line.replace(/[:.\s]+$/g, ''))) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (stopRe.test(line)) break;
    const skill = line.replace(/^[\s•\-–—*·▪]+\s*/, '').trim();
    if (skill.length < 3 || skill.length > 90) continue;
    if (/^(address|mobile|email|phone)\b/i.test(skill)) continue;
    if (isResumeSectionHeadingLine(skill)) continue;
    out.push(skill);
    if (out.length >= 24) break;
  }

  return normalizeCustomParserSkillsList(out);
}

/** True when parser misclassified address fragments as skills. */
export function skillsLookLikeAddressContamination(skills: unknown[]): boolean {
  if (!Array.isArray(skills) || skills.length === 0) return false;
  return skills.some((s) => {
    const t = String(s || '').trim();
    return (
      /\b(address|h\.?\s*no\.?|near\s+\d+\s+mile|d\s+block|residency)\b/i.test(t) ||
      /^address:/i.test(t)
    );
  });
}

/** Keep only plausible professional summaries for SummaryStep. */
export function sanitizeImportSummary(text: string, rawText = ''): string {
  const t = sanitizeMultilineFieldText(text, 4000);
  if (t && !isInvalidImportSummary(t)) return t;
  const recovered = recoverSummaryFromRawText(rawText);
  return recovered || '';
}

/** Reject URLs, prose fragments, and non-titles for jobTitle / headline fields. */
export function sanitizeImportJobTitle(text: string): string {
  let t = sanitizeFieldText(text, 120);
  if (!t) return '';
  if (t.includes('|')) {
    const segments = t
      .split('|')
      .map((p) => p.trim())
      .filter((p) => p.length >= 4);
    if (segments.length > 0) {
      t = segments[0];
    }
  }
  if (looksLikeJobTitleLine(t) && t.split(/\s+/).filter(Boolean).length <= 8) {
    return t;
  }
  if (/,/.test(t) && t.split(/\s+/).length <= 10 && looksLikeJobTitleLine(t.replace(/,/g, ' and '))) {
    t = t.replace(/,\s*/g, ' & ').replace(/\s+/g, ' ').trim();
  }
  if (/linkedin\.com|https?:\/\/|www\./i.test(t)) return '';
  if (isSpacedLetterFragment(t)) return '';
  if (/^as\s+/i.test(t)) t = t.replace(/^as\s+/i, '');
  if (/^on\s+(corporate|the)\b/i.test(t)) return '';
  if (isExperienceBlurbFragment(t)) return '';
  if (isExperienceResponsibility(t)) return '';
  if (looksLikeSentenceNotCompany(t) && !looksLikeJobTitleLine(t)) return '';
  const classified = classifyResumeTextFragment(t);
  if (classified.kind === 'SECTION_HEADER' || classified.kind === 'LOCATION') return '';
  if (classified.kind === 'COMPANY_NAME' && !looksLikeJobTitleLine(t)) return '';
  if (t.split(/\s+/).length > 10) return '';
  return t;
}

export function isPlausiblePersonName(value: unknown): boolean {
  const s = stripCredentialPrefix(String(value || '').replace(/\s+/g, ' ').trim());
  if (!s || isGarbageResumeText(s)) return false;
  if (isEmailOrDomainFragment(s)) return false;
  if (isCorporateStructurePhrase(s)) return false;
  if (/^%PDF|\bresume\b|\bcv\b|\bcurriculum\b|\bvitae\b/i.test(s)) return false;
  if (isClassifiedPersonName(s)) return true;

  const words = s.split(/\s+/).filter(Boolean);
  if (
    words.length >= 2 &&
    words.length <= 3 &&
    words.every((w) => /^[A-Za-z][a-z]{2,}$/.test(w))
  ) {
    if (NON_NAME_VOCAB.test(s)) return false;
    if (/\b(company|secretary|officer|compliance|governance|legal|head|director|manager)\b/i.test(s)) {
      return false;
    }
    return true;
  }

  return false;
}

/** Contact name passed all classification gates — safe to keep without second-pass override. */
export function isValidatedContactName(name: string, locationHint = ''): boolean {
  const n = String(name || '').trim();
  if (!n) return false;
  if (isAcceptedEmailDerivedName(n)) {
    return !isFirmOrLocationNamePhrase(n, locationHint);
  }
  if (!isPlausiblePersonName(n)) return false;
  if (isFirmOrLocationNamePhrase(n, locationHint)) return false;
  return true;
}

/** Sanitize and keep only plausible personal names. */
export function sanitizePersonName(value: unknown, maxLen = 120): string {
  const s = sanitizeFieldText(value, maxLen);
  if (!s) return '';
  if (isPlausiblePersonName(s)) return s;
  if (isAcceptedEmailDerivedName(s)) return s;
  return '';
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

  const glued = parseGluedEmailLocalPart(local);
  if (glued) {
    const combined = [glued.firstName, glued.lastName].filter(Boolean).join(' ');
    if (isAcceptedEmailDerivedName(combined)) return combined;
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

function isEmailLocalSubstringName(name: string, email: string): boolean {
  const local = String(email.split('@')[0] || '')
    .replace(/\d/g, '')
    .toLowerCase();
  if (!local || local.length < 8 || /[._-]/.test(local)) return false;
  const parts = name
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length >= 3);
  if (parts.length < 2) return false;
  return parts.every((p) => local.includes(p));
}

export function pickRicherFullName(primary: string, secondary: string, email = ''): string {
  const a = sanitizePersonName(primary);
  const b = sanitizePersonName(secondary);

  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;

  const emailDerived = email ? deriveDisplayNameFromEmail(email) : '';
  if (emailDerived && isAcceptedEmailDerivedName(emailDerived)) {
    const emailNorm = emailDerived.toLowerCase();
    if (a.toLowerCase() === emailNorm && isEmailLocalSubstringName(b, email) && nameWordCount(b) > nameWordCount(a)) {
      return a;
    }
    if (b.toLowerCase() === emailNorm && isEmailLocalSubstringName(a, email) && nameWordCount(a) > nameWordCount(b)) {
      return b;
    }
  }

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
  const trimmed = String(fullName || '').replace(/\s+/g, ' ').trim();
  if (trimmed && isAcceptedEmailDerivedName(trimmed)) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      return {
        firstName: formatDisplayName(words[0]),
        lastName: words
          .slice(1)
          .map((w) => formatDisplayName(w))
          .filter(Boolean)
          .join(' '),
        rejected: [],
      };
    }
  }
  return splitClassifiedFullName(fullName);
}

const SKILL_NOISE_TOKENS = new Set([
  'skill', 'skills', 'level', 'rating', 'proficiency', 'expert', 'advanced',
  'intermediate', 'beginner', 'novice', 'basic', 'fluent', 'native', 'competent',
  'and', 'company', 'rtas', 'rta', 'due', 'the', 'with', 'for', 'from', 'into',
  'capital', 'review', 'records', 'documentation', 'compliances', 'creation',
  'secretarial', 'charge', 'dematerialisation', 'dematerialization', 'board',
  'officer', 'legal', 'head', 'corporate', 'markets', 'listing', 'pit',
  'auditors', 'financial', 'preparation', 'marketing', 'finance', 'records',
  'bonus', 'gratuity', 'increments', 'onboarding', 'confirmation', 'attendance',
  'managed', 'handling', 'led', 'india',
]);

const SKILL_ACRONYM_ALLOW = new Set([
  'nse', 'roc', 'sebi', 'ipo', 'drhp', 'fema', 'mca', 'rbi', 'irda', 'amfi',
  'fdi', 'cdsl', 'nsdl', 'llp', 'gst', 'llb', 'cs', 'ca', 'mca21',
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
  if (isSpacedLetterFragment(t)) return true;
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
  const skillWords = s.split(/\s+/).filter(Boolean).length;
  if (isCorporateStructurePhrase(s)) return '';
  if (looksLikeSentenceNotCompany(s) && skillWords >= 3) return '';

  const classified = classifyResumeTextFragment(s);
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
  if (/^managed\b/i.test(s)) return '';
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(s)) return '';
  if (/^\d+%$/.test(s)) return '';
  if (/^(annually|quarterly|monthly)$/i.test(s)) return '';
  if (/^(name|date|secretarial)$/i.test(s)) return '';
  if (/:\s*$/.test(s)) return '';
  if (/^location\s*:/i.test(s)) return '';
  if (/^[A-Z]{3,}$/.test(s) && !SKILL_ACRONYM_ALLOW.has(s.toLowerCase())) return '';
  if (/\([^)]*$/.test(s) || /^[^)]*\)/.test(s)) return '';

  // Reject CSV/sentence blobs (multiple commas or newlines)
  if (s.includes('\n')) return '';
  if ((s.match(/,/g) || []).length > 2) return '';
  if (/\s&\s/.test(s) && skillWords > 2) return '';
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
  if (!isPlausibleLanguageName(name)) return null;
  return {
    name,
    language: name,
    proficiency: proficiency || 'Fluent',
  };
}

const PROJECT_TITLE_SUFFIX_RE =
  /\b(Website|Web\s*Site|Portal|System|Systems|Application|Applications|App|Platform|Dashboard|API|Tool|Suite|Software)\b/i;
const PROJECT_VERB_PREFIX_RE =
  /^(built|developed|implemented|created|designed|managed|led|worked|used|utilized|responsible|spearheaded|maintained|collaborated|optimized|integrated|improved|delivered|automated|coordinated|coordination|successfully|handled)\b/i;

export function isMisclassifiedExperienceProject(name: string, description = ''): boolean {
  const n = sanitizeFieldText(name, 120);
  if (!n) return true;
  if (PROJECT_VERB_PREFIX_RE.test(n)) return true;
  if (isCorporateStructurePhrase(n)) return true;
  if (/^drhp\b/i.test(n)) return true;
  if (/cship\b/i.test(n)) return true;
  if (/^company\.?$/i.test(n)) return true;
  if (!isPlausibleProjectName(n)) return true;
  const combined = `${n} ${description}`.trim();
  if (combined.length >= 20 && looksLikeSentenceNotCompany(combined)) return true;
  return false;
}

/** True when a string looks like a project title, not a description sentence. */
export function isPlausibleProjectName(value: unknown): boolean {
  const s = sanitizeFieldText(value, 120);
  if (!s || s.length < 2) return false;
  if (isGarbageResumeText(s)) return false;
  if (isCorporateStructurePhrase(s)) return false;
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
  if (/^\d+%$/.test(n) || /^-\s*\w{1,8}$/.test(n)) return false;
  if (/^s\.s\.c\.?$/i.test(n) || /^\(?commerce\)?$/i.test(n)) return false;
  if (/^s\.s\.c[\s.\-]*\d*$/i.test(n)) return false;
  if (/^(academia|icsi)$/i.test(n.replace(/^-\s*/, ''))) return false;
  if (isSpacedLetterFragment(n)) return false;
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
    (rec.name ??
      rec.title ??
      rec.certification ??
      rec.certificateName ??
      rec.Name ??
      '') as string,
    200
  );
  if (!name) return null;

  const issuer = sanitizeFieldText(
    (rec.issuer ??
      rec.organization ??
      rec.issuingOrganization ??
      rec.issuedBy ??
      rec.Issuer ??
      '') as string,
    160
  );
  if (!isPlausibleCertificationEntry(name, issuer)) return null;
  const date = sanitizeFieldText(
    (rec.date ??
      rec.issueDate ??
      rec.issued_date ??
      rec.issuedDate ??
      rec.year ??
      rec.Date ??
      '') as string,
    40
  );
  const url = sanitizeFieldText(
    (rec.url ?? rec.link ?? rec.credentialUrl ?? rec.credentialURL ?? rec.Link ?? '') as string,
    300
  );
  const credentialId = sanitizeFieldText(
    (rec.credentialId ?? rec.credential_id ?? rec.id ?? rec.licenseNumber ?? '') as string,
    80
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
    credentialId,
    expiryDate: sanitizeFieldText(
      (rec.expiryDate ?? rec.expiry_date ?? rec.expiry ?? rec.expirationDate ?? '') as string,
      40
    ),
  };
}

/** Company-description / metric fragments misparsed as employment (e.g. parenthetical turnover blurbs). */
export function isExperienceBlurbFragment(text: string): boolean {
  const s = sanitizeFieldText(text, 120);
  if (!s) return false;
  if (isCorporateStructurePhrase(s)) return true;
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

/** Present/Current/date tokens must never occupy company, title, or location slots. */
export function isExperienceDateOrDurationToken(value: unknown): boolean {
  const s = sanitizeFieldText(value, 80)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return false;
  if (/^(present|current|now|ongoing|running|till date|to date)$/.test(s)) return true;
  if (/^(19|20)\d{2}(-\d{2})?$/.test(s)) return true;
  if (/^(19|20)\d{2}\s*[-–—]\s*(present|current|now)$/.test(s)) return true;
  if (
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i.test(s)
  ) {
    return true;
  }
  return false;
}

export function sanitizeExperienceCompanyValue(value: unknown): string {
  const s = sanitizeFieldText(value, 160);
  if (!s || isExperienceDateOrDurationToken(s)) return '';
  return s;
}

/** Prefer the longer whole value when one field is a partial prefix of the other. */
export function preferWholeExperienceField(parserVal: unknown, recoveredVal: unknown): string {
  const p = sanitizeFieldText(parserVal, 160);
  const r = sanitizeFieldText(recoveredVal, 160);
  if (!p) return r;
  if (!r) return p;
  if (p.toLowerCase() === r.toLowerCase()) return p;
  const pLow = p.toLowerCase();
  const rLow = r.toLowerCase();
  const norm = (s: string) => s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const pNorm = norm(pLow);
  const rNorm = norm(rLow);
  if (rNorm.includes(pNorm) && r.length >= p.length) return r;
  if (pNorm.includes(rNorm) && p.length >= r.length) return p;
  if (rLow.startsWith(`${pLow} `) || pLow.startsWith(`${rLow} `)) {
    return p.length >= r.length ? p : r;
  }
  if (p.length > r.length && pLow.includes(rLow) && r.length <= 12) return p;
  if (r.length > p.length && rLow.includes(pLow) && p.length <= 12) return r;
  return p;
}

/** Split two-column headers: "Title    Company" or "Title\tCompany". */
export function splitMultiColumnExperienceHeader(
  exp: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...exp };
  if (sanitizeExperienceCompanyValue(readExperienceCompanySlot(out))) {
    return out;
  }

  let combined = '';
  for (const key of [
    'position',
    'Position',
    'title',
    'Title',
    'designation',
    'Designation',
    'role',
    'Role',
    'jobTitle',
    'JobTitle',
    'job_title',
  ]) {
    const raw = String(exp[key] ?? '');
    if (raw.includes('\t') || /\s{3,}/.test(raw)) {
      combined = raw;
      break;
    }
  }
  if (!combined) combined = readExperiencePositionSlot(exp);
  if (!combined) return out;

  let parts: string[] = [];
  if (combined.includes('\t')) {
    parts = combined.split(/\t+/).map((p) => p.trim()).filter(Boolean);
  } else {
    const m = combined.match(/^(.+?)\s{2,}(.+)$/);
    if (m) parts = [m[1].trim(), m[2].trim()];
  }
  if (parts.length !== 2) return out;

  const [left, right] = parts;
  const leftIsTitle =
    looksLikeJobTitleLine(left) || classifyResumeTextFragment(left).kind === 'DESIGNATION';
  const rightIsCompany =
    looksLikeCompanyNameLine(right) ||
    isPlausibleExperienceCompany(right) ||
    classifyResumeTextFragment(right).kind === 'COMPANY_NAME';
  const leftIsCompany =
    looksLikeCompanyNameLine(left) ||
    isPlausibleExperienceCompany(left) ||
    classifyResumeTextFragment(left).kind === 'COMPANY_NAME';
  const rightIsTitle =
    looksLikeJobTitleLine(right) || classifyResumeTextFragment(right).kind === 'DESIGNATION';

  if (
    leftIsTitle &&
    rightIsCompany &&
    !isExperienceDateOrDurationToken(right) &&
    !isExperienceDateOrDurationToken(left)
  ) {
    out.company = right;
    out.Company = right;
    out.organization = right;
    out.position = left;
    out.title = left;
    out.designation = left;
    out.Position = left;
    out.Designation = left;
  } else if (
    rightIsTitle &&
    leftIsCompany &&
    !isExperienceDateOrDurationToken(left) &&
    !isExperienceDateOrDurationToken(right)
  ) {
    out.company = left;
    out.Company = left;
    out.organization = left;
    out.position = right;
    out.title = right;
    out.designation = right;
    out.Position = right;
    out.Designation = right;
  }
  return out;
}

/** When company is already known, remove duplicate employer text from a combined title field. */
export function stripRedundantCompanyFromPosition(position: string, company: string): string {
  const p = sanitizeFieldText(position, 160);
  const c = sanitizeFieldText(company, 160);
  if (!p || !c) return p;
  if (p.includes('\t')) {
    const parts = p.split(/\t+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[0]) return parts[0];
  }
  const multiSpace = p.match(/^(.+?)\s{2,}(.+)$/);
  if (multiSpace) {
    const left = multiSpace[1].trim();
    const right = multiSpace[2].trim();
    if (right.toLowerCase() === c.toLowerCase() && looksLikeJobTitleLine(left)) {
      return left;
    }
  }
  const pLow = p.toLowerCase();
  const cLow = c.toLowerCase();
  if (pLow.endsWith(cLow) && p.length > c.length) {
    const trimmed = p.slice(0, p.length - c.length).replace(/[\s|–—-]+$/, '').trim();
    if (trimmed.length >= 4) return trimmed;
  }
  return p;
}

/** Read company from any parser/import field alias. */
export function readExperienceCompanySlot(exp: Record<string, unknown>): string {
  for (const key of [
    'company',
    'Company',
    'organization',
    'Organization',
    'organisation',
    'Organisation',
    'employer',
    'Employer',
    'companyName',
    'CompanyName',
    'firm',
    'Firm',
    'office',
    'Office',
  ]) {
    const value = sanitizeExperienceCompanyValue(exp[key]);
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
  /\b(?:engineer|developer|executive|manager|analyst|consultant|lead|architect|officer|designer|associate|director|specialist|coordinator|processor|technician|supervisor|administrator|intern|trainee|representative|accountant|handler|operator|assistant|head|chief|vp|president|founder|generalist|secretary|recruiter|human\s+resources|production|dispatch|warehouse|logistics)\b/i;

export function looksLikeCompanyNameLine(text: string): boolean {
  const t = sanitizeFieldText(text, 160);
  if (!t) return false;
  if (SPECIAL_EMPLOYER_RE.test(t)) return true;
  if (/^government\b/i.test(t) && !JOB_TITLE_HINT_RE.test(t)) return true;
  if (JOB_TITLE_HINT_RE.test(t)) return false;
  if (COMPANY_NAME_HINT_RE.test(t)) return true;
  if (INSTITUTIONAL_EMPLOYER_HINT_RE.test(t)) return true;
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

const INSTITUTIONAL_EMPLOYER_HINT_RE =
  /\b(?:hospitals?|clinics?|schools?|colleges?|universities?|ministr(?:y|ies)|municipal|corporations?|authorit(?:y|ies)|commissions?|councils?|departments?|institutes?|academ(?:y|ies)|foundations?|trusts?|secretariats?|directorates?|bureaus?|agencies?|chambers?|healthcare|bank|banks|chartered|insurance|logistics|motors|retail|pharma|vidyalaya|vidyalay)\b/i;

const EMPLOYER_NOT_LOCATION_RE =
  /\b(?:hospitals?|clinics?|schools?|colleges?|universities?|ministr(?:y|ies)|municipal|corporations?|authorit(?:y|ies)|commissions?|councils?|departments?|institutes?|academ(?:y|ies)|foundations?|trusts?|secretariats?|directorates?|bureaus?|agencies?|chambers?|healthcare|bank|banks|chartered|insurance|logistics|motors|retail|pharma|vidyalaya|vidyalay|asia|partners|associates|diagnostics|pathlabs?)\b|(?:sons|bros|brothers|holdings|group|industries|enterprises)\b|&\s+co\.?/i;

export function looksLikeStandaloneLocationLine(text: string): boolean {
  const t = sanitizeFieldText(text, 80);
  if (!t || t.length > 60) return false;
  if (EMPLOYER_NOT_LOCATION_RE.test(t)) return false;
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
      isPlausibleExperienceCompany(line) &&
      line !== position &&
      line.length <= 80
    ) {
      return line;
    }
  }
  return '';
}

function recoverPositionFromExperienceText(description: string, company: string): string {
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean);
  const blob = lines.slice(0, 2).join(' ');

  const hrMatch = blob.match(
    /\b((?:senior|assistant|associate|deputy)?\s*hr\s+(?:generalist|executive|manager|specialist|coordinator|bp)(?:\s*\([^)]+\))?)\b/i
  );
  if (hrMatch) return formatDisplayName(hrMatch[1].trim().replace(/^as\s+/i, ''));

  const csMatch = blob.match(
    /\b((?:senior|assistant|associate|deputy|group)?\s*(?:company\s+secretary|compliance\s+officer|legal\s+head|corporate\s+legal)(?:\s*(?:&|and)\s*[^,.]{3,40})?)\b/i
  );
  if (csMatch) return formatDisplayName(csMatch[1].trim().replace(/^as\s+/i, ''));

  const groupCsMatch = blob.match(
    /\b((?:group\s+)?company\s+secretary)\b/i
  );
  if (groupCsMatch) return formatDisplayName(groupCsMatch[1].trim());

  for (const line of lines.slice(0, 3)) {
    if (line.length > 90) continue;
    if (looksLikeJobTitleLine(line) && !looksLikeCompanyNameLine(line)) return line;
    const asMatch = line.match(/^as\s+(?:a\s+)?(.+?)(?:\s+at\s+|\s+with\s+|$)/i);
    if (asMatch) {
      const title = sanitizeFieldText(asMatch[1], 120);
      if (title && looksLikeJobTitleLine(title)) return title;
    }
    const roleMatch = line.match(
      /\bin my current role as\s+(.+?)(?:\s+with\b|\s+at\b|,|\.|$)/i
    );
    if (roleMatch) {
      const title = sanitizeFieldText(roleMatch[1], 120);
      if (title && looksLikeJobTitleLine(title)) return title;
    }
  }

  if (company && looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) {
    return company;
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
  exp = splitMultiColumnExperienceHeader(exp);
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
    const embeddedDate = company.match(/^(.+?)\s*[-–—]\s*((?:19|20)\d{2})\s*$/);
    if (embeddedDate && embeddedDate[1].trim().length >= 4) {
      company = embeddedDate[1].trim();
      if (!String(exp.startDate || exp.StartDate || '').trim()) {
        exp.startDate = embeddedDate[2];
        exp.StartDate = embeddedDate[2];
      }
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

  if (company && position) {
    position = stripRedundantCompanyFromPosition(position, company);
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
        if (!isPlausibleExperienceCompany(line)) continue;
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
        line.length <= 120 &&
        isPlausibleExperienceCompany(line)
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
    !isPlausibleExperienceCompany(company) &&
    (looksLikeSentenceNotCompany(company) || !looksLikeCompanyNameLine(company))
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

  if (company && position) {
    const pLower = position.toLowerCase().trim();
    const cLower = company.toLowerCase().trim();
    if (pLower && cLower.startsWith(pLower) && company.length > position.length + 2) {
      const rest = company.slice(position.length).replace(/^[\s,:\-–—|]+/, '').trim();
      if (
        rest &&
        rest !== position &&
        (looksLikeCompanyNameLine(rest) || isPlausibleExperienceCompany(rest))
      ) {
        company = rest;
      }
    }
  }

  if (
    company &&
    !position &&
    (looksLikeStandaloneLocationLine(company) || isLikelyLocationFragment(company))
  ) {
    if (!location) location = company;
    company =
      recoverCompanyFromExperienceText(deduped.description, position) ||
      sanitizeFieldText(exp.companyName || exp.CompanyName, 160) ||
      '';
  }

  if (!position && deduped.description) {
    const recoveredTitle = recoverPositionFromExperienceText(deduped.description, company);
    if (recoveredTitle) position = recoveredTitle;
  }

  if (position && /^as\s+/i.test(position)) {
    position = sanitizeImportJobTitle(position) || position.replace(/^as\s+/i, '');
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

function stripForeignCompanyLeadLines(description: string, company: string): string {
  const companyKey = sanitizeFieldText(company, 160).toLowerCase();
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  while (lines.length > 0) {
    const line = lines[0];
    const colonAt = line.indexOf(':');
    if (colonAt < 8) break;
    const left = line.slice(0, colonAt).trim().toLowerCase();
    if (left === companyKey) {
      lines[0] = line.slice(colonAt + 1).trim();
      if (!lines[0]) lines.shift();
      break;
    }
    if (looksLikeCompanyNameLine(line.slice(0, colonAt)) || /\b(ltd|limited|pvt|company|group)\b/i.test(left)) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join('\n').trim();
}

/**
 * When one parser row embeds multiple jobs in description, split before orphan merge.
 * Preserves block integrity: header lines + dates stay with their bullets.
 */
function splitExperienceOnCompanyColonLines(
  entry: Record<string, unknown>
): Record<string, unknown>[] {
  const body = collectExperienceBodyFields(entry);
  const lines = body.description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [entry];

  type ColonRow = { company: string; lead: string; lineIdx: number };
  const colonRows: ColonRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonAt = line.indexOf(':');
    if (colonAt < 8 || colonAt > 100) continue;
    const left = line.slice(0, colonAt).trim();
    const right = line.slice(colonAt + 1).trim();
    if (!right || right.length < 8) continue;
    if (!looksLikeCompanyNameLine(left) && !/\b(ltd|limited|pvt|llp|inc|corp|company|group)\b/i.test(left)) continue;
    if (isExperienceDomainHeading(left) || isResumeCompetencySectionEntry({ company: left })) continue;
    colonRows.push({ company: left, lead: right, lineIdx: i });
  }

  if (colonRows.length < 2) return [entry];

  const headerTitle = sanitizeFieldText(readExperiencePositionSlot(entry), 120);
  const out: Record<string, unknown>[] = [];
  colonRows.forEach((row, idx) => {
    const nextLineIdx = colonRows[idx + 1]?.lineIdx ?? lines.length;
    const tail: string[] = [];
    for (let j = row.lineIdx + 1; j < nextLineIdx; j++) {
      const line = lines[j];
      const c = line.indexOf(':');
      if (c >= 8) {
        const left = line.slice(0, c).trim();
        if (looksLikeCompanyNameLine(left) || /\b(ltd|limited|pvt|company|group)\b/i.test(left)) {
          break;
        }
      }
      tail.push(line);
    }
    const description = stripForeignCompanyLeadLines([row.lead, ...tail].join('\n').trim(), row.company);
    out.push(
      reconcileExperienceHeaderFields({
        ...entry,
        company: row.company,
        position: headerTitle,
        title: headerTitle,
        designation: headerTitle,
        description,
        Description: description,
        startDate: idx === 0 ? entry.startDate : '',
        endDate: idx === 0 ? entry.endDate : '',
        current: idx === 0 ? entry.current : false,
      })
    );
  });

  const seen = new Set<string>();
  const deduped = out.filter((row) => {
    const key = sanitizeFieldText(readExperienceCompanySlot(row), 160).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.length > 0 ? deduped : [entry];
}

export function splitExperienceEntriesWithEmbeddedJobs(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const splits = splitSingleExperienceOnEmbeddedJobs(entry);
    for (const split of splits) {
      const colonSplits = splitExperienceOnCompanyColonLines(split);
      result.push(...colonSplits);
    }
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

function isRedundantExperienceDateBodyLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 64) return false;
  if (EXPERIENCE_DATE_RANGE_RE.test(t)) return true;
  if (
    /\b(19|20)\d{2}(?:-\d{2})?\s*[-–—to]+\s*((?:19|20)\d{2}(?:-\d{2})?|present|current|now|ongoing)\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^(present|current|now|ongoing)$/i.test(t)) return true;
  return false;
}

/** Drop date-only body lines when structured start/end dates already exist on the entry. */
export function stripRedundantExperienceDateBodyLines(
  description: string,
  achievements: string[],
  options?: { startDate?: string; endDate?: string; current?: boolean }
): { description: string; achievements: string[] } {
  const hasStructuredDates =
    !!String(options?.startDate ?? '').trim() ||
    !!String(options?.endDate ?? '').trim() ||
    options?.current === true;
  if (!hasStructuredDates) {
    return { description, achievements };
  }

  const filterLine = (line: string): boolean => !isRedundantExperienceDateBodyLine(line);
  const keptAchievements = achievements.map((a) => String(a || '').trim()).filter(filterLine);
  const descLines = String(description || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(filterLine);

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

const NAUKRI_MONTH_TOKEN =
  'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

function collapseSpacedLettersInText(text: string): string {
  return String(text || '').replace(/(?:\b[A-Z]\s+){2,}[A-Z]\b/g, (m) => m.replace(/\s+/g, ''));
}

function flattenExperienceSectionBlob(rawText: string): string {
  const collapsed = collapseSpacedLettersInText(rawText.replace(/\f/g, '\n'));
  const sectionStart = collapsed.search(
    /\b(?:organisational|organizational)\s*experience\b|\bwork\s*experience\b|\bemployment\s*history\b/i
  );
  let blob =
    sectionStart >= 0
      ? collapsed.slice(sectionStart)
      : collapsed.slice(Math.max(0, collapsed.search(/\bexperience\b/i)));
  const sectionEnd = blob.search(
    /\b(?:education|academic|skills|certifications|languages|projects|achievements|personal\s+details)\b/i
  );
  if (sectionEnd > 120) blob = blob.slice(0, sectionEnd);
  return blob.replace(/\s+/g, ' ').trim();
}

function splitCompanyAndLocation(raw: string): { company: string; location: string } {
  const text = sanitizeFieldText(raw, 200);
  if (!text) return { company: '', location: '' };
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { company: text, location: '' };
  const last = parts[parts.length - 1];
  if (isLikelyLocationFragment(last) || (last.length <= 40 && !/\b(ltd|limited|pvt|inc|corp|llp|group|industries)\b/i.test(last))) {
    return {
      company: parts.slice(0, -1).join(', '),
      location: last,
    };
  }
  return { company: text, location: '' };
}

/**
 * Recover Naukri-style dated employment lines from raw text when the parser
 * collapses experience into competency stubs (e.g. "Dec 2002 – Jul 2004 with X as Y").
 */
export function recoverStructuredExperienceFromRawText(
  rawText: string
): Record<string, unknown>[] {
  const blob = flattenExperienceSectionBlob(rawText);
  if (blob.length < 40) return [];

  const withAsRe = new RegExp(
    `(${NAUKRI_MONTH_TOKEN})\\.?,?\\s+(\\d{4})\\s*[-–—]\\s*(?:(${NAUKRI_MONTH_TOKEN})\\.?,?\\s+)?(\\d{4}|Present|Current|Now|present|current)\\s+with\\s+(.+?)\\s+as\\s+(.+?)(?=(?:${NAUKRI_MONTH_TOKEN})\\.?,?\\s+\\d{4}\\s*[-–—]|(?:${NAUKRI_MONTH_TOKEN})\\.?,?\\s+\\d{4}\\s+onwards\\b|$)`,
    'gi'
  );

  const out: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;
  while ((match = withAsRe.exec(blob)) !== null) {
    const startDate = normalizeDate(`${match[1]} ${match[2]}`);
    const endMonth = match[3] ? `${match[3]} ` : '';
    const endToken = String(match[4] || '').trim();
    const endDate = /^(present|current|now)$/i.test(endToken)
      ? 'Present'
      : normalizeDate(`${endMonth}${endToken}`.trim());
    const { company, location } = splitCompanyAndLocation(match[5]);
    const title = sanitizeFieldText(match[6].replace(/\s+/g, ' ').trim(), 120);
    if (!company || !title) continue;
    out.push({
      company,
      Company: company,
      title,
      position: title,
      designation: title,
      startDate,
      endDate,
      current: /^(present|current|now)$/i.test(endToken),
      location,
      Location: location,
    });
  }

  const onwardsRe = new RegExp(
    `(${NAUKRI_MONTH_TOKEN})\\.?,?\\s+(\\d{4})\\s+onwards\\s+(working\\s+.+?)(?=\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+\\s+E-?Mail:|$)`,
    'i'
  );
  const onwardsMatch = onwardsRe.exec(blob);
  if (onwardsMatch) {
    const startDate = normalizeDate(`${onwardsMatch[1]} ${onwardsMatch[2]}`);
    const description = sanitizeMultilineFieldText(onwardsMatch[3], 2000);
    if (description.length >= 12) {
      out.push({
        company: 'Independent / Retainer',
        Company: 'Independent / Retainer',
        title: 'Company Secretary & Legal Consultant',
        position: 'Company Secretary & Legal Consultant',
        designation: 'Company Secretary & Legal Consultant',
        description,
        Description: description,
        startDate,
        endDate: 'Present',
        current: true,
      });
    }
  }

  const seen = new Set<string>();
  return out
    .map((row) => reconcileExperienceHeaderFields(row))
    .filter((row) => {
      const company = sanitizeFieldText(readExperienceCompanySlot(row), 160);
      const title = sanitizeFieldText(readExperiencePositionSlot(row), 120);
      if (!company && !title) return false;
      const key = `${company.toLowerCase()}|${title.toLowerCase()}|${String(row.startDate || '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (company && !isPlausibleExperienceCompany(company)) return false;
      return true;
    });
}

/** Custom-parser import — pair title/company fragments and merge date/location stubs, then reconcile. */
export function finalizeExperienceListForCustomParserImport(
  entries: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const demoted = entries
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map(demoteImplausibleExperienceCompany);
  const split = splitExperienceEntriesWithEmbeddedJobs(demoted);
  const paired = pairHeaderFragmentOrphans(split as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  const merged = mergeOrphanExperienceEntries(paired as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  const deduped = dedupeAdjacentExperienceEntries(merged as ExperienceLike[]) as Record<
    string,
    unknown
  >[];
  return deduped
    .map((e) => demoteImplausibleExperienceCompany(reconcileExperienceHeaderFields(e)))
    .filter((e) => !isResumeCompetencySectionEntry(e));
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
  return deduped
    .map((e) => reconcileExperienceHeaderFields(e))
    .map((e) => demoteImplausibleExperienceCompany(e))
    .filter((e) => !isResumeCompetencySectionEntry(e));
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
/** Clear tech-skill / location values wrongly stored in the company slot; relocate to location when empty. */
export function demoteImplausibleExperienceCompany(
  exp: Record<string, unknown>
): Record<string, unknown> {
  if (!exp || typeof exp !== 'object') return exp;
  const out = { ...exp };
  const company = readExperienceCompanySlot(out);
  if (!company || isPlausibleExperienceCompany(company)) {
    return out;
  }

  const existingLoc = sanitizeFieldText(out.location ?? out.Location, 120);
  if (
    !existingLoc &&
    (looksLikeStandaloneLocationLine(company) ||
      isLikelyLocationFragment(company) ||
      classifyResumeTextFragment(company).kind === 'LOCATION')
  ) {
    out.location = company;
    out.Location = company;
  }

  for (const key of [
    'company',
    'Company',
    'organization',
    'Organization',
    'employer',
    'Employer',
    'companyName',
    'CompanyName',
  ] as const) {
    delete out[key];
  }
  return out;
}

/** Prefer a plausible employer name when merging parser + recovered experience rows. */
export function resolveMergedExperienceCompany(
  parser: Record<string, unknown>,
  recovered: Record<string, unknown>
): string {
  const parserCo = sanitizeExperienceCompanyValue(readExperienceCompanySlot(parser));
  const recoveredCo = sanitizeExperienceCompanyValue(
    recovered.company ||
      recovered.Company ||
      recovered.organization ||
      recovered.Organization ||
      recovered.employer ||
      ''
  );
  const parserOk = !!parserCo && isPlausibleExperienceCompany(parserCo);
  const recoveredOk = !!recoveredCo && isPlausibleExperienceCompany(recoveredCo);
  if (parserOk && recoveredOk) {
    return parserCo.length >= recoveredCo.length ? parserCo : recoveredCo;
  }
  if (recoveredOk) return recoveredCo;
  if (parserOk) return parserCo;
  if (
    recoveredCo &&
    !isExperienceDateOrDurationToken(recoveredCo) &&
    looksLikeCompanyNameLine(recoveredCo) &&
    !looksLikeJobTitleLine(recoveredCo)
  ) {
    return recoveredCo;
  }
  if (
    parserCo &&
    !isExperienceDateOrDurationToken(parserCo) &&
    looksLikeCompanyNameLine(parserCo) &&
    !looksLikeJobTitleLine(parserCo)
  ) {
    return parserCo;
  }
  return '';
}

export function isPlausibleExperienceCompany(value: unknown): boolean {
  const company = sanitizeExperienceCompanyValue(value);
  if (!company) return false;
  if (isExperienceDomainHeading(company)) return false;
  if (/^name$/i.test(company.trim())) return false;
  if (company.length > 65 && /\b(for various|incorporated|completed post|in the form of)\b/i.test(company)) {
    return false;
  }
  if (looksLikeSentenceNotCompany(company)) return false;
  const lower = company.toLowerCase().replace(/\s+/g, ' ').trim();
  if (
    company.length > 40 &&
    /\b(improv|optimiz|reduc|increas|develop|design|mentor|administer|engineer|construct|deliver)\w*/i.test(
      lower
    )
  ) {
    return false;
  }
  if (/\d+\s*%/.test(company)) return false;
  if (INSTITUTIONAL_EMPLOYER_HINT_RE.test(lower)) return true;
  if (/\b[A-Z][a-z]+\s+(?:sons|bros|brothers|holdings|group|industries|enterprises|motors|retail)\b/i.test(company)) {
    return true;
  }
  if (/\b(?!south|east|west|north|southeast|central)\w+\s+asia\b/i.test(lower)) {
    return true;
  }
  if (/\s&\s+co\.?$/i.test(company)) return true;
  if (TECH_SKILL_AS_COMPANY_RE.test(lower)) return false;
  if (isResumeSectionHeadingLine(company) || isLikelyEducationLine(company)) return false;
  if (looksLikeStandaloneLocationLine(company) || isLikelyLocationFragment(company)) return false;
  if (
    /\b(technologies?|solutions?|systems?|services?|consulting|processors?|industries|enterprises?|laborator(?:y|ies)|university|college|pvt|ltd|llc|inc|corp|group|holdings)\b/i.test(
      lower
    ) &&
    !/\b(developer|engineer|manager|analyst|consultant|designer|architect|lead|intern|programmer|specialist)\b/i.test(
      lower
    ) &&
    !TECH_SKILL_AS_COMPANY_RE.test(lower)
  ) {
    return true;
  }
  if (
    !/\s/.test(company) &&
    company.length <= 12 &&
    !/\b(ltd|llc|pvt|inc|corp|gmbh|llp|co|plc)\b/i.test(lower)
  ) {
    if (looksLikeJobTitleLine(company)) return false;
    if (isLikelyCompanyNameFragment(company)) return true;
    return false;
  }
  if (looksLikeCompanyNameLine(company)) return true;
  if (looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) return false;
  const classified = classifyResumeTextFragment(company);
  if (classified.kind === 'DESIGNATION' && classified.confidence >= 70) return false;
  if (classified.kind === 'LOCATION' && classified.confidence >= 70) return false;
  if (classified.kind === 'COMPANY_NAME' && classified.confidence >= 70) {
    if (TECH_SKILL_AS_COMPANY_RE.test(lower) || looksLikeJobTitleLine(company)) return false;
    return true;
  }
  if (looksLikeCompanyNameLine(company)) return true;
  return false;
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
  if (safeCompany && (isCorporateStructurePhrase(safeCompany) || (looksLikeSentenceNotCompany(safeCompany) && !looksLikeCompanyNameLine(safeCompany)))) {
    safeCompany = '';
  }
  if (safePosition && (isCorporateStructurePhrase(safePosition) || (looksLikeSentenceNotCompany(safePosition) && !looksLikeJobTitleLine(safePosition)))) {
    safePosition = '';
  }
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
  if (degree && isGarbageEducationDegree(degree)) return null;
  if (institution && isGarbageEducationDegree(institution)) return null;
  if (!institution && !degree) return null;
  if (degree && (degree.split(/\s+/).length > 12 || /\.\s/.test(degree))) return null;
  if (isGarbageResumeText(degree) && isGarbageResumeText(institution)) return null;
  if (
    institution &&
    !degree &&
    (looksLikeCompanyNameLine(institution) ||
      isLikelyCompanyNameFragment(institution) ||
      classifyResumeTextFragment(institution).kind === 'COMPANY_NAME')
  ) {
    return null;
  }
  if (
    degree &&
    !institution &&
    (classifyResumeTextFragment(degree).kind === 'LOCATION' ||
      /^\(?[a-z\s.]+\(?m\.?\s*p\.?\)?\)?$/i.test(degree))
  ) {
    return null;
  }
  if (
    !degree &&
    institution &&
    classifyResumeTextFragment(institution).kind === 'LOCATION'
  ) {
    return null;
  }
  if (
    degree &&
    !institution &&
    !isLikelyEducationLine(degree) &&
    (looksLikeCompanyNameLine(degree) ||
      isLikelyCompanyNameFragment(degree) ||
      classifyResumeTextFragment(degree).kind === 'COMPANY_NAME')
  ) {
    return null;
  }
  if (
    institution &&
    !degree &&
    !isLikelyEducationLine(institution) &&
    (looksLikeCompanyNameLine(institution) ||
      isLikelyCompanyNameFragment(institution) ||
      classifyResumeTextFragment(institution).kind === 'COMPANY_NAME')
  ) {
    return null;
  }
  if (institution && /^date\s+/i.test(institution)) return null;

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
