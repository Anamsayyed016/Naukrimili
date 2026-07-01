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

/** Remove scraping artifacts: broken dots, empty bullets, duplicate punctuation. */
function sanitizeScrapingArtifacts(text: string): string {
  let t = text;

  t = t.replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '');
  t = t.replace(/\u2026/g, '...');
  t = t.replace(/^[\-*●◦▪▸]\s+/gm, '• ');
  t = t.replace(/^\s*·\s+/gm, '• ');
  t = t.replace(/^\s*\.+\s*$/gm, '');
  t = t.replace(/(^|\n)\s*\.{2,}\s*(?=[A-Za-z])/g, '$1');
  t = t.replace(/\s\.{4,}\s*/g, ' ');
  t = t.replace(/\s\.{3}(?=[a-z])/g, ' ');
  t = t.replace(/•\s*\.{2,}\s*/g, '• ');
  t = t.replace(/•\s*•\s*/g, '• ');
  t = t.replace(/^\s*•\s*$/gm, '');
  t = t.replace(/\.{2,}\s*:/g, ':');
  t = t.replace(/([!?;,])\1+/g, '$1');
  t = t.replace(/\.{5,}/g, ' ');
  t = t.replace(/\.{3,}(?=[a-z])/g, ' ');
  t = t.replace(/\s+([.,;:!?])/g, '$1');
  t = t.replace(/\.{2}(?=\S)/g, '. ');

  return t;
}

export type JobDescriptionBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** Normalize line endings only — no truncation, no scraping cleanup. */
export function normalizeJobDescriptionLineEndings(
  raw: string | null | undefined
): string {
  if (raw == null) return '';
  return String(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function readDescriptionFromRawJson(rawJson: unknown): string | null {
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    return null;
  }
  const desc = (rawJson as Record<string, unknown>).description;
  return typeof desc === 'string' && desc.trim() ? desc : null;
}

/**
 * Detail API: employer-posted text is returned verbatim (line endings normalized).
 * External/imported HTML jobs still pass through cleanJobDescription.
 */
export function formatJobDescriptionForDetail(job: {
  description?: string | null;
  source?: string | null;
  rawJson?: unknown;
}): string {
  const source = String(job.source || '').toLowerCase();
  const column = normalizeJobDescriptionLineEndings(job.description);

  if (source === 'manual' || source === 'employer') {
    const fromRawJson = readDescriptionFromRawJson(job.rawJson);
    if (fromRawJson && fromRawJson.length > column.length) {
      return normalizeJobDescriptionLineEndings(fromRawJson);
    }
    return column;
  }

  return cleanJobDescription(job.description);
}

/**
 * Convert provider HTML or entity-encoded text to clean plain text.
 * Preserves paragraph breaks and simple bullet lines where possible.
 */
export function cleanJobDescription(raw: string | null | undefined): string {
  if (raw == null) return '';
  let text = String(raw);
  if (!text.trim()) return '';

  if (!/[<>]|&(?:#?[a-z0-9]+|nbsp);/i.test(text)) {
    return sanitizeScrapingArtifacts(normalizeWhitespace(decodeHtmlEntities(text)));
  }

  text = htmlStructureToNewlines(text);
  text = decodeHtmlEntities(text);
  return sanitizeScrapingArtifacts(normalizeWhitespace(text));
}

function isMeaningfulLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^\.+$/.test(t)) return false;
  if (t.length < 3) return false;
  return true;
}

/**
 * Card preview: one clean sentence block, word-safe truncation, no broken symbols.
 */
export function getJobDescriptionPreview(
  raw: string | null | undefined,
  maxChars = 240
): string {
  const cleaned = cleanJobDescription(raw);
  if (!cleaned) return '';

  const lines = cleaned
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(isMeaningfulLine);

  let flat =
    lines.length > 0
      ? lines.join(' ')
      : cleaned.replace(/\s+/g, ' ').trim();

  const ellipsisParts = flat
    .split(/\s*\.{3,}\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 12 && !/^\.+$/.test(p));

  if (ellipsisParts.length > 1) {
    flat =
      ellipsisParts.find((p) => p.length >= 40 && /^[A-Z]/.test(p)) ||
      ellipsisParts.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  flat = flat.replace(/\s+/g, ' ').trim();
  if (!flat) return '';

  const sentences = flat.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [flat];
  let preview = '';
  for (const sentence of sentences) {
    const s = sentence.trim();
    if (s.length < 15) continue;
    if (/^\.{2,}/.test(s)) continue;
    preview += preview ? ` ${s}` : s;
    if (preview.length >= maxChars) break;
  }
  if (!preview) preview = flat;

  if (preview.length > maxChars) {
    const cut = preview.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(' ');
    preview =
      (lastSpace > maxChars * 0.55 ? cut.slice(0, lastSpace) : cut).trim() + '…';
  }

  return preview;
}

/**
 * Structured blocks for detail page: paragraphs and bullet lists in order.
 */
export function parseJobDescriptionBlocks(
  raw: string | null | undefined
): JobDescriptionBlock[] {
  const cleaned = cleanJobDescription(raw);
  if (!cleaned) return [];

  const lines = cleaned.split('\n').map((l) => l.trim()).filter(isMeaningfulLine);
  const blocks: JobDescriptionBlock[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length) {
      blocks.push({ type: 'ul', items: [...bulletBuffer] });
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^•\s*(.+)$/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (item && !/^\.+$/.test(item)) bulletBuffer.push(item);
      continue;
    }
    flushBullets();
    blocks.push({ type: 'p', text: line });
  }
  flushBullets();

  if (!blocks.length && cleaned.trim()) {
    blocks.push({ type: 'p', text: cleaned.replace(/\s+/g, ' ').trim() });
  }

  return blocks;
}
