import {
  runBenchmarkCase,
  runBenchmarkSuite,
  evaluationReportToJson,
  BENCHMARK_FIXTURES,
} from '@/lib/resume-parser/custom/benchmark';
import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';
import { extractIdentityFromSections } from '@/lib/resume-parser/custom/identity-extraction';
import { extractSummaryFromSection } from '@/lib/resume-parser/custom/summary-extraction';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '@/lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '@/lib/resume-parser/custom/project-extraction';
import { extractSkillsIntelligence } from '@/lib/resume-parser/custom/skills-intelligence';
import { validateAndRepairResume } from '@/lib/resume-parser/custom/validation-repair';

describe('custom benchmark framework', () => {
  function runCustomPipelineOnText(rawText: string) {
    const sections = detectResumeSections(rawText);
    const experiences = sections.experience
      ? extractExperiencesFromSection(sections.experience)
      : [];
    const educations = sections.education ? extractEducationFromSection(sections.education) : [];
    const projects = sections.projects ? extractProjectsFromSection(sections.projects) : [];
    const skills = extractSkillsIntelligence({
      skillsSectionText: sections.skills,
      experienceTechnologies: experiences.map((e) => e.technologies),
      projectTechnologies: projects.map((p) => p.technologies),
    });

    const identity = extractIdentityFromSections({
      headerText: sections.preamble || rawText.split('\n').slice(0, 3).join('\n'),
      contactSectionText: sections.preamble,
      preambleText: rawText.slice(0, 400),
      fullResumeText: rawText,
    });
    const summary = sections.summary
      ? extractSummaryFromSection({ summarySectionText: sections.summary })
      : null;

    return validateAndRepairResume({
      rawText,
      identity,
      summary,
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
  }

  it('evaluates developer fixture against custom pipeline', () => {
    const fixture = BENCHMARK_FIXTURES[0];
    const validation = runCustomPipelineOnText(fixture.rawText || '');
    const report = runBenchmarkCase(
      fixture,
      { kind: 'validation', result: validation },
      { deterministic: true }
    );

    expect(report.overallAccuracy).toBeGreaterThan(0);
    expect(report.sectionScores.identity).toBeGreaterThanOrEqual(0);
    expect(report.statistics.parserConfidence).toBeGreaterThan(0);
    expect(report.mismatches.length).toBeGreaterThanOrEqual(0);
    expect(report.humanReport).toContain('BENCHMARK EVALUATION');

    const json = JSON.parse(evaluationReportToJson(report));
    expect(json.frameworkVersion).toBeTruthy();
    expect(json.humanReport).toBeUndefined();
  });

  it('classifies skill normalization mismatches', () => {
    const fixture = BENCHMARK_FIXTURES[0];
    const report = runBenchmarkCase(fixture, {
      kind: 'extracted',
      data: {
        ...fixture.groundTruth,
        skills: ['ReactJS', 'NodeJS'],
      },
    });

    const normMismatch = report.mismatches.find((m) => m.errorClass === 'incorrect_normalization');
    expect(normMismatch || report.skills.accuracy < 100).toBeTruthy();
  });

  it('runs benchmark suite with trend data', () => {
    const suite = runBenchmarkSuite(
      BENCHMARK_FIXTURES.map((fixture) => ({
        fixture,
        actual: {
          kind: 'extracted',
          data: fixture.groundTruth,
        },
      })),
      { deterministic: true }
    );

    expect(suite.caseCount).toBe(2);
    expect(suite.aggregate.meanOverallAccuracy).toBeGreaterThanOrEqual(90);
    expect(suite.aggregate.accuracyTrend).toHaveLength(2);
  });

  it('detects missing experience entries', () => {
    const fixture = BENCHMARK_FIXTURES[0];
    const report = runBenchmarkCase(fixture, {
      kind: 'extracted',
      data: {
        ...fixture.groundTruth,
        experience: [fixture.groundTruth.experience[0]],
      },
    });

    expect(report.experience.missingEntries).toBeGreaterThanOrEqual(1);
  });
});
