/**
 * Line splitting and bullet detection for experience sections.
 */

import type { ExperienceLine } from './types';

const BULLET_RE = /^[\s]*(?:[-–—•·▪‣●○◦]|\d+[\.\)])\s+/;

export function isBulletLine(text: string): boolean {
  return BULLET_RE.test(text);
}

export function stripBulletPrefix(text: string): string {
  return text.replace(BULLET_RE, '').trim();
}

/**
 * Collapse OCR-broken date parentheses that span multiple lines:
 * "(26\nth\nJune2025 to till date)" → "(26 June2025 to till date)"
 */
export function collapseOcrBrokenDateLines(sectionText: string): string {
  const text = String(sectionText || '').replace(/\r\n/g, '\n');
  if (!text) return '';

  // Parenthetical blocks that contain year tokens and ordinals often wrap mid-date.
  return text.replace(/\(([^)]{0,80})\)/g, (full, inner: string) => {
    if (!/\b(?:19|20)\d{2}\b|till\s*date|present|current/i.test(inner)) return full;
    if (!/\n/.test(inner) && !/\b\d{1,2}\s*(?:st|nd|rd|th)\b/i.test(inner)) return full;
    const healed = inner
      .replace(/\b(\d{1,2})\s*(?:\r?\n|\s)*(?:st|nd|rd|th)\b/gi, '$1')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `(${healed})`;
  });
}

export function splitExperienceSectionLines(sectionText: string): string[] {
  return collapseOcrBrokenDateLines(sectionText || '').split('\n');
}

export function buildExperienceLines(sectionText: string): ExperienceLine[] {
  const raw = splitExperienceSectionLines(sectionText);
  return raw.map((text, index) => ({
    index,
    text,
    isBlank: text.trim().length === 0,
    isBullet: isBulletLine(text),
    boundaryScore: 0,
    role: 'description' as const,
  }));
}
