/**
 * Smoke test — benchmark framework with custom extractors (not production parseResume).
 */
import {
  runBenchmarkCase,
  runBenchmarkSuite,
  BENCHMARK_FIXTURES,
} from '../lib/resume-parser/custom/benchmark';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractIdentityFromSections } from '../lib/resume-parser/custom/identity-extraction';
import { extractSummaryFromSection } from '../lib/resume-parser/custom/summary-extraction';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '../lib/resume-parser/custom/project-extraction';
import { extractSkillsIntelligence } from '../lib/resume-parser/custom/skills-intelligence';
import { validateAndRepairResume } from '../lib/resume-parser/custom/validation-repair';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function runPipeline(rawText: string) {
  const sections = detectResumeSections(rawText);
  const experiences = extractExperiencesFromSection(sections.experience || rawText);
  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    experienceTechnologies: experiences.map((e) => e.technologies),
  });

  return validateAndRepairResume({
    rawText,
    identity: extractIdentityFromSections({
      headerText: sections.preamble || rawText.split('\n').slice(0, 3).join('\n'),
      contactSectionText: sections.preamble,
      fullResumeText: rawText,
    }),
    summary: sections.summary
      ? extractSummaryFromSection({ summarySectionText: sections.summary })
      : null,
    experiences,
    educations: sections.education ? extractEducationFromSection(sections.education) : [],
    projects: sections.projects ? extractProjectsFromSection(sections.projects) : [],
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
}

const devFixture = BENCHMARK_FIXTURES[0];
const report = runBenchmarkCase(
  devFixture,
  { kind: 'validation', result: runPipeline(devFixture.rawText || '') },
  { deterministic: true }
);

assert(report.overallAccuracy > 0, 'overall accuracy > 0');
assert(report.fieldComparisons.length > 0, 'field comparisons produced');
assert(report.humanReport.includes('BENCHMARK'), 'human report generated');

const suite = runBenchmarkSuite(
  BENCHMARK_FIXTURES.map((f) => ({
    fixture: f,
    actual: { kind: 'extracted', data: f.groundTruth },
  })),
  { deterministic: true }
);

assert(suite.aggregate.meanOverallAccuracy >= 90, 'perfect ground truth suite high accuracy');

console.log('smoke-benchmark: OK');
console.log(
  JSON.stringify(
    {
      case: report.caseId,
      overall: report.overallAccuracy,
      identity: report.sectionScores.identity,
      experience: report.sectionScores.experience,
      mismatches: report.mismatches.length,
      suiteMean: suite.aggregate.meanOverallAccuracy,
    },
    null,
    2
  )
);
