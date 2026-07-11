/**
 * Isolated custom parser pipeline for reliability testing.
 * Does NOT call parseResume() — wires extractors + validation + canonical directly.
 */

import { buildCanonicalResumeFromValidation } from '../canonical-resume/build';
import { detectResumeSections } from '../section-detection';
import {
  resolveAchievementsSectionText,
  resolveHobbiesSectionText,
} from '../section-detection/resolve-section';
import { extractIdentityFromSections } from '../identity-extraction';
import { extractSummaryFromSection } from '../summary-extraction';
import { extractExperiencesFromSection } from '../experience-extraction';
import { extractEducationFromSection } from '../education-extraction';
import { extractProjectsFromSection } from '../project-extraction';
import { extractLanguagesFromSection } from '../language-extraction';
import { extractCertificationsFromSection } from '../certification-extraction';
import { extractAchievementsFromSection } from '../achievements-extraction';
import { extractHobbiesFromSection } from '../hobbies-extraction';
import { extractSkillsIntelligence } from '../skills-intelligence';
import { validateAndRepairResume } from '../validation-repair';
import type { CustomParserPipelineResult } from './types';

function estimateLayoutConfidence(
  sections: ReturnType<typeof detectResumeSections>
): number {
  let score = 55;
  if (sections.coverage?.complete) score += 15;
  if (sections.experience?.trim()) score += 8;
  if (sections.education?.trim()) score += 5;
  if (sections.skills?.trim()) score += 5;
  if (sections.preamble?.trim()) score += 4;
  if (sections.documentProfile?.signals?.multiColumnLikely) score += 3;
  return Math.min(92, score);
}

export function runCustomParserPipeline(rawText: string): CustomParserPipelineResult {
  const cpuBefore = process.cpuUsage();
  const heapBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();

  const sections = detectResumeSections(rawText);
  const boundaryOpts = sections.parseStrategy
    ? {
        threshold: sections.parseStrategy.experienceBoundaryThreshold,
        thresholdAfterBlank: sections.parseStrategy.experienceBoundaryThresholdAfterBlank,
      }
    : undefined;
  const experiences = sections.experience
    ? extractExperiencesFromSection(sections.experience, boundaryOpts)
    : [];
  const educations = sections.education ? extractEducationFromSection(sections.education) : [];
  const projects = sections.projects ? extractProjectsFromSection(sections.projects) : [];
  const languages = sections.languages ? extractLanguagesFromSection(sections.languages) : [];
  const certifications = sections.certifications
    ? extractCertificationsFromSection(sections.certifications)
    : [];
  const achievements = extractAchievementsFromSection(resolveAchievementsSectionText(sections));
  const hobbies = extractHobbiesFromSection(resolveHobbiesSectionText(sections));

  const certNames = certifications.map((c) => c.name).filter(Boolean);

  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    preambleText: sections.preamble,
    experienceTechnologies: experiences.map((e) => e.technologies),
    experienceTexts: experiences.map((e) =>
      [e.description, ...(e.bulletPoints || [])].filter(Boolean).join('\n')
    ),
    projectTechnologies: projects.map((p) => p.technologies),
    projectTexts: projects.map((p) =>
      [p.title, p.description, ...(p.achievements || [])].filter(Boolean).join('\n')
    ),
    summaryText: sections.summary,
    educationTexts: educations.map((e) =>
      [e.degree, e.fieldOfStudy, ...(e.coursework || [])].filter(Boolean).join(' ')
    ),
    certificationNames: certNames,
  });

  const validation = validateAndRepairResume({
    rawText,
    identity: extractIdentityFromSections({
      headerText: sections.preamble || rawText.split('\n').slice(0, 4).join('\n'),
      contactSectionText: sections.preamble,
      preambleText: rawText.slice(0, 800),
      fullResumeText: rawText,
    }),
    summary: sections.summary
      ? extractSummaryFromSection({ summarySectionText: sections.summary })
      : null,
    experiences,
    educations,
    projects,
    skills,
    languages: languages.map((l) =>
      l.proficiency ? { name: l.name, proficiency: l.proficiency } : l.name
    ),
    certifications: certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      ...(c.url ? { url: c.url } : {}),
    })),
    achievements: achievements.map((a) => a.text),
    hobbies: hobbies.map((h) => h.name),
    sectionTexts: {
      experience: sections.experience,
      education: sections.education,
      projects: sections.projects,
      skills: sections.skills,
      summary: sections.summary,
      contact: sections.preamble,
      languages: sections.languages,
      certifications: sections.certifications,
      achievements: resolveAchievementsSectionText(sections),
      hobbies: resolveHobbiesSectionText(sections),
    },
    parserConfidence: estimateLayoutConfidence(sections),
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
