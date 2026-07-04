/**
 * Resolve section bodies including custom headings mapped by keyword.
 */

import type { DetectedResumeSections } from '../section-detection/types';

const ACHIEVEMENTS_HEADING_RE =
  /\b(?:achievements?|awards?|honors?|honours?|recognition|accomplishments?|highlights?|key\s+achievements?|professional\s+highlights?|distinctions?)\b/i;

const HOBBIES_HEADING_RE =
  /\b(?:hobbies?|interests?|personal\s+interests?|extracurricular|activities|leisure)\b/i;

export function resolveAchievementsSectionText(sections: DetectedResumeSections): string {
  const direct = sections.achievements?.trim();
  if (direct) return direct;

  for (const custom of sections.customSections || []) {
    if (ACHIEVEMENTS_HEADING_RE.test(custom.rawHeading)) {
      return custom.content?.trim() || '';
    }
  }
  return '';
}

export function resolveHobbiesSectionText(sections: DetectedResumeSections): string {
  const direct = sections.hobbies?.trim();
  if (direct) return direct;

  for (const custom of sections.customSections || []) {
    if (HOBBIES_HEADING_RE.test(custom.rawHeading)) {
      return custom.content?.trim() || '';
    }
  }
  return '';
}
