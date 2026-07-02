/**
 * Description, achievements, and coursework extraction — no rewriting.
 */

import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

import { isBulletLine, stripBulletPrefix } from './lines';
import { parseCourseworkLine } from './field';

export interface BlockDescription {
  description: string;
  achievements: string[];
  coursework: string[];
  confidence: number;
}

export function extractDescriptionFromBlock(bodyLines: string[]): BlockDescription {
  const achievements: string[] = [];
  const paragraphs: string[] = [];
  const coursework: string[] = [];

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;

    const courses = parseCourseworkLine(line);
    if (courses.length > 0) {
      coursework.push(...courses);
      continue;
    }

    if (isBulletLine(raw)) {
      const bullet = stripBulletPrefix(raw);
      if (bullet.length >= 4) achievements.push(bullet);
      continue;
    }

    const inlineBullets = splitBullets(line);
    if (inlineBullets.length > 1) {
      for (const b of inlineBullets) {
        if (b.length >= 4) achievements.push(b);
      }
      continue;
    }

    if (line.length >= 10) paragraphs.push(line);
  }

  const description = paragraphs.join('\n\n').trim();
  let confidence = 0;
  if (achievements.length > 0) confidence += Math.min(85, 35 + achievements.length * 8);
  if (description.length > 0) confidence += Math.min(75, 28 + Math.floor(description.length / 40));
  if (coursework.length > 0) confidence += Math.min(70, 30 + coursework.length * 5);

  return {
    description,
    achievements,
    coursework: [...new Set(coursework)],
    confidence: Math.min(100, confidence),
  };
}
