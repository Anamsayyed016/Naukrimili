/**
 * Canonical Resume Model — public exports.
 */

export { CANONICAL_RESUME_VERSION } from './types';

export {
  buildCanonicalResume,
  buildCanonicalResumeFromValidation,
} from './build';

export {
  deserializeCanonicalResume,
  parseBuilderResume,
  serializeBuilderResume,
  serializeCanonicalResume,
  toExtractedResumeData,
} from './serialize';

export {
  certificationNodeId,
  deterministicNodeId,
  educationNodeId,
  experienceNodeId,
  fnv1a32,
  identityNodeId,
  languageNodeId,
  projectNodeId,
  skillNodeId,
  summaryNodeId,
} from './ids';

export {
  cloneCanonicalSnapshot,
  freezeCanonicalResume,
  isFrozenCanonicalResume,
} from './immutable';

export {
  createCertificationNode,
  createEducationNode,
  createExperienceNode,
  createIdentityNode,
  createProjectNode,
  createSkillNode,
  createSummaryNode,
  languagesFromExtracted,
  normalizeLanguageEntry,
} from './nodes';

export { buildCanonicalMetadata, buildQualityMetadata, buildParserDiagnostics } from './metadata';

export type {
  CanonicalNodeNamespace,
} from './ids';

export type {
  BuildCanonicalResumeInput,
  CanonicalCertificationData,
  CanonicalCertificationNode,
  CanonicalEducationData,
  CanonicalEducationNode,
  CanonicalExperienceData,
  CanonicalExperienceNode,
  CanonicalIdentityData,
  CanonicalIdentityNode,
  CanonicalLanguageData,
  CanonicalLanguageNode,
  CanonicalProjectData,
  CanonicalProjectNode,
  CanonicalResume,
  CanonicalResumeMetadata,
  CanonicalResumeSnapshot,
  CanonicalSkillData,
  CanonicalSkillNode,
  CanonicalSummaryData,
  CanonicalSummaryNode,
  ParserDiagnostics,
  QualityMetadata,
  RejectedDiagnosticEntry,
} from './types';
