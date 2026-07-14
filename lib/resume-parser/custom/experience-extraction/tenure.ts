/**
 * Parse duration-tenure experience lines:
 * "07 Year experience as a Deputy Quality Manager at M/s Acme Pvt. Ltd."
 * "3 years experience as Project Engineer at Example Corp"
 */

export interface ParsedTenureExperienceLine {
  designation: string;
  company: string;
  years: number | null;
  raw: string;
  confidence: number;
}

const TENURE_AS_AT_RE =
  /^(\d{1,2})\+?\s*(?:years?|yrs?|year)\s+(?:of\s+)?experience\s+as\s+(?:an?\s+)?(.+?)\s+at\s+(?:m\/?s\.?\s+)?(.+?)\.?$/i;

const TENURE_AS_WITH_RE =
  /^(\d{1,2})\+?\s*(?:years?|yrs?|year)\s+(?:of\s+)?experience\s+as\s+(?:an?\s+)?(.+?)\s+with\s+(?:m\/?s\.?\s+)?(.+?)\.?$/i;

/** Strip trailing subsection labels glued onto a role title. */
export function stripRolesResponsibilitiesSuffix(title: string): string {
  return title
    .replace(/\s*(?:roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|key\s+responsibilit(?:y|ies))\s*:?\s*$/i, '')
    .trim();
}

export function parseTenureExperienceLine(text: string): ParsedTenureExperienceLine | null {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length < 20 || trimmed.length > 220) return null;

  for (const re of [TENURE_AS_AT_RE, TENURE_AS_WITH_RE]) {
    const m = trimmed.match(re);
    if (!m) continue;
    const years = Number.parseInt(m[1], 10);
    let designation = stripRolesResponsibilitiesSuffix(m[2].trim());
    let company = m[3].trim().replace(/\s*\.$/, '');
    if (!designation || designation.length < 3) continue;
    if (!company || company.length < 2) continue;
    // Reject if "designation" still looks like a full sentence of duties.
    if (designation.split(/\s+/).length > 12) continue;
    if (/^(to|the|responsible|ensure|carry)\b/i.test(designation)) continue;
    return {
      designation,
      company,
      years: Number.isFinite(years) ? years : null,
      raw: trimmed,
      confidence: 82,
    };
  }
  return null;
}

export function lineLooksLikeTenureExperience(text: string): boolean {
  return parseTenureExperienceLine(text) !== null;
}
