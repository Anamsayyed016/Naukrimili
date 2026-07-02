/**
 * Validation & Repair Engine — final quality gate for custom parser modules.
 *
 * Never invents data. Repairs only with deterministic evidence.
 * Does NOT integrate with parseResume() or production pipelines.
 */

import { validateAndRepairIdentity, scoreIdentitySection } from './identity';
import { validateAndRepairSummary, scoreSummarySection } from './summary';
import { validateAndRepairExperiences, scoreExperienceSection } from './experience';
import { validateAndRepairProjects, scoreProjectsSection } from './projects';
import { validateAndRepairEducation, scoreEducationSection } from './education';
import { validateAndRepairSkills, scoreSkillsSection } from './skills';
import {
  validateLanguages,
  validateCertifications,
  scoreLanguagesSection,
  scoreCertificationsSection,
} from './languages';
import { validateChronology } from './chronology';
import { crossCheckSections } from './cross-check';
import { assembleValidatedResume } from './assemble';
import {
  buildRepairReport,
  buildValidationReport,
  computeParserConfidenceScore,
  computeResumeQualityScore,
  computeSectionConfidence,
  inferSectionPresence,
} from './scoring';
import type {
  ValidationRepairInput,
  ValidationRepairResult,
  ValidatedResumeBundle,
} from './types';
import { createRepairContext, VALIDATION_REPAIR_VERSION } from './types';

export { VALIDATION_REPAIR_VERSION };

/**
 * Validate and repair all resume sections. Returns canonical resume + reports.
 */
export function validateAndRepairResume(input: ValidationRepairInput): ValidationRepairResult {
  const ctx = createRepairContext(input);

  const identity = validateAndRepairIdentity(input.identity, ctx);
  const summary = validateAndRepairSummary(input.summary, ctx);
  const experiences = validateAndRepairExperiences(input.experiences, ctx);
  const projects = validateAndRepairProjects(input.projects, ctx);
  const educations = validateAndRepairEducation(input.educations, ctx);
  const skills = validateAndRepairSkills(input.skills, ctx);
  const languages = validateLanguages(input.languages, ctx);
  const certifications = validateCertifications(input.certifications, ctx);

  validateChronology(experiences, educations, projects, ctx);
  crossCheckSections(experiences, projects, educations, skills, ctx);

  const sectionConfidence = computeSectionConfidence({
    identityScore: scoreIdentitySection(identity),
    summaryScore: scoreSummarySection(summary),
    experienceScore: scoreExperienceSection(experiences),
    projectsScore: scoreProjectsSection(projects),
    educationScore: scoreEducationSection(educations),
    skillsScore: scoreSkillsSection(skills),
    languagesScore: scoreLanguagesSection(languages),
    certificationsScore: scoreCertificationsSection(certifications),
  });

  const validationReport = buildValidationReport(ctx.issues, sectionConfidence);
  const repairReport = buildRepairReport(ctx.repairs);

  const sectionPresence = inferSectionPresence({
    rawText: input.rawText,
    sectionTexts: input.sectionTexts,
    projectCount: projects.length,
    languageCount: languages?.length ?? 0,
    certificationCount: certifications?.length ?? 0,
  });

  const parserConfidenceScore = computeParserConfidenceScore(
    sectionConfidence,
    input.parserConfidence,
    sectionPresence
  );

  const resumeQualityScore = computeResumeQualityScore({
    sectionConfidence,
    validationReport,
    repairReport,
    parserConfidence: input.parserConfidence,
    hasIdentity: Boolean(identity?.fullName || identity?.email),
    hasSummary: Boolean(summary?.summary?.trim()),
    experienceCount: experiences.length,
    projectCount: projects.length,
    educationCount: educations.length,
    skillCount: skills.length,
    sectionPresence,
  });

  const validated: ValidatedResumeBundle = {
    identity,
    summary,
    experiences,
    projects,
    educations,
    skills,
    languages,
    certifications,
  };

  const resume = assembleValidatedResume(
    validated,
    input.rawText || '',
    resumeQualityScore,
    parserConfidenceScore
  );

  return {
    resume,
    validated,
    validationReport,
    repairReport,
    resumeQualityScore,
    parserConfidenceScore,
  };
}
