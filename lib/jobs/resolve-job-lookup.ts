/**
 * Resolve a /jobs/[param] route segment to database lookup hints.
 * Keeps listing IDs, SEO slugs, sourceId, and ext-{source}-{sourceId} formats aligned.
 */
import { parseSEOJobUrl } from '@/lib/seo-url-utils';

export type ExtCompositeId = { source: string; sourceId: string };

export type JobRouteResolution = {
  raw: string;
  /** ID used for logging / error messages */
  resolvedId: string;
  numericId: number | null;
  isLargeNumericId: boolean;
  isSafeInteger: boolean;
  extComposite: ExtCompositeId | null;
};

/** Parse listing ID format: ext-{source}-{sourceId} */
export function parseExtListingId(id: string): ExtCompositeId | null {
  const match = String(id).trim().match(/^ext-([^-]+)-(.+)$/);
  if (!match) return null;
  return { source: match[1], sourceId: match[2] };
}

/**
 * Turn route param (numeric id, SEO slug, ext-adzuna-123, etc.) into lookup hints.
 */
export function resolveJobRouteParam(routeParam: string): JobRouteResolution {
  const raw = String(routeParam || '').trim().replace(/\/+$/, '');
  let resolvedId = raw;

  const extDirect = parseExtListingId(raw);
  if (extDirect) {
    return buildResolution(raw, resolvedId, extDirect);
  }

  // Pure numeric route param
  if (/^\d+$/.test(raw)) {
    return buildResolution(raw, raw, null);
  }

  // Provider-prefixed IDs (adzuna-*, jsearch-*, job-*-*, etc.)
  if (/^(adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external|sample|job)-/.test(raw)) {
    const extFromProvider = parseExtListingId(
      raw.startsWith('ext-') ? raw : `ext-external-${raw}`
    );
    return buildResolution(raw, raw, extFromProvider);
  }

  // SEO slug (many segments) — parse trailing job id
  const hyphenCount = raw.split('-').length;
  const looksLikeSeoSlug =
    hyphenCount > 3 ||
    (raw.length > 40 && hyphenCount > 2);

  if (looksLikeSeoSlug) {
    const parsed = parseSEOJobUrl(raw);
    if (parsed) {
      resolvedId = parsed;
      const extParsed = parseExtListingId(parsed);
      if (extParsed) {
        return buildResolution(raw, resolvedId, extParsed);
      }
      return buildResolution(raw, resolvedId, null);
    }
  }

  // Short alphanumeric id (legacy)
  if (/^[a-zA-Z0-9_-]+$/.test(raw) && hyphenCount <= 3) {
    const extShort = parseExtListingId(raw);
    return buildResolution(raw, raw, extShort);
  }

  return buildResolution(raw, resolvedId, null);
}

function buildResolution(
  raw: string,
  resolvedId: string,
  extComposite: ExtCompositeId | null
): JobRouteResolution {
  const isNumericString = /^\d+$/.test(resolvedId);
  const isLargeNumericId = isNumericString && resolvedId.length >= 10;
  const numericId = isNumericString ? Number(resolvedId) : NaN;
  const isSafeInteger =
    isNumericString &&
    !isLargeNumericId &&
    !Number.isNaN(numericId) &&
    Number.isSafeInteger(numericId) &&
    numericId > 0;

  return {
    raw,
    resolvedId,
    numericId: isSafeInteger ? numericId : null,
    isLargeNumericId,
    isSafeInteger,
    extComposite,
  };
}
