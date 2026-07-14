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
  /\b(?:certified|certification|certificate|license|licence|credential|accreditation|chartered|fellowship)\b/i;

const AWS_CERT_NAME_RE = /\baws\s+(?:certified\s+)?(?:solutions\s+)?architect\b/i;

const EXPERIENCE_VERB_RE =
  /\b(responsible for|managed|mentored|developed|implemented|designed|delivered|led|built|created)\b/i;

const SKILL_LIST_RE = /(?:^|[,;|])\s*[A-Za-z+#.]+\s*[,;|]\s*[A-Za-z+#.]+\s*[,;|]/;

function isUnrelatedCertificationContent(name: string, issuer: string): boolean {
  const combined = `${name} ${issuer}`.trim();
  if (!combined) return true;
  if (isResumeSectionHeadingLine(name) || isResumeSectionHeadingLine(combined)) return true;
  if (isLikelyEducationLine(name) || isLikelyEducationLine(combined)) return true;
  if (looksLikeJobTitleLine(name) && !CERT_KEYWORD_RE.test(name) && !AWS_CERT_NAME_RE.test(name)) return true;
  if (EXPERIENCE_VERB_RE.test(combined) && combined.split(/\s+/).length > 5) return true;
  if (looksLikeSentenceNotCompany(name) && name.split(/\s+/).length > 6) return true;
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

  const byDash = trimmed.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (byDash) {
    const left = byDash[1].trim();
    const right = byDash[2].trim();
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

  let working = trimmed.replace(/^[-•*·]\s*/, '');
  const parenYear = working.match(/\(((?:19|20)\d{2})\)\s*$/);
  if (parenYear) {
    working = working.replace(/\s*\((?:19|20)\d{2}\)\s*$/, '').trim();
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
        (confidence >= 45 || CERT_KEYWORD_RE.test(name)) &&
        !isUnrelatedCertificationContent(name, issuer) &&
        (isPlausibleCertificationEntry(name, issuer) || CERT_KEYWORD_RE.test(name) || AWS_CERT_NAME_RE.test(name))
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
  if (confidence < 45 && !CERT_KEYWORD_RE.test(name)) return null;
  if (isUnrelatedCertificationContent(name, issuer)) return null;
  if (!isPlausibleCertificationEntry(name, issuer) && !CERT_KEYWORD_RE.test(name) && !AWS_CERT_NAME_RE.test(name)) {
    return null;
  }

  return { name, issuer, date, url, credentialId, confidence };
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
    .filter(Boolean);

  const yearLines = lines.filter((l) => /^(?:19|20)\d{2}$/.test(l.trim()));
  const textLines = normalized.filter((l) => !/^(?:19|20)\d{2}$/.test(l));

  const combined = textLines.join(' — ');
  let best: ParsedCertification | null = null;

  const fromCombined = parseCertificationLine(
    yearLines.length > 0 ? `${combined} (${yearLines[yearLines.length - 1]})` : combined
  );
  if (fromCombined) best = fromCombined;

  for (const line of textLines) {
    const withYear =
      yearLines.length > 0 ? `${line} (${yearLines[yearLines.length - 1]})` : line;
    const parsed = parseCertificationLine(withYear);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
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
