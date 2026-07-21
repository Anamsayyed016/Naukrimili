/**
 * Phone detection and normalization — international formats.
 */

export interface PhoneCandidate {
  phone: string;
  normalized: string;
  confidence: number;
}

const PHONE_PATTERNS = [
  /\+\s*\d{1,3}(?:[\s.-]*\d{2,5}){2,4}(?:\s*(?:ext|x)\s*\d{1,6})?/g,
  /(?:\+?\s*\d{1,3}[\s.-]*)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}(?:\s*(?:ext|x)\s*\d{1,6})?/g,
];

/** Heal common PDF spacing around country codes before digit extraction. */
function healPhoneRaw(raw: string): string {
  return String(raw || '')
    .replace(/\+\s*91\s*[-–—.]?\s*/gi, '+91 ')
    .replace(/\b91\s*[-–—.]\s*(?=[6-9]\d{9}\b)/g, '+91 ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhoneNumber(raw: string): string {
  const trimmed = healPhoneRaw(raw);
  const extMatch = trimmed.match(/(?:ext|x)\s*(\d{1,6})$/i);
  const ext = extMatch ? ` ext ${extMatch[1]}` : '';

  const digits = trimmed.replace(/(?:ext|x)\s*\d{1,6}$/i, '').replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return trimmed;

  // Explicit +country or leading country code.
  if (trimmed.startsWith('+') || /^00\d/.test(trimmed.replace(/\s/g, ''))) {
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}${ext}`.trim();
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}${ext}`.trim();
    }
    return `+${digits}${ext ? ` ${ext.trim()}` : ''}`;
  }

  // "91 - 91655…" without plus — treat as India when 12 digits.
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}${ext}`.trim();
  }

  if (digits.length === 10) {
    // Prefer +91 when the raw capture retained an India country-code hint.
    const rawHasIndiaHint = /(?:\+?\s*91)\b/i.test(raw) || /(?:\+?\s*91)\b/i.test(trimmed);
    if (rawHasIndiaHint && /^[6-9]\d{9}$/.test(digits)) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}${ext}`.trim();
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}${ext}`.trim();
  }

  return trimmed;
}

function scorePhone(raw: string, zoneWeight: number): number {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 0;

  let confidence = Math.round(68 * zoneWeight);
  if (raw.trim().startsWith('+')) confidence += 10;
  if (/\b(mobile|cell|phone|tel|contact)\s*[:–-]/i.test(raw)) confidence += 12;
  if (digits.length === 10 || digits.length === 11 || digits.length === 12) confidence += 8;

  return Math.min(100, confidence);
}

export function extractPhoneCandidates(text: string, zoneWeight = 1): PhoneCandidate[] {
  if (!text?.trim()) return [];
  const seen = new Set<string>();
  const out: PhoneCandidate[] = [];
  const healedText = healPhoneRaw(text);

  for (const re of PHONE_PATTERNS) {
    for (const match of healedText.matchAll(re)) {
      const raw = healPhoneRaw(match[0]);
      const digits = raw.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) continue;
      if (seen.has(digits)) continue;
      seen.add(digits);

      const confidence = scorePhone(raw, zoneWeight);
      if (confidence <= 0) continue;

      out.push({
        phone: raw,
        normalized: normalizePhoneNumber(raw),
        confidence,
      });
    }
  }

  const filtered = out.filter((c, i, arr) => {
    const digits = c.normalized.replace(/\D/g, '');
    return !arr.some((other, j) => {
      if (i === j) return false;
      const otherDigits = other.normalized.replace(/\D/g, '');
      return otherDigits.length > digits.length && otherDigits.includes(digits);
    });
  });

  const byLast10 = new Map<string, PhoneCandidate>();
  for (const c of filtered) {
    const last10 = c.normalized.replace(/\D/g, '').slice(-10);
    if (last10.length < 10) continue;
    const prev = byLast10.get(last10);
    if (!prev || c.confidence > prev.confidence) byLast10.set(last10, c);
  }

  return [...byLast10.values()].sort(
    (a, b) =>
      b.normalized.replace(/\D/g, '').length - a.normalized.replace(/\D/g, '').length ||
      b.confidence - a.confidence
  );
}

export function pickPrimaryPhone(candidates: PhoneCandidate[]): PhoneCandidate {
  if (candidates.length === 0) {
    return { phone: '', normalized: '', confidence: 0 };
  }
  return candidates[0];
}

export function pickAlternatePhone(candidates: PhoneCandidate[]): PhoneCandidate {
  if (candidates.length < 2) {
    return { phone: '', normalized: '', confidence: 0 };
  }
  const primary = pickPrimaryPhone(candidates);
  const primaryLast10 = primary.normalized.replace(/\D/g, '').slice(-10);
  const alt = candidates.find((c) => {
    const last10 = c.normalized.replace(/\D/g, '').slice(-10);
    return last10.length >= 10 && last10 !== primaryLast10;
  });
  return alt || { phone: '', normalized: '', confidence: 0 };
}
