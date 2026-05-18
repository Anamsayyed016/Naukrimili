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

const JOB_PROVIDERS = ['adzuna', 'jsearch', 'jooble', 'indeed', 'ziprecruiter', 'google', 'rapidapi'] as const;

/** Parse listing ID: ext-adzuna-123, ext-external-adzuna-123, ext-external-123 */
export function parseExtListingId(id: string): ExtCompositeId | null {
  const s = String(id).trim();

  const externalProvider = s.match(
    /^ext-external-(adzuna|jsearch|jooble|indeed|ziprecruiter|google|rapidapi)-(.+)$/i
  );
  if (externalProvider) {
    return {
      source: externalProvider[1].toLowerCase(),
      sourceId: externalProvider[2],
    };
  }

  for (const provider of JOB_PROVIDERS) {
    const prefix = `ext-${provider}-`;
    if (s.toLowerCase().startsWith(prefix)) {
      return { source: provider, sourceId: s.slice(prefix.length) };
    }
  }

  const generic = s.match(/^ext-([^-]+)-(.+)$/);
  if (!generic) return null;

  const source = generic[1].toLowerCase();
  let sourceId = generic[2];
  if (source === 'external') {
    const nested = sourceId.match(/^(adzuna|jsearch|jooble|indeed|ziprecruiter|google|rapidapi)-(.+)$/i);
    if (nested) {
      return { source: nested[1].toLowerCase(), sourceId: nested[2] };
    }
  }
  return { source, sourceId };
}

/** Extra source/sourceId pairs to try in Prisma (legacy URL shapes). */
export function extCompositeLookupVariants(
  ext: ExtCompositeId
): ExtCompositeId[] {
  const variants: ExtCompositeId[] = [ext];
  const numeric = ext.sourceId.match(/(\d{5,})$/);
  if (numeric && numeric[1] !== ext.sourceId) {
    variants.push({ source: ext.source, sourceId: numeric[1] });
  }
  if (ext.source === 'external') {
    const nested = ext.sourceId.match(
      /^(adzuna|jsearch|jooble|indeed|ziprecruiter|google|rapidapi)-(.+)$/i
    );
    if (nested) {
      variants.push({ source: nested[1].toLowerCase(), sourceId: nested[2] });
      const n = nested[2].match(/(\d{5,})$/);
      if (n) variants.push({ source: nested[1].toLowerCase(), sourceId: n[1] });
    }
  }
  const seen = new Set<string>();
  return variants.filter((v) => {
    const key = `${v.source}|${v.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Turn route param (numeric id, SEO slug, ext-adzuna-123, etc.) into lookup hints.
 */
export function resolveJobRouteParam(routeParam: string): JobRouteResolution {
  const raw = String(routeParam || '').trim().replace(/\/+$/, '');
  let resolvedId = raw;

  const extDirect = parseExtListingId(raw);
  if (extDirect) {
    return buildResolution(raw, `ext-${extDirect.source}-${extDirect.sourceId}`, extDirect);
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
