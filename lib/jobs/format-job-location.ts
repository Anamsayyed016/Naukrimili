/**
 * Shared job location display helpers (cards vs detail pages).
 */

/** Normalize scraped locality strings for display. */
export function normalizeJobLocationText(location?: string | null): string {
  return (location || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

/**
 * Card/list: short label with city-first logic; full string available via title/tooltip.
 */
export function formatJobCardLocation(location?: string | null): string {
  const raw = normalizeJobLocationText(location);
  if (!raw) return 'Location not specified';

  const parts = raw
    .split(/[,•|]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return raw;
  if (parts.length === 1) {
    return parts[0].length > 56 ? `${parts[0].slice(0, 56)}…` : parts[0];
  }

  const city = parts[0];
  const second = parts[1];

  if (second.length > 32 || parts.length > 2) {
    const locality = second.length > 24 ? `${second.slice(0, 24)}…` : second;
    return `${city} • ${locality}`;
  }

  return `${city}, ${second}`;
}

/** Detail page: preserve full location with natural line breaks at commas. */
export function formatJobDetailLocation(location?: string | null): string {
  const raw = normalizeJobLocationText(location);
  if (!raw) return '';
  return raw.replace(/,\s*/g, ',\n');
}
