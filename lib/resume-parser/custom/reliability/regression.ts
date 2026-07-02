/**
 * Per-module regression testing.
 */

import { runBenchmarkCase } from '../benchmark/engine';
import type { BenchmarkCase } from '../benchmark/types';
import { isFrozenCanonicalResume } from '../canonical-resume/immutable';
import { runCustomParserPipelineSafe } from './pipeline';
import type {
  ModuleRegressionResult,
  RegressionModuleId,
  RegressionReport,
  ReliabilityFixture,
} from '../types';

const ALL_MODULES: RegressionModuleId[] = [
  'identity',
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'validation',
  'canonical',
];

function fixtureToBenchmarkCase(fixture: ReliabilityFixture): BenchmarkCase {
  return {
    id: fixture.id,
    name: fixture.name,
    description: fixture.description,
    tags: fixture.categories as BenchmarkCase['tags'],
    format: fixture.format,
    rawText: fixture.rawText,
    groundTruth: fixture.groundTruth || {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      confidence: 0,
      rawText: fixture.rawText,
    },
    skillExpectations: fixture.skillExpectations,
    validationExpectation: fixture.validationExpectation,
  };
}

function moduleAccuracy(
  module: RegressionModuleId,
  evaluation: ReturnType<typeof runBenchmarkCase>
): number {
  const s = evaluation.sectionScores;
  switch (module) {
    case 'identity':
      return s.identity;
    case 'summary':
      return s.summary;
    case 'experience':
      return s.experience;
    case 'projects':
      return s.projects;
    case 'education':
      return s.education;
    case 'skills':
      return s.skills;
    case 'validation':
      return s.validation;
    case 'canonical':
      return s.canonical;
    default:
      return 0;
  }
}

function assertModule(
  module: RegressionModuleId,
  fixture: ReliabilityFixture,
  pipeline: Exclude<ReturnType<typeof runCustomParserPipelineSafe>, { error: string }>
): string | null {
  if (!fixture.modules.includes(module)) return null;

  switch (module) {
    case 'identity':
      if (!pipeline.validation.validated.identity && fixture.groundTruth?.fullName) {
        return 'Identity module produced no identity for fixture with expected name';
      }
      break;
    case 'summary':
      if (fixture.rawText.toLowerCase().includes('summary') && !pipeline.validation.validated.summary) {
        return 'Summary section detected in text but no summary extracted';
      }
      break;
    case 'experience':
      if (fixture.rawText.toLowerCase().includes('experience') && !pipeline.validation.validated.experiences.length) {
        return 'Experience section present but no experiences extracted';
      }
      break;
    case 'projects':
      if (fixture.rawText.toLowerCase().includes('projects') && !pipeline.validation.validated.projects.length) {
        return 'Projects section present but no projects extracted';
      }
      break;
    case 'education':
      if (fixture.rawText.toLowerCase().includes('education') && !pipeline.validation.validated.educations.length) {
        return 'Education section present but no education extracted';
      }
      break;
    case 'skills':
      if (fixture.rawText.toLowerCase().includes('skills') && !pipeline.validation.validated.skills.length) {
        return 'Skills section present but no skills extracted';
      }
      break;
    case 'validation':
      if (!pipeline.validation.validationReport) {
        return 'Validation report missing';
      }
      break;
    case 'canonical':
      if (!isFrozenCanonicalResume(pipeline.canonical)) {
        return 'Canonical resume not frozen';
      }
      break;
  }

  return null;
}

export function runModuleRegression(
  module: RegressionModuleId,
  fixtures: ReliabilityFixture[]
): ModuleRegressionResult {
  const relevant = fixtures.filter((f) => f.modules.includes(module));
  const failures: ModuleRegressionResult['failures'] = [];
  let passed = 0;
  let accuracySum = 0;

  for (const fixture of relevant) {
    const result = runCustomParserPipelineSafe(fixture.rawText);
    if ('error' in result) {
      failures.push({ fixtureId: fixture.id, reason: result.error });
      continue;
    }

    const structural = assertModule(module, fixture, result);
    if (structural) {
      failures.push({ fixtureId: fixture.id, reason: structural });
      continue;
    }

    if (fixture.groundTruth) {
      const bench = runBenchmarkCase(
        fixtureToBenchmarkCase(fixture),
        { kind: 'validation', result: result.validation },
        { deterministic: true, includeHumanReport: false }
      );
      const acc = moduleAccuracy(module, bench);
      accuracySum += acc;
      if (acc < 50) {
        failures.push({
          fixtureId: fixture.id,
          reason: `${module} accuracy ${acc}% below regression threshold`,
        });
        continue;
      }
    } else {
      accuracySum += 100;
    }

    passed += 1;
  }

  const caseCount = relevant.length;
  return {
    module,
    caseCount,
    passed,
    failed: caseCount - passed,
    passRate: caseCount ? Math.round((passed / caseCount) * 1000) / 10 : 100,
    averageAccuracy: caseCount ? Math.round(accuracySum / caseCount) : 100,
    failures,
  };
}

export function runRegressionSuite(fixtures: ReliabilityFixture[]): RegressionReport {
  const modules = ALL_MODULES.map((m) => runModuleRegression(m, fixtures));
  const totalCases = modules.reduce((s, m) => s + m.caseCount, 0);
  const totalPassed = modules.reduce((s, m) => s + m.passed, 0);

  return {
    modules,
    totalCases,
    totalPassed,
    totalFailed: totalCases - totalPassed,
    passRate: totalCases ? Math.round((totalPassed / totalCases) * 1000) / 10 : 100,
    regressionsDetected: totalPassed < totalCases,
  };
}
