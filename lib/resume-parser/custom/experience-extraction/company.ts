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

/** Parent-company / affiliation taglines under an employer — not a new job. */
export function isEmployerAffiliationTagline(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 100) return false;
  if (
    /^(?:(?:a|an)\s+)?(?:wholly[- ]owned\s+)?(?:group\s+company|subsidiary|sister\s+concern|affiliate|division|unit|branch)\s+of\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^part\s+of\s+(?:the\s+)?(?:group|company|organization)\b/i.test(t)) return true;
  return false;
}

/** Sector / industry descriptors used as role taglines — not employers or locations. */
export function isIndustrySectorTagline(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  // "FMCG Sector Company", "Listed … Conglomerate", "Industry Leader"
  if (
    /^(?:listed\s+)?[A-Za-z][A-Za-z0-9/&.'\s-]{0,48}(?:sector\s+company|conglomerate|industry\s+leader)\s*$/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^[A-Z]{2,}(?:\s+[A-Z][a-z]+)?\s+sector\s+company\s*$/i.test(t)) return true;
  return false;
}

/**
 * Client-book / consultancy practice employers that lack Ltd/Inc suffixes.
 * Generic — matches freelance and multi-client practices across domains.
 */
export function looksLikeClientPracticeEmployer(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 8 || t.length > 120) return false;
  if (
    /^(?:various|multiple|several|select|independent)\s+clients?\b/i.test(t) ||
    /\b(?:consultancy|consulting)\s+practice\b/i.test(t) ||
    /^(?:freelance|independent)\s+(?:consultant|practice|work)\b/i.test(t) ||
    /^self[- ]employed\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/** Hard legal / institutional suffixes — safe mid-string signals of an employer. */
const HARD_COMPANY_SUFFIX_RE =
  /\b(?:private\s+limited|pvt\.?\s*ltd\.?|ltd\.?|limited|llp|inc\.?|incorporated|corporation|corp\.?|gmbh|plc|university|government|startup|freelance|self[- ]?employed)\b/i;

/**
 * Soft product-style suffixes. These appear inside duty prose ("establishing systems")
 * and must only count when they look like a trailing employer name token.
 */
const SOFT_COMPANY_SUFFIX_RE =
  /\b(?:technologies?|solutions|systems|software|labs|healthcare|consulting|services)\b/i;

const COMPANY_SUFFIX_RE = new RegExp(
  `${HARD_COMPANY_SUFFIX_RE.source}|${SOFT_COMPANY_SUFFIX_RE.source}`,
  'i'
);

function hasTrailingSoftCompanySuffix(text: string): boolean {
  const trimmed = text.trim();
  if (!SOFT_COMPANY_SUFFIX_RE.test(trimmed)) return false;
  // Soft suffix must land in the final 1–3 tokens of a short-ish name.
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 10) return false;
  const tail = words.slice(-3).join(' ');
  return SOFT_COMPANY_SUFFIX_RE.test(tail) && /^[A-Z]/.test(trimmed);
}

const PROPRIETARY_NAME_SUFFIX_RE =
  /\b[A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+)*\s+(?:Technology|Technologies|Solutions|Systems|Software|Labs|Digital|Infotech|Consulting|Services)\b/;

const FALSE_COMPANY_RE =
  /^(python|react|node\.?js|javascript|typescript|java|django|flask|aws|docker|redis|kafka|postgresql|mongodb|bhopal|mumbai|delhi|bangalore|hyderabad|pune|chennai|remote|hybrid|onsite|wfh)$/i;

const ROLE_OR_PROJECT_LABEL_RE =
  /^(?:role|designation|position|title|project|team\s*size|key\s+responsibilit)\s*[:\-–—]/i;

const SENTENCE_VERB_RE =
  /\b(led|built|designed|developed|wrote|managed|created|implemented|integrated|responsible|delivered|achieved|maintained|optimized|collaborated)\b/i;

/** Short employer references common in government, academic, and agency resumes. */
const SHORT_ORG_RE =
  /^(?:org|dept|department|unit|branch|office|agency|division|bureau|firm|group|ministry|directorate)\s+[\w\d.-]+$/i;

/** Compact employer labels such as "Org 4", "Unit 12", "Branch 3". */
const COMPACT_EMPLOYER_RE = /^[A-Z][A-Za-z]{1,24}(?:\s+[A-Z][A-Za-z]{1,24})?\s+\d{1,4}$/;

/** Government and institutional employer patterns. */
const INSTITUTIONAL_EMPLOYER_RE =
  /\b(?:hospitals?|clinics?|schools?|colleges?|universities?|ministr(?:y|ies)|municipal|corporations?|authorit(?:y|ies)|commissions?|councils?|departments?|institutes?|academ(?:y|ies)|foundations?|trusts?|secretariats?|directorates?|bureaus?|agencies?|chambers?|healthcare|chartered|insurance|logistics|motors|retail|pharma|vidyalaya|vidyalay|railways?|(?:state|national|central|federal|reserve)\s+banks?|(?:indian\s+)?(?:army|navy|air\s*force)|(?:armed|defence|defense|paramilitary)\s+forces?)\b/i;

export function looksLikeInstitutionalEmployer(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4) return false;
  // Duty sentences often mention "systems", "services", etc. — not employers.
  if (looksLikeSentenceNotCompany(trimmed)) return false;
  return (
    INSTITUTIONAL_EMPLOYER_RE.test(trimmed) ||
    SHORT_ORG_RE.test(trimmed) ||
    HARD_COMPANY_SUFFIX_RE.test(trimmed) ||
    hasTrailingSoftCompanySuffix(trimmed) ||
    PROPRIETARY_NAME_SUFFIX_RE.test(trimmed)
  );
}

/**
 * True when a line contains an employer signal even if the full line is a
 * compressed "Company + Title | Dates" header that fails whole-line company scoring
 * (e.g. because length > 55 triggers prose rejection).
 */
export function lineImpliesEmployerPresence(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (detectCompanyFromLine(trimmed).confidence >= 42) return true;
  if (COMPANY_SUFFIX_RE.test(trimmed)) return true;
  if (PROPRIETARY_NAME_SUFFIX_RE.test(trimmed)) return true;
  if (looksLikeInstitutionalEmployer(trimmed)) return true;
  if (
    /\b[A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+)*\s+(?:Sons|Bros|Brothers|Holdings|Group|Industries|Enterprises|Motors|Retail)\b/.test(
      trimmed
    )
  ) {
    return true;
  }
  // Check pipe-separated left segments that may individually score as employers.
  // Do NOT split on en/em dashes — those are date ranges ("Apr 2025 – Jan 2026"),
  // and the right half would otherwise false-positive as a company name.
  const segments = trimmed
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const seg of segments) {
    if (seg === trimmed) continue;
    if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}$/i.test(seg)) {
      continue;
    }
    if (/^(?:19|20)\d{2}$/.test(seg)) continue;
    if (detectCompanyFromLine(seg).confidence >= 42) return true;
    if (COMPANY_SUFFIX_RE.test(seg)) return true;
  }
  return false;
}

/** Reject bullet sentences and long prose misclassified as company names. */
export function looksLikeSentenceNotCompany(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Client-book / practice employers are never prose sentences.
  if (looksLikeClientPracticeEmployer(trimmed)) return false;
  // Employment headers like "As Counsel in ACME Ltd" are role lines, not prose.
  if (/^as\s+.+\s+(?:in|at|with|for)\s+.+/i.test(trimmed)) return false;
  // Duty openers are never employers — even when a soft suffix like "systems" appears.
  if (
    /^(?:to|the|for|with|by|ensure|carry|organize|planning|taking|doing|coordinating|responsible|implement|prepare|monitor|maintain|identify|acquire|overview|authorize|authori[sz]ed|liaison|liason|liaise|training)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  // Standards / audit clause fragments are not company names.
  if (/\biso(?:\s*[/:-]?\s*iec)?\s*\d{4,5}\b/i.test(trimmed) && !/\b(?:ltd|limited|pvt|inc|corp|company|group)\b/i.test(trimmed)) {
    return true;
  }
  // Hard legal suffixes can exempt employer strings; soft suffixes only when trailing.
  if (HARD_COMPANY_SUFFIX_RE.test(trimmed) && trimmed.length <= 140) return false;
  // Joint-venture / industrial employer phrases without Ltd/Limited.
  if (
    /\b(?:motors|vehicles|ventures?|laborator(?:y|ies)|industries|enterprises|holdings|railways?)\b/i.test(
      trimmed
    ) &&
    /^[A-Z]/.test(trimmed) &&
    trimmed.length <= 140
  ) {
    return false;
  }
  if (hasTrailingSoftCompanySuffix(trimmed) && trimmed.length <= 80) return false;
  if (
    /\b(?:rank\s+in\s+(?:college|class|university|school|semester)|(?:sgpa|cgpa)\b|semester\s+\d+)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  if (/\b(improv(?:ed|ing)|optimiz(?:ed|ing)|reduc(?:ed|ing)|increas(?:ed|ing)|develop(?:ed|ing)|design(?:ed|ing)|mentor(?:ed|ing)|administer(?:ed|ing))\b/i.test(trimmed)) {
    return true;
  }
  if (/\d+\s*%/.test(trimmed)) return true;
  // Site / facility duty blurbs (often lose trailing "." after meta strip).
  if (
    !HARD_COMPANY_SUFFIX_RE.test(trimmed) &&
    !looksLikeClientPracticeEmployer(trimmed) &&
    (
      /\b(?:industrial|residential|commercial|civil)\s+(?:plant|complex|building|project|shed|structure)s?\b/i.test(
        trimmed
      ) ||
      /\b(?:plant|complex|building|shed)\s+with\b/i.test(trimmed) ||
      /\b(?:water\s+supply|irrigation|sewerage|drainage)\s+(?:scheme\s+)?projects?\b/i.test(trimmed) ||
      /\b(?:scheme|assignment|engagement)\s+project\b/i.test(trimmed) ||
      /\bprojects?\s+in\b/i.test(trimmed) ||
      (
        /\b(?:etp|stp|wwtp|effluent|sewage\s+treatment|cable\s+trench(?:es)?|road\s+work|foundation\s+work)\b/i.test(
          trimmed
        ) &&
        /\b(?:plant|project|complex|foundation|trench|work|residential|industrial)\b/i.test(trimmed)
      )
    )
  ) {
    return true;
  }
  if (trimmed.length > 55) return true;
  if (trimmed.length > 30 && SENTENCE_VERB_RE.test(trimmed)) return true;
  if (/^[a-z]/.test(trimmed) && trimmed.length > 25) return true;
  if (/[.!?]$/.test(trimmed) && trimmed.length > 20) return true;
  if (trimmed.split(/\s+/).length > 8) return true;
  return false;
}

/** Reject postal / street address lines that ATS dumps under employer headers. */
export function looksLikeStreetAddressLine(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 8 || t.length > 160) return false;
  if (HARD_COMPANY_SUFFIX_RE.test(t)) return false;
  const hasLocality =
    /\b(?:society|nagar|colony|road|street|sector|phase|pocket|block|apartment|apartments|flat|bungalow|layout|extension|cross|main|industrial\s+area|okhla)\b/i.test(
      t
    );
  const hasPlotOrHouse =
    /\b(?:h\.?\s*no\.?|house\s*no\.?|plot\s*no\.?|shop\s*no\.?|door\s*no\.?)\b/i.test(t) ||
    /^\d{1,5}[A-Za-z]?\s*[,.]/.test(t) ||
    /\b\d{1,5}\s*,\s*[A-Za-z]/.test(t);
  if (hasLocality && (hasPlotOrHouse || /\d/.test(t))) return true;
  if (hasLocality && t.split(/[,\s]+/).length >= 4) return true;
  return false;
}

export function scoreCompanyCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return 0;
  if (/^(?:present|current|now|ongoing|till\s*date|to\s*date)$/i.test(trimmed)) return 0;
  if (/^(?:19|20)\d{2}$/.test(trimmed)) return 0;
  // Month + year tokens from date-range splits are never employers.
  if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}$/i.test(trimmed)) {
    return 0;
  }
  if (ROLE_OR_PROJECT_LABEL_RE.test(trimmed)) return 0;
  if (isEmployerAffiliationTagline(trimmed) || isIndustrySectorTagline(trimmed)) return 0;
  if (looksLikeStreetAddressLine(trimmed)) return 0;
  if (looksLikeSentenceNotCompany(trimmed) && !looksLikeClientPracticeEmployer(trimmed)) return 0;
  if (FALSE_COMPANY_RE.test(trimmed)) return 0;
  if (TECH_SKILL_AS_COMPANY_RE.test(trimmed.toLowerCase())) return 0;
  if (looksLikeJobTitleLine(trimmed) && !looksLikeCompanyNameLine(trimmed)) return 0;

  let score = 0;
  if (looksLikeClientPracticeEmployer(trimmed)) score += 72;
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
  if (/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+Railways?\b/.test(trimmed)) score += 44;
  if (/\b[A-Z][a-z]+\s+(?:Sons|Bros|Brothers|Holdings|Group|Industries|Enterprises|Motors|Retail)\b/.test(trimmed)) {
    score += 42;
  }
  // "… Security Force", "… Guards", "… Services" style employer names without Ltd.
  if (
    /\b(?:security\s+force|security\s+services|guards?|facility\s+management)\b/i.test(trimmed) &&
    /^[A-Z]/.test(trimmed) &&
    trimmed.split(/\s+/).length <= 6
  ) {
    score += 36;
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

/**
 * Strip employment header metadata that often trails employer names on ATS CVs:
 * "Acme Pvt. Ltd. City, State. Start Date: Jan 2020 to Current"
 * Generic — label-driven, not company/title specific.
 */
export function stripCompanyLineEmploymentMeta(text: string): string {
  let t = String(text || '').trim();
  if (!t) return '';

  // Labeled date / tenure suffixes.
  t = t
    .replace(
      /\s*(?:[.,;|]\s*)?(?:start\s*date|end\s*date|duration|period|tenure|dates?)\s*[:\-–—]\s*.+$/i,
      ''
    )
    .trim();

  // Trailing open date ranges after punctuation: ". Nov 2023 to May 2024."
  t = t
    .replace(
      /\s*[.,;|]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:[-–—]|to|till|until|present|current).*$/i,
      ''
    )
    .trim();

  // After a hard legal suffix, drop trailing ". City, State" / ", City, State".
  const afterSuffix = t.match(
    /^(.+?\b(?:private\s+limited|pvt\.?\s*ltd\.?|ltd\.?|limited|llp|inc\.?|incorporated|corporation|corp\.?|gmbh|plc))\s*[.,]\s+(.+)$/i
  );
  if (afterSuffix) {
    const core = afterSuffix[1].trim();
    const tail = afterSuffix[2].trim();
    // Location-like tails: City, State / City only — not another org name.
    if (
      tail.length >= 3 &&
      tail.length <= 80 &&
      !HARD_COMPANY_SUFFIX_RE.test(tail) &&
      (/^[A-Z][A-Za-z .'-]+(?:,\s*[A-Z][A-Za-z .'-]+)?\.?$/.test(tail) ||
        /\b(?:andhra|arunachal|assam|bihar|chhattisgarh|goa|gujarat|haryana|himachal|jharkhand|karnataka|kerala|madhya\s+pradesh|maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|punjab|rajasthan|sikkim|tamil\s+nadu|telangana|tripura|uttar\s+pradesh|uttarakhand|west\s+bengal|delhi|mumbai|bengaluru|bangalore|chennai|hyderabad|kolkata|pune|ahmedabad|vadodara|nashik|bhopal|indore)\b/i.test(
          tail
        ))
    ) {
      t = core;
    }
  }

  return t.replace(/[.,;:\s]+$/g, '').trim();
}

export function detectCompanyFromLine(text: string): CompanyDetection {
  const trimmedRaw = text.trim();
  if (!trimmedRaw) return { company: '', confidence: 0 };
  if (isEmployerAffiliationTagline(trimmedRaw) || isIndustrySectorTagline(trimmedRaw)) {
    return { company: '', confidence: 0 };
  }
  if (looksLikeStreetAddressLine(trimmedRaw)) {
    return { company: '', confidence: 0 };
  }
  // Reject before punctuation strip — trailing "." is a strong prose signal that
  // stripCompanyLineEmploymentMeta would otherwise erase.
  if (looksLikeSentenceNotCompany(trimmedRaw)) {
    return { company: '', confidence: 0 };
  }

  const trimmed = stripCompanyLineEmploymentMeta(trimmedRaw) || trimmedRaw;
  if (looksLikeSentenceNotCompany(trimmed)) {
    return { company: '', confidence: 0 };
  }

  // Strip trailing " – City, State" location for scoring, keep employer core.
  const locStripped = trimmed
    .replace(/\s+[–—\-]\s+[A-Z][A-Za-z .]{2,40}(?:,\s*[A-Z].{0,20})?\s*$/u, '')
    .trim();

  if (looksLikeClientPracticeEmployer(trimmed) || looksLikeClientPracticeEmployer(locStripped)) {
    const core = looksLikeClientPracticeEmployer(locStripped) ? locStripped : trimmed;
    return { company: core, confidence: 78 };
  }

  const pipeSplit = splitCompanyLocationPipe(trimmed);
  if (pipeSplit?.company) {
    const conf = scoreCompanyCandidate(pipeSplit.company);
    if (conf >= 40) {
      return { company: pipeSplit.company, confidence: conf };
    }
  }

  // "Employer Name: descriptive tagline" — score the left segment alone so long
  // taglines do not drown the employer via looksLikeSentenceNotCompany.
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 2 && colonIdx < 72) {
    const left = trimmed.slice(0, colonIdx).trim();
    const right = trimmed.slice(colonIdx + 1).trim();
    if (
      left &&
      right.length >= 3 &&
      left.split(/\s+/).length <= 8 &&
      !/^(?:role|designation|position|title|project|duration|period|tenure|location|ctc|salary)\b/i.test(
        left
      )
    ) {
      const conf = scoreCompanyCandidate(left);
      if (conf >= 42) {
        return { company: left, confidence: Math.min(100, conf + 8) };
      }
    }
  }

  const atMatch = trimmed.match(/\bat\s+([A-Z][A-Za-z0-9&.,'()\- ]{2,60})/);
  if (atMatch) {
    const conf = scoreCompanyCandidate(atMatch[1]);
    if (conf >= 45) {
      return { company: atMatch[1].trim(), confidence: conf };
    }
  }

  // Prefer location-stripped core when it is a stronger/cleaner employer name.
  if (locStripped && locStripped !== trimmed && locStripped.length >= 3) {
    const coreConf = scoreCompanyCandidate(locStripped);
    const fullConf = scoreCompanyCandidate(trimmed);
    if (coreConf >= 38 && coreConf >= fullConf - 8) {
      return { company: locStripped, confidence: coreConf };
    }
  }

  const conf = scoreCompanyCandidate(trimmed);
  if (conf >= 38) {
    return { company: trimmed, confidence: conf };
  }

  return { company: '', confidence: 0 };
}
