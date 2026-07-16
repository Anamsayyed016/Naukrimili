/**
 * Paragraph Formatting Engine
 *
 * Improves long prose blocks (summary, descriptions) without changing content,
 * template layout, column widths, or parser output.
 *
 * - Groups 2–3 sentences per paragraph (never one sentence per paragraph)
 * - Uses full available column width (overrides narrow measure caps)
 * - Balanced line wrapping via text-wrap + optional measure tuning
 */

import {
  findOptimalParagraphMeasure,
  type ParagraphOpticalContext,
} from './typographic-composition-engine';

const DECIMAL_TOKEN = '\uE000';
const ABBREV_TOKEN = '\uE001';
const US_TOKEN = '\uE002';
const UK_TOKEN = '\uE003';
const EG_TOKEN = '\uE004';
const IE_TOKEN = '\uE005';

const PROSE_MIN_CHARS = 48;
const PROSE_MIN_SENTENCES = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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

/** Plan paragraph sizes (2–3 sentences each) without orphan singles. */
export function planParagraphSizes(sentenceCount: number): number[] {
  if (sentenceCount <= 0) return [];
  if (sentenceCount <= 3) return [sentenceCount];

  const sizes: number[] = [];
  let remaining = sentenceCount;

  while (remaining > 0) {
    if (remaining <= 3) {
      sizes.push(remaining);
      break;
    }
    if (remaining === 4) {
      sizes.push(2, 2);
      break;
    }
    if (remaining === 5) {
      sizes.push(2, 3);
      break;
    }
    if (remaining === 6) {
      sizes.push(3, 3);
      break;
    }

    const nextThree = remaining - 3;
    if (nextThree >= 2 && nextThree !== 1) {
      sizes.push(3);
      remaining -= 3;
      continue;
    }

    sizes.push(2);
    remaining -= 2;
  }

  return sizes;
}

/** Group sentences into paragraph strings (2–3 sentences each). */
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

export function findBalancedMeasureCh(
  paragraph: string,
  availableCh: number,
  ctx?: Partial<ParagraphOpticalContext>
): number {
  const maxCh = Math.max(42, Math.round(availableCh));
  const minCh = Math.max(38, Math.round(maxCh * 0.88));

  const opticalCtx: ParagraphOpticalContext = {
    pageHeight: ctx?.pageHeight ?? 1123,
    remainingWhitespace: ctx?.remainingWhitespace ?? 120,
    pageFill: ctx?.pageFill ?? 0.82,
    preferMoreLines: false,
    targetFill: 0.9,
  };

  const result = findOptimalParagraphMeasure(paragraph, opticalCtx, {
    minCh,
    maxCh,
    step: 2,
  });

  return clamp(result.measureCh, minCh, maxCh);
}

export function buildFormattedParagraphHtml(
  paragraphs: string[],
  options?: { availableMeasureCh?: number; paragraphClass?: string }
): string {
  const paragraphClass = options?.paragraphClass ?? 'pfe-paragraph';
  const availableCh = options?.availableMeasureCh ?? 72;

  return paragraphs
    .map((paragraph) => {
      const measureCh =
        paragraph.length >= 60
          ? findBalancedMeasureCh(paragraph, availableCh)
          : availableCh;
      const style =
        measureCh < availableCh
          ? ` style="max-width:min(100%,${measureCh}ch)"`
          : '';
      return `<p class="${paragraphClass}"${style}>${escapeProseHtml(paragraph)}</p>`;
    })
    .join('');
}

export function formatProseBlockToHtml(
  text: string,
  options?: { availableMeasureCh?: number; wrapperClass?: string }
): string {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) return '';

  const paragraphs = formatProseIntoParagraphs(normalized);
  if (!verifyContentPreserved(normalized, paragraphs)) {
    return `<p class="pfe-paragraph">${escapeProseHtml(normalized)}</p>`;
  }

  const inner = buildFormattedParagraphHtml(paragraphs, {
    availableMeasureCh: options?.availableMeasureCh,
  });
  const wrapperClass = options?.wrapperClass ?? 'pfe-prose';
  return `<div class="${wrapperClass}">${inner}</div>`;
}

function estimateAvailableMeasureCh(htmlTemplate: string, inSidebar: boolean): number {
  if (inSidebar) return 44;
  if (/--sidebar-width|grid-template-columns|two-column|aside/i.test(htmlTemplate)) {
    return 62;
  }
  return 76;
}

function isSidebarContext(html: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 2400);
  const snippet = html.slice(windowStart, matchIndex);
  return /<(aside|nav)\b|class="[^"]*sidebar|class='[^"]*sidebar/i.test(snippet);
}

function transformProseInner(
  innerHtml: string,
  availableCh: number,
  options?: { inlineParagraphClass?: string }
): string {
  const text = extractPlainTextFromHtml(innerHtml);
  if (!text || !proseNeedsParagraphFormatting(text)) {
    return innerHtml;
  }

  const paragraphs = formatProseIntoParagraphs(text);
  if (paragraphs.length <= 1 && text.length < 140) {
    return innerHtml;
  }

  if (!verifyContentPreserved(text, paragraphs)) {
    return innerHtml;
  }

  const paragraphClass = options?.inlineParagraphClass
    ? `pfe-paragraph ${options.inlineParagraphClass}`
    : 'pfe-paragraph';

  return buildFormattedParagraphHtml(paragraphs, {
    availableMeasureCh: availableCh,
    paragraphClass,
  });
}

function applyProseTransformRules(
  html: string,
  htmlTemplate: string
): string {
  let result = html;

  result = result.replace(
    /(<p\b[^>]*\bclass="[^"]*\b(?:summary-text|professional-summary|objective-text)[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, inner, _close, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh);
      if (formatted === inner) return match;
      const wrapperClass = String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
      return `<div class="${wrapperClass} pfe-prose">${formatted}</div>`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\b(?:summary-text|professional-summary|objective-text)[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/gi,
    (match, open, inner, _close, offset) => {
      if (/\bpfe-paragraph\b/i.test(inner)) return match;
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh);
      if (formatted === inner) return match;
      const wrapperClass = String(open).match(/class="([^"]*)"/i)?.[1] ?? 'summary-text';
      return `<div class="${wrapperClass} pfe-prose">${formatted}</div>`;
    }
  );

  result = result.replace(
    /(<p\b[^>]*\bclass="[^"]*\bexperience-desc(?:--paragraph|--lead)?[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, inner, _close, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const extraClass = String(open).match(/class="([^"]*)"/i)?.[1] ?? '';
      const formatted = transformProseInner(inner, availableCh, {
        inlineParagraphClass: extraClass,
      });
      return formatted === inner ? match : formatted;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bexperience-item[^"]*"[^>]*>[\s\S]*?<div\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)\s*(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, _pOpen, inner, _pClose, offset) => {
      if (/<ul\b/i.test(match)) return match;
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh);
      if (formatted === inner) return match;
      return `${open}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bproject-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner, _pClose, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bachievement-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner, _pClose, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bcertification-item[^"]*"[^>]*>[\s\S]*?)(<p\b[^>]*\bclass="[^"]*\bdescription[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, prefix, _pOpen, inner, _pClose, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh, {
        inlineParagraphClass: 'description',
      });
      if (formatted === inner) return match;
      return `${prefix}${formatted}`;
    }
  );

  result = result.replace(
    /(<div\b[^>]*\bclass="[^"]*\bextended-section-body[^"]*\bdescription[^"]*"[^>]*>\s*)(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, open, _pOpen, inner, _pClose, offset) => {
      const inSidebar = isSidebarContext(result, offset);
      const availableCh = estimateAvailableMeasureCh(htmlTemplate, inSidebar);
      const formatted = transformProseInner(inner, availableCh);
      if (formatted === inner) return match;
      return `${open}${formatted}`;
    }
  );

  return result;
}

export function buildParagraphFormattingCss(): string {
  return `
<style data-injected="paragraph-formatting">
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary,
.resume-container .objective-text,
.resume-container .pfe-prose {
  max-width: 100% !important;
  width: 100%;
}

.resume-container .pfe-prose .pfe-paragraph,
.resume-container .summary-text.pfe-prose > .pfe-paragraph,
.resume-container .professional-summary.pfe-prose > .pfe-paragraph,
.resume-container .objective-text.pfe-prose > .pfe-paragraph,
.resume-container .experience-desc--paragraph.pfe-paragraph,
.resume-container .experience-desc--lead.pfe-paragraph,
.resume-container .experience-item .description > .pfe-paragraph,
.resume-container .project-item .description.pfe-paragraph,
.resume-container .achievement-item .description .pfe-paragraph,
.resume-container .certification-item .description .pfe-paragraph,
.resume-container .extended-section-body.description .pfe-paragraph {
  line-height: 1.52 !important;
  margin: 0 0 9px !important;
  text-align: left !important;
  letter-spacing: inherit !important;
  word-break: normal !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
  -webkit-hyphens: auto;
  text-wrap: pretty;
  -webkit-text-wrap: pretty;
  max-width: 100%;
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
  options?: { htmlTemplate?: string; templateId?: string }
): string {
  if (!html || !html.trim()) return html;

  const htmlTemplate = options?.htmlTemplate ?? '';
  let result = applyProseTransformRules(html, htmlTemplate);
  result = appendStyleBlockToHtml(result, buildParagraphFormattingCss());
  return result;
}
