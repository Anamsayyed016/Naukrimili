/**
 * Line splitting and bullet detection for experience sections.
 */

import type { ExperienceLine } from './types';
import { looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';
import { detectDesignationFromLine } from './designation';

const BULLET_RE = /^[\s]*(?:[-–—•·▪‣●○◦]|(?:[oO])(?=\s+\S)|\d+[\.\)])\s+/;

const EMBEDDED_MAJOR_SECTION_HEADING_RE =
  /^(?:projects?(?:\s+experience)?|technical\s+skills|industrial\s+skills|functional\s+skills|domain\s+skills|core\s+skills|key\s+skills|skills|education|certifications?(?:\s*(?:&|and)\s*\w+(?:\s+\w+)*)?|achievements?|languages?|references?|publications?|volunteer|hobbies?(?:\s+(?:&|and)\s+interests?)?|interests?|training(?:s)?(?:\s*(?:&|and)\s*workshops?)?|workshops?(?:\s*(?:&|and)\s*training(?:s)?)?|trainings?(?:\s*(?:&|and)\s*workshops?)?)\s*$/i;

/** Training/workshop attendance bullets that often leak when the heading was consumed by another section. */
const TRAINING_ATTENDANCE_BULLET_RE =
  /^(?:[-–—•·▪‣●○◦]|(?:[oO])(?=\s+\S)|\d+[\.\)])?\s*(?:participated|participating|undergone|attended|completed)\b.+\b(?:workshop|boot\s*camp|training\s+program(?:me)?|dissertation\s+training|training\s+on|seminar|conference)\b/i;

const TRAINING_AT_ORG_BULLET_RE =
  /^(?:[-–—•·▪‣●○◦]|(?:[oO])(?=\s+\S)|\d+[\.\)])?\s*training\b.+\b(?:at|by|from)\b/i;

/** Standalone major section headings embedded inside an experience body. */
export function isEmbeddedMajorSectionHeading(text: string): boolean {
  const t = String(text || '').trim();
  if (!t || t.length > 64) return false;
  if (looksLikeJobTitleLine(t) || detectDesignationFromLine(t).confidence >= 50) return false;
  return EMBEDDED_MAJOR_SECTION_HEADING_RE.test(t);
}

export function isTrainingAttendanceBullet(text: string): boolean {
  const t = String(text || '').trim();
  if (!t || t.length < 12 || t.length > 280) return false;
  return TRAINING_ATTENDANCE_BULLET_RE.test(t) || TRAINING_AT_ORG_BULLET_RE.test(t);
}

/** Drop project/education/skills headings that leaked into an experience section body. */
export function truncateExperienceSectionAtEmbeddedHeadings(sectionText: string): string {
  const lines = String(sectionText || '').replace(/\r\n/g, '\n').split('\n');
  const kept: string[] = [];
  let trainingBulletRun = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t && isEmbeddedMajorSectionHeading(t)) break;
    // When the Training heading was claimed by Certifications, its bullets can remain
    // in Experience — stop once a clear attendance-bullet run begins.
    if (t && isTrainingAttendanceBullet(t)) {
      trainingBulletRun += 1;
      if (trainingBulletRun >= 1 && kept.some((k) => k.trim().length > 0)) {
        break;
      }
    } else if (t) {
      trainingBulletRun = 0;
    }
    kept.push(line);
  }
  return kept.join('\n').trim();
}

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
