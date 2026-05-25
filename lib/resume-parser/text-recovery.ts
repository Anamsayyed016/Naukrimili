/**
 * Regex-based recovery layer for fields the parser failed to extract.
 * Runs over rawText to fill gaps in linkedin/github/portfolio/phone/email/summary
 * without duplicating parser logic — only fills what's missing.
 */

interface RecoveredText {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
}

const EMPTY: RecoveredText = {
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
};

const SECTION_HEADINGS = [
  'experience',
  'work history',
  'employment',
  'professional experience',
  'work experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'awards',
  'references',
  'interests',
  'hobbies',
];

export function recoverFromRawText(rawText: unknown): RecoveredText {
  if (typeof rawText !== 'string' || rawText.length < 20) return { ...EMPTY };

  const text = rawText;
  const recovered: RecoveredText = { ...EMPTY };

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) recovered.email = emailMatch[0].trim();

  // Phone — international or local 7–15 digits with optional separators
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/
  );
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      recovered.phone = phoneMatch[0].trim();
    }
  }

  // LinkedIn URL (canonicalize to https://linkedin.com/in/<slug>)
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)/i);
  if (linkedinMatch) {
    recovered.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // GitHub URL
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i);
  if (githubMatch) {
    recovered.github = `https://github.com/${githubMatch[1]}`;
  }

  // Generic portfolio/website (first http(s) URL that isn't linkedin/github)
  const urlMatches = text.match(/https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s)]*)?/g);
  if (urlMatches) {
    const portfolio = urlMatches.find(
      (u) => !/linkedin\.com|github\.com/i.test(u) && u.length < 200
    );
    if (portfolio) recovered.portfolio = portfolio.trim();
  }

  // Summary / Objective / Profile — capture block under heading until next section
  recovered.summary = extractSummaryBlock(text);

  return recovered;
}

function extractSummaryBlock(text: string): string {
  const headingRegex =
    /^\s*(?:professional\s+)?(summary|objective|profile|about\s*me|career\s*objective)\s*:?\s*$/im;
  const headingMatch = headingRegex.exec(text);
  if (!headingMatch) return '';

  const afterHeading = text.slice(headingMatch.index + headingMatch[0].length).trim();
  const lines = afterHeading.split(/\r?\n/);

  const body: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (body.length > 0) break;
      continue;
    }
    if (isSectionHeading(trimmed)) break;
    body.push(trimmed);
    if (body.join(' ').length > 1500) break;
  }
  return body.join(' ').slice(0, 1500);
}

function isSectionHeading(line: string): boolean {
  if (line.length > 60) return false;
  const lowered = line.toLowerCase().replace(/:$/, '').trim();
  if (SECTION_HEADINGS.includes(lowered)) return true;
  // Title case all-uppercase short line that ends with no period
  if (/^[A-Z][A-Z\s&/]+$/.test(line) && line.length < 40) return true;
  return false;
}

/**
 * Merge recovered values into an object — only fills empty/missing keys, never overwrites.
 */
export function mergeRecovery<T extends Record<string, unknown>>(
  base: T,
  recovered: Partial<RecoveredText>
): T {
  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(recovered) as Array<keyof RecoveredText>) {
    const current = merged[key];
    const next = recovered[key];
    if (next && (!current || (typeof current === 'string' && current.trim() === ''))) {
      merged[key] = next;
    }
  }
  return merged as T;
}
