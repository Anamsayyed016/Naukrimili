/**
 * Run large-scale benchmark corpus and report accuracy.
 */
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { runBenchmarkSuite, BENCHMARK_FIXTURES } from '../lib/resume-parser/custom/benchmark';
import { generateBenchmarkCorpus } from '../lib/resume-parser/custom/benchmark/fixtures/corpus-generator';

const CORPUS_SIZE = Number(process.env.BENCHMARK_CORPUS_SIZE || 300);
const corpus = generateBenchmarkCorpus(CORPUS_SIZE);
const core = BENCHMARK_FIXTURES;

function runSuite(fixtures: typeof corpus, label: string) {
  const suite = runBenchmarkSuite(
    fixtures.map((fixture) => ({
      fixture,
      actual: {
        kind: 'validation' as const,
        result: runCustomParserPipeline(fixture.rawText).validation,
      },
    })),
    { deterministic: true }
  );

  const sectionMeans = {
    identity: 0,
    experience: 0,
    education: 0,
    skills: 0,
    projects: 0,
    languages: 0,
    certifications: 0,
  };
  for (const c of suite.cases) {
    sectionMeans.identity += c.sectionScores.identity;
    sectionMeans.experience += c.sectionScores.experience;
    sectionMeans.education += c.sectionScores.education;
    sectionMeans.skills += c.sectionScores.skills;
    sectionMeans.projects += c.sectionScores.projects;
    sectionMeans.languages += c.sectionScores.languages;
    sectionMeans.certifications += c.sectionScores.certifications;
  }
  const n = suite.cases.length || 1;
  for (const k of Object.keys(sectionMeans) as Array<keyof typeof sectionMeans>) {
    sectionMeans[k] = Math.round(sectionMeans[k] / n);
  }

  console.log(
    JSON.stringify(
      {
        label,
        caseCount: suite.caseCount,
        meanOverall: suite.aggregate.meanOverallAccuracy,
        meanParserConfidence: suite.aggregate.meanParserConfidence,
        meanResumeQuality: suite.aggregate.meanResumeQuality,
        sectionMeans,
        weakest: suite.cases
          .slice()
          .sort((a, b) => a.overallAccuracy - b.overallAccuracy)
          .slice(0, 5)
          .map((c) => ({ id: c.caseId, overall: c.overallAccuracy, skills: c.sectionScores.skills })),
      },
      null,
      2
    )
  );
}

console.log('CORE FIXTURES');
runSuite(core, 'core');

console.log('\nCORPUS');
runSuite(corpus, `corpus-${CORPUS_SIZE}`);
