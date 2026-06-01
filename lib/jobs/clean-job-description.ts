/**
 * Normalize external job descriptions: HTML → readable plain text.
 * Single source of truth for ingestion and API responses (no duplicate parsers).
 */

const NAMED_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&ndash;': '–',
  '&mdash;': '—',
  '&bull;': '•',
  '&hellip;': '…',
};

function decodeHtmlEntities(input: string): string {
  let text = input;
  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    text = text.replace(new RegExp(entity, 'gi'), char);
  }
  text = text.replace(/&#(\d+);/g, (_, code) => {
    const n = parseInt(code, 10);
    return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : ' ';
  });
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const n = parseInt(hex, 16);
    return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : ' ';
  });
  return text;
}

function htmlStructureToNewlines(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)\s*>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '');
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert provider HTML or entity-encoded text to clean plain text.
 * Preserves paragraph breaks and simple bullet lines where possible.
 */
export function cleanJobDescription(raw: string | null | undefined): string {
  if (raw == null) return '';
  let text = String(raw);
  if (!text.trim()) return '';

  // Already plain text with no markup — still decode entities and normalize space
  if (!/[<>]|&(?:#?[a-z0-9]+|nbsp);/i.test(text)) {
    return normalizeWhitespace(decodeHtmlEntities(text));
  }

  text = htmlStructureToNewlines(text);
  text = decodeHtmlEntities(text);
  return normalizeWhitespace(text);
}
