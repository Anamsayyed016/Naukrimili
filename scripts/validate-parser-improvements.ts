/**
 * Quick validation for language/cert extraction improvements.
 */
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { runBenchmarkSuite, BENCHMARK_FIXTURES } from '../lib/resume-parser/custom/benchmark';
import { runReliabilitySuite } from '../lib/resume-parser/custom/reliability';

const LANG_CERT_RESUME = [
  'Maria Santos',
  'maria@example.com | Madrid, Spain',
  '',
  'SUMMARY',
  'Multilingual project manager with cloud certifications.',
  '',
  'EXPERIENCE',
  'Project Manager at Global Tech Inc',
  '2019 - Present',
  '- Led cross-border teams',
  '',
  'SKILLS',
  '| Technology | Level |',
  '| AWS        | Expert |',
  '| Python     | Advanced |',
  '',
  'LANGUAGES',
  'Spanish - Native',
  'English - Fluent',
  'Portuguese: Intermediate',
  '',
  'CERTIFICATIONS',
  'AWS Solutions Architect - Amazon Web Services',
  '2023',
  'PMP Certification - PMI',
  '2022',
].join('\n');

const result = runCustomParserPipeline(LANG_CERT_RESUME);
const resume = result.validation.resume;

console.log('LANG/CERT VALIDATION');
console.log(JSON.stringify({
  languages: resume.languages,
  certifications: resume.certifications,
  skills: resume.skills?.slice(0, 8),
  experienceCompanies: resume.experience?.map((e) => e.company),
  parserConfidence: result.validation.parserConfidenceScore,
  resumeQuality: result.validation.resumeQualityScore,
}, null, 2));

const benchmark = runBenchmarkSuite(
  BENCHMARK_FIXTURES.map((fixture) => ({
    fixture,
    actual: { kind: 'validation' as const, result: runCustomParserPipeline(fixture.rawText).validation },
  }))
);
const reliability = runReliabilitySuite({ deterministic: true, stressScales: [50] });

console.log('\nBENCHMARK');
console.log(JSON.stringify({
  suiteMean: benchmark.aggregate.meanOverallAccuracy,
  cases: benchmark.cases.map((c) => ({
    id: c.caseId,
    overall: c.overallAccuracy,
    identity: c.sectionScores.identity,
    experience: c.sectionScores.experience,
    education: c.sectionScores.education,
    skills: c.sectionScores.skills,
    languages: c.sectionScores.languages,
    certifications: c.sectionScores.certifications,
  })),
}, null, 2));

console.log('\nRELIABILITY');
console.log(JSON.stringify({
  readiness: reliability.readiness.overallScore,
  regressionPassRate: reliability.regression.passRate,
  stressFailureRate: reliability.stress.failureRate,
}, null, 2));
