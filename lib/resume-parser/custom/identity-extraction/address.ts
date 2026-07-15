/**
 * Address and location component detection.
 */

import {
  isLikelyLocationFragment,
  classifyResumeTextFragment,
} from '@/lib/resume-parser/field-classification';
import {
  isPlausiblePersonName,
  looksLikeStandaloneLocationLine,
} from '@/lib/resume-parser/import-sanitize';

import { getZoneLines, type ScanZone } from './sources';

export interface AddressDetection {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  confidence: number;
}

const POSTAL_RE = /\b\d{5}(?:-\d{4})?\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i;
const REMOTE_RE = /\b(remote|hybrid|onsite|on[- ]?site|wfh|work from home)\b/i;

const COUNTRY_NAMES =
  /\b(India|United States|USA|UK|United Kingdom|Canada|Australia|Germany|France|Singapore|UAE|Dubai)\b/i;

function scoreLocationLine(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 120) return 0;
  if (isPlausiblePersonName(trimmed)) return 0;

  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'PERSON_NAME') return 0;
  if (classified.kind === 'COMPANY_NAME' && classified.confidence >= 75) return 0;

  let score = 0;
  if (classified.kind === 'LOCATION') score += classified.confidence * 0.85;
  if (isLikelyLocationFragment(trimmed)) score += 28;
  if (looksLikeStandaloneLocationLine(trimmed)) score += 30;
  if (REMOTE_RE.test(trimmed)) score += 35;
  if (POSTAL_RE.test(trimmed)) score += 18;
  if (COUNTRY_NAMES.test(trimmed)) score += 15;
  if (/,\s*[A-Z]{2}\b/.test(trimmed)) score += 12;

  return Math.min(100, Math.round(score));
}

function parseAddressParts(line: string): Partial<AddressDetection> {
  const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
  const postal = line.match(POSTAL_RE)?.[0] || '';

  if (REMOTE_RE.test(line) && parts.length === 1) {
    return { city: line.trim() };
  }

  if (parts.length >= 3) {
    return {
      address: parts[0],
      city: parts[parts.length - 3] || '',
      state: parts[parts.length - 2] || '',
      country: parts[parts.length - 1] || '',
      postalCode: postal,
    };
  }

  if (parts.length === 2) {
    return {
      city: parts[0],
      state: parts[1],
      postalCode: postal,
    };
  }

  if (COUNTRY_NAMES.test(line)) {
    return { country: line.trim() };
  }

  return { city: line.trim() };
}

export function detectAddress(zones: ScanZone[]): AddressDetection {
  const lines = getZoneLines(zones, ['header', 'contact', 'preamble']);
  let best: AddressDetection = {
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    confidence: 0,
  };

  for (const line of lines.slice(0, 20)) {
    // Split pipe contact rows ("Phone: … | Email: … | Location: City") before scoring.
    const fragments = line.includes('|')
      ? line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)
      : [line];
    for (const fragment of fragments) {
      const labeled = fragment.match(/^(?:address|location|city|residence)\s*[:–-]\s*(.+)$/i);
      const candidate = labeled?.[1]?.trim() || fragment;
      if (isPlausiblePersonName(candidate)) continue;
      if (/@|https?:\/\//i.test(candidate)) continue;
      if (/\b(?:phone|mobile|email|linkedin|portfolio|website)\b/i.test(fragment) && !labeled) {
        continue;
      }
      let conf = scoreLocationLine(candidate);
      if (labeled) conf = Math.max(conf, 78);
      if (!labeled && !/,/.test(candidate) && !REMOTE_RE.test(candidate) && !POSTAL_RE.test(candidate)) {
        conf = Math.min(conf, 30);
      }
      if (conf < 40) continue;

      const parsed = parseAddressParts(candidate);
      const merged: AddressDetection = {
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        country: parsed.country || '',
        postalCode: parsed.postalCode || '',
        confidence: conf,
      };

      if (conf > best.confidence) best = merged;
    }
  }

  return best;
}
