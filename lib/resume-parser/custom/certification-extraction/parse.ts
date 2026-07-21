/**
 * Certification line/block parsing — name, issuer, dates, credential IDs, URLs.
 */

import { parseDateRangeFromText } from '../experience-extraction/dates';
import {
  isPlausibleCertificationEntry,
  isPlausiblePersonName,
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import { splitOnFieldSeparatorDash } from '@/lib/resume-parser/field-separator-dash';
import { looksLikeSentenceNotCompany } from '../experience-extraction/company';

export interface ParsedCertification {
  name: string;
  issuer: string;
  date: string;
  url: string;
  credentialId: string;
  confidence: number;
}

const URL_RE = /https?:\/\/\S+/i;
const CREDENTIAL_ID_RE = /\b(?:credential\s*(?:id|#)?|license\s*(?:#|no\.?|number)?|cert(?:ificate)?\s*(?:#|id)?)\s*[:#]?\s*([A-Z0-9][-A-Z0-9]{4,})/i;
const ISSUER_SUFFIX_RE =
  /\b(?:amazon\s+web\s+services|aws|microsoft|google|cisco|comptia|oracle|ibm|salesforce|pmi|scrum\.org|isc2|ec-council|red\s+hat|hashicorp|sap|adobe)\b/i;

const CERT_KEYWORD_RE =
  /\b(?:certified|certification|certificate|license|licence|credential|accreditation|chartered|fellowship|diploma|auditor)\b/i;

const AWS_CERT_NAME_RE = /\baws\s+(?:certified\s+)?(?:solutions\s+)?architect\b/i;

const EXPERIENCE_VERB_RE =
  /\b(responsible for|managed|mentored|developed|implemented|designed|delivered|led|built|created)\b/i;

const SKILL_LIST_RE = /(?:^|[,;|])\s*[A-Za-z+#.]+\s*[,;|]\s*[A-Za-z+#.]+\s*[,;|]/;

function isUnrelatedCertificationContent(name: string, issuer: string): boolean {
  const combined = `${name} ${issuer}`.trim();
  if (!combined) return true;
  if (isResumeSectionHeadingLine(name) || isResumeSectionHeadingLine(combined)) return true;
  if (isLikelyEducationLine(name) || isLikelyEducationLine(combined)) return true;
  // Spoken-language CSV rows must never become certifications.
  if (/^(?:spoken\s+)?languages?\s*:/i.test(name) || /^(?:spoken\s+)?languages?\s*:/i.test(combined)) {
    return true;
  }
  // Employment / soft-skill / personal-detail prose is not a credential.
  if (
    /^(?:at\s+present|currently|i\s+am\s+(?:working|involve)|strengths?|declaration|personal\s+details?|extra\s+details?)\b/i.test(
      name
    )
  ) {
    return true;
  }
  if (/^(?:father|mother|gender|nationality|marital|passport|notice\s+period)\b/i.test(name)) {
    return true;
  }
  // Role:/Team Size: employment blocks mis-routed into certifications.
  if (/^(?:role|designation|position|team\s*size|key\s+responsibilit)\s*:/i.test(name)) {
    return true;
  }
  if (
    /\b(?:ltd|limited|pvt|llc|inc|corp|corporation)\b\.?/i.test(combined) &&
    !CERT_KEYWORD_RE.test(combined) &&
    !AWS_CERT_NAME_RE.test(combined)
  ) {
    return true;
  }
  // Job-title-shaped training names are valid when an issuer (or dated course) is present,
  // or when the line names a course platform / diploma / audit credential.
  if (
    looksLikeJobTitleLine(name) &&
    !CERT_KEYWORD_RE.test(name) &&
    !AWS_CERT_NAME_RE.test(name) &&
    !issuer.trim() &&
    !/\b(?:by|udemy|coursera|linkedin|microsoft|google|ibm|diploma|course|auditor|analytics|recruiting|certificate)\b/i.test(
      combined
    )
  ) {
    return true;
  }
  if (EXPERIENCE_VERB_RE.test(combined) && combined.split(/\s+/).length > 5) return true;
  // Credential / course titles with a trailing period are not prose sentences.
  if (
    looksLikeSentenceNotCompany(name) &&
    name.split(/\s+/).length > 6 &&
    !CERT_KEYWORD_RE.test(combined) &&
    !/\b(?:diploma|auditor|course|udemy|coursera|linkedin|professional)\b/i.test(combined)
  ) {
    return true;
  }
  if (SKILL_LIST_RE.test(name)) return true;
  if (/^(?:summary|objective|profile|experience|skills?|projects?|education)\b/i.test(name)) {
    return true;
  }
  // Multi-column bleed: contact / identity lines must never become certifications.
  if (/@|linkedin\.com|github\.com|https?:\/\/|\+?\d[\d\s().-]{7,}\d/i.test(combined)) return true;
  const normalizedName = name.replace(/\t+/g, ' ').trim();
  if (
    !CERT_KEYWORD_RE.test(name) &&
    !AWS_CERT_NAME_RE.test(name) &&
    !ISSUER_SUFFIX_RE.test(combined) &&
    isPlausiblePersonName(normalizedName)
  ) {
    return true;
  }
  return false;
}

function extractUrl(text: string): { url: string; remainder: string } {
  const match = text.match(URL_RE);
  if (!match) return { url: '', remainder: text };
  return {
    url: match[0],
    remainder: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
  };
}

function extractCredentialId(text: string): { id: string; remainder: string } {
  const match = text.match(CREDENTIAL_ID_RE);
  if (!match) return { id: '', remainder: text };
  return {
    id: match[1],
    remainder: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
  };
}

function extractDate(text: string): { date: string; remainder: string } {
  const range = parseDateRangeFromText(text);
  if (range?.startDate) {
    const dateStr = range.endDate && !range.current
      ? `${range.startDate} - ${range.endDate}`
      : range.current
        ? `${range.startDate} - Present`
        : range.startDate;
    const raw = range.raw || dateStr;
    return { date: dateStr, remainder: text.replace(raw, ' ').replace(/\s+/g, ' ').trim() };
  }

  const yearMatch = text.match(/\b((?:19|20)\d{2})\b/);
  if (yearMatch) {
    return {
      date: yearMatch[1],
      remainder: text.replace(yearMatch[0], ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  return { date: '', remainder: text };
}

function splitNameIssuer(text: string): { name: string; issuer: string } {
  const trimmed = text.trim();
  if (!trimmed) return { name: '', issuer: '' };

  const byDash = splitOnFieldSeparatorDash(trimmed);
  if (byDash) {
    const left = byDash.left;
    const right = byDash.right;
    if (ISSUER_SUFFIX_RE.test(right) || right.split(/\s+/).length <= 4) {
      return { name: left, issuer: right };
    }
    if (ISSUER_SUFFIX_RE.test(left)) {
      return { name: right, issuer: left };
    }
    return { name: left, issuer: right };
  }

  const byPipe = trimmed.match(/^(.+?)\s*\|\s*(.+)$/);
  if (byPipe) {
    return { name: byPipe[1].trim(), issuer: byPipe[2].trim() };
  }

  const byIssuer = trimmed.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byIssuer && byIssuer[1].trim().length >= 4 && byIssuer[2].trim().length >= 2) {
    return { name: byIssuer[1].trim(), issuer: byIssuer[2].trim() };
  }

  const byParen = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (byParen) {
    const inner = byParen[2].trim();
    if (ISSUER_SUFFIX_RE.test(inner) || inner.length <= 50) {
      return { name: byParen[1].trim(), issuer: inner };
    }
  }

  const byComma = trimmed.match(/^(.+?),\s*(.+)$/);
  if (byComma && ISSUER_SUFFIX_RE.test(byComma[2])) {
    return { name: byComma[1].trim(), issuer: byComma[2].trim() };
  }

  return { name: trimmed, issuer: '' };
}

function scoreCertification(name: string, issuer: string, hasDate: boolean, hasUrl: boolean): number {
  let score = 50;
  if (name.length >= 5) score += 10;
  if (CERT_KEYWORD_RE.test(name)) score += 18;
  if (issuer) score += 12;
  if (hasDate) score += 10;
  if (hasUrl) score += 8;
  if (name.length > 120) score -= 20;
  return Math.min(100, Math.max(0, score));
}

export function parseCertificationLine(line: string): ParsedCertification | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return null;
  if (/^(?:certifications?|certificates?|licenses?|training|courses?)\s*:?\s*$/i.test(trimmed)) {
    return null;
  }

  let working = trimmed
    .replace(/^[-•*·]\s*/, '')
    .replace(/[.:]+$/g, '')
    .trim();
  if (/^(?:spoken\s+)?languages?\s*:/i.test(working)) return null;

  // "… from Issuer on ISO …" / "… from Issuer"
  const fromIssuer = working.match(/^(.+?)\s+from\s+(.+)$/i);
  if (fromIssuer && !/\bby\b/i.test(working)) {
    working = `${fromIssuer[1].trim()} by ${fromIssuer[2].trim()}`;
  }

  // Accept (2024), (2024-2025), (2024–2025) as course year annotations.
  const parenYear = working.match(
    /\(((?:19|20)\d{2})(?:\s*[-–—−]\s*((?:19|20)\d{2}))?\)\s*$/
  );
  if (parenYear) {
    working = working.replace(/\s*\((?:19|20)\d{2}(?:\s*[-–—−]\s*(?:19|20)\d{2})?\)\s*$/, '').trim();
  }

  if (CERT_KEYWORD_RE.test(working) || ISSUER_SUFFIX_RE.test(working) || AWS_CERT_NAME_RE.test(working)) {
    const { name, issuer: rawIssuer } = splitNameIssuer(working);
    const issuer = rawIssuer
      .replace(/\s*\(\s*\)\s*$/, '')
      .replace(/\s*\((?:19|20)\d{2}\)\s*$/, '')
      .trim();
    if (name && name.length >= 3) {
      const date = parenYear?.[1] || '';
      const confidence = scoreCertification(name, issuer, Boolean(date), false);
      if (
        (confidence >= 45 || CERT_KEYWORD_RE.test(name) || CERT_KEYWORD_RE.test(working)) &&
        !isUnrelatedCertificationContent(name, issuer) &&
        (isPlausibleCertificationEntry(name, issuer) ||
          CERT_KEYWORD_RE.test(name) ||
          CERT_KEYWORD_RE.test(working) ||
          AWS_CERT_NAME_RE.test(name))
      ) {
        return { name, issuer, date, url: '', credentialId: '', confidence };
      }
    }
  }

  const { url, remainder: afterUrl } = extractUrl(working);
  working = afterUrl;

  const { id: credentialId, remainder: afterId } = extractCredentialId(working);
  working = afterId;

  const { date: extractedDate, remainder: afterDate } = extractDate(working);
  const date = extractedDate || (parenYear ? parenYear[1] : '');
  working = afterDate;

  const { name, issuer: rawIssuer } = splitNameIssuer(working);
  const issuer = rawIssuer
    .replace(/\s*\(\s*\)\s*$/, '')
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/, '')
    .trim();
  if (!name || name.length < 3) return null;
  if (name.split(/\s+/).length > 20) return null;

  const confidence = scoreCertification(name, issuer, Boolean(date), Boolean(url));
  // Course / training bullets inside a certifications section often omit the word
  // "certificate" — accept when confidence is moderate or platform/issuer cues exist.
  const courseCue =
    Boolean(issuer) ||
    /\b(?:udemy|coursera|linkedin|diploma|auditor|course|certificate|professional|recruiting|analytics)\b/i.test(
      `${name} ${issuer} ${working}`
    );
  if (confidence < 45 && !CERT_KEYWORD_RE.test(name) && !courseCue) return null;
  if (confidence < 28) return null;
  if (isUnrelatedCertificationContent(name, issuer) && !courseCue) return null;
  if (
    !isPlausibleCertificationEntry(name, issuer) &&
    !CERT_KEYWORD_RE.test(name) &&
    !AWS_CERT_NAME_RE.test(name) &&
    !courseCue
  ) {
    return null;
  }

  return {
    name,
    issuer,
    date,
    url,
    credentialId,
    confidence: Math.max(confidence, courseCue ? 52 : confidence),
  };
}

export function partitionCertificationBlocks(sectionText: string): string[][] {
  const lines = sectionText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim());
  const blocks: string[][] = [];
  let current: string[] = [];

  const isYearOnly = (line: string) => /^(?:19|20)\d{2}$/.test(line.trim());
  const isCertLine = (line: string) =>
    CERT_KEYWORD_RE.test(line) || parseCertificationLine(line) !== null;

  for (const line of lines) {
    if (!line) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }

    if (isYearOnly(line) && current.length > 0) {
      current.push(line);
      continue;
    }

    const isNewBlock =
      current.length > 0 &&
      isCertLine(line) &&
      current.some((l) => isCertLine(l) || l.length > 15);

    if (isNewBlock) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) blocks.push(current);
  return blocks.length > 0 ? blocks : lines.filter(Boolean).map((l) => [l]);
}

export function parseCertificationBlock(lines: string[]): ParsedCertification | null {
  if (!lines.length) return null;

  const normalized = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^(?:spoken\s+)?languages?\s*:/i.test(l))
    .filter((l) => l !== '•' && !/^[•·▪◦]+$/.test(l));

  if (!normalized.length) return null;

  const yearLines = lines.filter((l) => /^(?:19|20)\d{2}$/.test(l.trim()));
  const textLines = normalized.filter((l) => !/^(?:19|20)\d{2}$/.test(l));

  // Prefer the strongest single-line parse — avoid joining cert + leftover rows with " — ".
  let best: ParsedCertification | null = null;

  for (const line of textLines) {
    const withYear =
      yearLines.length > 0 ? `${line} (${yearLines[yearLines.length - 1]})` : line;
    const parsed = parseCertificationLine(withYear);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
  }

  if (!best && textLines.length > 0) {
    const combined = textLines.join(' — ');
    best = parseCertificationLine(
      yearLines.length > 0 ? `${combined} (${yearLines[yearLines.length - 1]})` : combined
    );
  }

  if (best) {
    for (const line of textLines) {
      const issuerMatch = line.match(/^(?:issuer|issued\s+by|provider)\s*[:–-]\s*(.+)$/i);
      if (issuerMatch && !best.issuer) {
        best = { ...best, issuer: issuerMatch[1].trim(), confidence: Math.min(100, best.confidence + 8) };
      }
    }
    if (!best.date && yearLines.length > 0) {
      best = { ...best, date: yearLines[yearLines.length - 1], confidence: Math.min(100, best.confidence + 6) };
    }
    if (best.name.startsWith('— ')) {
      best = { ...best, name: best.name.replace(/^—\s+/, '').trim() };
    }
    best = {
      ...best,
      issuer: best.issuer.replace(/\s*\(\s*\)\s*$/, '').trim(),
      name: best.name.replace(/\s*\(\s*\)\s*$/, '').trim(),
    };
  }

  return best;
}

export interface CertificationSectionParseResult {
  certifications: ParsedCertification[];
  rejectedCount: number;
  blockCount: number;
}

export function parseCertificationsFromSection(sectionText: string): ParsedCertification[] {
  return parseCertificationsFromSectionWithStats(sectionText).certifications;
}

export function parseCertificationsFromSectionWithStats(
  sectionText: string
): CertificationSectionParseResult {
  if (!sectionText?.trim()) {
    return { certifications: [], rejectedCount: 0, blockCount: 0 };
  }

  const blocks = partitionCertificationBlocks(sectionText);
  const results: ParsedCertification[] = [];
  const seen = new Set<string>();
  let rejectedCount = 0;

  for (const block of blocks) {
    const parsed = parseCertificationBlock(block);
    if (!parsed) {
      rejectedCount += 1;
      continue;
    }
    const key = parsed.name.toLowerCase();
    if (seen.has(key)) {
      rejectedCount += 1;
      continue;
    }
    seen.add(key);
    results.push(parsed);
  }

  return { certifications: results, rejectedCount, blockCount: blocks.length };
}
