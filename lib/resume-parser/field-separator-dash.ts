/**
 * Field-separator dash splitting (title – employer, name – issuer).
 * Never treats compound-word hyphens (Full-Stack, Front-End) as separators.
 */

/** Spaced ASCII/Unicode dashes used as field separators between values. */
const SPACED_SEPARATOR_DASH_RE = /^(.+?)\s+[-–—−]\s+(.+)$/;

/** En/em/minus dash without spaces — still a separator when both sides are substantive. */
const UNSPACED_TYPOGRAPHIC_DASH_RE = /^(.+?)[–—−](.+)$/;

function sideLooksLikeCompoundFragment(side: string): boolean {
  const t = side.trim();
  if (!t) return true;
  // Single short Capitalized token is usually a compound-adjective stub ("Full", "Front").
  if (/^[A-Z][a-z]{1,8}$/.test(t) && t.split(/\s+/).length === 1) return true;
  return false;
}

/**
 * Split `left – right` field pairs. Returns null when the only hyphen is
 * intra-token (e.g. "Full-Stack Python Developer").
 */
export function splitOnFieldSeparatorDash(text: string): { left: string; right: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const spaced = trimmed.match(SPACED_SEPARATOR_DASH_RE);
  if (spaced) {
    const left = spaced[1].trim();
    const right = spaced[2].trim();
    if (left && right && !sideLooksLikeCompoundFragment(left)) {
      return { left, right };
    }
    if (left && right && right.split(/\s+/).length >= 2) {
      return { left, right };
    }
  }

  // Typographic dash without spaces: only when left is not a tiny fragment.
  const typographic = trimmed.match(UNSPACED_TYPOGRAPHIC_DASH_RE);
  if (typographic) {
    const left = typographic[1].trim();
    const right = typographic[2].trim();
    if (!left || !right) return null;
    if (sideLooksLikeCompoundFragment(left) && right.split(/\s+/).length < 2) return null;
    if (left.split(/\s+/).length >= 2 || right.split(/\s+/).length >= 2) {
      return { left, right };
    }
  }

  // ASCII hyphen: ONLY when surrounded by spaces (already handled) — never split Full-Stack.
  return null;
}

/**
 * Split a line into at most two parts on field-separator dashes.
 * Falls back to the original line when no separator is present.
 */
export function splitLineOnFieldSeparatorDash(text: string): string[] {
  const parts = splitOnFieldSeparatorDash(text);
  if (!parts) return [text.trim()].filter(Boolean);
  return [parts.left, parts.right];
}
