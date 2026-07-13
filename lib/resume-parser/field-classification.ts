/**
 * Classification layer between parser output and form mapping.
 * Only PERSON_NAME may populate contact name fields.
 */

import { cleanString } from '@/lib/resume-parser/normalize-extracted';

export type TextClassificationKind =
  | 'PERSON_NAME'
  | 'DESIGNATION'
  | 'SECTION_HEADER'
  | 'COMPANY_NAME'
  | 'LOCATION'
  | 'PROJECT_NAME'
  | 'SKILL'
  | 'CERTIFICATION'
  | 'ACHIEVEMENT'
  | 'EDUCATION'
  | 'EXPERIENCE'
  | 'UNKNOWN';

export interface ClassifiedText {
  kind: TextClassificationKind;
  confidence: number;
  value: string;
}

export interface AdditionalResumeData {
  sectionHeaders: string[];
  unclassifiedFragments: Array<{ value: string; kind: TextClassificationKind }>;
  achievements: string[];
  awards: string[];
  memberships: string[];
  publications: string[];
  patents: string[];
  volunteerWork: string[];
  extraSections: Array<{ heading: string; body: string }>;
}

export function emptyAdditionalResumeData(): AdditionalResumeData {
  return {
    sectionHeaders: [],
    unclassifiedFragments: [],
    achievements: [],
    awards: [],
    memberships: [],
    publications: [],
    patents: [],
    volunteerWork: [],
    extraSections: [],
  };
}

/** Words that must never appear in a personal name field. */
export const SECTION_HEADER_WORDS = new Set([
  'professional',
  'qualification',
  'qualifications',
  'profile',
  'summary',
  'experience',
  'education',
  'articleship',
  'achievements',
  'achievement',
  'competencies',
  'competency',
  'skills',
  'skill',
  'projects',
  'project',
  'certifications',
  'certification',
  'training',
  'history',
  'employment',
  'journey',
  'background',
  'overview',
  'biography',
  'bio',
  'objective',
  'contact',
  'details',
  'information',
  'membership',
  'memberships',
  'publications',
  'patents',
  'volunteer',
  'awards',
  'honors',
  'honours',
  'recognition',
  'languages',
  'language',
  'hobbies',
  'interests',
  'references',
  'curriculum',
  'vitae',
  'resume',
  'cv',
  'about',
  'introduction',
  'expertise',
  'strengths',
  'capabilities',
  'academics',
  'academic',
  'credentials',
  'licenses',
  'licences',
  'courses',
  'workshop',
  'workshops',
  'continuing',
  'development',
  'personal',
  'technical',
  'core',
  'key',
  'notable',
  'selected',
  'major',
  'minor',
  'executive',
  'career',
  'employment',
  'positions',
  'held',
  'record',
  'engagements',
  'assignments',
  'portfolio',
  'case',
  'studies',
  'synopsis',
  'legal',
  'board',
  'manufacturing',
  'industry',
  'sector',
]);

const SECTION_HEADER_PHRASES: RegExp[] = [
  /^career\s+objective$/i,
  /^career\s+synopsis$/i,
  /^executive\s+summary$/i,
  /^board\s+experience$/i,
  /^legal\s+experience$/i,
  /^professional\s+qualifications?$/i,
  /^professional\s+qualification$/i,
  /^professional\s+profile$/i,
  /^professional\s+summary$/i,
  /^professional\s+journey$/i,
  /^professional\s+background$/i,
  /^professional\s+experience$/i,
  /^professional\s+achievements?$/i,
  /^cs\s+articleship$/i,
  /^articleship$/i,
  /^articleship\s+training$/i,
  /^articleship\s+programme?$/i,
  /^(?:summary|profile|experience|education|skills?|projects?)$/i,
  /^work\s+history$/i,
  /^employment\s+history$/i,
  /^key\s+achievements?$/i,
  /^key\s+accomplishments?$/i,
  /^core\s+competenc(?:y|ies)$/i,
  /^technical\s+skills?$/i,
  /^academic\s+qualifications?$/i,
  /^educational\s+qualifications?$/i,
  /^certifications?\s+(?:&|and)\s+/i,
  /^languages?\s+(?:&|and)\s+/i,
];

const CREDENTIAL_ONLY_TOKENS = new Set(['cs', 'ca', 'cma', 'cfa', 'cpa', 'mba', 'phd', 'md']);

const COMPANY_NAME_MARKERS =
  /\b(?:inc\.?|ltd\.?|llc|llp|corp(?:oration)?|gmbh|co\.?|company|technologies|solutions|systems|labs|studios|consulting|consultancy|industries|group|enterprises|services|associates|partners|holdings|bank|motors|limited|pvt\.?|university|college|institute)\b/i;

const JOB_TITLE_MARKERS =
  /\b(?:engineer|developer|architect|manager|director|lead|head|consultant|analyst|designer|administrator|specialist|coordinator|associate|executive|officer|programmer|intern|trainee|founder|owner|ceo|cto|cfo|coo|vp|president|principal|scientist|researcher|accountant|auditor|secretary|artist|teacher|nurse|lawyer|attorney|partner|advisor|adviser)\b/i;

const NON_NAME_VOCAB =
  /\b(?:turnover|revenue|crores?|lakhs?|millions?|billions?|managed|managing|responsible|clients?|achieved|delivered|implemented|designed|developed|annual|growth|profit|sales|operations|department|division)\b/i;

const NAME_STOPWORDS = new Set([
  'of', 'the', 'and', 'or', 'around', 'with', 'for', 'to', 'in', 'at', 'from', 'by', 'a', 'an', 'as', 'on',
]);

/** Dictionary / resume vocabulary — never a personal name token. */
const NON_PERSON_NAME_WORDS = new Set([
  'academia',
  'academic',
  'academics',
  'manufacturing',
  'logistics',
  'banking',
  'insurance',
  'automotive',
  'pharmaceutical',
  'healthcare',
  'telecom',
  'retail',
  'construction',
  'professional',
  'qualification',
  'qualifications',
  'turnover',
  'crores',
  'crore',
  'lakhs',
  'lakh',
  'group',
  'company',
  'ruchi',
  'heading',
  'secretarial',
  'department',
  'self',
  'practise',
  'practice',
  'practicing',
  'practising',
  'portal',
  'chambers',
  'chamber',
]);

/** Common Indian city tokens often appended to firm lines (e.g. "Self Practise Bhopal"). */
const INDIAN_CITY_TOKENS = new Set([
  'bhopal', 'indore', 'delhi', 'mumbai', 'pune', 'noida', 'gurugram', 'gurgaon',
  'hyderabad', 'chennai', 'kolkata', 'bangalore', 'bengaluru', 'jaipur', 'lucknow',
  'ahmedabad', 'surat', 'vadodara', 'nagpur', 'raipur', 'patna', 'kochi', 'cochin',
  'chandigarh', 'ludhiana', 'amritsar', 'bhubaneswar', 'dehradun', 'coimbatore',
  'guwahati', 'ranchi', 'jodhpur', 'kota', 'udaipur', 'agra', 'nashik', 'kanpur',
  'varanasi', 'prayagraj', 'faridabad', 'ghaziabad', 'visakhapatnam', 'thiruvananthapuram',
  'mysore', 'mysuru', 'meerut', 'srinagar', 'shimla', 'panaji', 'goa',
  'aurangabad', 'chhatrapati sambhajinagar', 'thrissur', 'madurai', 'vijayawada',
]);

/** Allowlisted 2-letter surnames (East Asian / short legal names). */
const SHORT_VALID_SURNAMES = new Set(['li', 'wu', 'ng', 'yu', 'oh', 'ho', 'lu', 'ma', 'xu', 'ko', 'an']);

function normalizeFragment(value: unknown): string {
  return cleanString(value).replace(/\s+/g, ' ').trim();
}

function containsSectionHeaderWord(value: string): boolean {
  const words = value.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  if (words.every((w) => SECTION_HEADER_WORDS.has(w))) return true;
  const hits = words.filter((w) => SECTION_HEADER_WORDS.has(w)).length;
  return hits >= 1 && hits / words.length >= 0.5;
}

export function isLikelyJobTitleFragment(value: string): boolean {
  const s = normalizeFragment(value);
  if (!s) return false;
  if (
    /\b(?:chief\s+\w+\s+officer|managing\s+director|vice\s+president|company\s+secretary|chartered\s+accountant|compliance\s+officer|legal\s+head|board\s+member|independent\s+director)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (/^(head|officer|secretary|member|director)$/i.test(s)) return true;
  return JOB_TITLE_MARKERS.test(s) && s.split(/\s+/).length <= 6;
}

export function isLikelyCompanyNameFragment(value: string): boolean {
  const s = normalizeFragment(value);
  if (!s) return false;
  if (COMPANY_NAME_MARKERS.test(s)) return true;
  if (
    /^[A-Z][A-Za-z0-9&.'-]{2,24}$/.test(s) &&
    !JOB_TITLE_MARKERS.test(s) &&
    !INDIAN_CITY_TOKENS.has(s.toLowerCase())
  ) {
    return true;
  }
  return false;
}

export function isLikelyLocationFragment(value: string): boolean {
  const s = normalizeFragment(value);
  if (!s || s.length > 72) return false;
  if (JOB_TITLE_MARKERS.test(s)) return false;
  if (COMPANY_NAME_MARKERS.test(s)) return false;
  if (/\b(?:hospitals?|healthcare|chartered|assistance|generation|analytics|logistics|motors|retail|pharma|laborator(?:y|ies)|universit(?:y|ies)|colleges?|schools?|clinics?|banks?|insurance|vidyalaya|vidyalay|asia|partners|associates|diagnostics|pathlabs?)\b/i.test(s)) {
    return false;
  }
  // Corporate meeting / compliance phrases from summaries — not places.
  if (
    /\b(?:meetings?|committees?|compliances?|governance|regulations?|policies|procedures|resolutions?|diligence|prospectus)\b/i.test(
      s
    )
  ) {
    return false;
  }
  if (/\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/.test(s)) {
    return true;
  }
  if (/^(remote|hybrid|on-?site|work from home|wfh)$/i.test(s)) return true;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && words.every((w) => INDIAN_CITY_TOKENS.has(w.toLowerCase()))) return true;
  if (words.length === 1 && INDIAN_CITY_TOKENS.has(words[0].toLowerCase())) return true;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(s) && !/\d/.test(s) && words.length <= 3) {
    return !isLikelyCompanyNameFragment(s);
  }
  return false;
}

/** CS/CA firm lines and city suffixes — not personal names. */
export function nameOverlapsLocation(name: string, location: string): boolean {
  const nameWords = name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  const locTokens = location
    .toLowerCase()
    .split(/[,\s/]+/)
    .map((t) => t.replace(/[^a-z]/g, ''))
    .filter((w) => w.length >= 4);
  if (!nameWords.length || !locTokens.length) return false;
  return nameWords.some((nw) =>
    locTokens.some((lt) => nw === lt || nw.startsWith(lt) || lt.startsWith(nw))
  );
}

export function isFirmOrLocationNamePhrase(value: string, locationHint = ''): boolean {
  const s = normalizeFragment(value);
  if (!s) return false;
  if (/\bself\s+practi[cs]e\b/i.test(s)) return true;
  if (/\bself\s+employment\b/i.test(s)) return true;
  if (/\bpracti[cs]e\b/i.test(s) && s.split(/\s+/).length <= 4) return true;
  if (/\bself\b/i.test(s) && s.split(/\s+/).length >= 2) return true;
  if (locationHint && nameOverlapsLocation(s, locationHint)) return true;

  const words = s.toLowerCase().split(/\s+/).filter(Boolean);
  const hasCity = words.some((w) => INDIAN_CITY_TOKENS.has(w));
  if (hasCity && words.length >= 3) return true;
  if (hasCity && words.some((w) => /practi[cs]e|self|chamber/i.test(w))) return true;

  return false;
}

/** Email addresses, domain fragments, and TLD tokens — never personal names. */
export function isEmailOrDomainFragment(value: string): boolean {
  const s = normalizeFragment(value);
  if (!s) return false;
  if (/@/.test(s)) return true;
  if (/\.(?:com|net|org|in|co|edu|gov|io|uk|au|me)\b/i.test(s)) return true;
  if (
    /^(?:gmail|yahoo|hotmail|outlook|rediffmail|protonmail|icloud|live|msn)(?:\.[a-z]{2,})?$/i.test(
      s
    )
  ) {
    return true;
  }
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(s) && !/\s/.test(s)) return true;
  return false;
}

function passesPersonNameShape(value: string): boolean {
  const s = value
    .replace(/^(?:mr|mrs|ms|miss|dr|prof|ca|cs|cma|cfa|cpa|mba)\.?\s+/i, '')
    .trim();
  if (s.length < 2 || s.length > 60) return false;
  if (isEmailOrDomainFragment(s)) return false;
  if (/[@+#]/.test(s) || /https?:|\bwww\./i.test(s)) return false;
  if (/\d/.test(s)) return false;
  if (NON_NAME_VOCAB.test(s)) return false;

  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 5) return false;

  const stopCount = words.filter((w) => NAME_STOPWORDS.has(w.toLowerCase())).length;
  if (stopCount >= 2) return false;
  if (words.length >= 2 && stopCount / words.length >= 0.34) return false;
  if (!words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w) && w.length >= 2)) return false;
  if (words.some((w) => NON_PERSON_NAME_WORDS.has(w.toLowerCase()))) return false;
  if (words.length >= 2) {
    const last = words[words.length - 1].toLowerCase();
    if (last.length === 2 && !SHORT_VALID_SURNAMES.has(last)) return false;
  }
  if (words.length >= 3 && words.every((w) => w === w.toLowerCase())) return false;

  return true;
}

export function classifyResumeTextFragment(value: unknown): ClassifiedText {
  const valueNorm = normalizeFragment(value);
  if (!valueNorm) return { kind: 'UNKNOWN', confidence: 0, value: '' };

  const lower = valueNorm.toLowerCase();

  if (isEmailOrDomainFragment(valueNorm)) {
    return { kind: 'UNKNOWN', confidence: 0, value: valueNorm };
  }

  if (SECTION_HEADER_PHRASES.some((re) => re.test(lower))) {
    return { kind: 'SECTION_HEADER', confidence: 0, value: valueNorm };
  }

  if (containsSectionHeaderWord(valueNorm)) {
    return { kind: 'SECTION_HEADER', confidence: 0, value: valueNorm };
  }

  if (/\barticleship\b/i.test(valueNorm)) {
    return { kind: 'EDUCATION', confidence: 0, value: valueNorm };
  }

  if (isLikelyJobTitleFragment(valueNorm)) {
    return { kind: 'DESIGNATION', confidence: 88, value: valueNorm };
  }

  if (isLikelyCompanyNameFragment(valueNorm)) {
    const confidence = COMPANY_NAME_MARKERS.test(valueNorm) ? 92 : 78;
    return { kind: 'COMPANY_NAME', confidence, value: valueNorm };
  }

  if (isLikelyLocationFragment(valueNorm)) {
    return { kind: 'LOCATION', confidence: 82, value: valueNorm };
  }

  if (isFirmOrLocationNamePhrase(valueNorm)) {
    return { kind: 'DESIGNATION', confidence: 72, value: valueNorm };
  }

  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 1 && CREDENTIAL_ONLY_TOKENS.has(words[0])) {
    return { kind: 'CERTIFICATION', confidence: 0, value: valueNorm };
  }

  if (passesPersonNameShape(valueNorm)) {
    return { kind: 'PERSON_NAME', confidence: 75, value: valueNorm };
  }

  return { kind: 'UNKNOWN', confidence: 0, value: valueNorm };
}

export function isClassifiedPersonName(value: unknown, minConfidence = 50): boolean {
  const result = classifyResumeTextFragment(value);
  return result.kind === 'PERSON_NAME' && result.confidence >= minConfidence;
}

export function classifyNamePart(value: unknown): ClassifiedText {
  return classifyResumeTextFragment(value);
}

export function splitClassifiedFullName(fullName: string): {
  firstName: string;
  lastName: string;
  rejected: ClassifiedText[];
} {
  const classified = classifyResumeTextFragment(fullName);
  const rejected: ClassifiedText[] = [];

  if (classified.kind !== 'PERSON_NAME') {
    if (classified.value) rejected.push(classified);
    return { firstName: '', lastName: '', rejected };
  }

  const raw = classified.value;
  let parts = raw.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const camelSplit = parts[0].match(/[A-Z][a-z'-]+/g);
    if (camelSplit && camelSplit.length >= 2 && camelSplit.join('') === parts[0]) {
      parts = camelSplit;
    }
  }

  if (parts.length <= 1) {
    const partClass = classifyNamePart(parts[0] || '');
    if (partClass.kind !== 'PERSON_NAME') {
      if (partClass.value) rejected.push(partClass);
      return { firstName: '', lastName: '', rejected };
    }
    return { firstName: parts[0] || '', lastName: '', rejected };
  }

  const firstClass = classifyNamePart(parts[0]);
  const lastParts = parts.slice(1);
  const lastClass = classifyNamePart(lastParts.join(' '));

  const firstName = firstClass.kind === 'PERSON_NAME' ? parts[0] : '';
  const lastName = lastClass.kind === 'PERSON_NAME' ? lastParts.join(' ') : '';

  if (!firstName && firstClass.value) rejected.push(firstClass);
  if (!lastName && lastClass.value) rejected.push(lastClass);

  return { firstName, lastName, rejected };
}

/** Action verbs that signal job responsibilities — not standalone global achievements. */
const EXPERIENCE_RESPONSIBILITY_RE =
  /^\s*(?:managed|handled|coordinated|led|implement(?:ed|ing)?|supervised|maintained|develop(?:ed|ing)?|support(?:ed|ing)?|organiz(?:ed|ing)|organis(?:ed|ing)|prepared|conducted|assisted|monitored|reviewed|collaborated|facilitated|executed|operated|oversaw|delivered|designed|built|created|established|streamlined|optimiz(?:ed|ing)|optimis(?:ed|ing)|enhanced|ensured|provided|performed|reported|troubleshot|trained|mentored|negotiated|analyz(?:ed|ing)|analys(?:ed|ing)|researched|planned|scheduled|delegated|directed|administered|processed|resolved|identified|evaluated|recommended|presented|communicated|contributed|participated|worked|served|advised|consulted|liaised|liaisoned|liaison|updated|configured|deployed|tested|documented|architected|migrated|integrated|automated|validated|audited|inspected|regulated|complied|filed|drafted|negotiated|recruited|onboarded|on-boarded)\b/i;

/** Measurable impact markers — true achievements when present. */
const MEASURABLE_ACHIEVEMENT_RE =
  /\b(?:\d+\s*(?:%|percent|percentage)|(?:₹|rs\.?\s*|inr\s*|\$\s*|€\s*|£\s*)\s*\d[\d,.]*|\d[\d,.]*\s*(?:crore?s?|lakh?s?|million?s?|bn\b|k\+?)\b|team\s+of\s+\d+|\d+\+\s*(?:people|employees|clients|customers|users|projects|members)|\d{2,}\s*(?:people|employees|clients|customers|users|projects|members)|(?:increased|reduced|improved|decreased|lowered|raised|grew|boosted|saved|generated|achieved|delivered|exceeded|surpassed|cut)\s+(?:by\s+)?\d+\s*%|from\s+\d[\d,.]*\s*(?:%|to)\s+\d|within\s+\d+\s*(?:days?|weeks?|months?|years?))\b/i;

const EDUCATION_LINE_RE =
  /\b(?:university|college|school|institute|academy|b\.?\s*tech|m\.?\s*tech|bachelor|master|mba|ph\.?d|doctorate|diploma|graduation|post\s+graduation|b\.?\s*com|m\.?\s*com|b\.?\s*a\.?|m\.?\s*a\.?|ll\.?\s*b\.?|ll\.?\s*m\.?|b\.?\s*all\.?\s*b\.?|hsc|ssc|intermediate|matriculation|degree|articleship)\b/i;

const CERTIFICATION_LINE_RE =
  /\b(?:certif(?:ied|ication|icate)|professional\s+qualification|IATA|UFTAA|PMP|AWS|Google|Microsoft|license|licence|accredit(?:ation|ed)|credential|chartered|CPA|CFA|CMA|CS\s+executive|CA\s+final|training\s+course|diploma\s+course)\b/i;

const AWARD_ACHIEVEMENT_RE =
  /\b(?:award(?:ed|s)?|recogniz(?:ed|ition)|honou?r(?:ed|s)?|ranked|top\s+\d+|employee\s+of\s+the\s+(?:month|year|quarter)|best\s+\w+\s+award|president'?s?\s+award|merit\s+award|distinction|gold\s+medal|silver\s+medal)\b/i;

export function isLikelyEducationLine(text: string): boolean {
  const s = normalizeFragment(text);
  if (!s) return false;
  return EDUCATION_LINE_RE.test(s);
}

export function isLikelyCertificationLine(text: string): boolean {
  const s = normalizeFragment(text);
  if (!s) return false;
  if (/\b(?:university|college|bachelor|master|mba|b\.?\s*tech|m\.?\s*tech)\b/i.test(s)) {
    return false;
  }
  return CERTIFICATION_LINE_RE.test(s);
}

export function isMeasurableAchievement(text: string): boolean {
  const s = normalizeFragment(text);
  if (!s || s.length < 8) return false;
  if (isLikelyEducationLine(s) || isLikelyCertificationLine(s)) return false;
  if (AWARD_ACHIEVEMENT_RE.test(s)) return true;
  return MEASURABLE_ACHIEVEMENT_RE.test(s);
}

export function isExperienceResponsibility(text: string): boolean {
  const s = normalizeFragment(text);
  if (!s) return false;
  if (isMeasurableAchievement(s)) return false;
  if (EXPERIENCE_RESPONSIBILITY_RE.test(s)) return true;
  return /\b(?:responsible for|duties included|key responsibilities|accountable for|reporting to)\b/i.test(s);
}

/** Global AchievementsStep should only receive measurable-impact lines. */
export function shouldKeepAsGlobalAchievement(text: string): boolean {
  const s = normalizeFragment(text);
  if (!s) return false;
  if (isLikelyEducationLine(s) || isLikelyCertificationLine(s)) return false;
  if (isExperienceResponsibility(s) && !isMeasurableAchievement(s)) return false;
  return isMeasurableAchievement(s);
}

export function stashUnclassifiedFragment(
  store: AdditionalResumeData,
  value: string,
  kind: TextClassificationKind
): void {
  const trimmed = normalizeFragment(value);
  if (!trimmed) return;

  const entry = { value: trimmed, kind };
  if (store.unclassifiedFragments.some((f) => f.value.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }
  store.unclassifiedFragments.push(entry);

  if (kind === 'SECTION_HEADER' && !store.sectionHeaders.includes(trimmed)) {
    store.sectionHeaders.push(trimmed);
  }
  if (kind === 'ACHIEVEMENT' && !store.achievements.includes(trimmed)) {
    store.achievements.push(trimmed);
  }
  if (kind === 'EDUCATION' && !store.extraSections.some((s) => s.heading === trimmed)) {
    store.extraSections.push({ heading: trimmed, body: '' });
  }
}
