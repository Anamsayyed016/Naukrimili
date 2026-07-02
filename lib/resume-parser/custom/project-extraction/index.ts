/**
 * Public exports for project extraction engine.
 */

export {
  extractCanonicalProjects,
  extractProjectsFromSection,
  extractProjectsWithMeta,
  type ProjectExtractionResult,
} from './engine';

export { partitionProjectBlocks, scoreProjectBoundaries } from './boundaries';
export { detectTitleFromLine, scoreProjectTitleCandidate } from './title';
export { detectRoleFromLine } from './role';
export { extractLinksFromText, lineHasLinkSignal } from './links';
export { extractTechnologiesFromText, extractTechnologiesFromBlock, lineHasTechStackSignal } from './technologies';
export { extractDescriptionFromBlock } from './description';
export { isValidProject, filterValidProjects } from './validate';

export {
  PROJECT_EXTRACTION_VERSION,
  toCanonicalProject,
  type CanonicalProject,
  type CustomExtractedProject,
  type ProjectFieldConfidence,
  type ProjectLine,
  type ProjectRawBlock,
} from './types';
