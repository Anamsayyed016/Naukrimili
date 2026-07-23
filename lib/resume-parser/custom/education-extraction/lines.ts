/**
 * Line splitting for education sections.
 */

export {
  buildExperienceLines as buildEducationLines,
  isBulletLine,
  stripBulletPrefix,
} from '../experience-extraction/lines';

import type { EducationLine } from './types';
import { buildExperienceLines } from '../experience-extraction/lines';

export function buildTypedEducationLines(sectionText: string): EducationLine[] {
  // Rejoin OCR year wraps ("2004-\n2008") and soft hyphen word breaks.
  const joined = String(sectionText || '')
    .replace(/(\d{4})\s*-\s*\r?\n\s*(\d{4})/g, '$1-$2')
    .replace(/([A-Za-z])-\s*\r?\n\s*([a-z])/g, '$1$2');
  return buildExperienceLines(joined) as EducationLine[];
}
