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

export function splitExperienceSectionLines(sectionText: string): string[] {
  return (sectionText || '').replace(/\r\n/g, '\n').split('\n');
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
