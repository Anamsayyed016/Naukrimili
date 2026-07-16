/**
 * Shared structural height estimation for column balancing and dynamic layout.
 * Uses font-size / line-height / bullet / paragraph heuristics — not character volume alone.
 */

export const SECTION_SHELL_PX = 12;
export const SECTION_HEADING_PX = 36;

const HEIGHTS = {
  experienceItemBase: 72,
  experienceHeader: 28,
  experienceBullet: 22,
  experienceParagraphLine: 18,
  educationItem: 56,
  projectItem: 64,
  skillTag: 26,
  certificationItem: 48,
  languageItem: 24,
  achievementItem: 40,
  hobbyItem: 28,
  summaryLine: 20,
  extendedRecord: 44,
  textLine: 16,
} as const;

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractExperienceItemChunks(html: string): string[] {
  const chunks: string[] = [];
  const re = /<div[^>]*\bexperience-item\b[^>]*>/gi;
  const indices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    indices.push(match.index);
  }
  for (let i = 0; i < indices.length; i += 1) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : html.length;
    chunks.push(html.slice(start, end));
  }
  return chunks;
}

/**
 * Estimate a single experience entry from rendered HTML.
 */
export function estimateExperienceItemHeight(itemHtml: string): number {
  let h = HEIGHTS.experienceItemBase;
  const bullets = countMatches(itemHtml, /<li\b/gi);
  h += bullets * HEIGHTS.experienceBullet;

  const paragraphs = countMatches(itemHtml, /<p\b/gi);
  h += paragraphs * HEIGHTS.experienceParagraphLine * 2;

  const groupedBlocks = countMatches(
    itemHtml,
    /experience-desc--grouped|experience-bullet-group/gi
  );
  h += groupedBlocks * 8;

  const text = stripTags(itemHtml);
  if (text) {
    const proseChars = text.length - bullets * 28;
    if (proseChars > 0) {
      h += Math.ceil(proseChars / 64) * HEIGHTS.textLine;
    }
  }

  if (/\bexperience-header\b/i.test(itemHtml)) {
    h += HEIGHTS.experienceHeader;
  }

  return Math.max(h, 48);
}

/**
 * Estimate rendered height for a section block or column slice.
 */
export function estimateRenderableSectionHeight(html: string): number {
  if (!html.trim()) return 0;

  let h = SECTION_SHELL_PX;

  const experienceItems = extractExperienceItemChunks(html);
  if (experienceItems.length > 0) {
    h += SECTION_HEADING_PX;
    for (const item of experienceItems) {
      h += estimateExperienceItemHeight(item);
    }
    h += Math.max(0, experienceItems.length - 1) * 10;
    return Math.max(h, 24);
  }

  h += SECTION_HEADING_PX;
  h += countMatches(html, /\beducation-item\b/gi) * HEIGHTS.educationItem;
  h += countMatches(html, /\bproject-item\b/gi) * HEIGHTS.projectItem;
  h += countMatches(html, /\bskill-tag\b|psp-skill-item\b/gi) * HEIGHTS.skillTag;
  h += countMatches(html, /\bcertification-item\b/gi) * HEIGHTS.certificationItem;
  h += countMatches(html, /\blanguage-item\b|psp-language-item\b/gi) * HEIGHTS.languageItem;
  h += countMatches(html, /\bachievement-item\b/gi) * HEIGHTS.achievementItem;
  h += countMatches(html, /\bhobby-item\b/gi) * HEIGHTS.hobbyItem;
  h += countMatches(html, /\bextended-record-item\b/gi) * HEIGHTS.extendedRecord;
  h += countMatches(html, /\bextended-section\b/gi) * SECTION_HEADING_PX;
  h += countMatches(html, /<li\b/gi) * HEIGHTS.experienceBullet;

  const text = stripTags(html);
  if (/\bsummary-text\b|professional-summary\b|objective-text\b/i.test(html) && text) {
    // Calibrated to ~64ch measure (layout reflow band) so underfill isn't over-triggered.
    h += Math.max(
      HEIGHTS.summaryLine * 2,
      Math.ceil(text.length / 64) * HEIGHTS.summaryLine
    );
  } else if (text.length > 40) {
    h += Math.ceil(text.length / 72) * HEIGHTS.textLine;
  }

  return Math.max(h, 24);
}

export function estimateColumnHeights(mainHtml: string, sidebarHtml: string): {
  mainHeight: number;
  sidebarHeight: number;
  columnImbalance: number;
  mainToSidebarRatio: number;
} {
  const mainHeight = estimateRenderableSectionHeight(mainHtml);
  const sidebarHeight = estimateRenderableSectionHeight(sidebarHtml);
  return {
    mainHeight,
    sidebarHeight,
    columnImbalance: Math.abs(mainHeight - sidebarHeight),
    mainToSidebarRatio: sidebarHeight > 0 ? mainHeight / sidebarHeight : mainHeight,
  };
}
