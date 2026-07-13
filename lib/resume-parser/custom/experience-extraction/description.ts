/**
 * Description and bullet extraction — preserve order, no summarization.
 */

import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

import { isBulletLine, stripBulletPrefix } from './lines';

const EXPERIENCE_DETAIL_HEADING_RE =
  /^key\s+(?:result\s+areas?|responsibilit|accountabilit|duties|contributions?|highlights?)/i;

export interface BlockDescription {
  description: string;
  bulletPoints: string[];
  confidence: number;
}

export function extractDescriptionFromBlock(bodyLines: string[]): BlockDescription {
  const bullets: string[] = [];
  const paragraphs: string[] = [];

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    if (EXPERIENCE_DETAIL_HEADING_RE.test(line)) continue;

    if (isBulletLine(raw)) {
      const bullet = stripBulletPrefix(raw);
      if (bullet.length >= 4) bullets.push(bullet);
      continue;
    }

    const inlineBullets = splitBullets(line);
    if (inlineBullets.length > 1) {
      for (const b of inlineBullets) {
        if (b.length >= 4) bullets.push(b);
      }
      continue;
    }

    if (line.length >= 12) paragraphs.push(line);
  }

  const description = paragraphs.join('\n\n').trim();
  let confidence = 0;
  if (bullets.length > 0) confidence += Math.min(90, 40 + bullets.length * 8);
  if (description.length > 0) confidence += Math.min(70, 30 + Math.floor(description.length / 40));
  confidence = Math.min(100, confidence);

  return { description, bulletPoints: bullets, confidence };
}
