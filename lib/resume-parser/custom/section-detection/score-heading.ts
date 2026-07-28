/**
 * Hybrid heading scoring — keywords, formatting, layout context, content hints.
 */

import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';
import {
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { classifyResumeTextFragment } from '@/lib/resume-parser/field-classification';

import { lineContentDensity } from './line-index';
import { SECTION_TAXONOMY, scoreHeadingKeywords } from './taxonomy';
import type { HeadingCandidate, LineSpan, NormalizedSectionType, SectionScoreBreakdown } from './types';

const BULLET_LINE_RE = /^[\s]*(?:[-–—•·▪‣●○◦✓✔]|\d+[\.\)])\s+/;
const CONTACT_LINE_RE =
  /@|linkedin\.com|github\.com|https?:\/\/|\+?\d[\d\s().-]{7,}\d|www\./i;
const MIN_KNOWN_TYPE_SCORE = 38;
/** Custom headings need more than formatting alone, but stay open for short
 *  Title-Case unknowns ("Research", "Hackathons"). Experience-body false
 *  positives are blocked by isExperienceEntryOrDutyLine instead. */
const MIN_CUSTOM_HEADING_SCORE = 26;

/** Section body lines that must never be promoted to headings. */
const DEGREE_LINE_RE =
  /\b(?:b\.?\s*tech|m\.?\s*tech|m\.?\s*b\.?a|b\.?\s*com|m\.?\s*com|b\.?\s*sc|m\.?\s*sc|ph\.?\s*d|bachelor|master\s+of|associate\s+of|doctorate)\b/i;

/** Case-sensitive abbreviations — avoids false positives like "About Me". */
const DEGREE_ABBREV_RE = /\b(?:MBA|M\.?\s*B\.?A|B\.?\s*E\.|M\.?\s*E\.|B\.?\s*Com|M\.?\s*Com)\b/;

const LANGUAGE_PROFICIENCY_LINE_RE =
  /^(?:english|hindi|french|spanish|german|arabic|chinese|japanese|korean|portuguese|italian|russian|tamil|telugu|bengali|marathi|gujarati|punjabi|urdu|malayalam|kannada|dutch|polish|turkish|vietnamese|thai|indonesian|swahili)\b\s*[-–—:(]/i;

const SKILL_COMMA_LIST_LINE_RE = /(?:^|[,;|])\s*[A-Za-z+#.]+\s*[,;|]\s*[A-Za-z+#.]/;

const CITY_STATE_LINE_RE =
  /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|[A-Z]{2,})$/;

/**
 * In-role field labels ("Project:", "Role:", "Team Size:") describe a job
 * entry — they must never open a top-level Projects / custom section.
 */
function isInRoleFieldLabel(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  // Standalone plural section headings are never in-role field labels.
  if (
    /^(?:projects|skills|certifications|achievements|languages|references|publications|volunteer|hobbies|interests|education)$/i.test(
      t
    )
  ) {
    return false;
  }
  // In-role labels require a separator and trailing value ("Project: Fiber Rollout").
  if (
    /^(?:projects?|roles?|designations?|positions?|titles?|team\s*size|key\s+responsibilit(?:y|ies)|responsibilit(?:y|ies)|key\s+areas?|areas?\s+of\s+exposure|client|employer|company|duration|period|tenure|location|reporting\s+to|tools?\s+used|technologies?\s+used)\s*[:\-–—]\s*.+/i.test(
      t
    )
  ) {
    return true;
  }
  // Lone singular "Project" without a body — in-role subsection, not a resume section.
  return /^project\s*$/i.test(t) && !isAllCapsHeading(t);
}

/**
 * Table column headers / serial labels must never open a section (they steal
 * following bodies, including real Experience / Qualification blocks).
 * Generic structural patterns only — no resume-specific content.
 */
function isTableColumnHeaderLine(text: string): boolean {
  const t = text.trim().replace(/[:\-–—|]+$/g, '').trim();
  if (!t || t.length > 96) return false;
  if (
    /^(?:s\.?\s*\/?\s*no\.?|sr\.?\s*\/?\s*no\.?|sl\.?\s*\/?\s*no\.?|serial\s*(?:no|number|#)?\.?|row\s*#?|item\s*#?|#)$/i.test(
      t
    )
  ) {
    return true;
  }
  // Education / grade table stubs (often OCR-split across lines).
  if (
    /^(?:degree|board|university|college|school|institute|institution|year|academic(?:\s+year)?|percentage|percent(?:\s*-\s*age)?|percent(?:age)?(?:\s*\/\s*cgpa)?|cgpa|gpa|marks|score|result|division|grade|remarks?|course|organization|organisation|name\s+of\s+(?:school|college|institute|institution|university)|board\s*\/\s*university|degree\s+board(?:\s*\/\s*university)?)\s*$/i.test(
      t
    )
  ) {
    return true;
  }
  // Bare performance tokens: "7.0 CGPA", "78.2%", "8.5 GPA".
  if (/^\d{1,2}(?:\.\d{1,2})?\s*(?:cgpa|gpa|sgpa|%|percent(?:age)?)\s*$/i.test(t)) {
    return true;
  }
  if (/^\(?\s*%\s*\)?$/.test(t)) return true;
  // Glued multi-column header strips (e.g. "EducationBoard / UniversityYearDivision").
  const colHits = (
    t.match(
      /\b(?:s\/?\s*no|education|board|university|year|division|course|specialization|specialisation|organization|organisation|environment|institution|duration|grade|percentage|type|from|to|period|employer|designation|cgpa|gpa|school|college)\b/gi
    ) || []
  ).length;
  if (colHits >= 2 && !/[.!?]$/.test(t) && t.split(/\s+/).length <= 14) {
    return true;
  }
  return false;
}

/** OCR/wrap debris and unfinished sidebar labels are never section headings. */
function isHeadingDebris(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (isTableColumnHeaderLine(t)) return true;
  // Incomplete compound labels: "Team Building &", "Planning and"
  if (/[&/]\s*$/.test(t) || /\b(?:and|or|of|the|for|with|to)\s*$/i.test(t)) return true;
  // Lone sentence-wrap fragments: "works.", "suppliers.", "Processes."
  if (/^[A-Za-z][A-Za-z'’\-]{0,24}\.\s*$/.test(t)) return true;
  // Multi-token prose sentences (even when they mention "projects") are never headings.
  if (/[.!?]$/.test(t) && t.split(/\s+/).length >= 4) return true;
  // Mid-sentence continuation crumbs (not known section words).
  if (
    /^[a-z]/.test(t) &&
    !/^(?:skills?|education|experience|summary|projects?|certifications?|certificates?|languages?|achievements?|awards?|references?|publications?|objective|profile|interests?|hobbies?|training|qualifications?|employment|internship)\b/i.test(
      t
    )
  ) {
    return true;
  }
  // Sentence-wrap debris that starts with duty verbs / mid-bullet fragments.
  if (
    /^(?:responsibilities|responsibility|duties|ensuring|including|building|transferring|maximizing|working|handling|managing|leading)\b/i.test(
      t
    ) &&
    !/^(?:responsibilities|duties)\s*$/i.test(t) &&
    (/,/.test(t) || /\band\b/i.test(t) || /[.!?]$/.test(t))
  ) {
    return true;
  }
  return false;
}

/**
 * Short in-role workstream labels common on CA / audit / consulting resumes.
 * These must not open a new top-level custom section mid-experience.
 */
function isExperienceWorkstreamLabel(text: string): boolean {
  const t = text.trim().replace(/[:|\-–—]+$/g, '').trim();
  if (!t || t.length > 56) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) return false;

  // Known workstream phrases (generic practice areas, not employer/section names).
  if (
    /^(?:internal|statutory|tax|branch|stock|concurrent|revenue|cost|management|is|it|ifc|icfr)\s+audit(?:ing)?$/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /^(?:tax|gst|direct\s+tax|indirect\s+tax|tds|secretarial|legal)\s*(?:&|and)?\s*(?:compliance|advisory|litigation|appeals?)$/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /^(?:tax\s+compliance(?:\s*&|\s+and)?\s*return\s+preparation|return\s+preparation|financial\s+projections?|business\s+advisory|ifc\s*\/?\s*icfr(?:\s+testing)?)$/i.test(
      t
    )
  ) {
    return true;
  }
  // Short "Domain & Domain" labels when both sides look like practice areas.
  if (
    words.length <= 5 &&
    /\s(?:&|and)\s/i.test(t) &&
    /\b(?:audit|assurance|tax|compliance|finance|accounting|advisory|consulting|risk|controls?|reporting)\b/i.test(
      t
    ) &&
    !/\b(?:experience|education|skills?|projects?|summary|objective|profile|certifications?|achievements?)\b/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

/** OCR-glued multi-section compounds must not steal the surrounding body. */
function isGluedMultiSectionHeading(text: string): boolean {
  return splitGluedMultiSectionPhrases(text).length >= 2;
}

/**
 * Split OCR-glued multi-section heading lines into their constituent phrases
 * so each can become its own heading (e.g. "OBJECTIVE PROFESSIONAL ACCOMPLISHMENTS").
 */
export function splitGluedMultiSectionPhrases(text: string): string[] {
  const outsideParens = text.replace(/\([^)]*\)/g, ' ').trim();
  if (!outsideParens) return [];
  const compact = outsideParens.replace(/[^A-Za-z]/g, '').toLowerCase();
  if (compact.length < 18) return [];

  const phraseMatchers: Array<{ label: string; re: RegExp }> = [
    { label: 'OBJECTIVE', re: /\b(?:career\s+)?objective\b/i },
    { label: 'PROFESSIONAL SUMMARY', re: /\b(?:professional|career)\s+summary\b/i },
    { label: 'ABOUT ME', re: /\babout\s+me\b/i },
    { label: 'WORK EXPERIENCE', re: /\b(?:work|professional|employment)\s+experience\b|\bemployment\s+history\b|\bworkexperience\b/i },
    { label: 'ACADEMIC CREDENTIALS', re: /\bacademic\s+credentials?\b|\beducational?\s+qualifications?\b|\bacademic\s+qualifications?\b/i },
    { label: 'TECHNICAL SKILLS', re: /\btechnical\s+skills?\b|\bcore\s+skills?\b/i },
    { label: 'PROFESSIONAL ACCOMPLISHMENTS', re: /\bprofessional\s+accomplishments?\b|\bkey\s+achievements?\b|\bcareer\s+achievements?\b/i },
    { label: 'LANGUAGE KNOWN', re: /\blanguage\s+(?:known|proficiency)\b|\blinguistic\s+skills?\b/i },
    { label: 'PERSONAL PROFILE', re: /\bpersonal\s+(?:profile|details|information)\b/i },
  ];

  // Compact (no-space) OCR glues: "WORKEXPERIENCESKILLS"
  if (!/\s/.test(outsideParens)) {
    const families: string[][] = [
      ['profile', 'summary', 'objective', 'about'],
      ['experience', 'employment', 'organizational', 'organisational', 'career', 'workexperience'],
      ['education', 'academic', 'qualification', 'credentials'],
      ['skill', 'expertise', 'competenc'],
      ['project'],
      ['certif', 'licence', 'license', 'training'],
      ['achievement', 'accomplishment', 'award', 'honou'],
      ['language', 'linguistic'],
      ['personal'],
    ];
    const hitFamilies = families.filter((fam) => fam.some((k) => compact.includes(k)));
    if (hitFamilies.length < 2) return [];
    // Best-effort: emit canonical labels for the hit families we can map.
    const out: string[] = [];
    if (compact.includes('workexperience') || (compact.includes('experience') && !compact.includes('workexperience'))) {
      out.push('WORK EXPERIENCE');
    }
    if (compact.includes('skill') || compact.includes('expertise') || compact.includes('competenc')) {
      out.push('TECHNICAL SKILLS');
    }
    if (compact.includes('education') || compact.includes('academic') || compact.includes('qualification')) {
      out.push('EDUCATION');
    }
    if (compact.includes('objective') || compact.includes('summary')) {
      out.push('OBJECTIVE');
    }
    return out.length >= 2 ? out : [];
  }

  const spaced = outsideParens.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/\s/.test(spaced) || spaced.split(/\s+/).length < 3 || spaced.split(/\s+/).length > 10) {
    return [];
  }

  const hits: string[] = [];
  for (const { label, re } of phraseMatchers) {
    if (re.test(spaced)) hits.push(label);
  }
  // Trailing resume/cv noise next to education is not its own section.
  if (hits.length >= 1 && /\bresume\b|\bcv\b/i.test(spaced) && hits.some((h) => /academic|education/i.test(h))) {
    // keep education phrase only; resume is discarded
  }
  return hits.length >= 2 ? hits : hits.length === 1 && /\bresume\b|\bcv\b/i.test(spaced) ? hits : [];
}

/**
 * Expand glued multi-section heading lines into separate lines so each section
 * can own its body. Safe no-op for normal single-section headings.
 */
export function expandGluedSectionHeadingText(text: string): string {
  return String(text || '')
    .split(/\n/)
    .flatMap((line) => {
      const parts = splitGluedMultiSectionPhrases(line);
      if (parts.length < 2) return [line];
      return parts;
    })
    .join('\n');
}

/**
 * In-role CV field labels ("Organization", "Designation", "Duration") describe a
 * job entry — they must never open a top-level section and steal the body.
 */
function isInRoleBareFieldLabel(text: string): boolean {
  const t = text.trim().replace(/[:\-–—|]+$/g, '').trim();
  if (!t || t.length > 48) return false;
  return /^(?:organi[sz]ation|employer|company|client|firm|designation|position|role|title|post|duration|period|tenure|responsibility|responsibilities|(?:key|major|primary|core)\s+responsibilit(?:y|ies)|key\s+areas?|areas?\s+of\s+exposure|location|department|institution\s+name|company\s+name)\s*$/i.test(
    t
  );
}

/**
 * Experience entry headers, duty bullets, and in-role award lines must never
 * open top-level (especially custom) sections — doing so fragments employment
 * history after the first job.
 */
function isExperienceEntryOrDutyLine(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 160) return false;

  // Alpha / numeric duty markers: (a), (b), (g), (1), (4ss)
  if (/^\(\s*[a-z0-9]{1,5}\s*\)/i.test(t)) return true;

  // Numbered employer openers: "(1).ACME LTD: …" — entries, not section titles.
  if (/^\(\s*\d+\s*\)\s*\.?\s*[A-Za-z]/.test(t) && /:/.test(t)) return true;

  // Bare mid-role award labels (achievements taxonomy already dampened).
  if (/^(?:(?:cash\s+)?awards?|honou?rs?)\s*[:\-–—]?\s*$/i.test(t)) return true;

  // Education table row stubs promoted by formatting alone.
  if (/^(?:10th|12th|xi{0,2}|ix|viii|high\s*school|intermediate|matriculation)\s*$/i.test(t)) {
    return true;
  }

  // Role + tenure and/or CTC on one line (job entry header).
  if (
    /\b(?:ctc|c\.t\.c|lakh|lac|p\.?a\.?|per\s+annum)\b/i.test(t) &&
    /\b(?:19|20)\d{2}\b/.test(t)
  ) {
    return true;
  }
  if (
    looksLikeJobTitleLine(t.split(/[:(]/)[0] || t) &&
    /\(\s*[^)]*\b(?:19|20)\d{2}/.test(t)
  ) {
    return true;
  }

  // Employer:tagline lines ("Acme Ltd: a logistics provider").
  const colonIdx = t.indexOf(':');
  if (colonIdx >= 3 && colonIdx <= 72) {
    const left = t.slice(0, colonIdx).replace(/^\(\s*\d+\s*\)\s*\.?\s*/i, '').trim();
    const right = t.slice(colonIdx + 1).trim();
    if (
      right.length >= 6 &&
      !/^(?:key\s+areas?|responsibilit|role|designation|duration|location)\b/i.test(left) &&
      (looksLikeCompanyNameLine(left) ||
        /(?:ltd|limited|pvt|llc|inc|corp|force|army|ministry|university|college|group|films?|pharma|security)\b/i.test(
          left
        ) ||
        /[a-z](?:ltd|limited|llc|inc)\b/i.test(left))
    ) {
      return true;
    }
  }

  // Short duty / workstream phrases ending with a period (OCR often promotes them).
  if (
    /^[A-Z][A-Za-z0-9/&\s,'-]{3,70}\.\s*$/.test(t) &&
    !/\b(?:experience|education|skills?|summary|objective|profile|certifications?|projects?)\b/i.test(
      t
    ) &&
    t.split(/\s+/).length <= 8
  ) {
    return true;
  }

  return false;
}

function isSectionContentLineNotHeading(text: string): boolean {
  const t = text.trim();
  if (!t) return false;

  // Orphan personal-detail values / colon-led labels are never section headings.
  if (/^[:：]/.test(t)) return true;
  // Stream/OCR debris like "like Project Experience:"
  if (/^(?:like|and|or|with|for|the|a|an)\s+/i.test(t) && t.length < 60) return true;
  if (isHeadingDebris(t)) return true;
  if (isInRoleFieldLabel(t)) return true;
  if (isInRoleBareFieldLabel(t)) return true;
  if (isExperienceEntryOrDutyLine(t)) return true;
  if (isGluedMultiSectionHeading(t)) return true;
  if (
    /^(?:male|female|other|married|unmarried|single|indian|nationality|passport|gender|dob|date of birth)\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /^(?:father(?:'s)?\s+name|mother(?:'s)?\s+name|marital\s+status|permanent\s+add(?:ress)?|notice\s+period|current\s+salary)\b/i.test(
      t
    )
  ) {
    return true;
  }

  if (DEGREE_ABBREV_RE.test(t) || DEGREE_LINE_RE.test(t)) return true;
  if (LANGUAGE_PROFICIENCY_LINE_RE.test(t)) return true;
  if (/\b(?:published|presented)\b.+\b(?:ieee|conference|journal|symposium|workshop)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:employee of the year|best employee award|increased revenue)\b/i.test(t)) return true;

  // Signature / place footer lines are not section headings.
  if (/^(?:place|date|location)\s*:\s*.+/i.test(t) && t.length <= 80) return true;

  // Experience workstream / practice-area labels inside a role (not resume sections).
  // e.g. "Internal Audit", "Statutory Audit", "Tax & Compliance".
  if (isExperienceWorkstreamLabel(t)) return true;

  const typeScores = scoreHeadingKeywords(t);
  const bestKeyword = Math.max(0, ...Object.values(typeScores));

  const looksEmployer =
    looksLikeCompanyNameLine(t) ||
    /\b(?:pvt\.?\s*ltd\.?|private\s+limited|ltd\.?|limited|llc|inc\.?|corp\.?|gmbh|plc)\b/i.test(t);

  // Strong phrase-level taxonomy (≥70) always wins over company heuristics
  // ("PROFESSIONAL EXPERIENCE"). Moderate token hits (38–69) must not promote
  // employer lines that merely contain a taxonomy word ("Ministry of labour employment").
  if (bestKeyword >= 70) return false;
  if (
    bestKeyword >= MIN_KNOWN_TYPE_SCORE &&
    !looksEmployer &&
    !looksLikeJobTitleLine(t)
  ) {
    return false;
  }

  // Employer / company lines that merely contain skill taxonomy tokens
  // ("… Technologies …") must never become section headings.
  // Education/skills section titles must not be blocked by false company heuristics
  // (e.g. looksLikeCompanyNameLine("Educational") === true).
  if (
    looksEmployer &&
    !/\b(?:skills?|experience|educations?|educational|academics?|summary|projects?|certifications?|certificates?|languages?|achievements?|affiliations?|qualifications?|competenc(?:y|ies)|professional\s+(?:&|and)\s+technical\s+qualification|professional\s+qualification|professional\s+experience|core\s+specialt|key\s+areas?)\b/i.test(
      t
    )
  ) {
    return true;
  }

  // Job titles are never section headings when they only weakly touch taxonomy tokens.
  if (looksLikeJobTitleLine(t)) return true;

  if (looksLikeCompanyNameLine(t)) return true;
  if (CITY_STATE_LINE_RE.test(t)) return true;
  if (SKILL_COMMA_LIST_LINE_RE.test(t)) return true;
  // Middle-dot / bullet competency lists are skills body, never headings
  // ("Leadership Development • Executive Coaching • …").
  if (
    /[•·\u2022\u2023\u25aa]/.test(t) &&
    (t.match(/[•·\u2022\u2023\u25aa]/g) || []).length >= 1 &&
    t.split(/[•·\u2022\u2023\u25aa]/).filter((p) => p.trim().length >= 2).length >= 2
  ) {
    return true;
  }
  const classified = classifyResumeTextFragment(t);
  if (classified.kind === 'LOCATION' && classified.confidence >= 50) return true;
  if (classified.kind === 'PERSON_NAME' && classified.confidence >= 60) return true;
  return false;
}

export function isBulletLine(line: string): boolean {
  return BULLET_LINE_RE.test(line);
}

export function isAllCapsHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 64) return false;
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

export function isTitleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 56) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 8) return false;
  const titled = words.filter((w) => /^[A-Z][a-z]+(?:['-][A-Z][a-z]+)?$/.test(w)).length;
  return titled >= Math.max(1, Math.ceil(words.length * 0.6));
}

/** Bare function words / fragments that must never become section headings. */
const STOPWORD_HEADING_RE =
  /^(?:in|at|on|to|of|for|the|and|or|with|by|a|an|as|is|from)$/i;

export function looksLikeHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (STOPWORD_HEADING_RE.test(t)) return false;
  if (t.replace(/[^A-Za-z]/g, '').length < 2) return false;
  if (isSectionContentLineNotHeading(t)) return false;
  if (isBulletLine(t)) return false;
  if (CONTACT_LINE_RE.test(t) && t.length < 120) return false;
  if (t.split(/\s+/).length > 12) return false;
  // Trailing period on long lines usually means prose — but dated section
  // lead-ins ("Job Experience from Oct 2010 to till date.") are valid headings.
  if (/[.!?]$/.test(t) && t.split(/\s+/).length > 7) {
    const keywordPeak = Math.max(0, ...Object.values(scoreHeadingKeywords(t)));
    if (keywordPeak < 70) return false;
  }
  // Comma-heavy sentence fragments are never headings unless a strong section phrase.
  if ((t.match(/,/g) || []).length >= 1 && /\band\b/i.test(t) && /[.!?]$/.test(t)) {
    const keywordPeak = Math.max(0, ...Object.values(scoreHeadingKeywords(t)));
    if (keywordPeak < 70) return false;
  }
  return true;
}

function scoreCapitalization(rawHeading: string): number {
  if (isAllCapsHeading(rawHeading)) return 28;
  if (isTitleCaseHeading(rawHeading)) return 22;
  const t = rawHeading.trim();
  if (t.length <= 32 && t === t.toLowerCase()) return 8;
  return 0;
}

function scoreFormatting(lineIndex: number, lines: LineSpan[]): number {
  let score = 0;
  const prevBlank = lineIndex > 0 && lines[lineIndex - 1].isBlank;
  const nextBlank =
    lineIndex < lines.length - 1 && lines[lineIndex + 1].isBlank;
  if (prevBlank) score += 18;
  if (nextBlank) score += 6;
  const line = lines[lineIndex];
  if (line.text.trim().length <= 40) score += 8;
  if (/[:\-–—|]$/.test(line.text.trim())) score += 6;
  return score;
}

function scoreDocumentContext(
  type: NormalizedSectionType,
  lineIndex: number,
  totalLines: number,
  profile: ResumeDocumentProfile
): number {
  if (type === 'custom') return 0;
  const tax = SECTION_TAXONOMY[type];
  const position = totalLines > 1 ? lineIndex / (totalLines - 1) : 0.5;
  const distance = Math.abs(position - tax.typicalOrder);
  let score = Math.max(0, 24 - distance * 40);

  if (profile.signals.executiveLayout && (type === 'summary' || type === 'experience')) {
    score += 6;
  }
  if (profile.signals.multiColumnLikely || profile.signals.sidebarLikely) {
    score += 4;
  }
  if (profile.signals.scannedLikely) {
    score -= 4;
  }
  return Math.max(0, Math.min(30, score));
}

export function scoreContentHint(
  type: NormalizedSectionType,
  density: ReturnType<typeof lineContentDensity>
): number {
  if (type === 'custom') return 0;
  switch (type) {
    case 'experience':
      return Math.min(25, density.dateDensity * 40 + density.bulletDensity * 15);
    case 'education':
      return Math.min(20, density.dateDensity * 25);
    case 'skills':
      return Math.min(25, density.skillLineDensity * 30 + density.commaDensity * 12);
    case 'projects':
      return Math.min(18, density.bulletDensity * 20);
    case 'languages':
      return Math.min(15, density.commaDensity * 10);
    default:
      return Math.min(12, density.bulletDensity * 10);
  }
}

function pickBestType(
  typeScores: Partial<Record<NormalizedSectionType, number>>,
  formattingScore: number,
  capScore: number
): { type: NormalizedSectionType; keywordScore: number } {
  let bestType: NormalizedSectionType = 'custom';
  let bestKeyword = 0;
  for (const [type, score] of Object.entries(typeScores) as Array<
    [NormalizedSectionType, number]
  >) {
    if (score > bestKeyword) {
      bestKeyword = score;
      bestType = type;
    }
  }

  const headingSignal = formattingScore + capScore;
  if (bestKeyword < MIN_KNOWN_TYPE_SCORE && headingSignal >= MIN_CUSTOM_HEADING_SCORE) {
    return { type: 'custom', keywordScore: bestKeyword };
  }
  if (bestKeyword < MIN_KNOWN_TYPE_SCORE) {
    return { type: 'custom', keywordScore: bestKeyword };
  }
  return { type: bestType, keywordScore: bestKeyword };
}

export function scoreHeadingCandidate(
  lineIndex: number,
  lines: LineSpan[],
  profile: ResumeDocumentProfile,
  contentDensity?: ReturnType<typeof lineContentDensity>
): HeadingCandidate | null {
  const line = lines[lineIndex];
  if (!line || line.isBlank || !looksLikeHeadingLine(line.text)) return null;

  // Values immediately under in-role field labels ("Project:\nFiber Rollout")
  // are never top-level section headings.
  for (let p = lineIndex - 1; p >= 0; p--) {
    if (lines[p].isBlank) continue;
    if (isInRoleFieldLabel(lines[p].text)) return null;
    break;
  }

  const rawHeading = line.text.trim();
  const typeScores = scoreHeadingKeywords(rawHeading);
  const keywordBase = Math.max(0, ...Object.values(typeScores));
  const capScore = scoreCapitalization(rawHeading);
  const formattingScore = scoreFormatting(lineIndex, lines);
  const { type, keywordScore } = pickBestType(typeScores, formattingScore, capScore);

  // Table-label rows ("EMPLOYER" / ": AICONS Ltd", "FROM Dec 2023" / ": Till Date")
  // must not open custom sections that fragment the surrounding block.
  if (type === 'custom') {
    for (let n = lineIndex + 1; n < lines.length; n++) {
      if (lines[n].isBlank) continue;
      if (/^\s*[:：]/.test(lines[n].text)) return null;
      break;
    }
  }

  // Fragmented in-role duty labels ("Activities" / "Performed" / ": …") are
  // responsibility tables, not hobbies/interests sections.
  if (type === 'hobbies') {
    for (let n = lineIndex + 1; n < lines.length; n++) {
      if (lines[n].isBlank) continue;
      if (
        /^\s*(?:performed|undertaken|carried\s+out|assigned|handled|discharged|rendered)\b/i.test(
          lines[n].text
        )
      ) {
        return null;
      }
      break;
    }
  }

  const contextScore = scoreDocumentContext(type, lineIndex, lines.length, profile);
  const contentScore = contentDensity ? scoreContentHint(type, contentDensity) : 0;

  let total = Math.min(
    100,
    Math.round(keywordScore * 0.52 + capScore * 0.12 + formattingScore * 0.18 + contextScore * 0.1 + contentScore * 0.08)
  );

  if (type === 'custom' && total < MIN_CUSTOM_HEADING_SCORE) {
    const structural = capScore + formattingScore;
    if (structural >= MIN_CUSTOM_HEADING_SCORE) {
      total = Math.min(100, structural);
    }
  }
  if (type === 'custom' && total < MIN_CUSTOM_HEADING_SCORE) return null;
  // Strong taxonomy matches (phrase/token lead-ins) always clear the known-type floor
  // even when formatting/context are weak (common for dated section titles).
  if (type !== 'custom' && total < MIN_KNOWN_TYPE_SCORE) {
    if (keywordScore >= 70) {
      total = MIN_KNOWN_TYPE_SCORE;
    } else {
      return null;
    }
  }

  if (type !== 'custom') {
    total = Math.max(total, MIN_KNOWN_TYPE_SCORE);
  }

  const scores: SectionScoreBreakdown = {
    keyword: keywordScore,
    capitalization: capScore,
    formatting: formattingScore,
    context: contextScore,
    content: contentScore,
    profile: profile.primaryType ? 4 : 0,
    total,
  };

  return {
    lineIndex,
    rawHeading,
    type,
    confidence: total,
    scores,
    typeScores,
  };
}

export function rescoreWithContent(
  candidate: HeadingCandidate,
  density: ReturnType<typeof lineContentDensity>
): HeadingCandidate {
  const contentScore = scoreContentHint(candidate.type, density);
  let total = Math.min(
    100,
    Math.round(
      candidate.scores.keyword * 0.5 +
        candidate.scores.capitalization * 0.12 +
        candidate.scores.formatting * 0.16 +
        candidate.scores.context * 0.1 +
        contentScore * 0.12
    )
  );
  if (candidate.type === 'custom' && total < MIN_CUSTOM_HEADING_SCORE) {
    const structural = candidate.scores.capitalization + candidate.scores.formatting;
    if (structural >= MIN_CUSTOM_HEADING_SCORE) {
      total = Math.min(100, structural);
    }
  }
  if (candidate.type !== 'custom' && total < MIN_KNOWN_TYPE_SCORE) {
    total = MIN_KNOWN_TYPE_SCORE;
  }
  return {
    ...candidate,
    confidence: total,
    scores: { ...candidate.scores, content: contentScore, total },
  };
}
