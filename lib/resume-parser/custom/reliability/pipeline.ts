/**
 * Isolated custom parser pipeline for reliability testing.
 * Does NOT call parseResume() — wires extractors + validation + canonical directly.
 */

import { buildCanonicalResumeFromValidation } from '../canonical-resume/build';
import { detectResumeSections } from '../section-detection';
import { extractIdentityFromSections } from '../identity-extraction';
import { extractSummaryFromSection } from '../summary-extraction';
import { extractExperiencesFromSection } from '../experience-extraction';
import { extractEducationFromSection } from '../education-extraction';
import { extractProjectsFromSection } from '../project-extraction';
import { extractSkillsIntelligence } from '../skills-intelligence';
import { validateAndRepairResume } from '../validation-repair';
import type { CustomParserPipelineResult } from './types';

export function runCustomParserPipeline(rawText: string): CustomParserPipelineResult {
  const cpuBefore = process.cpuUsage();
  const heapBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();

  const sections = detectResumeSections(rawText);
  const experiences = sections.experience
    ? extractExperiencesFromSection(sections.experience)
    : [];
  const educations = sections.education ? extractEducationFromSection(sections.education) : [];
  const projects = sections.projects ? extractProjectsFromSection(sections.projects) : [];
  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    preambleText: sections.preamble,
    experienceTechnologies: experiences.map((e) => e.technologies),
    experienceTexts: experiences.map((e) =>
      [e.description, ...(e.bulletPoints || [])].filter(Boolean).join('\n')
    ),
    projectTechnologies: projects.map((p) => p.technologies),
    summaryText: sections.summary,
    educationTexts: educations.map((e) =>
      [e.degree, e.fieldOfStudy, ...(e.coursework || [])].filter(Boolean).join(' ')
    ),
  });

  const validation = validateAndRepairResume({
    rawText,
    identity: extractIdentityFromSections({
      headerText: sections.preamble || rawText.split('\n').slice(0, 4).join('\n'),
      contactSectionText: sections.preamble,
      preambleText: rawText.slice(0, 500),
      fullResumeText: rawText,
    }),
    summary: sections.summary
      ? extractSummaryFromSection({ summarySectionText: sections.summary })
      : null,
    experiences,
    educations,
    projects,
    skills,
    sectionTexts: {
      experience: sections.experience,
      education: sections.education,
      projects: sections.projects,
      skills: sections.skills,
      summary: sections.summary,
      contact: sections.preamble,
    },
    parserConfidence: 70,
  });

  const canonical = buildCanonicalResumeFromValidation(validation);

  const parseTimeMs = performance.now() - t0;
  const cpuAfter = process.cpuUsage(cpuBefore);
  const heapDeltaBytes = process.memoryUsage().heapUsed - heapBefore;

  return {
    validation,
    canonical,
    parseTimeMs,
    heapDeltaBytes,
    cpuUserMicros: cpuAfter.user,
    cpuSystemMicros: cpuAfter.system,
  };
}

export function runCustomParserPipelineSafe(
  rawText: string
): CustomParserPipelineResult | { error: string; parseTimeMs: number } {
  const t0 = performance.now();
  try {
    return runCustomParserPipeline(rawText);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      parseTimeMs: performance.now() - t0,
    };
  }
}
