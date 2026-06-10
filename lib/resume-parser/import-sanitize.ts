/**
 * Sanitization for resume import → builder mapping.
 * Rejects parser fallbacks and merged blobs; splits names for contact fields.
 */

import { cleanString } from './normalize-extracted';
import {
  isClassifiedPersonName,
  isEmailOrDomainFragment,
  isFirmOrLocationNamePhrase,
  splitClassifiedFullName,
  type ClassifiedText,
} from './field-classification';

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

  // Reject pure-numeric, percentage-only, or noise tokens
  if (/^\d+\.?\d*\s*%?$/.test(s)) return '';
  if (SKILL_NOISE_TOKENS.has(s.toLowerCase())) return '';

  // Reject CSV/sentence blobs (multiple commas or newlines)
  if (s.includes('\n')) return '';
  if ((s.match(/,/g) || []).length > 2) return '';
  if (s.length > 60 && /\s\w+\s\w+\s\w+/.test(s)) return ''; // a sentence

  return s;
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
 */
export function sanitizeCertificationEntry(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const name = sanitizeFieldText(value, 200);
    if (!name) return null;
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

  if (position && isLikelyJobTitle(position) && !company) return hasDates;
  if (company && isLikelyCompanyName(company) && !position) return hasDates;

  return false;
}

export function sanitizeExperienceEntry(exp: Record<string, unknown>): Record<string, unknown> | null {
  const company = sanitizeFieldText(
    exp.company || exp.Company || exp.organization || exp.Organization || exp.employer,
    120
  );
  let position = sanitizeFieldText(
    exp.position ||
      exp.Position ||
      exp.jobTitle ||
      exp.JobTitle ||
      exp.job_title ||
      exp.title ||
      exp.role,
    120
  );
  if (
    company &&
    position &&
    position.toLowerCase() === company.toLowerCase()
  ) {
    position = '';
  }
  const description = sanitizeFieldText(exp.description || exp.Description, 2000);
  if (!company && !position && !description) return null;
  if (isGarbageResumeText(company) && isGarbageResumeText(position)) return null;
  if (!isValidExperienceEntry({ company, position, startDate: String(exp.startDate || ''), endDate: String(exp.endDate || ''), description })) {
    return null;
  }

  return {
    ...exp,
    company,
    Company: company,
    position,
    Position: position,
    title: position,
    description,
    Description: description,
    location: sanitizeFieldText(exp.location || exp.Location, 120),
    startDate: exp.startDate || exp.start_date || '',
    endDate: exp.endDate || exp.end_date || '',
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
    description: sanitizeFieldText(edu.description || edu.Description, 500),
    location: sanitizeFieldText(edu.location || edu.Location, 120),
    year: edu.year || edu.endDate || '',
    startDate: edu.startDate || edu.start_date || '',
    endDate: edu.endDate || edu.end_date || edu.year || '',
    gpa: sanitizeFieldText(edu.gpa || edu.GPA, 20),
  };
}
