/**
 * Email detection — primary + alternates with confidence scoring.
 */

export interface EmailCandidate {
  email: string;
  confidence: number;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const DISPOSABLE_OR_NOISE_RE =
  /^(noreply|no-reply|donotreply|mailer-daemon|example|test|admin|info@example)/i;

const PERSONAL_DOMAIN_RE =
  /@(gmail|googlemail|yahoo|outlook|hotmail|live|icloud|protonmail|pm\.me|rediffmail|ymail)\./i;

export function extractEmailCandidates(text: string, zoneWeight = 1): EmailCandidate[] {
  if (!text?.trim()) return [];
  const seen = new Set<string>();
  const out: EmailCandidate[] = [];

  for (const match of text.matchAll(EMAIL_RE)) {
    const email = match[0].trim().toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);

    let confidence = Math.round(70 * zoneWeight);
    if (DISPOSABLE_OR_NOISE_RE.test(email)) confidence = 0;
    if (PERSONAL_DOMAIN_RE.test(email)) confidence += 12;
    if (email.length > 60) confidence -= 20;

    if (confidence > 0) out.push({ email, confidence: Math.min(100, confidence) });
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

export function pickPrimaryEmail(candidates: EmailCandidate[]): EmailCandidate {
  if (candidates.length === 0) return { email: '', confidence: 0 };
  return candidates[0];
}

export function pickAlternateEmail(candidates: EmailCandidate[]): EmailCandidate {
  if (candidates.length < 2) return { email: '', confidence: 0 };
  return candidates[1];
}
