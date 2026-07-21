/**
 * Description and bullet extraction — preserve order, no summarization.
 */

import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

import { isBulletLine, stripBulletPrefix } from './lines';

const EXPERIENCE_DETAIL_HEADING_RE =
  /^key\s+(?:result\s+areas?|responsibilit|accountabilit|duties|contributions?|highlights?)/i;

const EXPERIENCE_METADATA_LINE_RE =
  /^(?:designation|role|position|title|post|tenure|responsibilit(?:y|ies))\b/i;

const TENURE_VALUE_LINE_RE =
  /^(?:tenure|duration)\s*[-–—:]\s*.+/i;

function isExperienceMetadataFragment(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (EXPERIENCE_METADATA_LINE_RE.test(trimmed)) return true;
  if (TENURE_VALUE_LINE_RE.test(trimmed)) return true;
  if (/^(?:may|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)[a-z]*['']?\d{2}\b/i.test(trimmed)) {
    return true;
  }
  if (/^(?:till\s*date|present|current|to\s*date)$/i.test(trimmed)) return true;
  if (/^(?:tenure|responsibilities?|designation|role)$/i.test(trimmed)) return true;
  return false;
}

function shouldSplitInlineBullets(line: string): boolean {
  if (isExperienceMetadataFragment(line)) return false;
  if (/^(?:designation|role|position|title|post|tenure|responsibilit)/i.test(line)) return false;
  return true;
}

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

    if (isExperienceMetadataFragment(line)) {
      const resp = line.match(/^responsibilit(?:y|ies)\s*[-–—:]\s*(.+)$/i);
      if (resp?.[1]?.trim()) {
        paragraphs.push(resp[1].trim());
      }
      continue;
    }

    if (isBulletLine(raw)) {
      const bullet = stripBulletPrefix(raw);
      if (bullet.length >= 4 && !isExperienceMetadataFragment(bullet)) bullets.push(bullet);
      continue;
    }

    if (shouldSplitInlineBullets(line)) {
      const inlineBullets = splitBullets(line);
      if (inlineBullets.length > 1) {
        for (const b of inlineBullets) {
          if (b.length >= 4 && !isExperienceMetadataFragment(b)) bullets.push(b);
        }
        continue;
      }
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
