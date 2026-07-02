/**
 * Validation & Repair Engine — public exports.
 */

export { VALIDATION_REPAIR_VERSION, validateAndRepairResume } from './engine';

export type {
  EvidenceSource,
  RepairContext,
  RepairRecord,
  RepairReport,
  SectionConfidenceScores,
  ValidatedResumeBundle,
  ValidationIssue,
  ValidationRepairInput,
  ValidationRepairResult,
  ValidationReport,
  ValidationSeverity,
} from './types';

export { createRepairContext, recordIssue, recordRepair } from './types';

export {
  computeParserConfidenceScore,
  computeResumeQualityScore,
  computeSectionConfidence,
  inferSectionPresence,
} from './scoring';

export type { SectionPresenceFlags, QualityScoreInput } from './scoring';

export { validateAndRepairIdentity } from './identity';
export { validateAndRepairSummary } from './summary';
export { validateAndRepairExperiences, repairExperienceEntry } from './experience';
export { validateAndRepairProjects, repairProjectEntry } from './projects';
export { validateAndRepairEducation, repairEducationEntry } from './education';
export { validateAndRepairSkills } from './skills';
export { validateChronology } from './chronology';
export { crossCheckSections } from './cross-check';
export { assembleValidatedResume } from './assemble';
