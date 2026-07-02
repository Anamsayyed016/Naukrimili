/**
 * Line splitting for project sections — reuses experience line helpers.
 */

export {
  buildExperienceLines as buildProjectLines,
  isBulletLine,
  splitExperienceSectionLines as splitProjectSectionLines,
  stripBulletPrefix,
} from '../experience-extraction/lines';

import type { ProjectLine } from './types';
import { buildExperienceLines } from '../experience-extraction/lines';

export function buildTypedProjectLines(sectionText: string): ProjectLine[] {
  return buildExperienceLines(sectionText || '') as ProjectLine[];
}
