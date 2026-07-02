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
  return buildExperienceLines(sectionText || '') as EducationLine[];
}
