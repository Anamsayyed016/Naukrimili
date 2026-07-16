/**
 * Typographic Composition Engine
 *
 * Composes paragraphs for optical fill — same words, same font, different wrap width.
 * Never mutates resume data, never invents text, never uses spacing/leading hacks.
 *
 * Used by Gallery, Live Preview, PDF export (server estimate + client DOM refine).
 */

export const TYPO_MEASURE_CH_MIN = 45;
export const TYPO_MEASURE_CH_MAX = 75;
export const TYPO_MEASURE_STEP = 2;
export const TYPO_TARGET_PAGE_FILL = 0.9;
export const ESTIMATED_LINE_HEIGHT_PX = 17.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface ParagraphOpticalContext {
  pageHeight: number;
  remainingWhitespace: number;
  pageFill: number;
  availableSectionHeight?: number;
  targetFill?: number;
  preferMoreLines?: boolean;
}

export function tokenizeParagraph(text: string): string[] {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Word-wrap simulation at a given measure (ch) — no DOM required. */
export function simulateParagraphLines(words: string[], measureCh: number): string[] {
  const maxChars = Math.max(24, Math.round(measureCh * 0.92));
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? word.slice(0, maxChars) : word;
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Optical score for a composed paragraph (0–1).
 * Rewards balanced lines, penalizes orphans/widows, fills vertical slack when underfilled.
 */
export function scoreParagraphOptical(
  lines: string[],
  measureCh: number,
  ctx: ParagraphOpticalContext
): number {
  if (lines.length === 0) return 0;

  const maxChars = Math.max(24, Math.round(measureCh * 0.92));
  const lineLengths = lines.map((line) => line.length);
  const avgLen = lineLengths.reduce((sum, len) => sum + len, 0) / lines.length;
  const variance =
    lineLengths.reduce((sum, len) => sum + (len - avgLen) ** 2, 0) / lines.length;
  const stdDev = Math.sqrt(variance);

  const lineBalance = 1 - clamp(stdDev / (maxChars * 0.42), 0, 1);

  const lastLine = lines[lines.length - 1];
  const lastLineRatio = lastLine.length / maxChars;
  const lastWordCount = lastLine.split(/\s+/).filter(Boolean).length;

  let orphanScore = 1;
  if (lastLineRatio < 0.3 && lines.length > 2) orphanScore -= 0.32;
  if (lastWordCount === 1 && lines.length > 1) orphanScore -= 0.28;
  if (lastLineRatio < 0.18 && lines.length > 1) orphanScore -= 0.18;

  const readability =
    measureCh >= 50 && measureCh <= 72
      ? 1
      : measureCh < 50
        ? clamp(0.88 - (50 - measureCh) * 0.035, 0.55, 0.95)
        : clamp(0.9 - (measureCh - 72) * 0.045, 0.55, 0.95);

  const estimatedHeight = lines.length * ESTIMATED_LINE_HEIGHT_PX;
  const fillDeficit = clamp((ctx.targetFill ?? TYPO_TARGET_PAGE_FILL) - ctx.pageFill, 0, 0.5);
  const preferFill = fillDeficit > 0.05 || Boolean(ctx.preferMoreLines);

  let verticalFill = lineBalance;
  if (preferFill) {
    const slot = ctx.availableSectionHeight ?? estimatedHeight * 1.75;
    const slotRatio = clamp(estimatedHeight / Math.max(slot, 1), 0, 1);
    const targetSlotRatio = 0.7;
    verticalFill = 1 - clamp(Math.abs(slotRatio - targetSlotRatio) / 0.45, 0, 1);
  }

  const totalChars = lines.join(' ').length;
  const compactness = clamp(
    1 - Math.abs((lines.length * measureCh) / Math.max(totalChars * 1.35, 1) - 1) * 0.35,
    0.35,
    1
  );

  const whitespaceRatio = clamp(ctx.remainingWhitespace / Math.max(ctx.pageHeight, 1), 0, 1);
  const density =
    whitespaceRatio > 0.12
      ? clamp(lines.length / Math.max(2, Math.ceil(totalChars / (maxChars * 1.1))), 0.45, 1)
      : lineBalance;

  return clamp(
    lineBalance * 0.22 +
      orphanScore * 0.2 +
      verticalFill * 0.26 +
      readability * 0.12 +
      density * 0.12 +
      compactness * 0.08,
    0,
    1
  );
}

export function findOptimalParagraphMeasure(
  text: string,
  ctx: ParagraphOpticalContext,
  options?: { minCh?: number; maxCh?: number; step?: number }
): {
  measureCh: number;
  lines: string[];
  score: number;
  estimatedHeightPx: number;
} {
  const words = tokenizeParagraph(text);
  if (words.length === 0) {
    return { measureCh: 68, lines: [], score: 0, estimatedHeightPx: 0 };
  }

  const minCh = options?.minCh ?? TYPO_MEASURE_CH_MIN;
  const maxCh = options?.maxCh ?? TYPO_MEASURE_CH_MAX;
  const step = options?.step ?? TYPO_MEASURE_STEP;
  const preferFill = Boolean(ctx.preferMoreLines);

  let best = {
    measureCh: clamp(68, minCh, maxCh),
    lines: simulateParagraphLines(words, 68),
    score: -1,
    estimatedHeightPx: 0,
  };

  for (let ch = minCh; ch <= maxCh; ch += step) {
    const lines = simulateParagraphLines(words, ch);
    const score = scoreParagraphOptical(lines, ch, ctx);
    const estimatedHeightPx = lines.length * ESTIMATED_LINE_HEIGHT_PX;
    const better =
      score > best.score + 0.001 ||
      (Math.abs(score - best.score) < 0.001 &&
        preferFill &&
        estimatedHeightPx > best.estimatedHeightPx);
    if (better) {
      best = { measureCh: ch, lines, score, estimatedHeightPx };
    }
  }

  return best;
}

export interface TypographicPageContext {
  pageHeight: number;
  containerHeight: number;
  remainingWhitespace: number;
  pageFill: number;
  mainContentHeight: number;
  summaryText: string;
  experienceTexts: string[];
  projectTexts: string[];
  achievementTexts: string[];
  nextSectionHeights: Partial<Record<'experience' | 'projects' | 'achievements', number>>;
  baseSummaryCh: number;
  baseContentCh: number;
  shouldCompress: boolean;
  preferMoreLines: boolean;
}

export interface TypographicCompositionPlan {
  summaryMeasureCh: number;
  contentMeasureCh: number;
  experienceMeasureCh: number;
  projectMeasureCh: number;
  achievementMeasureCh: number;
  opticalScore: number;
  estimatedAddedHeightPx: number;
  iterations: number;
}

function estimateAvailableSummaryHeight(ctx: TypographicPageContext): number {
  const nextExp = ctx.nextSectionHeights.experience ?? 120;
  const gap = 32;
  const slack = ctx.remainingWhitespace + ctx.pageHeight * 0.08;
  return clamp(slack - nextExp - gap, 72, ctx.pageHeight * 0.38);
}

function findBestSharedContentMeasure(
  texts: string[],
  ctx: ParagraphOpticalContext,
  baseCh: number,
  shouldCompress: boolean
): { measureCh: number; score: number } {
  if (texts.length === 0) {
    return { measureCh: baseCh, score: 0.5 };
  }

  const minCh = shouldCompress ? 58 : 52;
  const maxCh = Math.min(TYPO_MEASURE_CH_MAX, baseCh + 2);
  let best = { measureCh: baseCh, score: -1 };

  for (let ch = minCh; ch <= maxCh; ch += TYPO_MEASURE_STEP) {
    const avgScore =
      texts.reduce((sum, text) => {
        const words = tokenizeParagraph(text);
        const lines = simulateParagraphLines(words, ch);
        return sum + scoreParagraphOptical(lines, ch, ctx);
      }, 0) / texts.length;
    if (avgScore > best.score) {
      best = { measureCh: ch, score: avgScore };
    }
  }

  return best;
}

/**
 * Iterative measure → compose → measure loop for page-level typographic balance.
 */
export function composeTypographicPagePlan(
  ctx: TypographicPageContext
): TypographicCompositionPlan {
  const opticalCtx: ParagraphOpticalContext = {
    pageHeight: ctx.pageHeight,
    remainingWhitespace: ctx.remainingWhitespace,
    pageFill: ctx.pageFill,
    preferMoreLines: ctx.preferMoreLines,
    targetFill: TYPO_TARGET_PAGE_FILL,
    availableSectionHeight: estimateAvailableSummaryHeight(ctx),
  };

  const summaryMax = Math.min(TYPO_MEASURE_CH_MAX, ctx.baseSummaryCh + 2);
  const summaryMin = ctx.shouldCompress ? 56 : TYPO_MEASURE_CH_MIN;

  let summaryResult = findOptimalParagraphMeasure(ctx.summaryText, opticalCtx, {
    minCh: summaryMin,
    maxCh: summaryMax,
  });

  const contentTexts = [
    ...ctx.experienceTexts,
    ...ctx.projectTexts,
    ...ctx.achievementTexts,
  ].filter((text) => text.trim().length > 0);

  const contentResult = findBestSharedContentMeasure(
    contentTexts,
    { ...opticalCtx, availableSectionHeight: undefined },
    ctx.baseContentCh,
    ctx.shouldCompress
  );

  let summaryCh = summaryResult.measureCh;
  let contentCh = contentResult.measureCh;
  let iterations = 1;
  let addedHeight = Math.max(0, summaryResult.estimatedHeightPx - 36);

  const MAX_ITER = 10;
  while (
    iterations < MAX_ITER &&
    ctx.preferMoreLines &&
    ctx.remainingWhitespace > 40 &&
    (ctx.containerHeight + addedHeight) / ctx.pageHeight < 0.87
  ) {
    const nextSummary = Math.max(summaryMin, summaryCh - TYPO_MEASURE_STEP);
    const nextContent = Math.max(52, contentCh - TYPO_MEASURE_STEP);
    if (nextSummary === summaryCh && nextContent === contentCh) break;

    const candidate = findOptimalParagraphMeasure(ctx.summaryText, opticalCtx, {
      minCh: nextSummary,
      maxCh: nextSummary,
    });

    if (candidate.score >= summaryResult.score * 0.9 && candidate.lines.length >= summaryResult.lines.length) {
      const delta = candidate.estimatedHeightPx - summaryResult.estimatedHeightPx;
      summaryCh = nextSummary;
      summaryResult = candidate;
      addedHeight += Math.max(0, delta);
      contentCh = nextContent;
      iterations += 1;
      continue;
    }
    break;
  }

  const opticalScore =
    Math.round(
      (summaryResult.score * (ctx.summaryText.trim() ? 0.42 : 0) +
        contentResult.score * (contentTexts.length > 0 ? 0.58 : 0.5)) *
        1000
    ) / 1000;

  return {
    summaryMeasureCh: summaryCh,
    contentMeasureCh: contentCh,
    experienceMeasureCh: contentCh,
    projectMeasureCh: contentCh,
    achievementMeasureCh: contentCh,
    opticalScore,
    estimatedAddedHeightPx: Math.round(addedHeight),
    iterations,
  };
}

export function extractSummaryTextForComposition(
  formData?: Record<string, unknown>,
  renderedHtml?: string
): string {
  if (formData) {
    const text = String(
      formData.summary ||
        formData.professionalSummary ||
        formData['Professional Summary'] ||
        formData['Career Objective'] ||
        formData.Objective ||
        ''
    ).trim();
    if (text) return text.replace(/\s+/g, ' ').trim();
  }
  const match = (renderedHtml ?? '').match(
    /class="[^"]*(?:summary-text|professional-summary)[^"]*"[^>]*>([\s\S]*?)<\//i
  );
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function collectDescriptionTexts(
  items: unknown[],
  fields: string[]
): string[] {
  const texts: string[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    for (const field of fields) {
      const value = String(rec[field] ?? '').trim();
      if (value.length >= 12) texts.push(value.replace(/\s+/g, ' '));
    }
    const bullets = Array.isArray(rec.achievements)
      ? rec.achievements
      : Array.isArray(rec.bullets)
        ? rec.bullets
        : [];
    for (const bullet of bullets) {
      const line = String(bullet ?? '').trim();
      if (line.length >= 12) texts.push(line.replace(/\s+/g, ' '));
    }
  }
  return texts;
}

export function extractSectionTextsForComposition(formData?: Record<string, unknown>): {
  experienceTexts: string[];
  projectTexts: string[];
  achievementTexts: string[];
} {
  if (!formData) {
    return { experienceTexts: [], projectTexts: [], achievementTexts: [] };
  }

  const experience = Array.isArray(formData.experience) ? formData.experience : [];
  const projects = Array.isArray(formData.projects) ? formData.projects : [];
  const achievements = Array.isArray(formData.achievements) ? formData.achievements : [];

  return {
    experienceTexts: collectDescriptionTexts(experience, ['description', 'Description']),
    projectTexts: collectDescriptionTexts(projects, [
      'description',
      'Description',
      'summary',
      'Summary',
    ]),
    achievementTexts: achievements
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item || typeof item !== 'object') return '';
        const rec = item as Record<string, unknown>;
        return String(rec.description ?? rec.title ?? rec.Title ?? '').trim();
      })
      .filter((text) => text.length >= 8),
  };
}

/** CSS rules for typographic composition (wrap shaping only — no spacing). */
export function buildTypographicCompositionCss(): string {
  return `
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary,
.resume-container .objective-text,
.resume-container .experience-desc--paragraph,
.resume-container .experience-desc--lead,
.resume-container .experience-item .description p,
.resume-container .project-item .description,
.resume-container .achievement-item .description {
  text-wrap: pretty;
  -webkit-text-wrap: pretty;
  hyphens: auto;
  -webkit-hyphens: auto;
  word-break: normal;
  overflow-wrap: break-word;
}`.trim();
}
