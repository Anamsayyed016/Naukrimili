/**
 * Description and achievement extraction — preserve order, no rewriting.
 */

import { peelTechnologiesFromProjectDescription } from '@/lib/resume-parser/import-sanitize';
import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

import { parseDateRangeFromText } from '../experience-extraction/dates';
import { extractLinksFromText } from './links';
import { isBulletLine, stripBulletPrefix } from './lines';
import { parseExplicitTechLine } from './technologies';

export interface BlockDescription {
  description: string;
  achievements: string[];
  peeledTechnologies: string[];
  confidence: number;
}

export function extractDescriptionFromBlock(bodyLines: string[]): BlockDescription {
  const achievements: string[] = [];
  const paragraphs: string[] = [];

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;

    if (
      extractLinksFromText(line).confidence >= 50 &&
      line.length < 160
    ) {
      continue;
    }
    if (parseDateRangeFromText(line) && line.length < 50) continue;
    if (parseExplicitTechLine(line).length >= 2 && line.length < 140) continue;

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

  const rawDescription = paragraphs.join('\n\n').trim();
  const peeled = peelTechnologiesFromProjectDescription(rawDescription);
  const peeledTechs = peeled.technologies
    ? peeled.technologies.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : [];

  let confidence = 0;
  if (achievements.length > 0) confidence += Math.min(90, 40 + achievements.length * 8);
  if (peeled.description.length > 0) {
    confidence += Math.min(75, 30 + Math.floor(peeled.description.length / 35));
  }
  confidence = Math.min(100, confidence);

  return {
    description: peeled.description,
    achievements,
    peeledTechnologies: peeledTechs,
    confidence,
  };
}
