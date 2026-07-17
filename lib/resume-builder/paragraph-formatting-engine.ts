/**
 * Paragraph Layout Engine
 *
 * Composes long prose (summary, descriptions) to use the full available
 * column width without changing content, template chrome, or parser output.
 *
 * - Groups ~2–4 sentences per paragraph (never one sentence per break)
 * - Never applies artificial ch measures that leave right-side white space
 * - Overrides template/ATS measure caps (68ch etc.) for prose targets only
 */

import {
  simulateParagraphLines,
  tokenizeParagraph,
} from './typographic-composition-engine';

const DECIMAL_TOKEN = '\uE000';
const ABBREV_TOKEN = '\uE001';
const US_TOKEN = '\uE002';
const UK_TOKEN = '\uE003';
const EG_TOKEN = '\uE004';
const IE_TOKEN = '\uE005';

const PROSE_MIN_CHARS = 48;
const PROSE_MIN_SENTENCES = 2;

export function normalizeProseWhitespace(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([.!?])([a-z])/g, '$1 $2')
    .trim();
}

function protectSentenceBoundaries(text: string): string {
  let out = text.replace(/(\d+)\.(\d+)/g, `$1${DECIMAL_TOKEN}$2`);
  out = out.replace(/\bU\.S\./g, US_TOKEN);
  out = out.replace(/\bU\.K\./g, UK_TOKEN);
  out = out.replace(/\be\.g\./gi, EG_TOKEN);
  out = out.replace(/\bi\.e\./gi, IE_TOKEN);
  out = out.replace(/\bPh\.D\./gi, `Ph${ABBREV_TOKEN}D${ABBREV_TOKEN}`);
  out = out.replace(/\bM\.D\./gi, `M${ABBREV_TOKEN}D${ABBREV_TOKEN}`);
  out = out.replace(/\bB\.A\./gi, `B${ABBREV_TOKEN}A${ABBREV_TOKEN}`);
  out = out.replace(/\bM\.S\./gi, `M${ABBREV_TOKEN}S${ABBREV_TOKEN}`);
  out = out.replace(
    /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|St|Ave|Dept|Fig|No|Vol)\./gi,
    (match) => match.replace('.', ABBREV_TOKEN)
  );
  out = out.replace(
    /\b(?:Inc|Ltd|Corp|Co)\.(?!\s+[A-Z])/gi,
    (match) => match.replace('.', ABBREV_TOKEN)
  );
  return out;
}

function restoreSentenceBoundaries(text: string): string {
  return text
    .replace(new RegExp(DECIMAL_TOKEN, 'g'), '.')
    .replace(new RegExp(ABBREV_TOKEN, 'g'), '.')
    .replace(new RegExp(US_TOKEN, 'g'), 'U.S.')
    .replace(new RegExp(UK_TOKEN, 'g'), 'U.K.')
    .replace(new RegExp(EG_TOKEN, 'g'), 'e.g.')
    .replace(new RegExp(IE_TOKEN, 'g'), 'i.e.');
}

/** Split prose into sentences without breaking abbreviations or decimals. */
export function splitIntoSentences(text: string): string[] {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) return [];

  const protectedText = protectSentenceBoundaries(normalized);
  const rawParts = protectedText
    .split(/(?<=[.!?…])\s+(?=[A-Z0-9"'(])/u)
    .map((part) => restoreSentenceBoundaries(part).trim())
    .filter(Boolean);

  if (rawParts.length <= 1) {
    const single = restoreSentenceBoundaries(protectedText).trim();
    return single ? [single] : [];
  }

  return rawParts;
}

/**
 * Plan paragraph sizes in the 2–4 sentence band.
 * Prefer fuller article-like groups; never emit a lone sentence paragraph
 * when it can be absorbed into a neighbor.
 */
export function planParagraphSizes(sentenceCount: number): number[] {
  if (sentenceCount <= 0) return [];
  if (sentenceCount <= 4) return [sentenceCount];

  const sizes: number[] = [];
  let remaining = sentenceCount;

  while (remaining > 0) {
    if (remaining <= 4) {
      sizes.push(remaining);
      break;
    }
    if (remaining === 5) {
      sizes.push(3, 2);
      break;
    }
    if (remaining === 6) {
      sizes.push(3, 3);
      break;
    }
    if (remaining === 7) {
      sizes.push(4, 3);
      break;
    }
    if (remaining === 8) {
      sizes.push(4, 4);
      break;
    }

    // Prefer 4 when the remainder stays in a healthy 2–4 band.
    const afterFour = remaining - 4;
    if (afterFour >= 2) {
      sizes.push(4);
      remaining -= 4;
      continue;
    }

    sizes.push(3);
    remaining -= 3;
  }

  return sizes;
}

/** Group sentences into paragraph strings (~2–4 sentences each). */
export function groupSentencesIntoParagraphs(sentences: string[]): string[] {
  if (sentences.length === 0) return [];
  if (sentences.length === 1) return [sentences[0]];

  const sizes = planParagraphSizes(sentences.length);
  const paragraphs: string[] = [];
  let index = 0;

  for (const size of sizes) {
    const chunk = sentences.slice(index, index + size);
    if (chunk.length > 0) paragraphs.push(chunk.join(' '));
    index += size;
  }

  return paragraphs.length > 0 ? paragraphs : [sentences.join(' ')];
}

export function formatProseIntoParagraphs(text: string): string[] {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) return [];

  const sentences = splitIntoSentences(normalized);
  if (sentences.length === 0) return [normalized];
  if (sentences.length === 1) return [sentences[0]];

  return groupSentencesIntoParagraphs(sentences);
}

export function proseNeedsParagraphFormatting(text: string): boolean {
  const normalized = normalizeProseWhitespace(text);
  if (normalized.length < PROSE_MIN_CHARS) return false;

  const sentences = splitIntoSentences(normalized);
  if (sentences.length >= PROSE_MIN_SENTENCES) return true;

  return normalized.length >= 120;
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function extractPlainTextFromHtml(html: string): string {
  return normalizeProseWhitespace(
    decodeBasicEntities(
      String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>\s*<p[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

export function escapeProseHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function verifyContentPreserved(original: string, paragraphs: string[]): boolean {
  const normalizedOriginal = normalizeProseWhitespace(original);
  const normalizedJoined = normalizeProseWhitespace(paragraphs.join(' '));
  return normalizedOriginal === normalizedJoined;
}

/**
 * Score how evenly a paragraph would wrap at full available measure.
 * Used only for diagnostics / tests — we do not narrow max-width.
 */
export function scoreFullWidthLineBalance(
  paragraph: string,
  availableCh: number
): number {
  const words = tokenizeParagraph(paragraph);
  if (words.length === 0) return 0;
  const lines = simulateParagraphLines(words, availableCh);
  if (lines.length <= 1) return 1;

  const maxChars = Math.max(24, Math.round(availableCh * 0.92));
  const lengths = lines.map((line) => line.length);
  const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + (len - avg) ** 2, 0) / lengths.length;
  const lastRatio = lengths[lengths.length - 1] / maxChars;
  const balance = 1 - Math.min(1, Math.sqrt(variance) / (maxChars * 0.45));
  const orphanPenalty = lastRatio < 0.28 && lines.length > 1 ? 0.2 : 0;
  return Math.max(0, Math.min(1, balance - orphanPenalty));
}

/** Build paragraph HTML — always full container width, never a narrower ch cap. */
export function buildFormattedParagraphHtml(
  paragraphs: string[],
  options?: { paragraphClass?: string }
): string {
  const paragraphClass = options?.paragraphClass ?? 'pfe-paragraph';

  return paragraphs
    .map(
      (paragraph) =>
        `<p class="${paragraphClass}">${escapeProseHtml(paragraph)}</p>`
    )
    .join('');
}

export function formatProseBlockToHtml(
  text: string,
  options?: { wrapperClass?: string }
): string {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) return '';

  const paragraphs = formatProseIntoParagraphs(normalized);
  if (!verifyContentPreserved(normalized, paragraphs)) {
    return `<p class="pfe-paragraph">${escapeProseHtml(normalized)}</p>`;
  }

  const inner = buildFormattedParagraphHtml(paragraphs);
  const wrapperClass = options?.wrapperClass ?? 'pfe-prose';
  return `<div class="${wrapperClass}">${inner}</div>`;
}

function transformProseInner(
  innerHtml: string,
  options?: { inlineParagraphClass?: string }
): string {
  const text = extractPlainTextFromHtml(innerHtml);
  if (!text || !proseNeedsParagraphFormatting(text)) {
    return innerHtml;
  }

  const paragraphs = formatProseIntoParagraphs(text);
  // Short single-block prose: still wrap so full-width CSS applies.
  if (paragraphs.length === 0) return innerHtml;

  if (!verifyContentPreserved(text, paragraphs)) {
    return innerHtml;
  }

  // Even one long paragraph benefits from full-width layout classes.
  if (paragraphs.length === 1 && text.length < 90) {
    return innerHtml;
  }

  const paragraphClass = options?.inlineParagraphClass
    ? `pfe-paragraph ${options.inlineParagraphClass}`
    : 'pfe-paragraph';

  return buildFormattedParagraphHtml(paragraphs, { paragraphClass });
}

function applyProseTransformRules(html: string): string {
  let result = html;

  result = result.replace(
    /(<p\b[^>]*\bclass="[^"]*\b(?:summary-text|professional-summary|objective-text)[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, inner) => {
      const formatted = transformProseInner(inner);
      if (formatted === inner) {
        // Still upgrade single-block summary to full-width wrapper when long enough.
        const text = extractPlainTextFromHtml(inner);
        if (text.length < 90) return match;
        const wrapperClass =
          String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
        return `<div class="${wrapperClass} pfe-prose"><p class="pfe-paragraph">${escapeProseHtml(text)}</p></div>`;
      }
      const wrapperClass =
        String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
      return `<div class="${wrapperClass} pfe-prose">${formatted}</div>`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\b(?:summary-text|professional-summary|objective-text)[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/gi,
    (match, open, inner) => {
      if (/\bpfe-paragraph\b/i.test(inner)) return match;
      const formatted = transformProseInner(inner);
      if (formatted === inner) {
        const text = extractPlainTextFromHtml(inner);
        if (text.length < 90) return match;
        const wrapperClass =
          String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
        return `<div class="${wrapperClass} pfe-prose"><p class="pfe-paragraph">${escapeProseHtml(text)}</p></div>`;
      }
      const wrapperClass =
        String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
      return `<div class="${wrapperClass} pfe-prose">${formatted}</div>`;
    }
  );

  result = result.replace(
    /(<p\b[^>]*\bclass="[^"]*\bexperience-desc(?:--paragraph|--lead)?[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, inner) => {
      const extraClass = String(open).match(/class="([^"]*)"/i)?.[1] ?? '';
      const formatted = transformProseInner(inner, {
        inlineParagraphClass: extraClass,
      });
      return formatted === inner ? match : formatted;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bexperience-item[^"]*"[^>]*>[\s\S]*?<div\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)\s*(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, _pOpen, inner) => {
      if (/<ul\b/i.test(match)) return match;
      const formatted = transformProseInner(inner);
      if (formatted === inner) return match;
      return `${open}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bproject-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner) => {
      const formatted = transformProseInner(inner, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bachievement-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner) => {
      const formatted = transformProseInner(inner, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bcertification-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner) => {
      const formatted = transformProseInner(inner, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bextended-section-body[^"]*\bdescription[^"]*"[^>]*>\s*)(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, _pOpen, inner) => {
      const formatted = transformProseInner(inner);
      if (formatted === inner) return match;
      return `${open}${formatted}`;
    }
  );

  return result;
}

export function buildParagraphFormattingCss(): string {
  return `
<style data-injected="paragraph-formatting">
/* Use the full column — defeat template/ATS measure caps (68ch / --*-measure). */
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary,
.resume-container .objective-text,
.resume-container .pfe-prose,
.resume-container.sce-resume .summary-text,
.resume-container.ege-resume .summary-text,
.resume-container.nge-resume .summary-text,
.resume-container.gce-resume .summary-text,
.resume-container.coe-resume .summary-text,
.resume-container.ome-resume .summary-text,
.resume-container .experience-item .description,
.resume-container .project-item .description,
.resume-container .achievement-item .description,
.resume-container .certification-item .description,
.resume-container .extended-section-body.description,
.resume-container.sce-resume .experience-item .description,
.resume-container.sce-resume .project-item .description {
  max-width: none !important;
  width: 100% !important;
}

.resume-container .pfe-prose .pfe-paragraph,
.resume-container .summary-text.pfe-prose > .pfe-paragraph,
.resume-container .professional-summary.pfe-prose > .pfe-paragraph,
.resume-container .objective-text.pfe-prose > .pfe-paragraph,
.resume-container p.pfe-paragraph,
.resume-container .experience-desc--paragraph.pfe-paragraph,
.resume-container .experience-desc--lead.pfe-paragraph,
.resume-container .experience-item .description > .pfe-paragraph,
.resume-container .project-item .description.pfe-paragraph,
.resume-container .project-item p.pfe-paragraph,
.resume-container .achievement-item .description .pfe-paragraph,
.resume-container .achievement-item p.pfe-paragraph,
.resume-container .certification-item .description .pfe-paragraph,
.resume-container .extended-section-body.description .pfe-paragraph {
  max-width: none !important;
  width: 100% !important;
  display: block;
  box-sizing: border-box;
  line-height: 1.5 !important;
  margin: 0 0 9px !important;
  padding: 0 !important;
  text-align: left !important;
  letter-spacing: inherit !important;
  word-break: normal !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
  -webkit-hyphens: auto;
  text-wrap: pretty;
  -webkit-text-wrap: pretty;
}

.resume-container .pfe-prose .pfe-paragraph:last-child,
.resume-container .summary-text.pfe-prose > .pfe-paragraph:last-child,
.resume-container .experience-item .description > .pfe-paragraph:last-child,
.resume-container .extended-section-body.description .pfe-paragraph:last-child {
  margin-bottom: 0 !important;
}
</style>`.trim();
}

function appendStyleBlockToHtml(html: string, styleBlock: string): string {
  if (!styleBlock) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${styleBlock}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${styleBlock}</html>`);
  }
  return html + styleBlock;
}

export function injectParagraphFormattingIntoHtml(
  html: string,
  _options?: { htmlTemplate?: string; templateId?: string }
): string {
  if (!html || !html.trim()) return html;

  let result = applyProseTransformRules(html);
  result = appendStyleBlockToHtml(result, buildParagraphFormattingCss());
  return result;
}
